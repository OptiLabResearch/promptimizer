import { runUnitTests } from "./tests/unit.js";

console.log("Running unit tests...");
const results = await runUnitTests();
let allPassed = true;
for (const r of results) {
  if (r.passed) {
    console.log(`✅ PASS: ${r.name}`);
  } else {
    console.error(`❌ FAIL: ${r.name} - ${r.error}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log("All unit tests passed!");
  process.exit(0);
} else {
  console.error("Some unit tests failed.");
  process.exit(1);
}
