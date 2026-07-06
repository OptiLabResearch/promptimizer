const assert = {
  ok(val, message) {
    if (!val) throw new Error(message || "Assertion failed");
  }
};
import { ValidationError, resolveProviderConfig, callCompletion, buildOptimizePrompt, buildRefinePassPrompt, parseDelimitedResponse, iterSseEvents } from "../../_lib/optimizer.js";

function makeMockStream(chunks) {
  let index = 0;
  return {
    getReader() {
      return {
        async read() {
          if (index >= chunks.length) {
            return { done: true, value: undefined };
          }
          const chunk = chunks[index++];
          const encoder = new TextEncoder();
          return { done: false, value: encoder.encode(chunk) };
        },
        releaseLock() {}
      };
    }
  };
}

export async function runUnitTests() {
  const results = [];
  const runTest = async (name, fn) => {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (e) {
      results.push({ name, passed: false, error: e.message });
    }
  };

  await runTest("buildOptimizePrompt contains OUTCOME-FIRST", () => {
    const { systemPrompt } = buildOptimizePrompt({}, "write a story");
    assert.ok(systemPrompt.includes("OUTCOME-FIRST"), "System prompt should contain OUTCOME-FIRST");
  });

  await runTest("conditional CoT behavior (local target)", () => {
    const { systemPrompt } = buildOptimizePrompt({ techniques: ["cot"], target_model: "local" }, "write a story");
    assert.ok(
      systemPrompt.includes("Add explicit step-by-step reasoning instructions (chain-of-thought)"),
      "Local target with cot technique should request manual step-by-step reasoning instructions"
    );
  });

  await runTest("conditional CoT behavior (non-local target)", () => {
    const { systemPrompt } = buildOptimizePrompt({ techniques: ["cot"], target_model: "claude" }, "write a story");
    assert.ok(
      systemPrompt.includes("reasoning effort should be set via the API's reasoning/thinking parameter"),
      "Non-local target with cot technique should suggest setting reasoning/thinking parameter"
    );
  });

  await runTest("new claude target model guideline", () => {
    const { systemPrompt } = buildOptimizePrompt({ target_model: "claude" }, "write a story");
    assert.ok(
      systemPrompt.includes("XML tags as the native delimiter dialect") &&
      systemPrompt.includes("do NOT rely on assistant-prefill tricks"),
      "Claude target guidelines should contain updated XML tag and prefill advice"
    );
  });

  await runTest("new gpt target model guideline", () => {
    const { systemPrompt } = buildOptimizePrompt({ target_model: "gpt" }, "write a story");
    assert.ok(
      systemPrompt.includes("Structure the prompt with markdown headers and lists rather than XML") &&
      systemPrompt.includes("outcome-first is official doctrine"),
      "GPT target guidelines should contain updated markdown and outcome-first advice"
    );
  });

  await runTest("depth deep helper exists and returns instructions", () => {
    const refine = buildRefinePassPrompt("raw story prompt", "first optimized story prompt");
    assert.ok(typeof refine === "object" && refine.systemPrompt && refine.userText, "buildRefinePassPrompt should return systemPrompt and userText");
    assert.ok(refine.systemPrompt.includes("<optimized_prompt>") && refine.systemPrompt.includes("<explanation>"), "refine pass systemPrompt must contain the two-block contract instructions");
    assert.ok(refine.userText.includes("raw story prompt") && refine.userText.includes("first optimized story prompt"), "refine pass userText must contain the raw prompt and first-pass optimized prompt");
  });

  await runTest("system prompt does not contain NaN", () => {
    const { systemPrompt } = buildOptimizePrompt({}, "write a story");
    assert.ok(!systemPrompt.includes("NaN"), "System prompt should not contain NaN from operator syntax bugs");
  });

  await runTest("parseDelimitedResponse case-insensitive and robust to missing tags", () => {
    const raw = "<OPTIMIZED_prompt>\nhello optimized\n<EXPLANATION>\nhello explanation";
    const { optimizedText, explanationText } = parseDelimitedResponse(raw);
    assert.ok(optimizedText === "hello optimized", "Should parse optimized prompt case-insensitively");
    assert.ok(explanationText === "hello explanation", "Should parse explanation case-insensitively and handle missing closing tag");
  });

  await runTest("iterSseEvents handles LF and CRLF stream boundaries", async () => {
    // 1. CRLF message stream
    const crlfStream = makeMockStream([
      "data: {\"piece\": 1}\r\n\r\n",
      "data: {\"piece\": 2}\r\n\r\n"
    ]);
    const crlfResults = [];
    for await (const event of iterSseEvents(crlfStream)) {
      crlfResults.push(event.data);
    }
    assert.ok(crlfResults.length === 2, "Should parse 2 CRLF events");
    assert.ok(crlfResults[0] === '{"piece": 1}', "Should decode first CRLF chunk content correctly");
    assert.ok(crlfResults[1] === '{"piece": 2}', "Should decode second CRLF chunk content correctly");

    // 2. LF message stream
    const lfStream = makeMockStream([
      "data: {\"piece\": 3}\n\n",
      "data: {\"piece\": 4}\n\n"
    ]);
    const lfResults = [];
    for await (const event of iterSseEvents(lfStream)) {
      lfResults.push(event.data);
    }
    assert.ok(lfResults.length === 2, "Should parse 2 LF events");
    assert.ok(lfResults[0] === '{"piece": 3}', "Should decode first LF chunk content correctly");
  });

  await runTest("parseDelimitedResponse reverse order tags and nested tags", () => {
    const raw = "<EXPLANATION>\nthis is explanation\n</EXPLANATION>\n<OPTIMIZED_prompt>\nthis is optimized containing <explanation> nested tag\n</OPTIMIZED_prompt>";
    const { optimizedText, explanationText } = parseDelimitedResponse(raw);
    assert.ok(optimizedText === "this is optimized containing <explanation> nested tag", "Should parse optimized prompt with nested tags");
    assert.ok(explanationText === "this is explanation", "Should parse explanation properly when it appears first");
  });

  await runTest("resolveProviderConfig validation when key is missing and provider not hosted", async () => {
    let errorMsg = "";
    try {
      await resolveProviderConfig({ provider: "nvidia" }, { HOSTED_PROVIDER: "google,openai" });
    } catch (e) {
      if (e instanceof ValidationError) errorMsg = e.message;
    }
    assert.ok(errorMsg.includes("API key is required for provider \"nvidia\""), "Should validate missing key for non-hosted provider");
  });

  await runTest("iterSseEvents yields remaining buffer without trailing double newline", async () => {
    const stream = makeMockStream([
      "data: {\"piece\": 5}\n\n",
      "data: {\"piece\": 6}"
    ]);
    const results = [];
    for await (const event of iterSseEvents(stream)) {
      results.push(event.data);
    }
    assert.ok(results.length === 2, "Should yield 2 events, including the last one without trailing newlines");
    assert.ok(results[1] === '{"piece": 6}', "Last event data should be yielded correctly");
  });

  return results;
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (body && body.run_unit_tests) {
    const testResults = await runUnitTests();
    const passed = testResults.every(r => r.passed);
    return json({ ok: true, passed, results: testResults });
  }

  const original = String(body.original || "").trim();
  const optimized = String(body.optimized || "").trim();
  if (!original || !optimized) {
    return json({ ok: false, error: "original and optimized are both required" }, 400);
  }
  if (original.length > 30000 || optimized.length > 30000) {
    return json({ ok: false, error: "Prompt too long (max 30,000 characters)" }, 400);
  }

  let config;
  try {
    config = await resolveProviderConfig(body, env);
  } catch (e) {
    if (e instanceof ValidationError) return json({ ok: false, error: e.message }, 400);
    throw e;
  }

  try {
    const [originalResult, optimizedResult] = await Promise.all([
      callCompletion(config, "", original, 1000),
      callCompletion(config, "", optimized, 1000),
    ]);
    return json({
      ok: true,
      original_output: originalResult.content,
      optimized_output: optimizedResult.content,
      original_truncated: originalResult.truncated,
      optimized_truncated: optimizedResult.truncated,
    });
  } catch (e) {
    return json({ ok: false, error: e.message || "Test run failed." }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
