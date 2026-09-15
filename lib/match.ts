import type {MatchItem,MatchPayload} from './dna';

export function finiteSignal(value:unknown):number|null {
  if((typeof value!=='number'&&typeof value!=='string')||(typeof value==='string'&&!value.trim()))return null;
  const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=100?n:null;
}
export function matchRows(payload?:MatchPayload|null):MatchItem[]{
  if(!payload)return [];
  const rows=payload.results||[...(payload.top_matches||[]),...(payload.alternatives||[]),...(payload.consider||[]),...(payload.mismatch||[])];
  const seen=new Set<string>();
  return rows.filter(row=>{const key=row.investment_id||row.symbol;if(seen.has(key))return false;seen.add(key);return true;});
}
export function eligibleMatches(payload?:MatchPayload|null):MatchItem[]{
  // Only the guarded model's explicit eligibility can create a featured match.
  return matchRows(payload).filter(row=>row.eligibility==='eligible'&&finiteSignal(row.match_score)!==null)
    .sort((a,b)=>(b.match_score??0)-(a.match_score??0)||a.symbol.localeCompare(b.symbol));
}
export function displayMatchScore(row:MatchItem):string {
  const n=finiteSignal(row.match_score);
  return n===null||row.eligibility==='review_required'?'—':Math.round(n).toString();
}
export function matchWatchouts(row:MatchItem):string[]{return row.explanation?.watchouts||row.watchouts||[];}
export function matchStrengths(row:MatchItem):string[]{return row.explanation?.strengths||row.strengths||[];}
export function matchStatus(payload?:MatchPayload|null):{title:string;body:string}{
  switch(payload?.status){
    case 'review_required':return {title:'Review these needs first',body:'Your answers identify a financial or withdrawal constraint. No funds are featured as suitable matches for this money.'};
    case 'context_required':return {title:'Complete the context for this money',body:'Your DNA is ready. Add your goal, first withdrawal date and capital needs before using a fund ranking.'};
    case 'no_suitable_options':return {title:'No suitable options in this collection',body:'None of the available funds meets the current fit limits. The closest fund is not necessarily suitable.'};
    default:return {title:'Your closest matches',body:'Compare the eligible options and their trade-offs. These research signals are not recommendations to buy.'};
  }
}
