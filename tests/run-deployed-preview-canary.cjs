const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const token = process.env.VERCEL_PREVIEW_SHARE_TOKEN || '';
if (!token) {
  console.error('Missing VERCEL_PREVIEW_SHARE_TOKEN GitHub Actions secret.');
  process.exit(2);
}

const sourcePath = path.join(__dirname, 'deployed-preview-flow.cjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const marker = "  const response = await page.goto(ORIGIN + '/dna/assessment', { waitUntil: 'domcontentloaded' });";
if (!source.includes(marker)) {
  console.error('Deployed-preview canary bootstrap marker not found.');
  process.exit(3);
}

const bootstrap = [
  "  const shareToken = process.env.VERCEL_PREVIEW_SHARE_TOKEN;",
  "  assert.ok(shareToken, 'VERCEL_PREVIEW_SHARE_TOKEN is required');",
  "  await page.goto(ORIGIN + '/?_vercel_share=' + encodeURIComponent(shareToken), { waitUntil: 'domcontentloaded' });",
  "  assert.equal(new URL(page.url()).host, expectedHost, 'Share bootstrap redirected away from app to ' + page.url());",
  '',
  marker
].join('\n');

const runtimePath = path.join(__dirname, '.deployed-preview-flow.runtime.cjs');
fs.writeFileSync(runtimePath, source.replace(marker, bootstrap), 'utf8');

try {
  const result = spawnSync(process.execPath, [runtimePath], {
    stdio: 'inherit',
    env: process.env
  });
  process.exitCode = result.status === null ? 1 : result.status;
} finally {
  try { fs.unlinkSync(runtimePath); } catch {}
}
