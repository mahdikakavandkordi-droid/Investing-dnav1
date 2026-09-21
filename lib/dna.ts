/**
 * Client-side Investing DNA contracts and guest recovery state.
 *
 * Canonical scoring stays server-side. The browser owns only rendering,
 * recovery, short-lived guest continuity and optional report personalization.
 */

export type Question = {
  question_id: string;
  prompt: string;
  question_type: string;
  section?: string;
  options: {value:string|number;label?:string;text?:string}[];
};

export type ExperienceProfile = {
  role?: string;
  overall_score?: number;
  dimensions?: Record<string,number>;
};

export type QualityPair = {
  construct?: string;
  q1?: string;
  q2?: string;
  score1?: number;
  score2?: number;
  difference?: number;
  status?: "aligned"|"mixed"|"conflict"|string;
  clarifier_id?: string;
};

export type QualityProfile = {
  supported?: boolean;
  heuristic_version?: string;
  pair_count?: number;
  mixed_count?: number;
  conflict_count?: number;
  consistency_score?: number;
  consistency_label?: "high"|"moderate"|"low"|"not_available"|string;
  clarification_recommended?: boolean;
  clarifier_ids?: string[];
  pairs?: QualityPair[];
  note?: string;
};

export type NarrativeProfile = {
  archetype?: string;
  archetype_name?: string;
  character?: string;
  summary?: string;
  how_you_think?: string;
  pressure_style?: string;
  strength?: string;
  blind_spot?: string;
  decision_influence?: string;
  methodology_note?: string|null;
};

export type PersonalizationProfile = {
  first_name?: string;
  age?: number;
  last_name?: string|null;
  phone?: string|null;
};

export type InvestmentContextProfile = {
  first_name?: string|null;
  age?: number|null;
  amount_to_invest?: number|null;
  amount_currency?: string|null;
  goal?: string|null;
  time_horizon?: string|null;
  horizon_months?: number|null;
  liquidity_need?: string|null;
  principal_required?: string|null;
  investment_share?: string|null;
};

export type MatchVersions = {
  questionnaire?: string|null;
  investor_dna?: string|null;
  scoring?: string|null;
  match?: string|null;
  fund_data?: string|null;
};

export type GoalFitExplanation = {
  model_version?: string;
  score?: number|null;
  components?: Record<string,number>;
  summary?: string;
};

export type MatchItem = {
  investment_id?: string;
  symbol: string;
  name?: string;
  match_score: number|null;
  eligibility?: string;
  gate_codes?: string[];
  fit_label?: string;
  recommendation_tier?: string;
  risk_band?: string;
  explanation?: {
    summary?: string;
    fit_label?: string;
    why_it_fits?: string[];
    strengths?: string[];
    watchouts?: string[];
    scores?: Record<string,number|null>;
    goal_fit?: GoalFitExplanation|null;
  };
  strengths?: string[];
  watchouts?: string[];
};

export type MatchPayload = {
  model_version?: string;
  goal_model_version?: string;
  context_only_score_policy?: "hidden_until_context_complete"|string;
  run_id?: string;
  status?: "review_required"|"context_required"|"no_suitable_options"|"available"|string;
  confidence?: string;
  data_version?: string;
  data_as_of?: string|null;
  versions?: MatchVersions;
  universe_count?: number;
  eligible_count?: number;
  constraints?: Record<string,unknown>;
  results?: MatchItem[];
  top_matches?: MatchItem[];
  alternatives?: MatchItem[];
  consider?: MatchItem[];
  mismatch?: MatchItem[];
};

export type AssessmentDimensionSection = {
  answer_count?: number;
  overall_score?: number|null;
  raw_score?: number|null;
  dimensions?: Record<string,number>;
  guard?: Record<string,unknown>;
  decision_experience?: string|null;
  downturn_experience?: string|null;
  owned_products?: string[];
  role?: string;
};

export type AssessmentDimensions = {
  question_count?: number;
  questionnaire_version?: string;
  risk_tolerance?: AssessmentDimensionSection;
  behavioral_dna?: AssessmentDimensionSection;
  risk_capacity?: AssessmentDimensionSection;
  investment_experience?: AssessmentDimensionSection;
};

export type DNA = {
  archetype?: string;
  risk_tolerance?: number;
  risk_capacity?: number;
  model_version?: string;
  dna_model_version?: string;
  completed_at?: string;
  calibration_status?: string;
  behavioral_profile?: Record<string,number>;
  experience_profile?: ExperienceProfile;
  assessment_dimensions?: AssessmentDimensions;
  quality_profile?: QualityProfile;
  decision_style?: string;
  pressure_style?: string;
  strengths?: unknown;
  watchouts?: unknown;
  methodology_note?: string|null;
  narrative?: NarrativeProfile;
  investment_context?: InvestmentContextProfile|null;
};

export type Submission = {
  result: DNA;
  account_linked?: boolean;
  quality?: QualityProfile;
  report?: {report?:DNA};
  match?: MatchPayload;
  fingerprint?: {
    decision_style?: string;
    pressure_style?: string;
    strengths?: unknown;
    watchouts?: unknown;
    trait_scores?: Record<string,number>;
  };
};

export type AppState = {
  has_profile: boolean;
  assessment_id?: string;
  dna: DNA|null;
  report: DNA|null;
  matches?: MatchPayload;
};

export type AssessmentSession = {
  assessment_id: string;
  session_token: string;
  account_linked?: boolean;
  language_code?: 'en'|'fr'|'fa';
  anonymous_code?: string;
};

export type AnswerValue = string|string[];

export type Draft = {
  version: 1;
  createdAt: number;
  ownerId: string|null;
  session: AssessmentSession;
  answers: Record<string,AnswerValue>;
  index: number;
  personalization?: PersonalizationProfile;
  result?: Submission;
};

export type ClaimTicket = {
  version: 1;
  createdAt: number;
  session: AssessmentSession;
  personalization?: PersonalizationProfile;
};

export const DRAFT_KEY = "investing-dna:draft:v2";
export const EPHEMERAL_RESULT_KEY = "investing-dna:result:v1";
const LEGACY_DRAFT_KEY = "investing-dna:draft:v1";
const CLAIM_KEY = "investing-dna:claim:v1";
const MAX_AGE = 24 * 60 * 60 * 1000;
let memory: Draft|null = null;

function validAge(createdAt:number){
  return Number.isFinite(createdAt) && createdAt<=Date.now() && Date.now()-createdAt<=MAX_AGE;
}

function removeStoredDraft(){
  try{
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  }catch{}
}

function removeEphemeralResult(){
  try{sessionStorage.removeItem(EPHEMERAL_RESULT_KEY);}catch{}
}

function readEphemeralResult():Draft|null{
  try{
    const raw=sessionStorage.getItem(EPHEMERAL_RESULT_KEY);
    return raw?JSON.parse(raw) as Draft:null;
  }catch{
    return null;
  }
}

export function normalizePersonalization(value:unknown):PersonalizationProfile|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const input=value as Record<string,unknown>;
  const firstName=typeof input.first_name==='string'?input.first_name.trim().slice(0,60):'';
  const age=typeof input.age==='number'?input.age:Number(input.age);
  const validAge=Number.isInteger(age)&&age>=18&&age<=100;
  if(!firstName&&!validAge)return null;
  const lastName=typeof input.last_name==='string'?input.last_name.trim().slice(0,80):'';
  const phone=typeof input.phone==='string'?input.phone.trim().slice(0,40):'';
  return {
    ...(firstName?{first_name:firstName}:{}),
    ...(validAge?{age}:{}),
    ...(lastName?{last_name:lastName}:{}),
    ...(phone?{phone}:{}),
  };
}

export function hasCompleteInvestmentContext(context?:InvestmentContextProfile|null):boolean{
  return !!(
    context?.goal &&
    context?.time_horizon &&
    context?.liquidity_need &&
    context?.principal_required
  );
}

export function clearClaimTicket(){
  try{localStorage.removeItem(CLAIM_KEY);}catch{}
}

export function clearDraft(){
  memory=null;
  removeStoredDraft();
  removeEphemeralResult();
  clearClaimTicket();
}

export function readClaimTicket():ClaimTicket|null {
  try{
    const raw=localStorage.getItem(CLAIM_KEY);
    if(!raw)return null;
    const ticket=JSON.parse(raw) as ClaimTicket;
    if(
      ticket?.version!==1 ||
      !validAge(ticket.createdAt) ||
      !ticket.session?.assessment_id ||
      !ticket.session?.session_token
    ){
      clearClaimTicket();
      return null;
    }
    const personalization=normalizePersonalization(ticket.personalization);
    return personalization?{...ticket,personalization}:{...ticket,personalization:undefined};
  }catch{
    clearClaimTicket();
    return null;
  }
}

export function writeClaimPersonalization(value:PersonalizationProfile):boolean{
  const personalization=normalizePersonalization(value);
  if(!personalization)return false;
  try{
    const ticket=readClaimTicket();
    if(!ticket)return false;
    localStorage.setItem(CLAIM_KEY,JSON.stringify({...ticket,personalization}));
    return true;
  }catch{
    return false;
  }
}

export function readDraft(ownerId:string|null):Draft|null {
  let d:Draft|null=memory;
  if(!d){
    try{
      const raw=localStorage.getItem(DRAFT_KEY);
      if(raw)d=JSON.parse(raw);
    }catch{}
  }
  if(!d)d=readEphemeralResult();

  try{localStorage.removeItem(LEGACY_DRAFT_KEY);}catch{}
  if(!d)return null;

  const invalid =
    d.version!==1 ||
    !validAge(d.createdAt) ||
    !d.session?.assessment_id ||
    !d.session?.session_token ||
    !d.answers ||
    typeof d.answers!=="object" ||
    !Number.isInteger(d.index) ||
    d.index<0;

  if(invalid){
    clearDraft();
    return null;
  }
  if(d.ownerId && d.ownerId!==ownerId)return null;

  const personalization=normalizePersonalization(d.personalization);
  memory=personalization?{...d,personalization}:{...d,personalization:undefined};
  return memory;
}

export function writeDraft(d:Draft):boolean {
  memory=d;
  removeEphemeralResult();
  try{
    localStorage.setItem(DRAFT_KEY,JSON.stringify(d));
    localStorage.removeItem(LEGACY_DRAFT_KEY);
    return true;
  }catch{
    return false;
  }
}

export function writeEphemeralResult(d:Draft):boolean {
  const ephemeral:Draft={
    ...d,
    createdAt:Date.now(),
    answers:{},
    index:0,
  };
  memory=ephemeral;
  let ok=true;
  removeStoredDraft();
  try{
    if(d.result?.account_linked){
      removeEphemeralResult();
      localStorage.removeItem(CLAIM_KEY);
    }else{
      sessionStorage.setItem(EPHEMERAL_RESULT_KEY,JSON.stringify(ephemeral));
      localStorage.setItem(CLAIM_KEY,JSON.stringify({
        version:1,
        createdAt:Date.now(),
        session:d.session,
        personalization:normalizePersonalization(d.personalization)||undefined,
      } satisfies ClaimTicket));
    }
  }catch{
    ok=false;
  }
  return ok;
}

export function answerRows(answers:Record<string,AnswerValue>){
  return Object.entries(answers).map(([question_id,value])=>({
    question_id,
    answer_value:{value}
  }));
}

export function score(value:unknown):string {
  return (typeof value==='number' && Number.isFinite(value)) ? value.toFixed(0) : "—";
}

export function optionsFor(q:Question){
  if(q.question_type==='scale'){
    return Array.from({length:11},(_,value)=>({value:String(value),label:String(value)}));
  }
  return Array.isArray(q.options)
    ? q.options.map(o=>({value:String(o.value),label:o.label||o.text||String(o.value)}))
    : [];
}

export function sectionLabel(section?:string):string {
  if(section==='risk_tolerance')return 'Risk tolerance';
  if(section==='behavioral_dna')return 'Behavioral DNA';
  if(section==='risk_capacity')return 'Financial capacity';
  if(section==='investment_experience')return 'Investment experience';
  return 'Investor DNA';
}

export function humanize(key:string):string {
  return key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}
