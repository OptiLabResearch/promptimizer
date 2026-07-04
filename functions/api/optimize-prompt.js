import {
  ValidationError,
  buildOptimizePrompt,
  parseDelimitedResponse,
  resolveProviderConfig,
  callCompletion,
} from "../_lib/optimizer.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const rawPrompt = String(body.prompt || "").trim();
  if (!rawPrompt) return json({ ok: false, error: "prompt is required" }, 400);
  if (rawPrompt.length > 30000) {
    return json({ ok: false, error: "Prompt too long (max 30,000 characters)" }, 400);
  }

  let systemPrompt, userText, config;
  try {
    ({ systemPrompt, userText } = buildOptimizePrompt(body, rawPrompt));
    config = resolveProviderConfig(body, env);
  } catch (e) {
    if (e instanceof ValidationError) return json({ ok: false, error: e.message }, 400);
    throw e;
  }

  try {
    const { content, truncated } = await callCompletion(config, systemPrompt, userText);
    if (truncated) {
      return json(
        { ok: false, error: "The model's response was cut off before it finished. Try a shorter prompt or a different model." },
        502
      );
    }
    const { optimizedText, explanationText } = parseDelimitedResponse(content);
    return json({ ok: true, optimized_prompt: optimizedText, explanation: explanationText, model: config.model });
  } catch (e) {
    return json({ ok: false, error: e.message || "Optimization failed." }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
