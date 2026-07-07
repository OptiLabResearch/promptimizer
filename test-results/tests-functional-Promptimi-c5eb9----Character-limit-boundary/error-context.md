# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/functional.spec.ts >> Promptimizer Live Web App Tests >> Case A - Character-limit boundary
- Location: tests/functional.spec.ts:78:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]: P
      - heading "Promptimizer" [level=1] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: ● openai/gpt-oss-120b · live
      - button "📖 Guide" [ref=e8] [cursor=pointer]
      - button "★ Library" [ref=e9] [cursor=pointer]
      - button "↺ History" [ref=e10] [cursor=pointer]
      - button "⚙ API" [ref=e11] [cursor=pointer]
      - button "Toggle theme" [ref=e12] [cursor=pointer]: ◐
  - main [ref=e13]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Raw prompt
        - generic [ref=e18]:
          - button "📎 Upload" [ref=e19] [cursor=pointer]
          - button "🖼️ Image" [ref=e20] [cursor=pointer]
          - button "🎤 Dictate" [ref=e21] [cursor=pointer]
          - button "✕ Clear" [ref=e22] [cursor=pointer]
          - generic [ref=e23]: 0 / 5000
      - textbox "Paste or write your rough prompt here…" [ref=e25]
      - button "Options ▼" [ref=e26] [cursor=pointer]:
        - generic [ref=e27]: Options
        - generic [ref=e28]: ▼
      - button "✦ Optimize prompt" [disabled] [ref=e31]
    - generic [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]: Optimized result
        - generic [ref=e36]:
          - generic [ref=e37]:
            - button "Structured" [ref=e38] [cursor=pointer]
            - button "Raw" [ref=e39] [cursor=pointer]
            - button "Outline" [ref=e40] [cursor=pointer]
          - button "⋯" [ref=e42] [cursor=pointer]
      - generic [ref=e44]:
        - generic [ref=e45]: →
        - generic [ref=e46]: Your optimized prompt will appear here.
      - generic [ref=e47]:
        - button "⧉ Copy prompt" [ref=e48] [cursor=pointer]
        - button "★ Save" [ref=e49] [cursor=pointer]
  - contentinfo [ref=e50]:
    - generic [ref=e51]: Promptimizer · free & open source
    - generic [ref=e52]:
      - link "How it works" [ref=e53] [cursor=pointer]:
        - /url: "#"
      - link "Methodology" [ref=e54] [cursor=pointer]:
        - /url: "#"
      - link "Features" [ref=e55] [cursor=pointer]:
        - /url: "#"
      - link "Why this exists" [ref=e56] [cursor=pointer]:
        - /url: "#"
      - link "GitHub" [ref=e57] [cursor=pointer]:
        - /url: https://github.com/OptiLabResearch/promptimizer
      - link "Roadmap" [ref=e58] [cursor=pointer]:
        - /url: https://github.com/users/OptiLabResearch/projects/1/views/1
      - link "💬 Give feedback" [ref=e59] [cursor=pointer]:
        - /url: "#"
  - dialog [ref=e60]:
    - generic [ref=e61]:
      - generic [ref=e62]: ⚖ Test Bench
      - button [ref=e64] [cursor=pointer]: ✕
    - generic [ref=e65]:
      - generic [ref=e66]:
        - generic [ref=e67]: Test input (optional)
        - generic [ref=e68]: Sample data merged into both prompts before running.
        - textbox [ref=e69]
      - button [ref=e70] [cursor=pointer]: Run comparison
      - generic [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e73]: A · Original prompt
          - button [ref=e74] [cursor=pointer]: Pick winner
        - generic [ref=e75]: Run a comparison to see the response.
      - generic [ref=e76]:
        - generic [ref=e77]:
          - generic [ref=e78]: B · Optimized prompt
          - button [ref=e79] [cursor=pointer]: Pick winner
        - generic [ref=e80]: Run a comparison to see the response.
    - generic [ref=e81]: Winner is saved to your library with the test attached.
  - dialog [ref=e82]:
    - generic [ref=e83]:
      - generic [ref=e84]:
        - button [ref=e85] [cursor=pointer]: ★ Library
        - button [ref=e86] [cursor=pointer]: ↺ History
      - button [ref=e87] [cursor=pointer]: ✕
    - textbox [ref=e90]:
      - /placeholder: Search by name, tag, or content…
  - generic [ref=e91]:
    - generic [ref=e92]:
      - generic [ref=e93]:
        - generic [ref=e94]: P
        - generic [ref=e95]: Promptimizer
      - button "Close menu" [ref=e96] [cursor=pointer]: ✕
    - generic [ref=e97]:
      - generic [ref=e99]: ● openai/gpt-oss-120b · live
      - navigation [ref=e100]:
        - button "📖 Guide" [ref=e101] [cursor=pointer]
        - button "★ Library" [ref=e102] [cursor=pointer]
        - button "↺ History" [ref=e103] [cursor=pointer]
        - button "⚙ API Settings" [ref=e104] [cursor=pointer]
        - button "◐ Toggle Theme" [ref=e105] [cursor=pointer]
        - separator [ref=e106]
        - link "🐙 GitHub" [ref=e107] [cursor=pointer]:
          - /url: https://github.com/OptiLabResearch/promptimizer
        - link "🗺 Roadmap" [ref=e108] [cursor=pointer]:
          - /url: https://github.com/users/OptiLabResearch/projects/1/views/1
        - button "💬 Give feedback" [ref=e109] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import * as fs from 'fs';
  3   | import * as path from 'path';
  4   | 
  5   | // Define helper to setup console and network error tracking
  6   | function setupErrorTrackers(page: Page) {
  7   |   const consoleErrors: string[] = [];
  8   |   const pageErrors: string[] = [];
  9   |   const networkErrors: string[] = [];
  10  | 
  11  |   page.on('console', msg => {
  12  |     if (msg.type() === 'error') {
  13  |       consoleErrors.push(`[Console Error] ${msg.text()}`);
  14  |     }
  15  |   });
  16  | 
  17  |   page.on('pageerror', exception => {
  18  |     pageErrors.push(`[Page Error] ${exception.message}\nStack: ${exception.stack}`);
  19  |   });
  20  | 
  21  |   page.on('requestfailed', request => {
  22  |     networkErrors.push(`[Network Error] ${request.url()} failed: ${request.failure()?.errorText}`);
  23  |   });
  24  | 
  25  |   page.on('response', response => {
  26  |     if (!response.ok()) {
  27  |       networkErrors.push(`[HTTP Error] ${response.url()} status: ${response.status()} ${response.statusText()}`);
  28  |     }
  29  |   });
  30  | 
  31  |   return {
  32  |     getErrors: () => ({
  33  |       consoleErrors: [...consoleErrors],
  34  |       pageErrors: [...pageErrors],
  35  |       networkErrors: [...networkErrors],
  36  |       hasErrors: consoleErrors.length > 0 || pageErrors.length > 0 || networkErrors.length > 0
  37  |     }),
  38  |     clear: () => {
  39  |       consoleErrors.length = 0;
  40  |       pageErrors.length = 0;
  41  |       networkErrors.length = 0;
  42  |     }
  43  |   };
  44  | }
  45  | 
  46  | // Helper to expand advanced options if collapsed
  47  | async function ensureOptionsExpanded(page: Page) {
  48  |   const optionsBody = page.locator('#optionsBody');
  49  |   const isCollapsed = await optionsBody.evaluate(el => el.classList.contains('collapsed'));
  50  |   if (isCollapsed) {
  51  |     await page.click('#optionsToggle');
  52  |     await expect(optionsBody).not.toHaveClass(/collapsed/);
  53  |   }
  54  | }
  55  | 
  56  | // Helper to take screenshots
  57  | async function takeScreenshot(page: Page, testName: string, suffix: string) {
  58  |   const dir = path.join(__dirname, '../test-screenshots');
  59  |   if (!fs.existsSync(dir)) {
  60  |     fs.mkdirSync(dir, { recursive: true });
  61  |   }
  62  |   const filePath = path.join(dir, `${testName}_${suffix}.png`);
  63  |   await page.screenshot({ path: filePath, fullPage: true });
  64  |   console.log(`Screenshot saved: ${filePath}`);
  65  | }
  66  | 
  67  | test.describe('Promptimizer Live Web App Tests', () => {
  68  |   const LIVE_URL = 'https://promptimizer.optiqo.dev/';
  69  | 
  70  |   test.beforeEach(async ({ page }) => {
  71  |     // Clear localStorage/sessionStorage to have a clean state for each test
  72  |     await page.goto(LIVE_URL);
  73  |     await page.evaluate(() => localStorage.clear());
  74  |     await page.evaluate(() => sessionStorage.clear());
  75  |   });
  76  | 
  77  |   // --- CASE A: Character-limit boundary ---
  78  |   test('Case A - Character-limit boundary', async ({ page }) => {
  79  |     const tracker = setupErrorTrackers(page);
  80  |     await page.goto(LIVE_URL);
> 81  |     await page.waitForLoadState('networkidle');
      |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  82  | 
  83  |     // Create a 50,000+ character string (mix of unbroken and normal)
  84  |     const unbrokenPart = 'A'.repeat(15000);
  85  |     const normalPart = ' This is normal text. '.repeat(1600);
  86  |     const largeInput = unbrokenPart + normalPart; // ~50k characters
  87  | 
  88  |     // 1. Paste/fill the text
  89  |     const rawPrompt = page.locator('#rawPrompt');
  90  |     await rawPrompt.fill(largeInput);
  91  | 
  92  |     // 2. Check if client enforces 5000 limit
  93  |     const filledValue = await rawPrompt.inputValue();
  94  |     console.log(`Case A: Raw prompt length after normal fill: ${filledValue.length}`);
  95  |     expect(filledValue.length).toBeLessThanOrEqual(5000);
  96  | 
  97  |     // Check if charCount UI shows 5000/5000
  98  |     const charCountText = await page.locator('#charCount').innerText();
  99  |     console.log(`Case A: Char count text: ${charCountText}`);
  100 |     expect(charCountText).toContain('5000');
  101 | 
  102 |     // Take layout screenshot of normal fill
  103 |     await takeScreenshot(page, 'case_a', 'normal_limit');
  104 | 
  105 |     // 3. Bypass the client limit using page.evaluate and trigger optimize
  106 |     await page.evaluate((val) => {
  107 |       const el = document.getElementById('rawPrompt') as HTMLTextAreaElement;
  108 |       el.removeAttribute('maxlength');
  109 |       el.value = val;
  110 |       el.dispatchEvent(new Event('input', { bubbles: true }));
  111 |     }, largeInput);
  112 | 
  113 |     const bypassedValue = await page.locator('#rawPrompt').inputValue();
  114 |     console.log(`Case A: Bypassed prompt length: ${bypassedValue.length}`);
  115 |     expect(bypassedValue.length).toBe(largeInput.length);
  116 | 
  117 |     const bypassedCharCountText = await page.locator('#charCount').innerText();
  118 |     console.log(`Case A: Bypassed Char count text: ${bypassedCharCountText}`);
  119 | 
  120 |     // Click optimize and observe network/UI response
  121 |     tracker.clear();
  122 |     const optimizeBtn = page.locator('#optimizeBtn');
  123 |     await expect(optimizeBtn).toBeEnabled();
  124 |     await optimizeBtn.click();
  125 | 
  126 |     // The backend API limits prompts to 30,000 characters. Sending 50,000 characters
  127 |     // should fail at the API level (400 Bad Request). Let's see if the UI handles it or hangs.
  128 |     console.log('Case A: Sent request, waiting for response or error...');
  129 |     await page.waitForTimeout(5000); // Wait to see if loader resolves or hangs
  130 | 
  131 |     const errors = tracker.getErrors();
  132 |     console.log('Case A Errors during submit:', errors);
  133 | 
  134 |     const progressContainerVisible = await page.locator('#progressContainer').isVisible();
  135 |     const isSpinnerRunning = await page.locator('.spinner').isVisible().catch(() => false);
  136 |     
  137 |     await takeScreenshot(page, 'case_a', 'after_bypass_submit');
  138 | 
  139 |     // Output findings: check if UI is stuck or displays error
  140 |     console.log(`Case A Progress Container Visible: ${progressContainerVisible}`);
  141 |     console.log(`Case A Spinner Visible: ${isSpinnerRunning}`);
  142 |     
  143 |     // We expect the app to display a clear error if the network request fails with 400
  144 |     const emptyStateText = await page.locator('#emptyStateText').innerText().catch(() => '');
  145 |     console.log(`Case A Empty state or error text: ${emptyStateText}`);
  146 |   });
  147 | 
  148 |   // --- CASE B: Variable parser edge cases ---
  149 |   test('Case B - Variable parser edge cases', async ({ page }) => {
  150 |     const tracker = setupErrorTrackers(page);
  151 | 
  152 |     // Mock `/api/optimize-prompt` to echo the raw prompt back so we can verify frontend placeholder rendering
  153 |     await page.route(url => url.pathname.includes('/api/optimize-prompt'), async (route) => {
  154 |       const request = route.request();
  155 |       if (request.method() === 'POST') {
  156 |         const body = request.postDataJSON();
  157 |         await route.fulfill({
  158 |           status: 200,
  159 |           contentType: 'application/json',
  160 |           body: JSON.stringify({
  161 |             ok: true,
  162 |             optimized_prompt: `Here are the variables: ${body.prompt}`,
  163 |             explanation: "Mocked response for testing placeholder parsing."
  164 |           })
  165 |         });
  166 |       } else {
  167 |         await route.continue();
  168 |       }
  169 |     });
  170 | 
  171 |     const testInputs = [
  172 |       { name: 'nested_brackets', prompt: '{{{{nested_brackets}}}}' },
  173 |       { name: 'unclosed_variable', prompt: '{{unclosed_variable' },
  174 |       { name: 'empty_variable', prompt: '{{ }}' },
  175 |       { name: 'number_variable', prompt: '{{1234}}' },
  176 |       { name: 'special_chars', prompt: '{{ spaces and $pecial #chars ! }}' },
  177 |       { name: 'concurrency_50_vars', prompt: Array.from({ length: 50 }, (_, i) => `{{var${i + 1}}}`).join(' ') }
  178 |     ];
  179 | 
  180 |     for (const input of testInputs) {
  181 |       console.log(`\n--- Testing Variable Input: ${input.name} ---`);
```