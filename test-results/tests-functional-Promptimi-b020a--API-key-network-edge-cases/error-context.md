# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/functional.spec.ts >> Promptimizer Live Web App Tests >> Case C - API key & network edge cases
- Location: tests/functional.spec.ts:231:7

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
  182 |       tracker.clear();
  183 |       await page.goto(LIVE_URL);
  184 |       await page.waitForLoadState('networkidle');
  185 | 
  186 |       // Ensure options are expanded, then select "Deep" quality
  187 |       await ensureOptionsExpanded(page);
  188 |       await page.click('div[data-group="quality"] button[data-value="deep"]');
  189 | 
  190 |       await page.fill('#rawPrompt', input.prompt);
  191 |       await page.click('#optimizeBtn');
  192 | 
  193 |       // Wait for output card to appear
  194 |       await page.waitForSelector('#prettyView', { state: 'visible' });
  195 | 
  196 |       // Open developer menu to toggle compiled preview
  197 |       await page.click('#devMenuBtn');
  198 |       await page.click('#previewBtn');
  199 | 
  200 |       // Check if variables placeholder inputs are rendered (if any were matched)
  201 |       const containerExists = await page.locator('#placeholderInputsContainer').isVisible().catch(() => false);
  202 |       console.log(`  Inputs container rendered: ${containerExists}`);
  203 | 
  204 |       if (containerExists) {
  205 |         // Take screenshot of placeholder form
  206 |         await takeScreenshot(page, input.name, 'vars_panel');
  207 | 
  208 |         // List detected variable labels
  209 |         const labels = await page.locator('.placeholder-inputs-grid label').allInnerTexts();
  210 |         console.log(`  Detected placeholder fields:`, labels);
  211 | 
  212 |         // Try to type into the first variable input field
  213 |         const firstInput = page.locator('.placeholder-inputs-grid input').first();
  214 |         if (await firstInput.isVisible()) {
  215 |           await firstInput.fill('TEST_VAL');
  216 |           const previewText = await page.locator('#rawView').innerText();
  217 |           console.log(`  Preview updated: ${previewText.includes('TEST_VAL') ? 'Yes' : 'No'}`);
  218 |         }
  219 |       }
  220 | 
  221 |       const errors = tracker.getErrors();
  222 |       if (errors.hasErrors) {
  223 |         console.error(`  [FAIL] Case B (${input.name}) triggered errors:`, errors);
  224 |       } else {
  225 |         console.log(`  [PASS] Case B (${input.name}) ran without JS or network exceptions.`);
  226 |       }
  227 |     }
  228 |   });
  229 | 
  230 |   // --- CASE C: API key / network edge cases ---
  231 |   test('Case C - API key & network edge cases', async ({ page }) => {
  232 |     const tracker = setupErrorTrackers(page);
  233 |     await page.goto(LIVE_URL);
> 234 |     await page.waitForLoadState('networkidle');
      |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  235 | 
  236 |     // 1. Enter malformed key and check spinner/error timeout
  237 |     console.log('\n--- Case C.1: Malformed API Key validation ---');
  238 |     await page.click('#apiBtn');
  239 |     await page.locator('#settingsModal').waitFor({ state: 'visible' });
  240 | 
  241 |     // Select Google provider (Gemini) instead of non-existent openai
  242 |     await page.selectOption('#settingsProvider', 'google');
  243 |     await page.locator('#settingsApiKeyGroup').waitFor({ state: 'visible' });
  244 |     await page.fill('#settingsApiKey', 'invalid_google_key_999');
  245 |     await page.click('#settingsSave');
  246 |     await page.locator('#settingsModal').waitFor({ state: 'hidden' });
  247 | 
  248 |     // Verify engine chip shows "google"
  249 |     const engineText = await page.locator('#engineChip').innerText();
  250 |     console.log(`Engine chip updated to: ${engineText}`);
  251 | 
  252 |     // Input prompt and optimize
  253 |     await page.fill('#rawPrompt', 'Optimize this simple prompt, please.');
  254 |     tracker.clear();
  255 |     await page.click('#optimizeBtn');
  256 | 
  257 |     // We expect the request to fail (due to fake API key) and a clear error to show
  258 |     // We wait up to 10 seconds to see if the error is displayed or if it hangs
  259 |     console.log('Waiting for API error response...');
  260 |     let errorDetected = false;
  261 |     let didHang = true;
  262 | 
  263 |     for (let i = 0; i < 20; i++) {
  264 |       await page.waitForTimeout(500);
  265 |       const isProgressVisible = await page.locator('#progressContainer').isVisible();
  266 |       const errorContent = await page.locator('#emptyStateText').innerText().catch(() => '');
  267 |       
  268 |       // If progress bar is gone, it resolved (either success or error)
  269 |       if (!isProgressVisible) {
  270 |         didHang = false;
  271 |         if (errorContent.toLowerCase().includes('failed') || errorContent.toLowerCase().includes('error') || errorContent.toLowerCase().includes('unauthorized') || errorContent.length > 50) {
  272 |           errorDetected = true;
  273 |           console.log(`Clear user error displayed in UI: "${errorContent}"`);
  274 |         }
  275 |         break;
  276 |       }
  277 |     }
  278 | 
  279 |     if (didHang) {
  280 |       console.log('[BUG] Loading state hangs on invalid API key!');
  281 |       await takeScreenshot(page, 'case_c', 'hung_loading');
  282 |     }
  283 |     expect(didHang).toBe(false);
  284 | 
  285 |     const errors = tracker.getErrors();
  286 |     console.log('Case C.1 Errors:', errors);
  287 | 
  288 |     // 2. Switching providers and checking persistence
  289 |     console.log('\n--- Case C.2: Switching providers and persistence ---');
  290 |     const providersToTest = [
  291 |       { id: 'google', key: 'gemini-key-567', model: 'gemini-pro' },
  292 |       { id: 'openrouter', key: 'or-key-890', model: 'meta-llama/llama-3' },
  293 |       { id: 'groq', key: 'gsk-groq111', model: 'mixtral-8x7b' },
  294 |       { id: 'custom', key: 'custom-key-222', model: 'my-custom-model', baseUrl: 'https://test.custom/v1' }
  295 |     ];
  296 | 
  297 |     for (const prov of providersToTest) {
  298 |       console.log(`Setting provider: ${prov.id}`);
  299 |       await page.click('#apiBtn');
  300 |       await page.locator('#settingsModal').waitFor({ state: 'visible' });
  301 | 
  302 |       await page.selectOption('#settingsProvider', prov.id);
  303 |       await page.locator('#settingsApiKeyGroup').waitFor({ state: 'visible' });
  304 |       await page.fill('#settingsApiKey', prov.key);
  305 |       
  306 |       if (prov.model) {
  307 |         const modelInput = page.locator('#settingsModel');
  308 |         if (await modelInput.isVisible()) {
  309 |           await modelInput.fill(prov.model);
  310 |         }
  311 |       }
  312 |       if (prov.baseUrl) {
  313 |         const baseUrlInput = page.locator('#settingsBaseUrl');
  314 |         if (await baseUrlInput.isVisible()) {
  315 |           await baseUrlInput.fill(prov.baseUrl);
  316 |         }
  317 |       }
  318 | 
  319 |       await page.click('#settingsSave');
  320 |       await page.locator('#settingsModal').waitFor({ state: 'hidden' });
  321 | 
  322 |       // Close and reopen modal to verify values persist in memory/DOM
  323 |       await page.click('#apiBtn');
  324 |       await page.locator('#settingsModal').waitFor({ state: 'visible' });
  325 |       
  326 |       expect(await page.locator('#settingsProvider').inputValue()).toBe(prov.id);
  327 |       expect(await page.locator('#settingsApiKey').inputValue()).toBe(prov.key);
  328 |       
  329 |       if (prov.model && await page.locator('#settingsModel').isVisible()) {
  330 |         expect(await page.locator('#settingsModel').inputValue()).toBe(prov.model);
  331 |       }
  332 |       if (prov.baseUrl && await page.locator('#settingsBaseUrl').isVisible()) {
  333 |         expect(await page.locator('#settingsBaseUrl').inputValue()).toBe(prov.baseUrl);
  334 |       }
```