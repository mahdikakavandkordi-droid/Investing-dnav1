/**
 * Client-side Investing DNA contracts and guest recovery state.
 *
 * This module owns:
 * - public questionnaire/result/Match TypeScript contracts used by the browser;
 * - in-progress guest draft recovery;
 * - the short-lived claim ticket used after a completed guest assessment.
 *
 * It intentionally does NOT calculate canonical Investor DNA or DNA Match
 * scores. Those remain server/database responsibilities.
 * See `docs/ARCHITECTURE.md` and `docs/ASSESSMENT-METHODOLOGY.md`.
 */

// ---------------------------------------------------------------------------
// Public assessment / result contracts
// ---------------------------------------------------------------------------

/**
 * Narrow browser-facing questionnaire DTO.
 *
 * Internal scoring metadata (`weight`, construct configuration, model/version
 * fields and non-selected localized copy) stays server-side. Keep this type in
 * lock-step with the Edge Function questionnaire response and `tests/contracts.mjs`.
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
  };
  strengths?: string[];
  watchouts?: string[];
};

/**
 * Canonical Match response consumed by the browser.
 * `match_score` can legitimately be null when a review/safety gate applies.
 */
export type MatchPayload = {
  model_version?: string;
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
};

// ---------------------------------------------------------------------------
// Guest recovery / claim state
// ---------------------------------------------------------------------------

export type Draft = {
  version: 1;
  createdAt: number;
  ownerId: string|null;
  session: AssessmentSession;
  answers: Record<string,string>;
  index: number;
  result?: Submission;
};

export type ClaimTicket = {
  version: 1;
  createdAt: number;
  session: AssessmentSession;
};

export const DRAFT_KEY = "investing-dna:draft:v2";
const LEGACY_DRAFT_KEY = "investing-dna:draft:v1";
const CLAIM_KEY = "investing-dna:claim:v1";
const MAX_AGE = 24 * 60 * 60 * 1000;

// Memory remains available when browser storage is blocked and also holds the
// completed one-time guest result for the current page/session experience.
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

export function clearClaimTicket(){
  try{localStorage.removeItem(CLAIM_KEY);}catch{}
}

export function clearDraft(){
  memory=null;
  removeStoredDraft();
  clearClaimTicket();
}

/** Return a valid, unexpired post-completion claim ticket if one exists. */
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
    return ticket;
  }catch{
    clearClaimTicket();
    return null;
  }
}

/**
 * Restore an in-progress draft owned by the current account/guest context.
 * A draft owned by another signed-in user is deliberately ignored.
 */
export function readDraft(ownerId:string|null):Draft|null {
  let d:Draft|null=memory;
  if(!d){
    try{
      const raw=localStorage.getItem(DRAFT_KEY);
      if(raw)d=JSON.parse(raw);
    }catch{
      // Memory fallback keeps the assessment usable when storage is blocked.
    }
  }

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

  memory=d;
  return d;
}

/** Persist an in-progress draft when storage is available. */
export function writeDraft(d:Draft):boolean {
  memory=d;
  try{
    localStorage.setItem(DRAFT_KEY,JSON.stringify(d));
    localStorage.removeItem(LEGACY_DRAFT_KEY);
    return true;
  }catch{
    return false;
  }
}

/**
 * Completed guest reports are not persisted as a full localStorage draft.
 * Keep only the limited claim ticket required to attach the assessment after
 * optional magic-link authentication.
 */
export function writeEphemeralResult(d:Draft):boolean {
  memory=d;
  let ok=true;
  try{
    removeStoredDraft();
    if(d.result?.account_linked){
      localStorage.removeItem(CLAIM_KEY);
    }else{
      localStorage.setItem(CLAIM_KEY,JSON.stringify({
        version:1,
        createdAt:Date.now(),
        session:d.session
      } satisfies ClaimTicket));
    }
  }catch{
    ok=false;
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Small deterministic presentation / transport helpers
// ---------------------------------------------------------------------------

export function answerRows(answers:Record<string,string>){
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
