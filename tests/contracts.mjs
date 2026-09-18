import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as d from '../lib/dna.ts';

const data=new Map();
const sessionData=new Map();
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
globalThis.sessionStorage={getItem:k=>sessionData.get(k)||null,setItem:(k,v)=>sessionData.set(k,v),removeItem:k=>sessionData.delete(k)};

assert.deepEqual(d.answerRows({RC01:'A',RT01:'7'}),[
  {question_id:'RC01',answer_value:{value:'A'}},
  {question_id:'RT01',answer_value:{value:'7'}}
]);
assert.equal(d.optionsFor({question_id:'RT01',prompt:'Example',question_type:'scale',options:[]}).length,11);
assert.equal(d.score(undefined),'—');
assert.equal(d.score(0),'0');
assert.equal(d.hasCompleteInvestmentContext({goal:'growth',time_horizon:'5_10y'}),false);
assert.equal(d.hasCompleteInvestmentContext({goal:'growth',time_horizon:'5_10y',liquidity_need:'low',principal_required:'no'}),true);

const draft={version:1,createdAt:Date.now(),ownerId:null,session:{assessment_id:'id',session_token:'token'},answers:{RC01:'A'},index:0};
d.writeDraft(draft);
assert.equal(d.readDraft('user').session.assessment_id,'id');
d.writeDraft({...draft,ownerId:'alice'});
assert.equal(d.readDraft('bob'),null);
d.writeDraft({...draft,createdAt:Date.now()-25*3600000});
assert.equal(d.readDraft(null),null);
assert.equal(data.size,0);
assert.equal(sessionData.size,0);

d.writeDraft(draft);
const guestResult={...draft,personalization:{first_name:'Mahdi',age:35},result:{result:{archetype:'MAVERICK'},account_linked:false}};
assert.equal(d.writeEphemeralResult(guestResult),true);
assert.equal(localStorage.getItem(d.DRAFT_KEY),null);
assert.ok(sessionStorage.getItem(d.EPHEMERAL_RESULT_KEY));
assert.equal(d.readDraft(null)?.result?.result.archetype,'MAVERICK');
d.clearDraft();
assert.equal(sessionStorage.getItem(d.EPHEMERAL_RESULT_KEY),null);

localStorage.setItem=()=>{throw Error('blocked')};
assert.equal(d.writeDraft(draft),false);
assert.equal(d.readDraft(null).answers.RC01,'A');
d.clearDraft();
assert.equal(d.readDraft(null),null);

const edgeSource=readFileSync(new URL('../supabase/functions/investing-dna-pilot/index.ts',import.meta.url),'utf8');
const questionnaireBlock=edgeSource.match(/if \(action === 'questionnaire'\) \{[\s\S]*?if \(action === 'save_answers'\)/)?.[0];
assert.ok(questionnaireBlock,'questionnaire Edge Function block must exist');
assert.match(questionnaireBlock,/question_id: row\.question_id/);
assert.match(questionnaireBlock,/prompt: language === 'fr'/);
assert.doesNotMatch(questionnaireBlock,/\.\.\.row/);
assert.doesNotMatch(questionnaireBlock,/\.select\([^)]*weight/);
assert.doesNotMatch(questionnaireBlock,/construct_role/);
assert.match(edgeSource,/anonymous_code: participant\.anonymous_code/);
assert.match(edgeSource,/async function ensureProfile\(admin: any, authUser: any\)/);
assert.doesNotMatch(edgeSource,/userClient!\.rpc\('get_or_create_current_profile'\)/);
const profileBootstrapHardening=readFileSync(new URL('../supabase/migrations/20260918110915_harden_profile_bootstrap_rpc.sql',import.meta.url),'utf8');
assert.match(profileBootstrapHardening,/revoke execute on function public\.get_or_create_current_profile\(\) from public, anon, authenticated/);
const profileOwnershipHardening=readFileSync(new URL('../supabase/migrations/20260918110922_make_profile_ownership_check_invoker.sql',import.meta.url),'utf8');
assert.match(profileOwnershipHardening,/alter function public\.is_current_profile\(uuid\) security invoker/);
assert.match(profileOwnershipHardening,/grant select\(id,user_id\) on public\.profiles to authenticated/);
const internalGrantHardening=readFileSync(new URL('../supabase/migrations/20260918111110_revoke_legacy_browser_table_grants.sql',import.meta.url),'utf8');
assert.match(internalGrantHardening,/revoke all privileges on table/);
for (const internalTable of [
  'investment_data_refresh_runs',
  'investment_intelligence_profiles',
  'investment_match_narratives',
  'investment_official_facts',
  'market_data_ingestion_log',
  'market_data_normalization_rules',
  'market_data_provider_adapters',
  'market_data_refresh_runs',
  'market_data_source_routing',
  'market_data_sources'
]) {
  assert.ok(internalGrantHardening.includes('public.'+internalTable), 'Internal table grant hardening missing '+internalTable);
}
assert.match(internalGrantHardening,/from anon, authenticated/);

const supabaseSource=readFileSync(new URL('../lib/supabase.ts',import.meta.url),'utf8');
assert.match(supabaseSource,/flowType:\s*["']implicit["']/);
assert.match(supabaseSource,/detectSessionInUrl:\s*true/);
assert.match(supabaseSource,/persistSession:\s*true/);
assert.match(supabaseSource,/autoRefreshToken:\s*true/);

const profileSource=readFileSync(new URL('../app/profile/page.tsx',import.meta.url),'utf8');
assert.match(profileSource,/history\.replaceState\(history\.state,''\s*,\s*url\.pathname\+url\.search\)/);
assert.match(profileSource,/access_token/);
assert.match(profileSource,/refresh_token/);
assert.match(profileSource,/dna\/assessment\?fresh=1/);
assert.match(profileSource,/matches\?\.results\?\.find\(item=>item\.eligibility==='eligible'\)/);

const assessmentSource=readFileSync(new URL('../app/dna/assessment/page.tsx',import.meta.url),'utf8');
assert.match(assessmentSource,/COGNITIVE_V1_10/);
assert.match(assessmentSource,/draft\.session\.anonymous_code/);
assert.match(assessmentSource,/Research code:/);
assert.match(assessmentSource,/searchParams\.get\('fresh'\)===\'1\'/);

// The overall Match run status must override stale row-level numeric fields on
// every surface. A context_required or review_required payload can never leak a
// numeric score simply because an older row still says eligible/top_match.
const matchPresentationSource=readFileSync(new URL('../lib/match-presentation.ts',import.meta.url),'utf8');
assert.match(matchPresentationSource,/payloadStatus==='context_required'/);
assert.match(matchPresentationSource,/payloadStatus==='review_required'/);
const resultSource=readFileSync(new URL('../app/dna/result/page.tsx',import.meta.url),'utf8');
const matchPageSource=readFileSync(new URL('../app/match/page.tsx',import.meta.url),'utf8');
const compareSource=readFileSync(new URL('../app/compare/page.tsx',import.meta.url),'utf8');
const screenerSource=readFileSync(new URL('../app/screener/page.tsx',import.meta.url),'utf8');
const connectionSource=readFileSync(new URL('../components/InstrumentConnection.tsx',import.meta.url),'utf8');
assert.match(resultSource,/matchScorePresentation\(match,matchStatus\)/);
assert.match(matchPageSource,/matchScorePresentation\(item,match\?\.status\)/);
assert.match(compareSource,/matchScorePresentation\(match,matchStatus\)/);
assert.match(screenerSource,/matchScorePresentation\(match,matchStatus\)/);
assert.match(connectionSource,/matchScorePresentation\(match,status\)/);

const dnaSummarySource=readFileSync(new URL('../components/DnaSummary.tsx',import.meta.url),'utf8');
assert.doesNotMatch(dnaSummarySource,/aria-hidden="true">●/);

console.log('PASS assessment envelope, session-only guest result recovery, complete-context semantics, scale options, missing versus zero score, guest isolation, narrow questionnaire DTO, explicit Magic Link callback hygiene, retake reset, cognitive research-code continuity, dashboard Match fallback, clean DNA matrix highlighting, and payload-level Match redaction wiring');