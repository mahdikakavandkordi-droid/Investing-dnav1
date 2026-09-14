export type Question = {question_id:string;prompt:string;question_type:string;options:{value:string|number;label?:string;text?:string}[]};
export type DNA = {archetype?:string;risk_tolerance?:number;risk_capacity?:number;model_version?:string;dna_model_version?:string;completed_at?:string;behavioral_profile?:Record<string,number>;strengths?:unknown;watchouts?:unknown};
export type Submission = {result:DNA;account_linked?:boolean;report?:{report?:DNA};fingerprint?:unknown};
export type AppState = {has_profile:boolean;assessment_id?:string;dna:DNA|null;report:DNA|null};
export type Draft = {version:1;createdAt:number;ownerId:string|null;session:{assessment_id:string;session_token:string;account_linked?:boolean};answers:Record<string,string>;index:number;result?:Submission};
export const DRAFT_KEY = "investing-dna:draft:v1";
const MAX_AGE = 24 * 60 * 60 * 1000;
let memory:Draft|null = null;
export function clearDraft() { memory=null; try { localStorage.removeItem(DRAFT_KEY); } catch {} }
export function readDraft(ownerId:string|null):Draft|null {
  let d:Draft|null=memory;
  try { const raw=localStorage.getItem(DRAFT_KEY); if(raw) d=JSON.parse(raw); } catch { /* use memory when storage is blocked */ }
  if(!d) return null;
  if(d.version!==1 || !Number.isFinite(d.createdAt) || Date.now()-d.createdAt>MAX_AGE || d.createdAt>Date.now() || !d.session?.assessment_id || !d.session?.session_token || !d.answers || typeof d.answers!=="object" || !Number.isInteger(d.index) || d.index<0) {clearDraft();return null;}
  if(d.ownerId && d.ownerId!==ownerId) return null;
  memory=d; return d;
}
export function writeDraft(d:Draft):boolean {
  memory=d;
  try {localStorage.setItem(DRAFT_KEY,JSON.stringify(d));return true;} catch {return false;}
}
export function answerRows(answers:Record<string,string>) {
  return Object.entries(answers).map(([question_id,value])=>({question_id,answer_value:{value}}));
}
export function score(value:unknown):string {
  return (typeof value==='number' && Number.isFinite(value)) ? value.toFixed(0) : "—";
}
export function optionsFor(q:Question) {
  if(q.question_type==='scale') return Array.from({length:11},(_,value)=>({value:String(value),label:String(value)}));
  return Array.isArray(q.options) ? q.options.map(o=>({value:String(o.value),label:o.label||o.text||String(o.value)})) : [];
}
