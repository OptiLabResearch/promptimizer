# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/functional.spec.ts >> Promptimizer Live Web App Tests >> Case D - Test Bench concurrency & library corruption
- Location: tests/functional.spec.ts:361:7

# Error details

```
Error: page.waitForLoadState: Test ended.
```

# Test source

```ts
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
  335 | 
  336 |       await page.click('#settingsCancel'); // Close settings
  337 | 
  338 |       // Reload page to verify persistence in localStorage
  339 |       await page.reload();
  340 |       await page.waitForLoadState('networkidle');
  341 | 
  342 |       await page.click('#apiBtn');
  343 |       await page.locator('#settingsModal').waitFor({ state: 'visible' });
  344 |       
  345 |       expect(await page.locator('#settingsProvider').inputValue()).toBe(prov.id);
  346 |       expect(await page.locator('#settingsApiKey').inputValue()).toBe(prov.key);
  347 |       
  348 |       if (prov.model && await page.locator('#settingsModel').isVisible()) {
  349 |         expect(await page.locator('#settingsModel').inputValue()).toBe(prov.model);
  350 |       }
  351 |       if (prov.baseUrl && await page.locator('#settingsBaseUrl').isVisible()) {
  352 |         expect(await page.locator('#settingsBaseUrl').inputValue()).toBe(prov.baseUrl);
  353 |       }
  354 |       
  355 |       await page.click('#settingsCancel');
  356 |       console.log(`  [PASS] Provider ${prov.id} settings persisted correctly after reload.`);
  357 |     }
  358 |   });
  359 | 
  360 |   // --- CASE D: Test Bench concurrency & library data corruption ---
  361 |   test('Case D - Test Bench concurrency & library corruption', async ({ page }) => {
  362 |     const tracker = setupErrorTrackers(page);
  363 |     await page.goto(LIVE_URL);
> 364 |     await page.waitForLoadState('networkidle');
      |                ^ Error: page.waitForLoadState: Test ended.
  365 | 
  366 |     // Mock API requests for Test Bench
  367 |     let requestCount = 0;
  368 |     await page.route(url => url.pathname.includes('/api/optimize-prompt'), async (route) => {
  369 |       const request = route.request();
  370 |       if (request.url().includes('/test')) {
  371 |         requestCount++;
  372 |         const currentReq = requestCount;
  373 |         console.log(`Mocking Test Bench API Request #${currentReq}`);
  374 |         // Simulate a network delay of 2 seconds for the comparison run using a native promise
  375 |         await new Promise(resolve => setTimeout(resolve, 2000));
  376 |         await route.fulfill({
  377 |           status: 200,
  378 |           contentType: 'application/json',
  379 |           body: JSON.stringify({
  380 |             ok: true,
  381 |             original_output: `Output A for request #${currentReq}`,
  382 |             optimized_output: `Output B for request #${currentReq}`
  383 |           })
  384 |         });
  385 |       } else {
  386 |         // Normal optimize endpoint
  387 |         await route.fulfill({
  388 |           status: 200,
  389 |           contentType: 'application/json',
  390 |           body: JSON.stringify({
  391 |             ok: true,
  392 |             optimized_prompt: 'Optimized: Test Bench Context',
  393 |             explanation: 'Optimized explanation'
  394 |           })
  395 |         });
  396 |       }
  397 |     });
  398 | 
  399 |     // 1. Setup - Optimize a prompt to enable dev menu and Test Bench button
  400 |     // Ensure advanced options are expanded and set Quality to "Deep" to match our mock
  401 |     await ensureOptionsExpanded(page);
  402 |     await page.click('div[data-group="quality"] button[data-value="deep"]');
  403 | 
  404 |     await page.fill('#rawPrompt', 'Test Bench Base Prompt');
  405 |     await page.click('#optimizeBtn');
  406 |     await page.waitForSelector('#prettyView', { state: 'visible' });
  407 | 
  408 |     // 2. Open Test Bench
  409 |     await page.click('#devMenuBtn');
  410 |     await page.click('#testBenchBtn');
  411 |     await page.locator('#benchPanel').waitFor({ state: 'visible' });
  412 | 
  413 |     // Fill in a sample input in the test bench
  414 |     await page.fill('#benchInput', 'Sample test input');
  415 | 
  416 |     // 3. Concurrency check: Trigger "Run comparison" rapidly multiple times in succession
  417 |     // We will bypass the UI disabled attribute by calling click programmatically in loop,
  418 |     // simulating a double/triple click race condition
  419 |     tracker.clear();
  420 |     console.log('Triggering rapid successive clicks on Run Comparison...');
  421 |     
  422 |     await page.evaluate(() => {
  423 |       const btn = document.getElementById('benchRun') as HTMLButtonElement;
  424 |       // Dispatch 3 click events consecutively, re-enabling the button in between
  425 |       // to ensure all 3 clicks are processed regardless of browser-level disabled checks
  426 |       btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  427 |       btn.removeAttribute('disabled');
  428 |       btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  429 |       btn.removeAttribute('disabled');
  430 |       btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  431 |     });
  432 | 
  433 |     // Wait for requests to complete (we have a 2s delay in the mock)
  434 |     console.log('Waiting for Test Bench requests to finish...');
  435 |     await page.waitForTimeout(6000);
  436 | 
  437 |     // Verify the latest request results are rendered, and they don't get swapped/overwritten by aborted ones
  438 |     const textA = await page.locator('#benchBodyA').innerText();
  439 |     const textB = await page.locator('#benchBodyB').innerText();
  440 |     console.log(`Rendered Results after rapid clicking:\n  Card A: "${textA}"\n  Card B: "${textB}"`);
  441 |     
  442 |     // We triggered 3 requests. Request #3 was the last one, so output should be "Output A/B for request #3"
  443 |     expect(textA).toBe('Output A for request #3');
  444 |     expect(textB).toBe('Output B for request #3');
  445 | 
  446 |     // Verify how many requests actually fired
  447 |     console.log(`Total concurrent API requests recorded: ${requestCount}`);
  448 |     
  449 |     // 4. Data Corruption check:
  450 |     // Let's test the library entry overwrite bug we identified!
  451 |     console.log('\n--- Testing library entry data-loss bug ---');
  452 |     
  453 |     // Pick Winner A for the first prompt run
  454 |     await page.click('#benchCardA .bench-pick');
  455 |     console.log('Picked Winner A for Prompt 1');
  456 | 
  457 |     // Check library state in localStorage
  458 |     let library = await page.evaluate(() => JSON.parse(localStorage.getItem('promptimizerLibrary') || '[]'));
  459 |     console.log('Library entries after first save:', library.length);
  460 |     expect(library.length).toBe(1);
  461 |     const firstSavedId = library[0].id;
  462 |     console.log(`Saved entry ID: ${firstSavedId}`);
  463 | 
  464 |     // Close Test Bench
```