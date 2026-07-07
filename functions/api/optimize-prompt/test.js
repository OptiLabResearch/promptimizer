import {
  ValidationError,
  RateLimitError,
  resolveProviderConfig,
  callCompletion,
  enforceHostedRateLimit,
  enforceByokRateLimit,
  verifyTurnstileToken,
} from "../../_lib/optimizer.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
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
    if (!String(body.api_key || "").trim()) {
      await verifyTurnstileToken(body, request, env);
      await enforceHostedRateLimit(env, request);
    } else {
      await enforceByokRateLimit(env, request);
    }
    config = await resolveProviderConfig(body, env);
  } catch (e) {
    if (e instanceof ValidationError) return json({ ok: false, error: e.message }, 400);
    if (e instanceof RateLimitError) return json({ ok: false, error: e.message }, 429);
    throw e;
  }

  try {
    const TEST_SYSTEM = "You are executing a user-provided prompt so it can be evaluated in a prompt-testing tool. Respond to the prompt as written, concisely.";
    const [originalResult, optimizedResult] = await Promise.all([
      callCompletion(config, TEST_SYSTEM, original, 1000),
      callCompletion(config, TEST_SYSTEM, optimized, 1000),
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
