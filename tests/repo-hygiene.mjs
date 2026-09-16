import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

/**
 * Lightweight repository hygiene guard.
 *
 * This does not replace TypeScript/ESLint. It protects a few Investor DNA
 * architecture decisions that are easy to accidentally regress during rapid
 * product work: no convenience backup files, no retired compatibility wrappers,
 * no internal questionnaire fields in the browser DTO, no retired database
 * runtime references, and no service-role secret references in browser source.
 * Server-side Edge Functions may read service-role environment secrets.
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

// These names belong only in immutable migration history / retirement docs.
// Current browser and Edge runtime must not depend on or resurrect them.
const retiredRuntimeNames = [
  'generate_portfolio_blueprints',
  'refresh_blueprint_risk_and_match',
  'calculate_portfolio_risk_overlap',
  'get_investor_home',
  'v_app_dna',
  'v_app_investment_catalog',
  'v_app_investment_detail',
  'v_app_watchlist',
  'v_investor_home',
  'v_current_user_identity',
  'v_current_investor_dna',
  'calculate_investment_match_v3',
  'calculate_investment_match_v4',
  'calculate_investment_match_v5',
  'calculate_investment_match_v51',
  'v_investment_dna_v1',
  'capture_current_match_snapshot',
  'get_investment_recommendations',
  'get_explainable_match',
  'get_investment_match_intelligence',
  'cleanup_match_result_versions',
  'investor_match_snapshots'
];
const retiredRuntimeRefs = currentRuntimeFiles.filter(file => {
  const text = read(file);
  return retiredRuntimeNames.some(name => text.includes(name));
});
assert.deepEqual(
  retiredRuntimeRefs,
  [],
  `Retired runtime must not return to current source: ${retiredRuntimeRefs.join(', ')}`
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
