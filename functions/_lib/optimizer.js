// Shared prompt-building, response-parsing, and LLM-calling logic for the
// prompt optimizer API. Ported from hermes-webui's api/routes.py so this
// project can run standalone (no hermes-webui backend dependency).

export const PROVIDER_PRESETS = {
  openrouter: {
    label: "OpenRouter",
    mode: "chat",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "nvidia/nemotron-3-ultra-550b-a55b:free",
  },
  nvidia: {
    label: "NVIDIA NIM",
    mode: "chat",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "minimaxai/minimax-m3",
  },
  google: {
    label: "Google Gemini",
    mode: "chat",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-3-5-flash",
  },
  openai: {
    label: "OpenAI",
    mode: "chat",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5-4-mini",
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
    "Target model: Anthropic Claude. XML tags as the native delimiter dialect " +
    "(<task>, <rules>, <document>, <example>); long documents at top in <document> " +
    "wrappers, query/instructions at bottom; do NOT rely on assistant-prefill tricks " +
    "(deprecated); role via system prompt is a strong lever; note newer Claude models " +
    "are concise by default — ask for summaries explicitly if visibility is wanted. " +
    "If the target is a modern reasoning model, do not add 'think step by step' — " +
    "reasoning is controlled by a budget parameter, not prompt text.",
  gpt:
    "Target model: OpenAI GPT. Structure the prompt with markdown headers and lists " +
    "rather than XML tags; outcome-first is official doctrine; GPT-5.x follows " +
    "instructions literally — be specific, define stopping rules; keep personality/tone " +
    "separate from decision rules; mention verbosity/output-contract blocks. " +
    "If the target is a modern reasoning model, do not add 'think step by step' — " +
    "reasoning is controlled by a budget parameter, not prompt text.",
  gemini:
    "Target model: Google Gemini. Clear sectioning (markdown or XML both fine); for " +
    "long-context, data first and query last; don't hand-write CoT — thinking budget is " +
    "a parameter. If the target is a modern reasoning model, do not add 'think step by step' — " +
    "reasoning is controlled by a budget parameter, not prompt text.",
  local:
    "Target model: a small local/open-weight model. Keep the prompt short, simple, and direct — " +
    "avoid deeply nested structure, long context, or many simultaneous constraints, since small " +
    "models follow simple instructions far more reliably than complex ones. Manual chain-of-thought " +
    "(\"reason step by step before answering\") IS still useful here since small non-reasoning models " +
    "benefit from it. If the target is a modern reasoning model, do not add 'think step by step' — " +
    "reasoning is controlled by a budget parameter, not prompt text.",
  generic:
    "Target model: unspecified/generic. Portable architecture (role, context, ordered rules or " +
    "outcome definition, output schema, examples) with widely-compatible markdown structure; " +
    "note the delimiter dialect can be swapped per provider. If the target is a modern reasoning " +
    "model, do not add 'think step by step' — reasoning is controlled by a budget parameter, not prompt text.",
};

const STRENGTH_GUIDELINES = {
  concise: "Keep the optimized prompt extremely focused, concise, and direct. Eliminate all fluff.",
  detailed: "Be highly detailed. Expand the prompt to include clear context, comprehensive instructions, edge cases, and constraints.",
  balanced: "Strike an optimal balance between conciseness, instruction clarity, and contextual detail.",
};

// Controls the literal output length of the rewritten prompt, independent of
// STRENGTH_GUIDELINES above (which governs structural balance, not word count).
const LENGTH_GUIDELINES = {
  concise: "Keep the rewritten prompt itself short and tight — roughly the same length as the raw input, favoring brevity over exhaustive structure even if that means omitting optional sections.",
  standard: "Keep the rewritten prompt's overall length proportionate to the input — expand only what's needed for clarity, not for its own sake.",
  full: "Expand the rewritten prompt with comprehensive context, detailed step-by-step instructions, edge cases, and constraints wherever they add value.",
};

const TECHNIQUE_GUIDELINES = {
  cot: "", // Handled dynamically in buildOptimizePrompt based on targetModel
  fewshot: "Include 2–3 curated, contrastive examples that cover edge cases, including one near-miss negative example annotated with why it's wrong. Examples must be consistent with every stated rule — examples override instructions when they conflict.",
  xml: "Structure the prompt's sections with XML tags (e.g. <context>, <task>, <constraints>) for clarity, using XML as the delimiter dialect regardless of target-model default.",
  placeholders: "Use variable placeholders in the form {{like_this}} for values that should be filled in dynamically, putting input-data placeholders where the data belongs (long reference at top, query at bottom).",
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
      "preserving everything else about the prompt's structure, persona, and intent. " +
      "When applying the revision, keep the prompt aligned with modern best practice " +
      "(outcome-first, delimited data, output contract); do not reintroduce step-by-step " +
      "micromanagement or 'think step by step' boilerplate.\n\n" +
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
      "Evaluate the user's raw prompt through these four guide-aligned axes, scoring each from 1-10:\n" +
      "1. Outcome clarity (Is 'done' defined? Are success criteria, hard constraints, and output shape specified outcome-first?)\n" +
      "2. Structure & delimiting (Is there clear separation of data vs instructions? Is reference material at the top and the query at the bottom?)\n" +
      "3. Output contract (Is there an enforceable format, explicit schema, template, or strict length limits?)\n" +
      "4. Robustness (Are there anti-hallucination outs, explicit enums for classifications, and conditional decision rules over absolutes?)\n\n" +
      "Evaluate through each lens separately. At the end of the evaluation, list the top 3 highest-impact fixes, ordered by expected gain.\n\n" +
      "You MUST structure your entire response as exactly these two blocks, in this order,\n" +
      "with no text before, between, or after them:\n\n" +
      "<optimized_prompt>\n" +
      "Repeat the user's raw prompt here, verbatim and unchanged.\n" +
      "</optimized_prompt>\n" +
      "<explanation>\n" +
      "A markdown response with the four scores (out of 10) followed by the detailed evaluation through each lens, " +
      "and ending with the top 3 highest-impact fixes ordered by expected gain. Do not include a rewritten prompt here.\n" +
      "</explanation>";
    return { systemPrompt, userText: `Raw Prompt to Optimize:\n${rawPrompt}` };
  }

  const strength = String(body.strength || "balanced").trim().toLowerCase();
  const guideline = STRENGTH_GUIDELINES[strength] || STRENGTH_GUIDELINES.balanced;

  const targetModel = String(body.target_model || "").trim().toLowerCase();
  const requestedTechniques = Array.isArray(body.techniques) ? body.techniques : [];
  const techniqueLines = [];
  for (const t of requestedTechniques) {
    const techKey = String(t).trim().toLowerCase();
    if (techKey === "cot") {
      const line = targetModel === "local"
        ? "Add explicit step-by-step reasoning instructions (chain-of-thought) before giving the final answer."
        : "For modern reasoning models, note that reasoning effort should be set via the API's reasoning/thinking parameter rather than using 'think step by step' prompt text.";
      if (!techniqueLines.includes(line)) techniqueLines.push(line);
    } else {
      const line = TECHNIQUE_GUIDELINES[techKey];
      if (line && !techniqueLines.includes(line)) techniqueLines.push(line);
    }
  }

  let systemPrompt =
    "You are an expert prompt engineer (2026 practice). Rewrite the user's raw prompt into a\n" +
    "highly effective prompt. Apply these principles:\n\n" +
    "1. OUTCOME-FIRST: Define what \"done\" looks like — the expected outcome, success criteria,\n" +
    "   hard constraints, and output shape. Do NOT prescribe step-by-step procedures unless the\n" +
    "   raw prompt shows the exact path itself matters (compliance, fixed pipelines).\n" +
    "2. STRUCTURED ANATOMY, in this order when sections are warranted:\n" +
    "   role/identity → tone rules → reference material (delimited & labeled) → task/outcome\n" +
    "   definition → hard rules → examples → output format contract → the input/query LAST.\n" +
    "   Only include sections that earn their place; do not pad with empty boilerplate sections.\n" +
    "3. DELIMIT DATA FROM INSTRUCTIONS: any user-supplied data, documents, or variable content\n" +
    "   goes in clearly delimited blocks. Long reference material at the top; the query and\n" +
    "   instructions at the bottom.\n" +
    "4. OUTPUT CONTRACT, not polite requests: exact format spec (schema, template, or explicit\n" +
    "   length limits like \"≤5 bullets\"). Prefer machine-checkable shapes.\n" +
    "5. DECISION RULES OVER ABSOLUTES: reserve ALWAYS/NEVER/MUST for true invariants; use\n" +
    "   \"If X then Y, otherwise Z\" conditional rules for judgment calls.\n" +
    "6. ANTI-HALLUCINATION: when the task involves extraction, facts, or classification, give\n" +
    "   the model an out (\"if absent, output null / say 'insufficient information' — never\n" +
    "   guess\") and constrain categorical outputs to explicit enums.\n" +
    "7. HIGH SIGNAL ONLY: aim for the smallest set of high-signal tokens that achieves the\n" +
    "   outcome. Cut filler like \"please\", \"world-class\", and restated obvious context.\n" +
    "8. PLACEHOLDERS: if the prompt will be reused with varying inputs, mark those spots as\n" +
    "   {{VARIABLES}} and put them where the data belongs (bottom for queries).\n\n" +
    `Optimization Requirement: ${guideline}\n`;

  if (techniqueLines.length) {
    systemPrompt += "\nAdditionally, incorporate these techniques:\n" +
      techniqueLines.map((l) => `- ${l}`).join("\n") + "\n";
  }

  const length = String(body.length || "standard").trim().toLowerCase();
  const lengthGuideline = LENGTH_GUIDELINES[length] || LENGTH_GUIDELINES.standard;
  systemPrompt += `\nOutput length: ${lengthGuideline}\n`;

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

export function buildRefinePassPrompt(rawPrompt, firstOptimized) {
  const systemPrompt =
    "You are an expert prompt engineer. Critique the following optimized prompt through two lenses:\n" +
    "1. Robustness and failure modes (hallucination outs, ambiguity, conflicting rules)\n" +
    "2. Signal density and structure (placement, output contract)\n\n" +
    "Then, output the improved final version in the same two-block format.\n\n" +
    "You MUST structure your entire response as exactly these two blocks, in this order,\n" +
    "with no text before, between, or after them:\n\n" +
    "<optimized_prompt>\n" +
    "The improved final prompt in markdown format.\n" +
    "</optimized_prompt>\n" +
    "<explanation>\n" +
    "A short markdown bullet-point list of what you improved from the first version and why.\n" +
    "</explanation>";

  const userText =
    `Original raw prompt:\n${rawPrompt}\n\n` +
    `First-pass optimized prompt:\n${firstOptimized}`;

  return { systemPrompt, userText };
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
//
// The result is `{ attempts, source }`, where `attempts` is an ordered list
// of `{ mode, baseUrl, apiKey, model }` candidates to try in sequence —
// falling back to the next attempt on any upstream error (rate limit, 5xx,
// etc). For BYO keys there's exactly one attempt. For the hosted instance,
// `HOSTED_PROVIDER` may itself be a comma-separated list of providers (e.g.
// "nvidia,openrouter"), each contributing its own models (from
// `HOSTED_MODEL_<PROVIDER>`, or `HOSTED_MODEL` for the first provider, or
// the provider's default) — so a request can fail over from one model to
// the next *and* from one provider to the next.
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
    return { attempts: [{ mode, baseUrl, apiKey: bodyApiKey, model }], source: "byo" };
  }

  // No client key supplied — try the server's shared hosted-instance key(s).
  const sharedProviders = String(env.HOSTED_PROVIDER || "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const attempts = [];
  sharedProviders.forEach((provider, i) => {
    const preset = PROVIDER_PRESETS[provider];
    if (!preset) return;
    const key =
      provider === "nvidia"
        ? env.NVIDIA_API_KEY
        : provider === "openrouter"
          ? env.OPENROUTER_API_KEY
          : provider === "google"
            ? env.GOOGLE_API_KEY
            : undefined;
    if (!key) return;
    const rawModels = env[`HOSTED_MODEL_${provider.toUpperCase()}`] || (i === 0 ? env.HOSTED_MODEL : "");
    const models = String(rawModels || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!models.length) models.push(preset.defaultModel);
    for (const model of models) attempts.push({ mode: preset.mode, baseUrl: preset.baseUrl, apiKey: key, model });
  });

  if (attempts.length) return { attempts, source: "hosted" };

  throw new ValidationError(
    "No API key configured. Add your own key in Settings, or ask the site owner to configure a shared key."
  );
}

async function callChatCompletionOnce(attempt, systemPrompt, userText, maxTokens) {
  const resp = await fetch(`${attempt.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${attempt.apiKey}`,
    },
    body: JSON.stringify({
      model: attempt.model,
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

async function callAnthropicCompletionOnce(attempt, systemPrompt, userText, maxTokens) {
  const resp = await fetch(`${attempt.baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": attempt.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: attempt.model,
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

// Tries each attempt (model, possibly from a different provider) in order,
// falling back to the next one if a request fails (e.g. rate-limited or
// temporarily unavailable).
export async function callCompletion(config, systemPrompt, userText, maxTokens = 4000) {
  let lastError;
  for (const attempt of config.attempts) {
    try {
      const result =
        attempt.mode === "anthropic"
          ? await callAnthropicCompletionOnce(attempt, systemPrompt, userText, maxTokens)
          : await callChatCompletionOnce(attempt, systemPrompt, userText, maxTokens);
      return { ...result, model: attempt.model };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function streamAnthropicOnce(attempt, systemPrompt, userText, maxTokens, onChunk) {
  const resp = await fetch(`${attempt.baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": attempt.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: attempt.model,
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

async function streamChatOnce(attempt, systemPrompt, userText, maxTokens, onChunk) {
  const resp = await fetch(`${attempt.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${attempt.apiKey}`,
    },
    body: JSON.stringify({
      model: attempt.model,
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

// Streams text chunks from the upstream provider, calling onChunk(text) as
// they arrive. Tries each attempt (model, possibly from a different
// provider) in order, falling back to the next one if a request fails
// before any chunk is emitted. Returns { truncated, model }.
export async function streamCompletion(config, systemPrompt, userText, maxTokens, onChunk) {
  let lastError;
  for (const attempt of config.attempts) {
    try {
      const result =
        attempt.mode === "anthropic"
          ? await streamAnthropicOnce(attempt, systemPrompt, userText, maxTokens, onChunk)
          : await streamChatOnce(attempt, systemPrompt, userText, maxTokens, onChunk);
      return { ...result, model: attempt.model };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
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
