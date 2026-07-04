// Shared prompt-building, response-parsing, and LLM-calling logic for the
// prompt optimizer API. Ported from hermes-webui's api/routes.py so this
// project can run standalone (no hermes-webui backend dependency).

export const PROVIDER_PRESETS = {
  openrouter: {
    label: "OpenRouter",
    mode: "chat",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "deepseek/deepseek-chat-v3.1:free",
  },
  nvidia: {
    label: "NVIDIA NIM",
    mode: "chat",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.1-8b-instruct",
  },
  openai: {
    label: "OpenAI",
    mode: "chat",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  anthropic: {
    label: "Anthropic",
    mode: "anthropic",
    baseUrl: "https://api.anthropic.com",
    defaultModel: "claude-haiku-4-5-20251001",
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    mode: "chat",
    baseUrl: "",
    defaultModel: "",
  },
};

const TARGET_MODEL_GUIDELINES = {
  claude:
    "Target model: Anthropic Claude. Structure the prompt with XML tags " +
    "(e.g. <context>, <instructions>, <constraints>) since Claude follows " +
    "tag-delimited sections especially well.",
  gpt:
    "Target model: OpenAI GPT. Structure the prompt with markdown headers " +
    "(##) and numbered/bulleted lists rather than XML tags.",
  gemini:
    "Target model: Google Gemini. Use explicit, numbered step-by-step " +
    "instructions and be very literal/unambiguous about the task.",
  local:
    "Target model: a small local/open-weight model. Keep the prompt short, " +
    "simple, and direct — avoid deeply nested structure, long context, or " +
    "many simultaneous constraints, since small models follow simple " +
    "instructions far more reliably than complex ones.",
  generic:
    "Target model: unspecified/generic. Use widely-compatible structure " +
    "(clear headers, short paragraphs) that works reasonably well across " +
    "most LLMs.",
};

const STRENGTH_GUIDELINES = {
  concise: "Keep the optimized prompt extremely focused, concise, and direct. Eliminate all fluff.",
  detailed: "Be highly detailed. Expand the prompt to include clear context, comprehensive instructions, edge cases, and constraints.",
  balanced: "Strike an optimal balance between conciseness, instruction clarity, and contextual detail.",
};

const TECHNIQUE_GUIDELINES = {
  cot: "Instruct the model to reason step-by-step (chain-of-thought) before giving its final answer.",
  fewshot: "Include 1-3 well-chosen few-shot examples that demonstrate the desired input/output pattern.",
  xml: "Structure the prompt's sections with XML tags (e.g. <context>, <task>, <constraints>) for clarity.",
  placeholders: "Use variable placeholders in the form {{like_this}} for values that should be filled in dynamically.",
};

export class ValidationError extends Error {}

export function buildOptimizePrompt(body, rawPrompt) {
  const previousPrompt = String(body.previous_prompt || "").trim();
  const refinementInstruction = String(body.refinement_instruction || "").trim();
  if (refinementInstruction.length > 2000) {
    throw new ValidationError("Refinement instruction too long (max 2,000 characters)");
  }
  const isRefinement = Boolean(previousPrompt && refinementInstruction);

  if (isRefinement) {
    const systemPrompt =
      "You are an expert Prompt Engineer. The user has an already-optimized prompt and wants a " +
      "targeted revision, not a from-scratch rewrite. Apply ONLY the requested change while " +
      "preserving everything else about the prompt's structure, persona, and intent.\n\n" +
      "You MUST structure your entire response as exactly these two blocks, in this order,\n" +
      "with no text before, between, or after them:\n\n" +
      "<optimized_prompt>\n" +
      "The full prompt after applying the requested revision, in markdown format.\n" +
      "</optimized_prompt>\n" +
      "<explanation>\n" +
      "A short markdown bullet-point list of what changed and why.\n" +
      "</explanation>";
    const userText =
      `Current optimized prompt:\n${previousPrompt}\n\n` +
      `Requested revision: ${refinementInstruction}`;
    return { systemPrompt, userText };
  }

  const mode = String(body.mode || "").trim().toLowerCase();

  if (mode === "critique") {
    const systemPrompt =
      "You are an expert Prompt Engineer conducting a critique of a prompt — you do NOT rewrite it.\n" +
      "Score the user's raw prompt from 1-10 on each of: Clarity, Specificity, Structure, and Completeness.\n" +
      "Then list the concrete weaknesses you found and actionable suggestions for improving them.\n\n" +
      "You MUST structure your entire response as exactly these two blocks, in this order,\n" +
      "with no text before, between, or after them:\n\n" +
      "<optimized_prompt>\n" +
      "Repeat the user's raw prompt here, verbatim and unchanged.\n" +
      "</optimized_prompt>\n" +
      "<explanation>\n" +
      "A markdown response with the four scores (out of 10) followed by a bullet-point list of weaknesses " +
      "and suggestions. Do not include a rewritten prompt here.\n" +
      "</explanation>";
    return { systemPrompt, userText: `Raw Prompt to Optimize:\n${rawPrompt}` };
  }

  const strength = String(body.strength || "balanced").trim().toLowerCase();
  const guideline = STRENGTH_GUIDELINES[strength] || STRENGTH_GUIDELINES.balanced;

  const requestedTechniques = Array.isArray(body.techniques) ? body.techniques : [];
  const techniqueLines = [];
  for (const t of requestedTechniques) {
    const line = TECHNIQUE_GUIDELINES[String(t).trim().toLowerCase()];
    if (line && !techniqueLines.includes(line)) techniqueLines.push(line);
  }

  let systemPrompt =
    "You are an expert Prompt Engineer specializing in optimizing prompts for LLMs (such as Claude, GPT-4, and Gemini).\n" +
    "Your task is to take the user's raw prompt and rewrite it to make it highly effective, structured, and clear.\n\n" +
    "Structure your optimization around these principles:\n" +
    "1. Persona: Assign a clear role/expert identity to the LLM.\n" +
    "2. Context & Task: Clearly outline the background and the core objective.\n" +
    "3. Instructions: Provide step-by-step instructions or steps to follow.\n" +
    "4. Constraints: Define what the model should NOT do, style criteria, or limitations.\n" +
    "5. Output Format: Specify the structural or syntax format (Markdown, JSON, list, etc.) of the response.\n\n" +
    `Optimization Requirement: ${guideline}\n`;

  if (techniqueLines.length) {
    systemPrompt += "\nAdditionally, incorporate these techniques:\n" +
      techniqueLines.map((l) => `- ${l}`).join("\n") + "\n";
  }

  const targetModel = String(body.target_model || "").trim().toLowerCase();
  const targetGuideline = TARGET_MODEL_GUIDELINES[targetModel];
  if (targetGuideline) systemPrompt += `\n${targetGuideline}\n`;

  systemPrompt +=
    "\nYou MUST structure your entire response as exactly these two blocks, in this order,\n" +
    "with no text before, between, or after them:\n\n" +
    "<optimized_prompt>\n" +
    "The full, rewritten prompt in markdown format.\n" +
    "</optimized_prompt>\n" +
    "<explanation>\n" +
    "A short markdown bullet-point list of the specific improvements you made and why.\n" +
    "</explanation>";

  return { systemPrompt, userText: `Raw Prompt to Optimize:\n${rawPrompt}` };
}

export function parseDelimitedResponse(rawResponse) {
  let cleanResponse = rawResponse.trim();

  cleanResponse = cleanResponse
    .replace(/<(think|thinking|thought|reasoning)>[\s\S]*?<\/\1>/g, "")
    .trim();

  let optimizedText = "";
  let explanationText = "";

  const optMatch = cleanResponse.match(/<optimized_prompt>([\s\S]*?)<\/optimized_prompt>/);
  if (optMatch) {
    optimizedText = optMatch[1].trim();
    const expMatch = cleanResponse.match(/<explanation>([\s\S]*?)<\/explanation>/);
    explanationText = expMatch ? expMatch[1].trim() : "";
  } else {
    let jsonCandidate = cleanResponse;
    if (jsonCandidate.startsWith("```json")) {
      jsonCandidate = jsonCandidate.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (jsonCandidate.startsWith("```")) {
      jsonCandidate = jsonCandidate.replace(/^```/, "").replace(/```$/, "").trim();
    }
    const firstBrace = jsonCandidate.indexOf("{");
    const lastBrace = jsonCandidate.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonCandidate = jsonCandidate.slice(firstBrace, lastBrace + 1);
    }
    try {
      const result = JSON.parse(jsonCandidate);
      optimizedText = String(result.optimized_prompt || "").trim();
      explanationText = String(result.explanation || "").trim();
    } catch (e) {
      // fall through to last-resort below
    }

    if (!optimizedText) optimizedText = cleanResponse;
  }

  return { optimizedText, explanationText };
}

// Resolves which provider config to use: the caller's own key (BYO, from the
// request body) takes priority; otherwise fall back to a shared key from
// environment secrets (only present on the maintainer's hosted instance).
export function resolveProviderConfig(body, env) {
  const bodyApiKey = String(body.api_key || "").trim();
  const bodyProvider = String(body.provider || "").trim().toLowerCase();
  const bodyModel = String(body.model || "").trim();
  const bodyBaseUrl = String(body.base_url || "").trim();

  if (bodyApiKey) {
    const preset = PROVIDER_PRESETS[bodyProvider];
    const mode = preset ? preset.mode : "chat";
    const baseUrl = bodyBaseUrl || (preset ? preset.baseUrl : "");
    const model = bodyModel || (preset ? preset.defaultModel : "");
    if (!baseUrl) throw new ValidationError("A base URL is required for a custom provider.");
    if (!model) throw new ValidationError("A model is required.");
    return { mode, baseUrl, apiKey: bodyApiKey, model, source: "byo" };
  }

  // No client key supplied — try the server's shared hosted-instance key.
  const sharedProvider = (env.HOSTED_PROVIDER || "").trim().toLowerCase();
  const sharedKey = sharedProvider === "nvidia" ? env.NVIDIA_API_KEY : env.OPENROUTER_API_KEY;
  if (sharedProvider && sharedKey) {
    const preset = PROVIDER_PRESETS[sharedProvider];
    const model = env.HOSTED_MODEL || (preset ? preset.defaultModel : "");
    return { mode: preset.mode, baseUrl: preset.baseUrl, apiKey: sharedKey, model, source: "hosted" };
  }

  throw new ValidationError(
    "No API key configured. Add your own key in Settings, or ask the site owner to configure a shared key."
  );
}

async function callChatCompletion(config, systemPrompt, userText, maxTokens) {
  const resp = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Upstream provider error (${resp.status}): ${text.slice(0, 300)}`);
  }
  const data = await resp.json();
  const choice = (data.choices || [])[0] || {};
  const content = String(choice.message?.content || "").trim();
  const truncated = String(choice.finish_reason || "") === "length";
  return { content, truncated };
}

async function callAnthropicCompletion(config, systemPrompt, userText, maxTokens) {
  const resp = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Upstream provider error (${resp.status}): ${text.slice(0, 300)}`);
  }
  const data = await resp.json();
  const content = (data.content || []).map((b) => b.text || "").join("").trim();
  const truncated = data.stop_reason === "max_tokens";
  return { content, truncated };
}

export async function callCompletion(config, systemPrompt, userText, maxTokens = 4000) {
  if (config.mode === "anthropic") return callAnthropicCompletion(config, systemPrompt, userText, maxTokens);
  return callChatCompletion(config, systemPrompt, userText, maxTokens);
}

// Streams text chunks from the upstream provider, calling onChunk(text) as
// they arrive. Returns { truncated }.
export async function streamCompletion(config, systemPrompt, userText, maxTokens, onChunk) {
  if (config.mode === "anthropic") {
    const resp = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        system: systemPrompt,
        messages: [{ role: "user", content: userText }],
        max_tokens: maxTokens,
        stream: true,
      }),
    });
    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Upstream provider error (${resp.status}): ${text.slice(0, 300)}`);
    }
    let truncated = false;
    for await (const event of iterSseEvents(resp.body)) {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        continue;
      }
      if (data.type === "content_block_delta" && data.delta?.text) onChunk(data.delta.text);
      if (data.type === "message_delta" && data.delta?.stop_reason === "max_tokens") truncated = true;
    }
    return { truncated };
  }

  const resp = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Upstream provider error (${resp.status}): ${text.slice(0, 300)}`);
  }
  let truncated = false;
  for await (const event of iterSseEvents(resp.body)) {
    if (event.data === "[DONE]") break;
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      continue;
    }
    const choice = (data.choices || [])[0];
    const piece = choice?.delta?.content;
    if (piece) onChunk(piece);
    if (String(choice?.finish_reason || "") === "length") truncated = true;
  }
  return { truncated };
}

// Minimal SSE parser for upstream provider streams: yields {event, data} per
// "data: ..." line block, matching the OpenAI/Anthropic wire format.
async function* iterSseEvents(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const dataLines = raw.split("\n").filter((l) => l.startsWith("data:"));
      if (!dataLines.length) continue;
      const data = dataLines.map((l) => l.slice(5).trim()).join("\n");
      yield { data };
    }
  }
}
