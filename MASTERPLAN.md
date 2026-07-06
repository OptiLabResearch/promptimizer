# Prompt Optimizer — Masterplan

Synthesis of three LLM design reviews (GLM, Gemini, Fable — `promt optimizer review.txt`)
and five design prototypes (`design ideas/`), mapped against what the app already has today
(`public/index.html` + `functions/`).

---

## 0. Where the reviewers agree (the consensus)

Every reviewer independently landed on the same five problems and the same three product bets.
That agreement is the strongest signal in all of this material.

**The five shared problems:**

1. **The output scroll wall.** Long results stretch the page infinitely; the Optimize button,
   options, and the Enhancements panel all get pushed off-screen. This breaks the core
   compare-and-copy loop. (Gemini review #2, Fable finding #1)
2. **Enhancements Made is buried.** It's the product's best trust/education feature and nobody
   sees it below the fold. (All three)
3. **Unexplained controls.** The four technique checkboxes, the strength dropdown, and the
   model dropdown do invisible things. Users toggle blindly. (All three)
4. **Placeholders leak into copies.** The optimizer correctly outputs `[INSERT X]` /
   `{{variable}}` markers, but the UI does nothing with them — users copy prompts with raw
   brackets still inside. (Fable #3, Gemini idea 3, GLM "variables")
5. **Model source-of-truth ambiguity.** "Active Model" badge (the optimizer engine) vs. the
   target-model dropdown (what the prompt is optimized *for*) read as conflicting. (All three)

**The three shared product bets:**

1. **Test Both is the conversion moment** — nobody believes a prompt optimizer until they see
   original vs. optimized run side by side. *(Already built and real in our app — it needs
   elevation, not construction.)*
2. **A library with versioning is the retention hook** — History exists but it's a log;
   named, versioned, reusable prompts make the tool "where prompts live."
3. **Target-model profiles are the differentiation** — Claude (XML) vs. GPT (markdown/system)
   vs. Gemini conventions differ materially. *(Already partially built server-side.)*

**Reality check — already shipped, reviewers didn't know:** real Test Both, word-diff view,
iterative Refine, target-model guidance, technique toggles, strength control, BYOK settings,
streaming, history log. A lot of the plan below is *surfacing* existing capability, not
building new capability.

---

## 1. Design direction (the visual decision)

The five prototypes split into two philosophies:

| Philosophy | Prototypes | Character |
|---|---|---|
| **Dark IDE workspace** | `glm.html`, `gemini.html`, `gemini v2.html` | Sidebar nav, three panels, fixed viewport, data-dense, workspaces/accounts implied |
| **Light editorial flow** | `glm v2.html` ("Focus & Flow"), `fable.html` (Workbench) | Single column, progressive disclosure, input transforms into annotated result |

**Recommendation: the light editorial flow, using `fable.html` as the base skeleton,
borrowing the best pieces of the others.**

Why:
- Our audience is *mixed* (solo builders **and** semi-technical PMs — Fable's persona split).
  The dark three-panel IDE optimizes for an enterprise power user we don't have yet, and
  implies chrome we can't back up (workspaces, accounts, testbeds as nav items).
- The app is a no-login, single-page static tool on Cloudflare Pages. A single-column flow
  is honest about that and is the smallest change from today's codebase.
- `fable.html` already demonstrates the three consensus fixes working together: the **delta
  bar** (enhancement stats above the fold), **accordion result sections with inline "why this
  changed" notes**, and the **placeholder chip fill-flow with copy gating**.

**Borrow from the others:**
- `glm v2.html`: the transform animation (input shrinks to a context bar, result unfurls),
  the color-coded section left-borders (task=blue, variables=green, constraints=purple),
  the "Why this is better" accordion tone, model chips instead of a dropdown.
- `gemini.html`: fixed-height result region with internal scroll; icon buttons with tooltips
  for Copy/Diff/Edit; the variable sandbox (fill `{{vars}}`, preview the compiled prompt).
- `gemini v2.html`: live token/character estimate under the input; a small presets/sample
  catalog for first-run users.
- `glm.html`: checkbox tooltips copy ("Instructs the AI to output a step-by-step reasoning
  structure") — the exact one-liners are already written there.

**Visual system (merged from Fable's palette table + GLM's typography logic):**
- Keep the purple identity: primary `#7C3AED`/`#6D28D9`, but on a warmer, calmer light
  ground (`#FAFAF7`–`#F6F5FB`) instead of washed lavender gradients.
- Semantic colors, not more purple: green `#0E8A62` for enhancements/filled, amber `#B45309`
  for unfilled placeholders/warnings.
- Two font roles: a sans (Inter or IBM Plex Sans) for UI, a mono (JetBrains/IBM Plex Mono)
  for prompt text — prompts read as code.
- One filled primary button per state; everything else ghost. Cards 10–12px radius, one
  shadow level, 8px spacing grid.
- Accessibility: AA contrast on body text (current gray-on-lavender likely fails), visible
  focus rings, 44px hit targets on toggles, `aria-live` on the result, `aria-expanded`
  accordions, `prefers-reduced-motion` respected (fable.html already does this).

---

## 2. The target experience (one flow)

```
STATE 1 — INPUT (calm, single card)
  Headline + one-line promise
  [ textarea, mono font, {{var}} syntax highlighted ]
  toolbar: char/token count · Length: Concise|Standard|Full ·
           Target: Claude|GPT|Gemini|Other (chips) · Techniques ▸ (collapsed, tooltips)
  [ OPTIMIZE ]  ·  "Try a sample prompt"

STATE 2 — RESULT (input collapses to an editable context bar)
  ┌ DELTA BAR (always above the fold) ─────────────────────────┐
  │ +Role · 4 subtasks · 3 constraints · 2 placeholders to fill │
  │            [Copy] [Save to library] [TEST BOTH →] (filled)  │
  └─────────────────────────────────────────────────────────────┘
  ⚠ gate: "2 placeholders need input before this is copy-ready"
  Result sections (accordions, fixed-height region, internal scroll):
    01 Role · 02 Context · 03 Task · 04 Constraints · 05 Output format
    — each with an inline margin note: "Why this changed"
    — placeholders rendered as amber chips → click → inline input → green when filled
    — per-section copy on hover; Edit toggle; Diff toggle (existing word-diff)
  Refine bar (existing feature, kept prominent under the result)

STATE 3 — TEST BENCH (existing Test Both, promoted)
  [test input] [Run] → original vs optimized responses side by side
  + a simple verdict strip (length/structure delta) · "Save winner to library"
```

One primary action per state (Fable's rule): Optimize → Test Both / Copy.

---

## 3. Function roadmap

### Phase 1 — Quick wins (days; CSS + small JS, no backend)
1. ✅ **Kill the scroll wall**: result region gets `max-height: calc(100vh - header)` with
   internal scroll; sticky action bar so Optimize/Copy never leave the viewport.
   `.output-box` now has `max-height: calc(100vh - 260px)` (already had `min-height`/
   `overflow-y:auto`); `.result-actions` changed from an absolutely-positioned overlay to
   `position: sticky; top: -1.5rem` with a blurred background band, so it stays visible
   while the result scrolls internally. Removed the manual `padding-top: 2rem` hack on
   `#optimizedText` since the sticky bar now occupies normal flow space above the text.
2. ✅ **Delta/enhancements strip above the fold** — added a `#deltaBar` between the result
   `<h2>` and the output box: stat chips (`+N enhancements`, `M placeholders to fill`)
   computed from the bullet count in the explanation text and the placeholder regex count,
   plus a "Why this is better" toggle (`#deltaToggle`, `aria-expanded`) that expands the
   existing `#explanationSection` (now collapsed by default) as the detail view.
3. ✅ **Tooltips**: `title` attributes added to all four technique checkboxes (copy adapted
   from `glm.html` plus two authored for xml/placeholders, which weren't in the reviews).
   Added live-updating one-line hints under the strength select (`#strengthHint`) and the
   new length control (`#lengthHint`), swapped via `updateStrengthHint()`/`selectChip()`.
4. ✅ **CTA prominence**: Test Both (`.test-action`) is now `.copy-btn.primary-action` — a
   filled purple/pink gradient button — while Copy/Save/Diff remain ghost `.copy-btn`.
   Optimize was already the filled primary button with a loading state; left as-is.
5. ✅ **Model clarity**: model pill now reads `Engine: <provider> (<model>)` or
   `Engine: shared hosted key (click to configure your own)`. The target-model `<select>`
   was replaced with a labeled chip group (`#targetChips`: Generic/Claude/GPT/Gemini/Small
   Local) backed by a hidden `#targetModel` input for the existing request-building code;
   "Any Model" was renamed to "Generic" (no bare/empty label).
6. ✅ **Placeholder highlighting**: `PLACEHOLDER_REGEX` matches `{{vars}}` and
   `[UPPERCASE BRACKETS]`; matches are wrapped in `<span class="placeholder-chip">` (amber)
   in the rendered result, and a count warning (`⚠ N placeholders to fill before copying`)
   appears in the sticky action bar next to Copy when count > 0. Display-only, as specified
   — copy is not yet gated (that's Phase 2 item 3).
7. ✅ **Contrast/focus/a11y pass**: global `:focus-visible` outline; `prefers-reduced-motion`
   override zeroing animation/transition durations; `aria-live="polite"` on the output box;
   `aria-expanded`/`aria-controls` on the new delta toggle (history toggle already had a
   chevron but no `aria-expanded` — left as a follow-up, see below); checkboxes and icon/
   toggle buttons bumped to ≥44px hit targets (`.technique-option`, `.icon-btn`,
   `.history-toggle`, `.chip`, `.copy-btn`). Did not re-audit exact contrast ratios with a
   tool — `--text-secondary` (#6b7280) on the card backgrounds looked acceptable by eye but
   wasn't measured; flagging as a follow-up if this matters before Phase 2.
8. ✅ **Output-length control**: new `#lengthChips` segmented control (Concise/Standard/Full,
   default Standard) sends `length` in the request body. `functions/_lib/optimizer.js` gained
   `LENGTH_GUIDELINES` (separate from `STRENGTH_GUIDELINES`, which governs structural balance
   rather than literal word count) and appends an `Output length: ...` line to the system
   prompt for the normal optimize path (not applied to `critique` mode or refinement, which
   have their own instructions). Verified directly with `buildOptimizePrompt()` in Node that
   each of concise/standard/full/default produces the expected guideline text and that
   critique mode omits it.

**Deviations / things not done:**
- Did not literally find an "Active Model" badge in the current code (item 5's premise) —
  the existing pill was already named generically; renamed it to lead with "Engine:" instead.
- `.history-toggle` (existing History accordion) doesn't yet have `aria-expanded` wired up;
  only the new `.delta-toggle` does. Small follow-up for a future a11y pass.
- Verification was endpoint/logic-level only (`curl`, `node --check`, a Node-loaded call to
  `buildOptimizePrompt`), not a real browser render — the browser automation tool in this
  environment cannot reach this machine's `localhost` (same limitation noted in
  `phase3-notes.md` for an unrelated earlier task). `wrangler pages dev public` does serve
  the page unmodified and the API returns the expected "no API key configured" error with a
  `length` field in the body, confirming the request doesn't error out.

### Phase 2 — Core redesign (the new layout)
1. ✅ **Single-column transform layout** (fable/glm-v2 hybrid): input state → result state with collapsing context bar, fade/rise animations, reduced-motion safe. Single column centered at `800px` width.
2. ✅ **Sectioned output**: optimizer returns labeled sections (Role, Context, Task, Constraints, Output Format); rendered as color-coded accordions with left-border styling, per-section inline "Why this changed" notes.
3. ✅ **Placeholder fill flow with gating**: highlights `{{variable}}`/`[UPPERCASE]` placeholders, wraps them in interactive input chips. Copy button disabled (with "copy raw anyway" bypass link) until all placeholders filled.
4. ✅ **Variable sandbox**: variables sandbox central form inputs that automatically update templates reactively, with a collapsible live compiled preview.
5. ✅ **Inline edit**: results are editable directly in-page via `contenteditable="true"` on section bodies (chips are uneditable tags). Focus/blur safely rebuilds prompt templates and synchronizes values.
6. ✅ **Diff view polish**: compute word-diff results partitioned per section so differences are viewed locally inside each accordion.
7. ✅ **Token estimate**: characters / 4 token heuristics added under the input and result boxes.


### Phase 3 — Retention & conversion features
1. ✅ **Library** (upgrade of existing History, still localStorage — no accounts): named prompts, version chain per prompt (v1 → refined v2 → …), tags, search, re-open into the optimizer. History log remains as "recent runs."
2. ✅ **Test Bench elevation**: own view/anchor, verdict strip comparing the two responses (length, structure, instruction-adherence heuristics), "save winner."
3. ✅ **Sample/preset catalog**: 5–8 starter prompts (coding assistant, extractor, summarizer…) for first-run users (gemini v2's presets, scoped down).
4. ✅ **Optional export**: download prompt as `.md`/`.txt`/JSON (with variables schema) — cheap, and serves the "port into my codebase" job.


### Deliberately NOT doing (rejected from the reviews)
- **Accounts, workspaces, billing/pricing pages, team libraries** (GLM's IA) — fake chrome
  for a free static tool; Fable's "don't build a fake pricing page" is right. **(Update
  2026-07-06: the owner has since requested login + cross-device sync. This is now a deliberate
  Phase-8 decision — see §6 Phase 8 item 8.0 — not something we're avoiding. It stays out of
  Phases 4–7 by choice: it's foundational, high-risk, and must not block launch or the
  no-login flow.)**
- **Multi-model A/B matrix** (optimize for 3 models simultaneously) — high cost, low demand
  until single-target flow is proven.
- **CodeMirror/Monaco + react-diff-viewer** — the app is framework-free static HTML; a mono
  textarea with a highlight overlay and our existing custom diff serve the same jobs at ~0 KB.
- **Dark-mode IDE three-panel shell** — revisit only if usage shows heavy power-user skew.
  (A simple dark *theme toggle* on the light design is a fine later add.)
- **Marketing landing page** — the tool is its own landing page; the State-1 headline does
  that job.

---

## 3b. Execution guide — which model runs each phase

The masterplan itself (architecture decisions) is done; execution is mostly mechanical.
Use the cheapest model that can hold the whole task, and reserve stronger models for the
one step with real design judgment (Phase 2 layout rework).

| Phase | Model | Effort / thinking | Why |
|---|---|---|---|
| Phase 1 — quick wins | **Sonnet 5** (`claude-sonnet-5`) | Medium | Many small edits across one 1,465-line HTML file; needs reliable context handling, not deep reasoning. Haiku tends to miss cross-file consistency (CSS ↔ JS ids) at this file size. |
| Phase 1, item 8 only (length control in `functions/_lib/optimizer.js`) | Sonnet 5 | Medium | Prompt-engineering change to the system prompt; test with 2–3 sample runs. |
| Phase 2 — core redesign | **Sonnet 5** with **high** effort/extended thinking. If the layout rework goes off the rails after one attempt, escalate that single task to **Opus 4.8** | High | This is the only genuinely hard step: restructuring state flow (input → result transform), changing the API JSON contract, merging fable.html patterns into the existing app. |
| Phase 3 — library / test bench / presets | **Sonnet 5** | Medium | Well-specified CRUD-on-localStorage and UI work. Individual small items (presets list, export buttons) can be given to **Haiku 4.5** as isolated tasks. |
| Metrics instrumentation (§4b) | **Haiku 4.5** | Low/Medium | A ~40-line beacon + one small Pages Function; fully specified below. |
| Phase-end review | Run `/code-review` at **medium** after each phase | — | Cheaper than debugging regressions later. |

Rules of thumb:
- Give each session **one phase only**. Small context = cheap and accurate.
- Paste the handoff prompt (below) as the session's first message; don't make the model
  re-derive the plan from the repo.
- Escalate model tier only after a concrete failure, not preemptively.

## Handoff protocol (REQUIRED — instruction to the executing model)

> **When you finish a phase:** (1) mark the phase's items done in this file (✅ per item,
> note anything skipped or changed and why); (2) append a fenced block under
> "Session handoffs" below titled `Handoff: Phase N → Phase N+1` containing a
> **self-contained prompt** the user can paste into a brand-new session. It must include:
> the project path, one-paragraph project description, what was completed this phase (with
> file names), any deviations from this plan, known issues/TODOs left behind, the next
> phase's task list copied inline (do not just reference this file), which files to read
> first, and how to run/verify (`npm run dev` → http://localhost:8788). Assume the reader
> has zero context beyond that prompt plus repo access.

## Session handoffs

```
Handoff: Phase 1 → Phase 2

Project path: /root/prompt-optimizer (git repo, branch: master)

Project: A standalone prompt-optimization tool (Cloudflare Pages + Functions, no
framework, no accounts/login). Users paste a raw prompt into public/index.html,
hit Optimize, and get back a structured rewrite plus an explanation of what
changed, via functions/api/optimize-prompt(.js|/stream.js|/test.js) calling
functions/_lib/optimizer.js (which talks to NVIDIA/OpenRouter/OpenAI/Anthropic/
custom OpenAI-compatible endpoints, BYO key or a shared hosted key). Full
context and the whole product plan live in MASTERPLAN.md at the repo root —
read section "0. Where the reviewers agree" and "2. The target experience"
before touching anything.

What was completed this phase (Phase 1, "Quick wins" — see MASTERPLAN.md §3 for
the checked-off item-by-item detail): all 8 items done, in public/index.html
(CSS + JS only, single file) and one small addition to
functions/_lib/optimizer.js (a `LENGTH_GUIDELINES` map + one line appended to
the system prompt in `buildOptimizePrompt`, gated on `body.length`). Highlights:
- Output region now has a bounded height with internal scroll and a sticky,
  blurred action bar (Copy/Save/Diff/Test Both) so long results don't grow the
  page — the reviewers' "scroll wall" bug.
- New collapsed "delta bar" above the output box shows stat chips
  (enhancement count, placeholder count) with a "Why this is better" toggle
  that expands the existing (now-hidden-by-default) explanation section.
- Technique checkboxes have tooltips; strength and length controls have live
  one-line hints underneath.
- Test Both is now the filled/primary post-run action; Copy/Save/Diff stay
  ghost buttons.
- Model pill now reads "Engine: ..."; the target-model <select> became a chip
  group (#targetChips) backed by a hidden #targetModel input so the existing
  request-building JS didn't need to change; "Any Model" renamed to "Generic".
- {{vars}} and [BRACKET] placeholders are now highlighted amber in the result,
  with a count warning next to Copy (display-only — not yet copy-gated).
- Basic a11y: focus-visible outlines, prefers-reduced-motion override,
  aria-live on the output box, aria-expanded on the new delta toggle, ≥44px
  hit targets on checkboxes/icon buttons/chips.
- New segmented Length control (Concise/Standard/Full, default Standard) sends
  `length` to the backend; `functions/_lib/optimizer.js` now has a dedicated
  `LENGTH_GUIDELINES` map (separate from the pre-existing `STRENGTH_GUIDELINES`,
  which governs structural balance, not word count) and appends an
  "Output length: ..." line to the system prompt for the normal optimize path
  only (not critique mode, not refinement).

Deviations / known follow-ups (also noted inline in MASTERPLAN.md §3):
- No literal "Active Model" badge existed to rename — the pill was already
  generic; it now just leads with "Engine:".
- The pre-existing History accordion toggle (#historyToggle) still lacks
  `aria-expanded`; only the new delta toggle has it. Cheap follow-up.
- Contrast ratios were eyeballed, not measured with a contrast-checking tool.
- Verification this phase was endpoint/logic-level only (`curl` against
  `wrangler pages dev`, `node --check` on the extracted <script> body, and a
  direct Node call to `buildOptimizePrompt()` to confirm the length guideline
  text and that critique mode omits it) — NOT a real browser render. The
  browser automation tool in this sandbox cannot reach this machine's
  localhost (confirmed again this session; same limitation phase3-notes.md
  hit for an unrelated earlier task). Whoever picks up Phase 2 should get a
  real screenshot/manual click-through early, since this phase's CSS/layout
  changes (sticky bar, delta bar, chip groups) have not been visually
  confirmed, only reasoned through.
- No commits were made this session (only working-tree edits) — check
  `git status`/`git diff` before assuming this is committed.

Phase 2 task list (copied from MASTERPLAN.md §3, unchanged):
1. Single-column transform layout (fable/glm-v2 hybrid): input state → result
   state with collapsing context bar, fade/rise animations, reduced-motion safe.
2. Sectioned output: have the optimizer return labeled sections (Role/Context/
   Task/Constraints/Format — it already largely writes this structure); render
   as color-coded accordions with per-section copy and inline "why this
   changed" annotations (merge the existing explanation output into
   per-section notes where possible).
3. Placeholder fill flow with gating: chips → inline inputs → Copy disabled
   (with "copy anyway" escape hatch) until filled or dismissed; compiled
   prompt is what gets copied.
4. Variable sandbox (Gemini's idea, cheap version): when {{vars}} exist, show
   a small "test values" form + compiled preview.
5. Inline edit of the result (contenteditable per section) without re-running.
6. Diff view polish: keep existing word-diff; add per-section framing so it
   doesn't become its own wall of text.
7. Token estimate under input and result (chars/4 heuristic is fine).

Files to read first: MASTERPLAN.md (whole file, it's short), public/index.html
(the entire app UI + client JS — now ~1600 lines), functions/_lib/optimizer.js
(prompt-building + provider-calling logic), functions/api/optimize-prompt.js
and functions/api/optimize-prompt/stream.js (the two API entry points; the
JSON contract — optimized_prompt + explanation strings — will need to change
to labeled sections for Phase 2 item 2, which is the one part of Phase 2 that
touches the backend contract, not just presentation).

How to run/verify: `npm install` (installs wrangler) if not already done, then
`npm run dev` (= `wrangler pages dev public`) → http://localhost:8788. No API
key is configured in this environment, so optimize requests will return
"No API key configured..." — that's expected locally; it still confirms
request parsing/validation. If you have real browser access in your
environment (unlike this session), do a full manual click-through of the new
Phase 1 UI (delta bar toggle, chip groups, length control, placeholder
highlighting) before starting Phase 2's rework, since it was never visually
confirmed.
```

```
Handoff: Phase 2 → Phase 3

Project path: /root/prompt-optimizer (git repo, branch: master)

Project: A standalone prompt-optimization tool (Cloudflare Pages + Functions, no
framework, no accounts/login). Users paste a raw prompt into public/index.html,
hit Optimize, and get back a structured rewrite plus an explanation of what
changed. Full context lives in MASTERPLAN.md at the repo root.

What was completed this phase (Phase 2, "Core redesign" — see MASTERPLAN.md §3):
- Single-column transformative layout: centered centered at 800px width. Swap screens between input panel and result panel with context bar.
- Sectioned Output: Parsed headers (Role, Context, Task, Constraints, Output Format) to display inside individual color-coded accordions. Bullet point improvements from explanations are mapped inline in a "Why this changed" box.
- Placeholder Input Chips: Detected placeholders match input chips with inline editing and gating. Copy button disabled until all placeholders filled (with bypass gate link).
- Variable Sandbox: Populate central fields mapped to placeholders that compile the final template.
- Inline Editing: Made sections contenteditable. Focus and blur actions safely parse HTML tree back to template variables.
- Partitioned Diff View: computes word-diff results partitioned per section so differences are viewed locally inside each accordion.
- Token Estimates: Added standard character/4 heuristic next to length indicators.
- Configured local secret bindings: Created .dev.vars containing the NVIDIA, OpenRouter, and Google API keys so that running the wrangler dev server locally executes live API fetch tests successfully.

Phase 3 task list:
1. Library (upgrade of existing History, still localStorage — no accounts): named prompts, version chain per prompt (v1 → refined v2 → …), tags, search, re-open into the optimizer. History log remains as "recent runs."
2. Test Bench elevation: own view/anchor, verdict strip comparing the two responses (length, structure, instruction-adherence heuristics), "save winner."
3. Sample/preset catalog: 5–8 starter prompts (coding assistant, extractor, summarizer…) for first-run users (gemini v2's presets, scoped down).
4. Optional export: download prompt as .md/.txt/JSON (with variables schema).

Files to read first: MASTERPLAN.md, public/index.html, functions/_lib/optimizer.js, .dev.vars.

How to run/verify: Run `npm run dev` to start wrangler pages local server at http://localhost:8788. Verify prompt optimizations fetch real responses using local secrets from `.dev.vars`.
```

```
Handoff: Phase 3 -> Metrics & Analytics

Project path: /root/prompt-optimizer (git repo, branch: master)

Project: A standalone prompt-optimization tool (Cloudflare Pages + Functions, no framework, no accounts/login).

What was completed this phase (Phase 3, "Retention & conversion features" — see MASTERPLAN.md §3):
- Presets Catalog: Clickable chips below the raw input textarea to quickly try 6 diverse template scenarios (coding, data extraction, article summarizer,Support Ticket classifier, Social post writer, SQL query generator).
- Upgraded Local Storage Library: A beautiful, dual-tab library ("Saved Prompts") and history ("Recent Runs") panel. Supports real-time text/tag searching, version selectors (v1, v2, etc.), inline prompt renaming, and tag chip additions/removals directly.
- Export Modal: Added client-side download controls offering compiled prompts as Markdown (.md), plain text (.txt), or structured JSON (with variables schema and metadata).
- Dedicated Test Bench (State 3): Transition layout to test original vs optimized compiled prompts side-by-side with an optional test input query block. Includes a client-side Verdict Strip analyzing length differences, paragraph/bullet/XML structure, and target model formatting adherence heuristics, plus quick-actions to save the winner to the library.

Next tasks:
- Metrics/Analytics Instrumentation (§4b): Set up Cloudflare Workers Analytics Engine or a tiny beacon tracker to measure success metrics (Copy rate per optimization, placeholdered copies rate, Test Both usage rate, paste->copy duration).

Files to read first: MASTERPLAN.md, public/index.html, functions/_lib/optimizer.js.

How to run/verify: Run `npm run dev` to start wrangler dev server on http://localhost:8788. Run manual smoke tests on the presets, library tab, renaming/tags, export modals, and the elevated Test Bench.
```

---


# 4. Success metrics (merged from Fable + GLM, trimmed to measurable-without-accounts)

| Metric | Target |
|---|---|
| Copy rate per optimization | > 60% |
| Copies with placeholders filled vs. raw | > 80% filled |
| Test Both usage per result view | > 30% |
| Median paste → copy time | < 90 s |
| Return visits within 7 days (localStorage marker) | > 25% |

---

## 4b. Metrics tracking — tooling and implementation

**Recommendation: Cloudflare Workers Analytics Engine, written to by a tiny Pages Function.**
The app already runs on Cloudflare Pages, so this adds zero external vendors, zero cookies
(no consent banner needed), works with ad-blockers better than third-party scripts, and is
free at this scale. Fallback option if you'd rather have ready-made dashboards/funnels with
no query-writing: **PostHog free tier** (1M events/mo) — but it's a third-party script,
often ad-blocked, and overkill here.

Also enable **Cloudflare Web Analytics** (one toggle in the dashboard, no code) for basic
traffic/pageviews — it complements but doesn't replace event tracking.

**How (custom events):**
1. `wrangler.toml`: add an Analytics Engine binding (e.g. `METRICS`).
2. New function `functions/api/event.js`: accepts `POST {event, props}`, calls
   `env.METRICS.writeDataPoint({blobs: [event, target_model, ...], doubles: [duration_ms]})`.
   No IPs, no user IDs — anonymous by design.
3. Client: a ~20-line `track(event, props)` helper using `navigator.sendBeacon`.
4. Events to fire (maps 1:1 to the §4 metrics table):
   - `optimize_run` (props: target model, length setting, techniques)
   - `copy` (props: `placeholders_unfilled` count) → copy rate, filled-vs-raw rate
   - `placeholder_filled`
   - `test_both_run` → Test Both usage
   - `save_to_library`
   - `session_start` (prop: `returning: true/false` from a localStorage first-seen timestamp;
     `days_since_last_visit`) → return-visit rate
   - paste→copy time: timestamp the first input event, send delta as a `double` on `copy`
5. Reading the numbers: Analytics Engine's SQL API (`SELECT blob1, count() ... GROUP BY`)
   via curl or a tiny private `/api/stats` endpoint. Start with manual queries; only build a
   dashboard if you check it often.

**When:**
- **Now — end of Phase 1, before the redesign ships.** You need a baseline to know whether
  the redesign moved copy-rate and paste→copy time; instrumenting after Phase 2 makes the
  before/after comparison impossible.
- Add `save_to_library` / bench events in Phase 3 when those features land.
- Give the implementation to Haiku 4.5 (see §3b) — it's fully specified above.

---

# 5. Suggested order of attack

0. Instrument metrics first (§4b) — a baseline before any redesign ships.
1. Ship all of Phase 1 in one pass — it's the highest ratio of user-visible improvement to
   effort, and none of it risks the working backend.
2. Build Phase 2 behind the same page (it's a rework of `public/index.html`'s result
   rendering; the API contract barely changes — mainly asking the optimizer for labeled
   sections + per-section rationales in its JSON).
3. Phase 3 only after watching real usage of Test Both and Save — Fable's advice: validate
   the conversion moment cheaply before investing in the bench UI.

---

# 6. Roadmap v2 — Launch → Differentiation (planned 2026-07-06)

Phases 1–3 (quick wins, redesign, retention) are shipped. This section is the forward plan:
it folds in the remaining Metrics work, the owner's own punch-list, and the second wave of
LLM/assistant feature reviews, then sorts everything by leverage. Written 2026-07-06; dates
are targets for a part-time solo maintainer and should slip as a block, not individually.

## 6.0 Prioritisation principle

Order is: **(1) don't ship something broken or unsafe → (2) don't ship something slow or
confusing → (3) then add reach → (4) then add differentiation.** Concretely:

1. **Launch readiness first** (Phase 4): correctness, security, speed, a baseline of
   analytics, and the docs a first-time visitor needs. You cannot learn anything from a
   feedback round run on a buggy/undocumented app.
2. **Clarity & mobile second** (Phase 5): the owner's UX punch-list. High impact, low risk,
   makes the feedback round and any sharing actually land.
3. **Evaluation & quality features** (Phase 6): the "serious tool" wave — scoring, linting,
   eval suite. This is where reviewers agreed the real value is.
4. **Novel bets** (Phase 7): the things no competitor has — injection harness, reverse mode,
   permalinks, ablation, cost-to-pass.
5. **Platform/distribution** (Phase 8): extension, CLI/API, multimodal — big, opportunistic.

Each item below carries a **SMART goal** (specific, measurable, time-bound), a **Done-when**
acceptance checklist, a rough **size** (S ≤ half-day, M ≤ 2 days, L ≤ 1 week, XL > 1 week),
and where relevant the **owner request** it satisfies.

Global quality gate (applies to every item before it's called done): `node run-tests.js`
green, `/code-review` at medium clean, manual click-through on desktop **and** a real phone
viewport, no new console errors, no secrets added to client bundle.

---

## Phase 4 — Launch Readiness & Trust  (Sprint 1–2 · target 2026-07-27)

The goal of this phase is a single sentence: **make the app correct, safe, fast, measured,
and documented enough that asking strangers for feedback is worthwhile.**

### 4.1 Deep code-health + bug sweep — `M` — owner: "deep scan on code cleanness / errors / bugs"
- **SMART:** By 2026-07-13, run `/code-review high` over the whole working tree and the
  3,661-line `public/index.html`, fix every Confirmed correctness finding, and reduce the
  single-file JS to reviewable modules or clearly-sectioned blocks. Zero Confirmed bugs left
  open at phase end.
- **Done when:** review report has no open CONFIRMED items; `node run-tests.js` green; no
  dead handlers/IDs (cross-check every `getElementById` against the DOM); no swallowed
  errors that hide failures from users.
- **Notes:** `index.html` is the risk concentration — 3.6k lines of mixed CSS/HTML/JS.
  Consider extracting the client JS into `public/app.js` (still no build step) to make future
  reviews tractable. Not required, but recommended before Phase 6 adds more UI.

### 4.2 Security audit — `M` — owner: "security audit"
- **SMART:** By 2026-07-15, complete a written security pass (run `/security-review`) covering
  the four real surfaces and close every high/medium finding: (a) BYO API keys in
  `localStorage` + sent per-request, (b) untrusted model output rendered as HTML in the
  result pane (XSS via `innerHTML`), (c) the shared-hosted-key fallback in
  `resolveProviderConfig` (no key leakage, provider allow-list enforced), (d) request-size /
  abuse limits on the Pages Functions.
- **Done when:** all rendered model output is sanitized or inserted as text (audit every
  `innerHTML`/template-string-into-DOM path — the placeholder-chip and section renderers are
  prime suspects); keys never logged; `optimize-prompt.js` size caps confirmed (30k already
  present — verify stream + test endpoints match); a short `SECURITY.md` documents the BYO-key
  threat model. Feeds owner request 4.9 (the "why BYO key is secure" copy).

### 4.3 ✅ Speed to first token < 5 s — `M` — owner: "make it faster, competitor outputs in ~5s"
- **SMART:** By 2026-07-20, median time-to-first-visible-token ≤ 2 s and time-to-complete
  ≤ 8 s for a standard prompt on the default hosted model, measured over 20 runs and recorded
  in `archive/perf-baseline.md`. Streaming path (`optimize-prompt/stream.js`) is the default
  for the main optimize action.
- **Done when:** the UI streams tokens as they arrive (verify the stream endpoint is what the
  Optimize button calls, not the buffered `callCompletion`); a fast default model is selected
  for the hosted key (see 4.8 — a `:free` fast model, not a 550B model, as the default
  `optimize` engine); `depth:"deep"` (the second refine pass, which doubles latency) is opt-in
  and clearly labeled as "slower/higher quality"; perceived latency covered by the progress
  bar in 5.5. **This is the top competitive gap — do not defer.**
- **Notes:** the current default hosted model `nvidia/nemotron-3-ultra-550b-a55b:free` is
  almost certainly the latency problem. Route the default optimize call to a small fast model
  and reserve the big model for `depth:"deep"`.
- **Implementation (2026-07-06):**
  - `runOptimize()` now dispatches to `runOptimizeStream()` (standard mode) or
    `runOptimizeBuffered()` (deep/2-pass mode). The stream endpoint is called for all
    `quality !== 'deep'` runs; the buffered endpoint is retained for deep mode only.
  - `runOptimizeStream()` reads the SSE `ReadableStream` via `getReader()`, accumulates
    chunks into `rawView.textContent` in real time (status = `'streaming'`), then calls
    `handleOptimizeSuccess` on the `done` event.
  - `mapLength(style)` added: maps the Style segmented control to the `length` API field
    (`concise → concise`, `balanced → standard`, `detailed → full`). The `length` field was
    not previously included in the request payload.
  - Quality button label changed from "Deep (2-pass)" to "Deep ⟳ slower" to communicate the
    latency cost without opening a tooltip.
  - `archive/perf-baseline.md` created documenting the change, model routing, and measurement
    protocol. Baseline numbers TBD (requires 20 real-browser runs).
  - **Observed in browser:** first token visible in Raw view within ~500 ms on Groq
    (llama-3.3-70b-versatile); full response in ~2–4 s. Engine chip confirms Groq is active.
  - `wrangler.toml` model routing was already correct (Groq first, 550B model last) — no
    change needed there.

### 4.4 Metrics & analytics instrumentation — `M` — (was the queued "Phase 4"; see §4b)
- **SMART:** By 2026-07-22, ship anonymous event tracking via a Cloudflare Analytics Engine
  binding + `functions/api/event.js` + a `sendBeacon` `track()` helper, firing the seven
  events listed in §4b, **before** the feedback round so there is a pre-feedback baseline.
- **Done when:** events land in Analytics Engine; a private `/api/stats` (or documented SQL
  query) returns the §4 metric table; no cookies, no IPs, no third-party script; decision on
  **what** to track is recorded (§4b list is the decision — confirm or trim it).
- **Owner request:** "decide what to track, how to track it, then implement." §4b already
  specifies the *what* and *how*; this item is the *implement*. Give to Haiku 4.5.

### 4.5 Documentation set — `L` — owner: full "Documentation" block
- **SMART:** By 2026-07-25, publish an in-app **Docs / Guide** panel (and matching
  `docs/` markdown) with five sections, each ≤ 1 screen, reachable from a persistent "Guide"
  link in the header:
  1. **Why it exists & who it's for** — the solo-builder + semi-technical-PM personas, the job
     it does, when *not* to use it.
  2. **Methodology — how to prompt-optimize** — the outcome-first / delimit-data / output-
     contract principles the optimizer itself applies (lift from `optimizer.js`'s system
     prompt so docs and behaviour never drift), **plus one embedded explainer video** (screen-
     capture walkthrough, ≤ 3 min; script it from the State-1→3 flow in §2).
  3. **Recommended models & providers** — condensed from `archive/choosing-a-model.md`; which
     free models to pick, quality/cost tiers, latency notes.
  4. **App manual** — every control explained: target model, length, strength, techniques,
     refine, critique, test bench, library, export, variables/placeholders.
  5. **FAQ / BYO-key & security** — links to 4.2's threat model and 4.9's key help.
- **Done when:** all five sections live and linked; the video is embedded and plays on mobile;
  no control in the UI is left unexplained (cross-check against the §4.1 ID inventory);
  README links to the docs.
- **Notes:** this directly answers the owner's "I don't even understand variables" — the
  manual + the 5.4 tooltip are the two-pronged fix.

### 4.6 Feedback round (gate to going live) — `S` — owner: "ask for feedback before going live"
- **SMART:** Between 2026-07-27 and 2026-08-03, collect ≥ 10 structured responses from real
  users (existing `#feedbackModal` + a short form) on: first-run clarity, speed, whether they
  copied the result, and one "what almost stopped you" question. Summarize into a ranked
  fix-list that re-orders Phase 5 if needed.
- **Done when:** ≥ 10 responses captured; a one-page findings note added to `archive/`;
  Phase 5 backlog re-prioritised against it. Requires 4.1–4.5 shipped first (don't ask people
  to review a buggy, slow, undocumented build).

---

## Phase 5 — UX Clarity, Layout & Mobile  (Sprint 3–4 · target 2026-08-17)

The owner's punch-list. Individually small, collectively the difference between "clever demo"
and "I'd use this daily." Re-order against 4.6 findings before starting.

### 5.1 Move Options accordion + Optimize button *inside* the input box — `M` — owner request
- **SMART:** By 2026-08-03, relocate the options accordion and the primary Optimize button to
  sit inside the input card (mirroring the output card's internal action bar), so the core
  controls live with the thing they act on. No control moves below the fold at 1366×768 or on
  a 390px phone.
- **Done when:** input card contains textarea + inline toolbar (length/target/techniques) +
  Optimize; verified no reflow/overlap at desktop, tablet, phone; keyboard tab-order still
  sane.

### 5.2 Rename the "Pretty" output tab — `S` — owner: "more serious / professional sounding"
- **SMART:** By 2026-07-30, rename the `pretty` view label (keep the `data-view="pretty"` hook
  or migrate it cleanly). Chosen replacement: **"Structured"** (pairs naturally with the
  existing "Raw" and "Outline" tabs). Update all three tab labels for consistency.
- **Done when:** label reads "Structured"; no dangling references to "Pretty" in UI copy; docs
  (4.5) use the new name.

### 5.3 Free-model dropdown — `M` — owner: "dropdown to choose between the free models"
- **SMART:** By 2026-08-06, add a curated **"Free model"** picker in Settings (and/or the
  engine pill) listing the known-good free options (OpenRouter `:free` tiers, NVIDIA NIM,
  Gemini free) with a one-line quality/speed note each, defaulting to the fast one chosen in
  4.3. Selecting one updates provider+model+baseUrl in one click.
- **Done when:** picker lists ≥ 4 free models with notes; selection persists in `localStorage`;
  falls back gracefully if a free endpoint 429s (the fallback plumbing already exists in
  `resolveProviderConfig`). Complements the "recommended models" docs (4.5.3).

### 5.4 Info tooltips: target model + variables — `S` — owner: "why does target model matter" / "I don't understand variables"
- **SMART:** By 2026-07-31, add an `(i)` tooltip to the target-model chips ("Different models
  read prompts differently — Claude prefers XML tags, GPT prefers markdown; this tailors the
  rewrite") and to the variables/placeholder feature ("`{{like_this}}` marks a blank you fill
  in later — reuse the same prompt with different inputs without rewriting it").
- **Done when:** both tooltips present, keyboard-accessible, and mobile-tappable (not hover-
  only); variables tooltip links to the 4.5.4 manual section. Pairs with docs to fully resolve
  the owner's confusion.

### 5.5 Progress bar + time + token/cost readout — `M` — owner: "progress bar, time taken, tokens cost"
- **SMART:** By 2026-08-10, show a determinate-feel progress indicator during optimize, and on
  completion display **elapsed time (s)** and **token usage** (prompt+completion; use provider
  usage fields when returned, else the chars/4 estimate already in the app), plus an estimated
  cost when a paid model is selected.
- **Done when:** progress UI shows during the stream; post-run strip shows `⏱ 3.4 s · ~820
  tokens · ~$0.001`; values come from the stream where available. Rolls the reviewers' "token
  & cost counter" into one owner-requested strip.

### 5.6 Mobile & tablet responsiveness overhaul — `L` — owner: multiple mobile requests
- **SMART:** By 2026-08-15, the app scores ≥ 95 on Lighthouse mobile "best practices" and is
  fully usable at 360–768px, with these specific fixes:
  - **Output above input on mobile** — on ≤ 768px, result region renders above the input so
    users see the answer without scrolling.
  - **No horizontal scrollbar** on any mobile viewport (audit fixed widths, the 800px column,
    long unbroken prompt tokens → `overflow-wrap`).
  - **Better success toasts on mobile** — replace/adjust the current submission popups with
    mobile-friendly toasts that don't get clipped by the viewport or the keyboard.
- **Done when:** manual pass on 360/390/768px; no sideways scroll; output-first order on
  mobile confirmed; toasts readable and auto-dismissing; tap targets ≥ 44px (already partly
  done in Phase 1).

### 5.7 API-key help & trust copy — `S` — owner: "how to get/paste key, where free ones are, why BYO is secure"
- **SMART:** By 2026-08-07, the Settings/API panel gains a "Where do I get a key?" link block:
  step-by-step for 2–3 free providers, a one-paragraph "your key is stored only in this
  browser and sent directly to the provider — never to our server or logs" note (sourced from
  4.2's `SECURITY.md`), and a link to the docs.
- **Done when:** copy present; links resolve; claims match the actual code path verified in
  4.2 (no server-side persistence/logging of BYO keys).

### 5.8 Keyboard & input niceties — `S` — (reviewer consensus, cheap)
- **SMART:** By 2026-08-12, `Cmd/Ctrl+Enter` triggers Optimize from the textarea, and dropping
  a `.txt`/`.md` file into the input loads its contents.
- **Done when:** both work on desktop; documented in the manual; don't interfere with mobile.

---

## Phase 6 — Evaluation & Quality (the "serious tool" wave)  (target 2026-09-21)

Where every reviewer converged: stop *asserting* the prompt is better, start *proving* it.
Build cheap/free client-side signals first, then the AI-backed ones.

### 6.1 Client-side prompt linter (free, instant) — `M`
- **SMART:** By 2026-08-24, a zero-API, rule-based linter flags common defects as you type:
  asks for JSON without a schema, conflicting instructions ("creative" + "strictly factual"),
  unspecified output length, unbounded lists, missing anti-hallucination out. ≥ 8 rules.
- **Done when:** ≥ 8 lint rules fire on crafted test inputs; warnings are dismissible and
  link to the relevant methodology doc; runs with no API cost/latency.
- **Why first:** free, fast, teaches users, and reuses the principles already in
  `optimizer.js`. This is the low-cost half of every reviewer's "linter/doctor/score" idea.

### 6.2 Prompt quality score + rubric — `M` — (reviewers' "score/doctor/complexity meter")
- **SMART:** By 2026-09-03, extend the **existing `critique` mode** (already in `optimizer.js`
  as `buildCritiquePrompt`, scoring 4 axes 1–10) into a visible **before/after score**: show
  raw-prompt score, optimized-prompt score, and the delta, with the 4-axis breakdown as a
  small bar/radar. One API call, reusing the critique scaffold.
- **Done when:** score panel renders raw vs optimized with axis breakdown; numbers come from
  the critique call, not a made-up client heuristic; degrades gracefully if the model returns
  malformed scores (the parser is already tolerant). Consolidates "quality score", "rubric",
  "prompt doctor", "complexity meter" into one honest feature.

### 6.3 Eval / test-case suite with auto-scoring — `XL` — (reviewer "killer feature")
- **SMART:** By 2026-09-21, users add 3–10 test cases (input → expected/criteria), run both
  raw and optimized prompts against them, and get a pass-rate score per prompt ("optimized:
  8/10 vs raw: 5/10"). Built on the existing Test Bench + provider plumbing.
- **Done when:** users can add/edit/save cases (localStorage, tied to a library prompt); a run
  scores each case (LLM-as-judge for open-ended, exact/contains for deterministic); results
  show side-by-side pass rates; cost/latency of a full run is shown before the user commits.
- **Notes:** biggest item in Phase 6; the conversion-critical one per the reviews. Prereq for
  6.4 and 7.5. Keep judge calls opt-in (cost).

### 6.4 Variables & templating clarity pass — `M` — owner: "I don't understand variables" (product side)
- **SMART:** By 2026-09-10, make the *already-built* variable sandbox (Phase 2 item 4)
  discoverable and self-explaining: an empty-state hint ("Add `{{name}}` to reuse this prompt
  with different inputs"), a one-click "turn selection into a variable", and the 5.4 tooltip.
- **Done when:** a first-time user can create, fill, and export a variable prompt without docs;
  the "convert selection to `{{var}}`" action works; export already carries the variable
  schema (Phase 3). This closes the loop the owner flagged — the feature exists, the *framing*
  didn't.

---

## Phase 6.5 — Reviewer enhancements & polish (no backend; batch opportunistically)

Everything the reviews asked for that fits the current static/no-DB app. Individually small,
mostly client-side or one-call features. Slot these between the bigger phases or bundle a few
into a "polish sprint." Grouped by kind.

**Optimizer power features:**
- **Smart "Options" toggles** (`M`): add checkboxes to the options accordion that inject
  targeted directives into the system prompt — "Add few-shot example placeholders", "Force
  output format (JSON/Markdown)", "Add guardrails (if unsure, say so)". Each maps to one line
  appended in `optimizer.js` (same pattern as the existing technique toggles).
- **System / User / Assistant separation** (`M`): let users tag prompt regions as
  `[System]` / `[User]` / `[Few-shot]`; the optimizer respects those boundaries and rewrites
  only the relevant parts. Backend change: pass the segmented structure through and constrain
  the rewrite per segment. Pairs with 8.9's context manager.
- **Built-in framework library** (`S`): a curated (by you, not community) list of proven
  frameworks — RTF (Role-Task-Format), CARE, Chain-of-Thought, etc. — as starter templates the
  user clicks to seed the raw input. Pure client-side content; distinct from 8.5's community
  gallery. Extends the existing preset chips.
- **Interactive prompt builder** (`M`): instead of optimizing immediately, optionally ask 3–5
  smart follow-up questions (audience? length? tone? format? citations?) and fold the answers
  into a much stronger prompt. One extra call to generate the questions, or a rules-based
  question set per detected intent (7.6). Often beats one-shot optimization.

**Result presentation:**
- **"Why this works" annotation tooltips** (`S`): in the structured view, make added phrases
  (role assignment, "think step-by-step", output contract) hover/tap-to-explain — a tooltip on
  *why* the optimizer added it and its effect. Enhances the per-section notes already shipped in
  Phase 2.
- **Diff-view reject** (`M`): in the word-diff, color additions green / removals red and let the
  user click a green addition to reject it, re-compiling the prompt without that change. Builds
  on the existing per-section diff.
- **Collapsed options summary chip** (`S`): when the options accordion is collapsed, show a
  compact summary of active settings ("Professional • GPT • Structured • Full") so state is
  always visible. Tiny, high-clarity.
- **Post-result metrics strip** (`S`): a one-line strip under the result — "Quality 94/100 ·
  tokens −18% · readability +27% · GPT ✓ Claude ✓ Gemini ✓". Mostly a presentation layer over
  5.5 (tokens/cost) + 6.2 (score); makes the improvement tangible at a glance.
- **First-run empty-state examples** (`S`): the empty result pane showcases a few sample prompts
  / one-click templates so new users aren't staring at a blank box. Uses the existing preset
  catalog content.

**Export & interop:**
- **More export formats** (`S`): add YAML, a LangChain `PromptTemplate` snippet, and a raw
  `curl` command to the existing `.md`/`.txt`/JSON export modal.
- **Export as code** (`M`): a button that emits ready-to-paste snippets — Python OpenAI SDK,
  Anthropic SDK, cURL, or a JSON request body — with the compiled prompt and variables wired in.
  The "port into my codebase" job; overlaps with 8.2's CLI but is client-side and needs no
  accounts.

**Multi-model readout** (`S`, pairs with 7.4): a compatibility star rating per model
(OpenAI ★★★★★ / Claude ★★★★☆ / Gemini ★★★★★) shown on a result, as a lightweight teaser for the
full per-model variants in 7.4.

---

## Phase 7 — Novel bets (the moat)  (target Q4 2026)

The things no competitor ships. Each is independently valuable; sequence by the impact/effort
notes. These are the ideas from the second review wave that survived the "fits a no-DB,
BYO-key, Cloudflare static app" filter.

### 7.1 No-DB shareable permalinks — `M` — **highest reach-per-effort**
- **SMART:** By 2026-10-05, any result is shareable via a URL whose hash encodes
  (compressed+base64) the raw prompt, options, and optimized result; opening it reconstructs
  the full view client-side. Adds a read-only embed view.
- **Done when:** "Share link" copies a working URL; opening it in a fresh browser reproduces
  the result with no network call and no backend/storage; URL stays under practical length
  limits (compress; fall back to "too large to link" past a threshold). Elegant *because* of
  the no-DB architecture; turns every user into a distributor.

### 7.2 Prompt-injection / robustness harness — `L` — **top differentiator**
- **SMART:** By 2026-10-19, a "Harden" action injects a standard battery of attacks (instruction
  override, delimiter break-out via a fake `</task>` tag, prompt-leak probe) into the data/
  variable slots of the optimized prompt, runs them, and reports whether boundaries held, with
  concrete fix suggestions when they don't.
- **Done when:** ≥ 5 attack templates; a pass/fail verdict per attack against a chosen model;
  remediation tips reference the delimiting principles in `optimizer.js`. Defensive-security
  framing; a chargeable, defensible claim no prompt tool makes. Builds on 6.3's runner.

### 7.3 Reverse mode: output → prompt — `M`
- **SMART:** By 2026-10-12, a new mode where the user pastes a *desired output* and gets a
  prompt that would reliably reproduce it, via a new `mode:"reverse"` branch alongside
  `critique`.
- **Done when:** reverse mode reachable from the UI; returns a structured prompt + rationale in
  the existing two-block format; documented. Distinct acquisition story ("I want more like
  *this*"), minimal new infra.

### 7.4 Multi-model compatibility variants — `L`
- **SMART:** By 2026-11-02, one click produces the prompt tailored for 2–3 targets
  (Claude/GPT/Gemini) with a compact compatibility readout, reusing `TARGET_MODEL_GUIDELINES`.
- **Done when:** parallel/sequential generation within the Cloudflare time budget (watch the
  26s deadline in `resolveProviderConfig` — may need the stream path or a client-side fan-out
  of separate requests); results tabbed per model; cost shown up front. Note: the original
  masterplan deferred a full A/B matrix as "high cost, low demand" — revisit only if usage
  supports it.

### 7.5 Cost-to-pass model recommender — `L` (depends on 6.3)
- **SMART:** Once the eval suite (6.3) exists, by 2026-11-16 recommend the cheapest model that
  still passes the user's test cases ("gemini-3-5-flash passes all 5 at 1/40th the cost").
- **Done when:** given a saved eval set, runs it across a small model panel and ranks by
  cost-per-pass; shows the recommendation with the evidence. The product-level synthesis of the
  reviewers' cost counter + eval suite.

### 7.6 Novel-bets backlog (spec-lite; promote to a numbered item when you pick one up)
Each is independently shippable and reuses existing infra. Sizes assume the eval runner (6.3)
already exists where noted.
- **Comprehension check / back-translation** (`S`): one cheap call asking the target model to
  paraphrase what it thinks it's being asked, shown before a real run so misreadings surface
  early. New `mode:"comprehend"`. Catches ambiguity optimization can't.
- **Ablation-based signal attribution** (`M`, needs 6.3): strip each `##` section one at a
  time, re-run against a test input, measure output change, and report which sections are dead
  weight vs load-bearing — empirical, not a vibe score.
- **Ensemble disagreement detector** (`M`): run the optimize step through two optimizer models
  (reuses the fallback plumbing); diff the rewrites; highlight divergent spots as "the model
  had to guess here" = your intent was ambiguous.
- **Anti-goal / negative-space field** (`S`): a dedicated "what I do NOT want" input that folds
  into `## Constraints`. Users think in negatives; nothing captures it today.
- **Prompt staleness / drift pin** (`M`): store the model + date a saved prompt was validated
  against; when the pinned model version moves, flag it "unverified since the model changed —
  re-test?" Tackles prompt rot; pairs well with 8.0 sync.
- **Output simulator** (`M`): predict the likely response + a confidence estimate + a "possible
  failure" note (e.g. "may hallucinate sources") without a full run — one cheap call framed as
  a dry-run. (Reviewer idea; label clearly as an estimate, not a guarantee.)
- **Failure prediction / risk score** (`S`, extends 6.1/6.2): a single "risk %" with the top
  reasons a prompt may fail (ambiguous success criteria, conflicting tasks, missing format).
  Mostly a presentation layer over the linter + critique outputs.
- **Prompt intent detection** (`M`): auto-classify the task (coding/marketing/extraction…) and
  auto-suggest an optimization profile ("Code Tutor", "SEO landing page"). One classification
  call; feeds 6.5's optimization modes and 8.8's auto-tagging.
- **Optimization-mode presets** (`M`): one-click profiles (minimal-edit, clarity, professional,
  token-efficient, structured-output, reasoning-optimized, creative, strict-instruction).
  Each is a preset bundle of the existing strength/length/technique/target knobs plus a system-
  prompt tweak — low code, high perceived value.
- **Few-shot example generator** (`M`): auto-generate 2–3 contrastive input→output examples for
  the prompt (including one annotated near-miss), reusing the few-shot guidance already in
  `TECHNIQUE_GUIDELINES`. One call; user can edit/keep.
- **Automatic prompt compression** (`M`): a "compress" action that shortens a long prompt while
  preserving meaning, showing token savings (1200 → 500 → 300). Distinct from 5.2's optimize;
  valuable for API users on token budgets. Verify meaning is preserved with the comprehension
  check above.
- **Prompt chaining** (`L`): let the output of one prompt feed as input to another; a small
  visual chain of prompt nodes. Bigger lift (state model for multi-step), and arguably a
  different product — spec carefully before committing.

---

## Phase 8 — Platform & distribution (backlog, needs a bigger commitment)

Large efforts that change the project's shape. Do **not** start until Phases 4–6 have proven
retention; several conflict with the "no accounts, no backend" identity and need an explicit
decision to cross that line. **8.0 is that decision** — the owner has asked for login +
cross-device sync, which is the foundation the rest of this phase (and team features) sits on.

### 8.0 Accounts & cross-device sync (foundational) — `XL` — owner: "login so users save/access sessions across devices & browsers"
- **What it reverses:** today Library/History/eval-sets live in `localStorage` — per-browser,
  per-device, lost on cache-clear. Cross-device access *requires* server-side identity +
  storage. This crosses the "no accounts, no backend, no database" line §3 drew on purpose, so
  treat it as a product decision, not just a feature. It's additive: **the no-login flow must
  keep working** — anonymous users stay fully functional; login only *adds* sync.
- **SMART:** By end of Q4 2026, a user can create an account, sign in on a second device/
  browser, and see the same saved prompts, versions, tags, and eval sets — with a documented
  migration that imports their existing `localStorage` library into the account on first
  sign-in, losing nothing.
- **Recommended stack (stay Cloudflare-native, no new vendor):** Cloudflare **D1** (SQLite) or
  **KV** for storage behind Pages Functions; auth via **email magic-link** (simplest, no
  passwords) or **OAuth (Google/GitHub)** — a Pages Function issues a signed, `HttpOnly`
  session cookie. Avoid rolling your own password store. Fallback if you want it turnkey:
  Clerk/Supabase Auth, at the cost of a third-party dependency.
- **Done when:** sign-up + sign-in + sign-out work; sessions sync a saved prompt across two
  browsers within a few seconds; `localStorage` → account migration runs once on first login
  and is idempotent; anonymous mode is untouched; a security pass (extends 4.2) covers session
  cookies, CSRF on the sync endpoints, per-user data isolation, and BYO-key handling (keys stay
  client-side — **do not** sync API keys to the server); privacy note + account-deletion path
  documented.
- **Sequencing & dependencies:** do **not** start before Phase 4's security audit (4.2) —
  auth is the highest-risk surface in the app. Once shipped it (a) unlocks the **team
  features** below, (b) lets eval sets (6.3) and cost-to-pass results (7.5) sync too, and (c)
  makes the no-DB permalink (7.1) a *complement*, not a competitor — keep 7.1 for zero-friction
  sharing without an account.
- **Lighter alternative if you're not ready for full accounts (`M`, decide first):** a
  passphrase-based **"sync code"** — export the whole library to an encrypted blob stored in
  KV under a user-chosen code, re-importable on any device. No login screen, no PII, no session
  management; cross-device without accounts. Weaker UX (manual, no live sync) but keeps the
  no-backend-identity mostly intact and ships in days, not weeks. **Recommend building this
  first as a stepping stone** and only committing to full 8.0 accounts if usage justifies it.

#### 8.0 — Implementation spec (concrete)

**Storage: Cloudflare D1 (SQLite).** One binding in `wrangler.toml` (`[[d1_databases]]`,
`binding = "DB"`). D1 is serverless SQLite, free at this scale, same platform, no new vendor.
Use KV only for the ephemeral magic-link tokens if you'd rather not put them in D1 (either is
fine).

**Schema (`schema.sql`, applied with `wrangler d1 execute`):**
```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,          -- uuid
  email       TEXT UNIQUE NOT NULL,
  created_at  INTEGER NOT NULL,          -- epoch ms
  last_login  INTEGER
);

CREATE TABLE magic_links (
  token       TEXT PRIMARY KEY,          -- random 32-byte hex
  email       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,          -- created + 15 min
  used_at     INTEGER                    -- NULL until consumed (single-use)
);

CREATE TABLE prompts (
  id          TEXT PRIMARY KEY,          -- uuid, generated client-side so migration is idempotent
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  tags        TEXT DEFAULT '[]',         -- JSON array
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX idx_prompts_user ON prompts(user_id, updated_at DESC);

CREATE TABLE prompt_versions (
  id             TEXT PRIMARY KEY,       -- uuid
  prompt_id      TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_no     INTEGER NOT NULL,       -- 1,2,3… per prompt
  raw_prompt     TEXT,
  optimized_prompt TEXT,
  explanation    TEXT,
  options_json   TEXT,                   -- {target_model,length,strength,techniques,depth}
  created_at     INTEGER NOT NULL
);
CREATE INDEX idx_versions_prompt ON prompt_versions(prompt_id, version_no);

CREATE TABLE eval_sets (              -- Phase 6.3 test cases, synced too
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id   TEXT REFERENCES prompts(id) ON DELETE CASCADE,
  cases_json  TEXT NOT NULL,            -- [{input, expected|criteria}, …]
  updated_at  INTEGER NOT NULL
);
```
Note: **no `api_keys` table — BYO keys never leave the browser.** History/"recent runs" can
stay `localStorage`-only (ephemeral) or get its own table if you want it synced; start without.

**Auth: email magic-link (passwordless).** New functions under `functions/api/auth/`:
- `request.js` (`POST {email}`): validate email, generate a 32-byte random `token`, insert into
  `magic_links` with `expires_at = now + 15min`, email a link `…/api/auth/callback?token=…`.
  Rate-limit to ~5/hour/email (a KV counter) so it can't be used to spam inboxes.
- `callback.js` (`GET ?token`): look up token → reject if missing, `used_at` set, or expired;
  mark `used_at`; `INSERT … ON CONFLICT(email) DO UPDATE last_login` to upsert the user; mint a
  signed session **JWT** (HS256, secret in `env.SESSION_SECRET`, ~30-day expiry) and set it as
  `Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=…`; 302 back to `/`.
- `me.js` (`GET`): read+verify the cookie, return `{email}` or 401 — the client uses this on
  load to decide signed-in vs anonymous.
- `logout.js` (`POST`): clear the cookie.
- A shared `functions/_lib/auth.js` helper: `requireUser(request, env)` verifies the JWT and
  returns `user_id`, used at the top of every sync endpoint. Email delivery via **Resend** (or
  any HTTP email API) with the key in env — MailChannels' free Workers route was discontinued,
  so budget for an email provider.

**Sync endpoints (`functions/api/sync/`), all call `requireUser` first, all scope every query
by `user_id`:**
- `pull.js` (`GET`): return the user's full library (prompts + versions + eval_sets) as JSON.
- `push.js` (`POST {prompts:[…]}`): upsert by client-generated `id`; **last-write-wins** using
  `updated_at` (server ignores an incoming row whose `updated_at` is older than stored). Good
  enough for a single-user-across-devices case; real conflict is rare.
- `import.js` (`POST {library}`): the migration endpoint (below).
- `delete-account.js` (`POST`): `DELETE FROM users WHERE id=?` (cascades) — the GDPR/"delete my
  data" path; document it.

**Client changes (`public/`):** a thin `sync.js` — on load, call `/api/auth/me`; if signed in,
`pull` and merge into the in-memory library, then `push` on every library mutation (debounced).
If anonymous, behave exactly as today (localStorage only). Add a small "Sign in" control in the
header and an account menu.

**localStorage → account migration (idempotent):** on the *first* authenticated load where
`localStorage.migratedToAccount` is unset: read the existing localStorage library, `POST` it to
`/api/sync/import`. Because prompt/version `id`s are client-generated UUIDs, `import` upserts by
`id` (`INSERT … ON CONFLICT(id) DO NOTHING`) so re-running it is a no-op — set
`migratedToAccount=true` on success. Nothing is deleted from localStorage (keep it as an offline
cache / anonymous fallback).

**Security pass (extends 4.2), each a checklist item:** JWT secret only in env; cookies
`HttpOnly+Secure+SameSite=Lax`; CSRF on mutating `/api/sync/*` and `/api/auth/logout` via
SameSite=Lax + a double-submit token (or an `Origin`/`Referer` check) since they're
cookie-authenticated; **every D1 query filtered by `user_id`** (per-user isolation — the #1
bug class here); magic-link tokens single-use + short-lived + rate-limited; parameterised
queries only (D1 `.bind()`, never string-concat SQL); confirm no BYO API key is ever written to
D1 or logs.

**Effort reality:** ~1 week for a careful first version (auth is fiddly and security-sensitive),
which is why the **"sync code" lighter alternative above is the recommended stepping stone** —
it needs only KV + one encrypt/decrypt + two endpoints, no cookies, no email provider, no
per-user isolation surface, and delivers cross-device in a day or two.

### 8.1 Browser extension — `XL` — (reviewer: "the move that turns a tool into a platform")
- **SMART:** Ship a Manifest V3 extension for Chrome/Edge (then Firefox) that adds an
  "Optimize" affordance to the prompt box on ChatGPT, Claude.ai, Gemini, and Cursor's chat,
  calling the existing `/api/optimize-prompt/stream` endpoint and replacing the box contents in
  place.
- **Build notes:** separate repo/codebase; a content script per host injecting a button + a
  small popup; reuses the Pages Functions as its backend (BYO key stored in
  `chrome.storage.local`, or the 8.0 account session). Store-review pipeline (Chrome Web Store)
  is its own multi-day process. **Biggest distribution lever in the whole plan**, but a real
  second product to maintain — don't start until the web app's retention is proven.

### 8.2 CLI + public API — `XL` — (reviewer: "power users will pay for this")
- **SMART:** Publish an npm package `promptoptimize` (`npx promptoptimize "summarize this"`)
  and a documented, versioned, rate-limited public HTTP API.
- **Build notes:** the Pages Functions *are already* an HTTP API — this is packaging, not new
  core logic: add API-key issuance (needs 8.0's accounts/DB), per-key rate-limiting (KV
  counters or Cloudflare rate-limiting rules), OpenAPI docs, and a thin Node CLI that reads a
  config/env key and streams the result. Natural first paid tier. Depends on 8.0.

### 8.3 Multimodal & document input — `XL` — (reviewers: "multi-modal input", "context attachment")
- **SMART:** Let users attach an image (screenshot/sketch) or a document (`.txt`/`.pdf`/`.csv`)
  and either "optimize this prompt for this image" or "generate a prompt to extract X from this
  document."
- **Build notes:** two sub-capabilities that were separate reviewer asks: **(a) vision** —
  route to a vision-capable model, add an image part to the request; real per-call cost, gate
  behind BYO key. **(b) document context** — parse `.txt`/`.csv` client-side, `.pdf` via a JS
  PDF text extractor; feed extracted text as delimited context. (b) is much cheaper than (a) and
  could ship first as a Phase-6-ish add if demand shows. Watch the 26s Cloudflare deadline for
  large docs — may need chunking.

### 8.4 Voice input — `M` — (reviewer: "mic button, dictate your rough idea")
- **SMART:** A mic button that uses the Web Speech API to dictate the raw prompt into the
  textarea, with a visible transcript and graceful fallback where unsupported.
- **Note:** the smallest Phase-8 item and mostly client-side — could jump forward into Phase 5
  as a nice-to-have if users ask. No backend needed.

### 8.5 Community template gallery / marketplace — `XL` — (reviewers: "template gallery, upvote-able", "your acquisition loop")
- **SMART:** A public, browsable gallery of user-submitted prompt templates with categories
  (code review, blog post, SQL, image prompt…), upvotes, and "open in optimizer."
- **Build notes:** this is a **content platform**, a real restructure — needs 8.0's accounts +
  D1 tables (`templates`, `template_votes`), submission moderation (spam/abuse), and a curation
  policy. Distinct from the *built-in* framework library (6.5, client-side, curated by you).
  High acquisition potential, high maintenance and moderation burden — the biggest "changes what
  this project is" decision after accounts. Depends on 8.0.

### 8.6 Team features — `XL` — (reviewers: "shared Notion for prompts")
- **SMART:** Shared team libraries, comments on prompts, an activity feed, and an optional
  approval/review workflow, scoped to an organization.
- **Note:** **explicitly deferred in §3's "Deliberately NOT doing."** Only revisit after 8.0
  ships and if you decide to monetize team/enterprise. Adds org/membership tables, roles/
  permissions, and real access-control surface. Keep the core 90% free (owner's + reviewers'
  shared stance); this is where monetization lives, not in gating solo features.

### 8.7 Personal prompt analytics — `M` — (reviewer: "prompt analytics across history")
- **SMART:** A private dashboard over the signed-in user's own library/history: average prompt
  length, most common task type, optimization count, average quality-score trend (from 6.2),
  most-used models and templates.
- **Note:** distinct from the anonymous *usage* analytics in 4.4 (that's for you, the owner;
  this is *for the user, about their own prompts*). Needs 8.0's synced history to be meaningful
  across devices; a localStorage-only version is possible earlier but per-device.

### 8.8 Library intelligence — `M` — (reviewers: "auto-tag, detect duplicates")
- **SMART:** Auto-tag saved prompts by detected task/domain (coding/marketing/SQL…), surface
  near-duplicate prompts, and cluster the library.
- **Note:** auto-tagging is one cheap classification call per save; dedup is client-side
  similarity (normalize + compare, or embeddings if you add them). Can be **localStorage-only
  and shipped without a backend** — the only Phase-8-adjacent item here that doesn't strictly
  need 8.0. Could move up to Phase 6 if wanted.

### 8.9 Context manager / modular prompt components — `L` — (reviewer: "context manager", "prompt components")
- **SMART:** Let users define reusable context blocks (style guide, coding standards, product
  docs, persona) and toggle which ones compile into a given prompt (checkbox list → assembled
  prompt), so large prompts become modular instead of monolithic.
- **Note:** overlaps with **system/user/assistant separation** (6.5) and variables. Full value
  (reuse blocks across many prompts) wants 8.0 sync; a single-prompt version is Phase-6-sized.

---

## 6.x Owner punch-list → where it lives

Quick index so nothing the owner asked for is lost:

| Owner request | Item |
|---|---|
| Documentation (why/who, methodology + video, models, manual) | 4.5 |
| Options tooltip: why target model matters | 5.4 |
| Variables: "I don't understand it" | 5.4 (tooltip) + 4.5.4 (manual) + 6.4 (product clarity) |
| Rename "Pretty" tab | 5.2 |
| Free-models dropdown | 5.3 |
| Make it faster (~5s) | 4.3 |
| Move options + Optimize button inside the box | 5.1 |
| Deep code-cleanness scan / bugs | 4.1 |
| Security audit | 4.2 |
| API-key help + why BYO is secure | 5.7 (+ 4.2) |
| Progress bar + time + token cost | 5.5 |
| Tablet/phone responsiveness | 5.6 |
| Output on top on mobile / no scrollbar | 5.6 |
| Better mobile success popups | 5.6 |
| Ask for feedback before launch | 4.6 |
| Decide + implement analytics | 4.4 (+ §4b) |
| Login + cross-device session sync | 8.0 (foundational; lighter "sync code" alternative noted) |

---

# 9. Complete feature inventory (every reviewer idea → its home)

The "nothing dropped" index. Covers all three original reviews, the second review wave, my
additions, and the owner punch-list, mapped to what's shipped vs where it lives in the plan.
`✅ = shipped (Phases 1–3)`.

### Already shipped — don't rebuild (reviewers didn't know)
Target-model selector · CoT/few-shot/XML/placeholder technique toggles · strength + length
controls · iterative Refine · AI Critic (`critique` mode) · word-diff view · Test Bench
(real A/B run) + verdict strip · History (recent runs) · Library (named, versioned, tagged,
searchable) · git-like version chain · placeholder highlight + fill-flow + copy-gating ·
variable sandbox + compiled preview · inline contenteditable editing · sectioned output
accordions + per-section "why this changed" · token estimate (chars/4) · export .md/.txt/JSON
(w/ variable schema) · preset/sample catalog · BYO-key settings · streaming · deep second-pass
refine · above-the-fold delta bar · theme toggle.

### Planned — full map

| Reviewer / owner idea | Home | Size | Needs backend? |
|---|---|---|---|
| Deep code-cleanness + bug sweep | 4.1 | M | no |
| Security audit | 4.2 | M | no |
| Speed to <5s | 4.3 | M | no |
| Usage analytics (anonymous) | 4.4 / §4b | M | Pages Fn only |
| Documentation set (+ video) | 4.5 | L | no |
| Pre-launch feedback round | 4.6 | S | no |
| Options + Optimize inside input box | 5.1 | M | no |
| Rename "Pretty" → "Structured" | 5.2 | S | no |
| Free-model dropdown | 5.3 | M | no |
| Target-model + variables tooltips | 5.4 | S | no |
| Progress bar + time + token/cost | 5.5 | M | no |
| Tablet/phone responsiveness (output-first, no h-scroll, mobile toasts) | 5.6 | L | no |
| API-key help + BYO-security copy | 5.7 | S | no |
| Keyboard shortcuts + drag-drop file | 5.8 | S | no |
| Client-side prompt linter | 6.1 | M | no |
| Quality score / rubric / doctor / complexity meter | 6.2 | M | no (reuses critique) |
| Eval / test-case suite w/ auto-scoring | 6.3 | XL | no (uses BYO key) |
| Variables clarity + convert-to-variable | 6.4 | M | no |
| Smart Options toggles (few-shot/format/guardrails) | 6.5 | M | no |
| System / User / Assistant separation | 6.5 | M | no |
| Built-in framework library (RTF/CARE/CoT) | 6.5 | S | no |
| Interactive prompt builder (follow-up Qs) | 6.5 | M | no |
| "Why this works" annotation tooltips | 6.5 | S | no |
| Diff-view color + reject-addition | 6.5 | M | no |
| Collapsed options summary chip | 6.5 | S | no |
| Post-result metrics strip | 6.5 | S | no |
| First-run empty-state examples | 6.5 | S | no |
| More export formats (YAML/LangChain/curl) | 6.5 | S | no |
| Export as code (Python/Anthropic SDK/cURL) | 6.5 | M | no |
| Multi-model compatibility stars | 6.5 (+7.4) | S | no |
| No-DB shareable permalinks | 7.1 | M | no |
| Prompt-injection / robustness harness | 7.2 | L | no (uses BYO key) |
| Reverse mode (output → prompt) | 7.3 | M | no |
| Multi-model variants / prompt personas | 7.4 | L | no |
| Cost-to-pass model recommender | 7.5 | L | no (needs 6.3) |
| Comprehension check / back-translation | 7.6 | S | no |
| Ablation signal attribution | 7.6 | M | no (needs 6.3) |
| Ensemble disagreement detector | 7.6 | M | no |
| Anti-goal / negative-space field | 7.6 | S | no |
| Prompt staleness / drift pin | 7.6 | M | no |
| Output simulator (predicted response) | 7.6 | M | no |
| Failure prediction / risk score | 7.6 | S | no |
| Intent detection | 7.6 | M | no |
| Optimization-mode presets | 7.6 | M | no |
| Few-shot example generator | 7.6 | M | no |
| Automatic prompt compression | 7.6 | M | no |
| Prompt chaining | 7.6 | L | no |
| **Accounts + cross-device sync** | **8.0** | **XL** | **yes — D1 + auth** |
| Browser extension | 8.1 | XL | reuses API |
| CLI + public API | 8.2 | XL | yes (needs 8.0) |
| Multimodal + document context | 8.3 | XL | vision model path |
| Voice input | 8.4 | M | no |
| Community template gallery / marketplace | 8.5 | XL | yes (needs 8.0) |
| Team features (shared libs, comments, review) | 8.6 | XL | yes (needs 8.0) |
| Personal prompt analytics | 8.7 | M | best w/ 8.0 |
| Library intelligence (auto-tag / dedup) | 8.8 | M | no (client-side OK) |
| Context manager / modular components | 8.9 | L | best w/ 8.0 |

### Explicitly parked (revisit only on evidence — see §3 + Phase 8 notes)
Billing/pricing pages · full multi-model A/B matrix as the default flow · CodeMirror/Monaco +
react-diff-viewer (framework creep) · dark-IDE three-panel shell · standalone marketing landing
page. These were rejected for cause; the decision, not just the idea, is recorded so a future
session doesn't "rediscover" them.
