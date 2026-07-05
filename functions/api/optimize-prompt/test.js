const assert = {
  ok(val, message) {
    if (!val) throw new Error(message || "Assertion failed");
  }
};
import { ValidationError, resolveProviderConfig, callCompletion, buildOptimizePrompt, buildRefinePassPrompt } from "../../_lib/optimizer.js";

export function runUnitTests() {
  const results = [];
  const runTest = (name, fn) => {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (e) {
      results.push({ name, passed: false, error: e.message });
    }
  };

  runTest("buildOptimizePrompt contains OUTCOME-FIRST", () => {
    const { systemPrompt } = buildOptimizePrompt({}, "write a story");
    assert.ok(systemPrompt.includes("OUTCOME-FIRST"), "System prompt should contain OUTCOME-FIRST");
  });

  runTest("conditional CoT behavior (local target)", () => {
    const { systemPrompt } = buildOptimizePrompt({ techniques: ["cot"], target_model: "local" }, "write a story");
    assert.ok(
      systemPrompt.includes("Add explicit step-by-step reasoning instructions (chain-of-thought)"),
      "Local target with cot technique should request manual step-by-step reasoning instructions"
    );
  });

  runTest("conditional CoT behavior (non-local target)", () => {
    const { systemPrompt } = buildOptimizePrompt({ techniques: ["cot"], target_model: "claude" }, "write a story");
    assert.ok(
      systemPrompt.includes("reasoning effort should be set via the API's reasoning/thinking parameter"),
      "Non-local target with cot technique should suggest setting reasoning/thinking parameter"
    );
  });

  runTest("new claude target model guideline", () => {
    const { systemPrompt } = buildOptimizePrompt({ target_model: "claude" }, "write a story");
    assert.ok(
      systemPrompt.includes("XML tags as the native delimiter dialect") &&
      systemPrompt.includes("do NOT rely on assistant-prefill tricks"),
      "Claude target guidelines should contain updated XML tag and prefill advice"
    );
  });

  runTest("new gpt target model guideline", () => {
    const { systemPrompt } = buildOptimizePrompt({ target_model: "gpt" }, "write a story");
    assert.ok(
      systemPrompt.includes("Structure the prompt with markdown headers and lists rather than XML") &&
      systemPrompt.includes("outcome-first is official doctrine"),
      "GPT target guidelines should contain updated markdown and outcome-first advice"
    );
  });

  runTest("depth deep helper exists and returns instructions", () => {
    const refine = buildRefinePassPrompt("raw story prompt", "first optimized story prompt");
    assert.ok(typeof refine === "object" && refine.systemPrompt && refine.userText, "buildRefinePassPrompt should return systemPrompt and userText");
    assert.ok(refine.systemPrompt.includes("<optimized_prompt>") && refine.systemPrompt.includes("<explanation>"), "refine pass systemPrompt must contain the two-block contract instructions");
    assert.ok(refine.userText.includes("raw story prompt") && refine.userText.includes("first optimized story prompt"), "refine pass userText must contain the raw prompt and first-pass optimized prompt");
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
    const testResults = runUnitTests();
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
    config = resolveProviderConfig(body, env);
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
