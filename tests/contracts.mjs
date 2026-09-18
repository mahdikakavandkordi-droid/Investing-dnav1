import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as d from '../lib/dna.ts';

const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};

assert.deepEqual(d.answerRows({RC01:'A',RT01:'7'}),[
  {question_id:'RC01',answer_value:{value:'A'}},
  {question_id:'RT01',answer_value:{value:'7'}}
]);
assert.equal(d.optionsFor({question_id:'RT01',prompt:'Example',question_type:'scale',options:[]}).length,11);
assert.equal(d.score(undefined),'—');
assert.equal(d.score(0),'0');

const draft={version:1,createdAt:Date.now(),ownerId:null,session:{assessment_id:'id',session_token:'token'},answers:{RC01:'A'},index:0};
d.writeDraft(draft);
assert.equal(d.readDraft('user').session.assessment_id,'id');
d.writeDraft({...draft,ownerId:'alice'});
assert.equal(d.readDraft('bob'),null);
d.writeDraft({...draft,createdAt:Date.now()-25*3600000});
assert.equal(d.readDraft(null),null);
assert.equal(data.size,0);
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

const supabaseSource=readFileSync(new URL('../lib/supabase.ts',import.meta.url),'utf8');
assert.match(supabaseSource,/flowType:\s*["']implicit["']/);
assert.match(supabaseSource,/detectSessionInUrl:\s*true/);
assert.match(supabaseSource,/persistSession:\s*true/);
assert.match(supabaseSource,/autoRefreshToken:\s*true/);

const profileSource=readFileSync(new URL('../app/profile/page.tsx',import.meta.url),'utf8');
assert.match(profileSource,/history\.replaceState\(history\.state,''\s*,\s*url\.pathname\+url\.search\)/);
assert.match(profileSource,/access_token/);
assert.match(profileSource,/refresh_token/);

const assessmentSource=readFileSync(new URL('../app/dna/assessment/page.tsx',import.meta.url),'utf8');
assert.match(assessmentSource,/COGNITIVE_V1_10/);
assert.match(assessmentSource,/draft\.session\.anonymous_code/);
assert.match(assessmentSource,/Research code:/);

console.log('PASS assessment envelope, scale options, missing versus zero score, guest recovery/isolation, narrow questionnaire DTO, explicit Magic Link callback hygiene, and cognitive research-code continuity');
