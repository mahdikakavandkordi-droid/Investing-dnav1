import {humanize} from '@/lib/dna';

/**
 * Pure presentation metadata/helpers for the Investor DNA report.
 *
 * These functions translate already-computed DNA values into display labels and
 * narrative snippets. They are NOT scoring logic and must never be used by the
 * canonical assessment/Match engine.
 */
export const ARCHETYPES:Record<string,{title:string;tagline:string}>={
 VAULT:{title:'Protect today. Compound tomorrow.',tagline:'Protection comes first, and your current financial capacity also calls for caution.'},
 ANCHOR:{title:'Stay steady. Build with balance.',tagline:'You prefer a steadier path, with room for measured investment risk.'},
 COOLHAND:{title:'Calm mind. Steady progress.',tagline:'Your finances can absorb more risk than you naturally prefer to take.'},
 SCOUT:{title:'Look ahead. Find opportunities.',tagline:'You are open to some risk, while your current financial capacity calls for restraint.'},
 MAVERICK:{title:'Your path. Your perspective.',tagline:'Your comfort with risk and financial capacity are broadly balanced.'},
 STRIKER:{title:'Turn insight into action.',tagline:'You are comfortable with meaningful risk and currently have more room to absorb it.'},
 HOTSHOT:{title:'Embrace the ride. Go further.',tagline:'Your willingness to take risk is higher than the financial room you currently have to absorb losses.'},
 HIGHROLLER:{title:'Explore more. Navigate with purpose.',tagline:'You are comfortable taking significant risk with moderate financial capacity behind it.'},
 JACKPOT:{title:"Challenge more. Shape what's next.",tagline:'Both your willingness and your current capacity for investment risk are relatively high.'}
};

/**
 * Friendly display names. Canonical backend archetype keys remain unchanged so
 * assessment/scoring contracts and historical data do not need a migration.
 */
export const ARCHETYPE_DISPLAY_NAMES:Record<string,string>={
 VAULT:'VAULT',
 ANCHOR:'ANCHOR',
 COOLHAND:'COOLHAND',
 SCOUT:'SCOUT',
 MAVERICK:'MAVERICK',
 STRIKER:'STRIKER',
 HOTSHOT:'CHARGER',
 HIGHROLLER:'PATHFINDER',
 JACKPOT:'VANGUARD'
};

export function displayArchetype(value?:string|null){
 const key=(value||'MAVERICK').toUpperCase();
 return ARCHETYPE_DISPLAY_NAMES[key]||key;
}

export const BEHAVIOR:Record<string,{label:string;help:string;high:string;mid:string;low:string}>={
 decision_independence:{label:'Decision independence',help:'How much you separate other people’s excitement from your own decision.',high:'Independent',mid:'Mixed',low:'More socially influenced'},
 long_term_orientation:{label:'Long-term orientation',help:'How well you keep recent performance in perspective.',high:'Long-term focused',mid:'Mixed',low:'More performance-sensitive'},
 reference_flexibility:{label:'Reference flexibility',help:'How easily you look past the price you paid and reassess from today.',high:'Flexible',mid:'Mixed',low:'More anchored to past prices'},
 evidence_discipline:{label:'Evidence discipline',help:'How willing you are to test your view against new evidence.',high:'Evidence-led',mid:'Mixed',low:'More conviction-led'},
 emotional_decision_control:{label:'Emotional decision control',help:'How well you keep stress and regret from taking over the decision.',high:'Composed',mid:'Mixed',low:'More emotion-sensitive'}
};

export const RISK_MATRIX=[
 ['COOLHAND','STRIKER','JACKPOT'],
 ['ANCHOR','MAVERICK','HIGHROLLER'],
 ['VAULT','SCOUT','HOTSHOT']
];

export function riskBand(value:unknown){
 const score=typeof value==='number'?value:NaN;
 if(!Number.isFinite(score))return 'Not available';
 if(score<40)return 'Lower';
 if(score<70)return 'Moderate';
 return 'Higher';
}

export function behaviorBand(key:string,value:unknown){
 const score=typeof value==='number'?value:NaN;
 const meta=BEHAVIOR[key];
 if(!meta||!Number.isFinite(score))return 'Not available';
 if(score>=70)return meta.high;
 if(score>=45)return meta.mid;
 return meta.low;
}

export function riskRelationship(tolerance:unknown,capacity:unknown){
 const riskTolerance=typeof tolerance==='number'?tolerance:NaN;
 const riskCapacity=typeof capacity==='number'?capacity:NaN;
 if(!Number.isFinite(riskTolerance)||!Number.isFinite(riskCapacity))return '';

 const difference=riskCapacity-riskTolerance;
 if(difference>=15){
  return 'Your finances can absorb more risk than you naturally feel comfortable taking.';
 }
 if(difference<=-15){
  return 'Your willingness to take risk is running ahead of the financial room you currently have to absorb losses.';
 }
 return 'Your comfort with risk and your financial capacity are reasonably close to one another.';
}

export function formatInvestmentContext(key:string,value:unknown){
 if(value===null||value===undefined||value==='')return 'Not provided';
 const maps:Record<string,Record<string,string>>={
  goal:{
   growth:'Long-term growth',
   retirement:'Retirement',
   house_purchase:'Home purchase',
   major_purchase:'Major purchase',
   education:'Education',
   income:'Regular investment income',
   wealth_preservation:'Wealth preservation',
   preservation:'Wealth preservation',
   emergency_reserve:'Emergency reserve / protect near-term money'
  },
  time_horizon:{
   under_2:'Under 2 years',
   lt_1y:'Less than 1 year',
   '1_3y':'1–3 years',
   '2_5':'2–5 years',
   '3_5y':'3–5 years',
   '5_10':'5–10 years',
   '5_10y':'5–10 years',
   '10_plus':'More than 10 years',
   gt_10y:'More than 10 years'
  },
  liquidity_need:{
   very_high:'Very high — immediate access matters',
   high:'High — easy access matters',
   medium:'Medium — some access matters',
   low:'Low — can stay invested'
  },
  principal_required:{
   yes:'Yes — full amount must be protected',
   no:'No — market loss can be accepted at that time',
   unsure:'Not sure yet'
  }
 };
 return maps[key]?.[String(value)]||humanize(String(value));
}

export function standoutDecision(behavioral:Record<string,number>){
 const candidates=[
  {key:'decision_independence',low:'More socially responsive',high:'Independent-minded',lowText:'Other people’s excitement can pull your attention toward an investment before your own review is finished.',highText:'You tend to separate other people’s enthusiasm from your own investment decision.'},
  {key:'long_term_orientation',low:'Performance-sensitive',high:'Long-term focused',lowText:'Recent winners and laggards can change how attractive an investment feels to you.',highText:'You tend to keep recent performance in perspective and stay focused on the longer-term case.'},
  {key:'reference_flexibility',low:'Reference-sensitive',high:'Forward-looking',lowText:'The price you paid can remain influential when you decide what to do next.',highText:'You tend to reassess investments from today forward rather than staying anchored to the original purchase price.'},
  {key:'evidence_discipline',low:'Conviction-led',high:'Evidence-led',lowText:'Once you like an idea, changing your view can take stronger evidence.',highText:'You are relatively willing to test a favored idea against new or conflicting evidence.'}
 ];

 const ranked=candidates
  .map(candidate=>({...candidate,value:Number(behavioral[candidate.key])}))
  .filter(candidate=>Number.isFinite(candidate.value))
  .sort((a,b)=>Math.abs(b.value-50)-Math.abs(a.value-50));

 const top=ranked[0];
 if(!top||Math.abs(top.value-50)<15){
  return {label:'Balanced',text:'No single decision tendency dominates strongly. You appear to use a mix of your own criteria, evidence and experience.'};
 }
 return top.value<50
  ? {label:top.low,text:top.lowText}
  : {label:top.high,text:top.highText};
}

export function pressureInsight(value:unknown){
 const score=typeof value==='number'?value:NaN;
 if(!Number.isFinite(score)){
  return {label:'Not enough data',text:'We do not have enough information yet to describe how market pressure may affect your decisions.'};
 }
 if(score>=70){
  return {label:'Composed',text:'Sharp market moves are less likely to pull you away from a plan you chose while calm.'};
 }
 if(score<40){
  return {label:'More emotion-sensitive',text:'Sharp market moves or regret may create a stronger urge to change course sooner than you intended.'};
 }
 return {label:'Measured',text:'Market stress may affect you at times, but it does not appear to dominate your decision process.'};
}
