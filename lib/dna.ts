export type Question = {
  question_id:string;
  prompt:string;
  question_type:string;
  section?:string;
  construct?:string;
  construct_role?:string;
  options:{value:string|number;label?:string;text?:string}[];
};

export type ExperienceProfile = {
  role?:string;
  overall_score?:number;
  dimensions?:Record<string,number>;
};

export type QualityPair = {
  construct?:string;
  q1?:string;
  q2?:string;
  score1?:number;
  score2?:number;
  difference?:number;
  status?:"aligned"|"mixed"|"conflict"|string;
  clarifier_id?:string;
};

export type QualityProfile = {
  supported?:boolean;
  heuristic_version?:string;
  pair_count?:number;
  mixed_count?:number;
  conflict_count?:number;
  consistency_score?:number;
  consistency_label?:"high"|"moderate"|"low"|"not_available"|string;
  clarification_recommended?:boolean;
  clarifier_ids?:string[];
  pairs?:QualityPair[];
  note?:string;
};

export type DNA = {
  archetype?:string;
  risk_tolerance?:number;
  risk_capacity?:number;
  model_version?:string;
  dna_model_version?:string;
  completed_at?:string;
  calibration_status?:string;
  behavioral_profile?:Record<string,number>;
  experience_profile?:ExperienceProfile;
  quality_profile?:QualityProfile;
  decision_style?:string;
  pressure_style?:string;
  strengths?:unknown;
  watchouts?:unknown;
  methodology_note?:string|null;
};

export type Submission = {
  result:DNA;
  account_linked?:boolean;
  quality?:QualityProfile;
  report?:{report?:DNA};
  fingerprint?:{
    decision_style?:string;
    pressure_style?:string;
    strengths?:unknown;
    watchouts?:unknown;
    trait_scores?:Record<string,number>;
  };
};

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

export function sectionLabel(section?:string):string {
  if(section==='risk_tolerance') return 'Risk tolerance';
  if(section==='behavioral_dna') return 'Behavioral DNA';
  if(section==='risk_capacity') return 'Financial capacity';
  if(section==='investment_experience') return 'Investment experience';
  return 'Investor DNA';
}

export function humanize(key:string):string {
  return key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}
