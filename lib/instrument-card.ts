import type {Instrument} from './instruments';

/** Prefer the issuer-curated featured term; otherwise use the shortest term, never the highest rate. */
export function gicCardOption(item:Instrument){
 const options=(Array.isArray(item.deposit_term_options)?item.deposit_term_options:[]).filter(option=>Number.isFinite(option.term_months)&&option.term_months>0);
 const selected=[...options].sort((a,b)=>Number(!!b.is_featured)-Number(!!a.is_featured)||a.term_months-b.term_months||a.option_key.localeCompare(b.option_key))[0];
 if(selected)return {rate:selected.annual_rate_pct,term:selected.term_months,access:selected.redeemability,minimum:selected.minimum_deposit,date:selected.as_of_date,more:options.length>1};
 return {rate:item.deposit_rate_pct,term:item.term_months,access:item.redeemability,minimum:item.minimum_deposit,date:item.deposit_as_of_date,more:false};
}
