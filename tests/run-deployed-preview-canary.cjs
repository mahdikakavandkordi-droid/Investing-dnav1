const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
if (!bypassSecret) {
  console.error('Missing VERCEL_AUTOMATION_BYPASS_SECRET GitHub Actions secret.');
  process.exit(2);
}

const sourcePath = path.join(__dirname, 'deployed-preview-flow.cjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const marker = "const response=await page.goto(ORIGIN+'/dna/assessment',{waitUntil:'domcontentloaded'});";
const screenerMarker = "await page.goto(ORIGIN+'/screener');";
const compareMarker = "await page.getByRole('heading',{name:'Compare Investment DNA side by side'}).waitFor();";

if (!source.includes(marker)) {
  console.error('Deployed-preview canary bootstrap marker not found.');
  process.exit(3);
}
if (!source.includes(screenerMarker)) {
  console.error('Deployed-preview canary screener navigation marker not found.');
  process.exit(4);
}
if (!source.includes(compareMarker)) {
  console.error('Deployed-preview canary compare marker not found.');
  process.exit(5);
}

const bootstrap = [
  "const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;",
  "const bypassMode = process.env.VERCEL_BYPASS_MODE || 'header';",
  "assert.ok(bypassSecret, 'VERCEL_AUTOMATION_BYPASS_SECRET is required');",
  "if (bypassMode === 'header') await page.setExtraHTTPHeaders({'x-vercel-protection-bypass': bypassSecret, 'x-vercel-set-bypass-cookie': 'true'});",
  "const bypassUrl = bypassMode === 'query' ? ORIGIN + '/dna/assessment?x-vercel-protection-bypass=' + encodeURIComponent(bypassSecret) : ORIGIN + '/dna/assessment';",
  "const response=await page.goto(bypassUrl,{waitUntil:'domcontentloaded'});",
  "assert.ok(response);assert.ok(response.status()<400);assert.equal(new URL(page.url()).host,expectedHost);assert.doesNotMatch(await page.locator('body').innerText(),/Authentication Required|Log in to Vercel|Vercel Authentication/i);",
  "if (bypassMode === 'query') await page.setExtraHTTPHeaders({'x-vercel-protection-bypass': bypassSecret, 'x-vercel-set-bypass-cookie': 'true'});"
].join('\n');

// Keep the guest journey inside the same Next.js application session. A full
// reload intentionally does not persist the complete guest DNA report; account
// creation is the cross-visit persistence boundary. Navigate back to Match and
// follow the real product CTA into the screener instead of forcing page.goto().
const screenerNavigation = [
  "await page.goBack();",
  "await page.waitForURL(url => url.pathname === '/match');",
  "await page.getByText('Context-aware match', { exact: true }).waitFor();",
  "await page.getByRole('link', { name: 'Open ETF screener', exact: true }).click();",
  "await page.waitForURL(url => url.pathname === '/screener');"
].join('\n');

// The deployed Compare route resolves its selected-instrument research
// asynchronously after the shell/heading renders. Wait for both expected
// comparison rows before reading the page body so network/render timing cannot
// turn a healthy deployment into a false negative.
const compareWait = [
  compareMarker,
  "await page.getByText('ZAG', { exact: true }).first().waitFor();",
  "await page.getByText('VBAL', { exact: true }).first().waitFor();"
].join('\n');

const runtimePath = path.join(__dirname, '.deployed-preview-flow.runtime.cjs');
const runtimeSource = source
  .replace(marker, bootstrap)
  .replace(screenerMarker, screenerNavigation)
  .replace(compareMarker, compareWait);
fs.writeFileSync(runtimePath, runtimeSource, 'utf8');

try {
  const result = spawnSync(process.execPath, [runtimePath], {
    stdio: 'inherit',
    env: process.env
  });
  process.exitCode = result.status === null ? 1 : result.status;
} finally {
  try { fs.unlinkSync(runtimePath); } catch {}
}
