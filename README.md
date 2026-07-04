# Prompt Optimizer

Paste a rough prompt, get back a structured, model-tailored rewrite — with
chain-of-thought/few-shot/XML technique toggles, per-target-model guidance
(Claude/GPT/Gemini/local), iterative refinement, a word-diff view, and a
before/after test run against the raw vs. optimized prompt.

Runs entirely on Cloudflare Pages + Pages Functions. No database, no
build step — a static HTML page plus a few small API functions that call
whatever OpenAI-compatible or Anthropic-compatible endpoint you configure.

## Bring your own API key (default)

Click the settings gear in the top-right corner and pick a provider
(OpenRouter, NVIDIA NIM, OpenAI, Anthropic, or any custom OpenAI-compatible
base URL) plus your API key. The key is stored only in your browser's
`localStorage` and sent directly to the API function per-request — it is
never logged or persisted server-side.

## Running locally

```bash
npm install
npm run dev
```

This starts `wrangler pages dev`, serving `public/` and the `functions/`
API routes on `http://localhost:8788`.

## Deploying to Cloudflare Pages

```bash
npm run deploy
```

Or connect the repo in the Cloudflare dashboard for git-based deploys.

## Optional: hosting a shared free-tier key

If you want visitors to be able to use the tool without entering their own
key, set these on the Pages project (Settings → Environment Variables /
Secrets):

- `HOSTED_PROVIDER` = `openrouter` or `nvidia`
- `HOSTED_MODEL` = a model id available on that provider (e.g. a free
  OpenRouter model like `deepseek/deepseek-chat-v3.1:free`)
- `OPENROUTER_API_KEY` or `NVIDIA_API_KEY` (as a **secret**, matching
  `HOSTED_PROVIDER`)

When a visitor hasn't configured their own key in Settings, requests fall
back to this shared key automatically. Anyone cloning this repo without
setting these secrets will need to bring their own key.

## Project layout

```
public/index.html            the whole frontend (single page, no build step)
functions/api/optimize-prompt.js         POST — one-shot optimize/refine/critique
functions/api/optimize-prompt/stream.js  POST — same, streamed as SSE
functions/api/optimize-prompt/test.js    POST — run original vs. optimized prompt
functions/_lib/optimizer.js              shared prompt-building + provider-calling logic
```
