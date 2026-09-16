import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

/**
 * Lightweight repository hygiene guard.
 *
 * This does not replace TypeScript/ESLint. It protects a few Investor DNA
 * architecture decisions that are easy to accidentally regress during rapid
 * product work: no convenience backup files, no retired compatibility wrappers,
 * no internal questionnaire fields in the browser DTO, no frozen Portfolio
 * Builder runtime references, and no service-role secret references in browser
 * source. Server-side Edge Functions may read service-role environment secrets.
 */

const ROOT = process.cwd();
const LIVE_SOURCE_DIRS = ['app', 'components', 'lib', 'tests'];

function walk(relativeDir) {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir, {withFileTypes: true}).flatMap(entry => {
    const relative = path.join(relativeDir, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

const sourceFiles = LIVE_SOURCE_DIRS.flatMap(walk);
const junkName = /(^|[-_.])(old|backup|bak|final-final)([-_.]|$)/i;
const junkFiles = sourceFiles.filter(file => junkName.test(path.basename(file)));
assert.deepEqual(junkFiles, [], `Convenience backup/old files are not allowed: ${junkFiles.join(', ')}`);

assert.equal(
  fs.existsSync(path.join(ROOT, 'components/FundConnection.tsx')),
  false,
  'FundConnection.tsx was retired; use InstrumentConnection.tsx.'
);

const dna = read('lib/dna.ts');
const questionStart = dna.indexOf('export type Question = {');
const questionEnd = dna.indexOf('\n};', questionStart);
assert.ok(questionStart >= 0 && questionEnd > questionStart, 'Question DTO type not found.');
const questionDto = dna.slice(questionStart, questionEnd);
for (const forbidden of ['weight', 'construct:', 'construct_role', 'version:']) {
  assert.equal(
    questionDto.includes(forbidden),
    false,
    `Browser Question DTO must not expose internal field: ${forbidden}`
  );
}

const investments = read('lib/investments.ts');
for (const retired of [
  'export type WatchItem',
  'export function watchlist(',
  'export function saveFund(',
  'export function removeFund('
]) {
  assert.equal(
    investments.includes(retired),
    false,
    `Retired fund-specific Watchlist alias returned: ${retired}`
  );
}

const browserSourceFiles = [
  ...walk('app'),
  ...walk('components'),
  ...walk('lib')
].filter(file => /\.(?:ts|tsx|js|mjs|cjs)$/.test(file));

const currentRuntimeFiles = [
  ...browserSourceFiles,
  ...walk('supabase/functions')
].filter(file => /\.(?:ts|tsx|js|mjs|cjs)$/.test(file));

const portfolioRuntimeRefs = currentRuntimeFiles.filter(file => {
  const text = read(file);
  return /generate_portfolio_blueprints|refresh_blueprint_risk_and_match|calculate_portfolio_risk_overlap/.test(text);
});
assert.deepEqual(
  portfolioRuntimeRefs,
  [],
  `Frozen Portfolio Builder runtime must not return to current source: ${portfolioRuntimeRefs.join(', ')}`
);

const leakedServiceKeys = browserSourceFiles.filter(file => {
  const text = read(file);
  return /NEXT_PUBLIC_.*SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY/.test(text);
});
assert.deepEqual(
  leakedServiceKeys,
  [],
  `Service-role secrets must never appear in browser source: ${leakedServiceKeys.join(', ')}`
);

console.log('PASS: repository hygiene and retired-runtime boundaries');
