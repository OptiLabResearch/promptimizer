import { PROVIDER_PRESETS } from "../_lib/optimizer.js";

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!file) {
      return json({ ok: false, error: "No audio file provided." }, 400);
    }

    // Get optional client-provided settings
    let apiKey = String(formData.get("api_key") || "").trim();
    let provider = String(formData.get("provider") || "").trim().toLowerCase();
    let baseUrl = String(formData.get("base_url") || "").trim();
    let model = String(formData.get("model") || "").trim();

    // Determine authorization key and endpoint
    let targetUrl;
    let targetKey;
    let targetModel;

    if (apiKey) {
      // Client-supplied custom key (BYO)
      targetKey = apiKey;
      const preset = PROVIDER_PRESETS[provider];
      const resolvedBaseUrl = baseUrl || (preset ? preset.baseUrl : "");
      if (!resolvedBaseUrl) {
        return json({ ok: false, error: "A base URL is required for custom transcription providers." }, 400);
      }
      targetUrl = `${resolvedBaseUrl.replace(/\/+$/, "")}/audio/transcriptions`;
      targetModel = model || (provider === "openai" ? "whisper-1" : "whisper-large-v3");
    } else {
      // Server-side configured key (hosted mode fallback)
      // Check env.GROQ_API_KEY first as it is the fastest, then env.OPENAI_API_KEY
      if (env.GROQ_API_KEY) {
        targetKey = env.GROQ_API_KEY;
        targetUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
        targetModel = "whisper-large-v3";
      } else if (env.OPENAI_API_KEY) {
        targetKey = env.OPENAI_API_KEY;
        targetUrl = "https://api.openai.com/v1/audio/transcriptions";
        targetModel = "whisper-1";
      } else {
        return json({ ok: false, error: "No speech-to-text API keys configured on the server." }, 500);
      }
    }

    // Prepare the outgoing request to the STT provider
    const upstreamForm = new FormData();
    upstreamForm.append("file", file, "audio.webm");
    upstreamForm.append("model", targetModel);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const upstreamResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${targetKey}`
      },
      body: upstreamForm,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text().catch(() => "");
      console.error(`STT upstream error (${upstreamResponse.status}): ${text}`);
      return json({ ok: false, error: `Upstream transcription error: ${text.slice(0, 300) || upstreamResponse.statusText}` }, upstreamResponse.status);
    }

    const data = await upstreamResponse.json();
    return json({ ok: true, text: data.text });

  } catch (e) {
    console.error("Transcription error:", e);
    return json({ ok: false, error: e.message || "Transcription failed." }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
