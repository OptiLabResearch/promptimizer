# Prompt Optimizer

Live website: https://promptoptimizer.optiqo.dev/

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

- `HOSTED_PROVIDER` = `openrouter`, `nvidia`, or a comma-separated list of
  both (e.g. `nvidia,openrouter`) to fail over from one provider to the next
  if every model on the first provider errors out.
- `HOSTED_MODEL` = a model id available on the *first* listed provider (e.g.
  a free OpenRouter model like `deepseek/deepseek-chat-v3.1:free`, or an
  NVIDIA NIM model like `nvidia/nemotron-3-super-120b-a12b`). Can be a
  comma-separated list — if a model errors out (e.g. rate-limited), the next
  one in the list is tried automatically.
- `HOSTED_MODEL_NVIDIA` / `HOSTED_MODEL_OPENROUTER` — same as `HOSTED_MODEL`
  but scoped to a specific provider. Use these instead of (or in addition to)
  `HOSTED_MODEL` when `HOSTED_PROVIDER` lists more than one provider, so each
  one gets its own model list.
- `OPENROUTER_API_KEY` and/or `NVIDIA_API_KEY` (as **secrets**, matching
  whichever provider(s) are listed in `HOSTED_PROVIDER`)

When a visitor hasn't configured their own key in Settings, requests fall
back to this shared configuration automatically, trying each model on each
listed provider in order until one succeeds. Anyone cloning this repo
without setting these secrets will need to bring their own key.

## Project layout

```
public/index.html            the whole frontend (single page, no build step)
functions/api/optimize-prompt.js         POST — one-shot optimize/refine/critique
functions/api/optimize-prompt/stream.js  POST — same, streamed as SSE
functions/api/optimize-prompt/test.js    POST — run original vs. optimized prompt
functions/_lib/optimizer.js              shared prompt-building + provider-calling logic
```
