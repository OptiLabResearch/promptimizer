# Privacy Policy

**Effective Date:** July 7, 2026

Promptimizer is designed with a strict privacy-first architecture. This Privacy Policy details how we handle user data, API keys, and third-party integrations (including Cloudflare Turnstile).

---

## 1. Core Architecture & Data Control

Promptimizer is a client-side heavy application.
* **Local Storage:** All user configurations, API keys, prompt histories, and saved library items are stored directly within your web browser's local storage (`localStorage`). This data is sandboxed to your browser and is never stored on our servers.
* **No Database:** We do not operate a backend database to store user credentials, keys, or prompt content.

---

## 2. API Key & Prompt Transmission

When you optimize or critique a prompt:
1. **Stateless Proxying:** The application transmits the API key and prompt text via our Cloudflare Pages Functions to act as a stateless proxy to the designated AI provider (e.g., OpenAI, Anthropic, Google, OpenRouter, or NVIDIA NIM).
2. **No Data Logging:** The Cloudflare Pages Functions do not log, cache, or store your API keys or prompt contents. The data is processed in-memory and passed directly to the AI provider.
3. **Direct Transit (Alternative):** If you configure a custom Base URL in the settings, your browser may send requests directly to that endpoint (subject to the CORS configuration of that endpoint).

---

## 3. Third-Party Services & Integrations

### AI Model Providers
Your prompts, variables, and API keys are sent to the AI provider you select (e.g., OpenAI, Anthropic, Google AI Studio, OpenRouter, or NVIDIA). The handling of that data is governed by the respective privacy policies and terms of service of those providers.

### Cloudflare Turnstile (Security & Anti-Abuse)
To protect our platform against automated abuse, spam, and denial-of-service attacks, we use **Cloudflare Turnstile** in **Invisible Mode** (silently validating requests without active visual challenges).

As a condition of using Turnstile's invisible verification mode, we must reference and incorporate Cloudflare's disclosures:
* Turnstile collects and processes telemetry, browser characteristics, and user interaction data to verify that visitor requests are legitimate.
* This processing is governed by the [Cloudflare Turnstile Privacy Addendum](https://www.cloudflare.com/privacypolicy/) and the main [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/).
* No personal identification information is collected by this application through Turnstile.

---

## 4. User Choices & Control

You have full control over your data:
* **Clear Data:** You can delete all stored API keys, history, and preferences at any time by:
  1. Clicking "Clear Saved Keys" or similar reset options in the API Settings panel.
  2. Clearing your browser's site data/cache for this origin.
* **Hosted Keys vs. Bring Your Own Key:** If you choose not to enter a personal API key, you may use shared hosted keys (if available), which keeps all API authentication secret server-side.

---

## 5. Contact & Open Source

Promptimizer is an open-source project. You can inspect the source code, trace data flows, or file issues directly on our [GitHub Repository](https://github.com/OptiLabResearch/prompt-optimizer).
