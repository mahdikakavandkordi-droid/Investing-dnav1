import {rpc} from '@/lib/supabase';
import type {Investment} from '@/lib/types';

/**
 * Generic cross-asset browser read/write adapter.
 *
 * Use this module for Explore, generic Detail, Compare and asset-neutral
 * Watchlist operations. ETF-only facts/holdings/Match compatibility remain in
 * `lib/investments.ts`.
 *
 * The field groups mirror the generic research read model exposed by
 * `app_search_instruments`, `app_get_instrument` and
 * `app_compare_instruments`. See `docs/ARCHITECTURE.md` and
 * `docs/DATABASE-AND-API.md`.
 */
export type DepositTermOption={
 option_key:string;
 term_months:number;
 annual_rate_pct:number|null;
 rate_type:string;
 rate_basis?:string|null;
 minimum_deposit?:number|null;
 account_scope?:string|null;
 registered_account_eligibility?:string[]|null;
 redeemability:string;
 interest_payment_frequency?:string|null;
 special_terms?:string|null;
 is_featured?:boolean|null;
 source_name:string;
 source_url:string;
 as_of_date:string;
};

export type Instrument=Investment&{
 // Identity / generic research fields.
 legal_name?:string|null;
 display_name?:string|null;
 subcategory?:string|null;
 strategy?:string|null;
 sector?:string|null;
 region?:string|null;
 country_code?:string|null;
 currency?:string|null;
 exchange?:string|null;
 description?:string|null;
 inception_date?:string|null;
 is_featured?:boolean|null;
 data_status?:string|null;
 issuer_name?:string|null;
 issuer_website?:string|null;
 metrics_as_of_date?:string|null;
 daily_change_pct?:number|null;
 return_1m_pct?:number|null;
 return_3m_pct?:number|null;
 distribution_frequency?:string|null;
 volume?:number|null;
 data_quality_status?:string|null;
 data_quality_score?:number|null;
 profile_objective?:string|null;
 profile_benchmark?:string|null;
 profile_methodology?:string|null;
 profile_portfolio_construction?:string|null;
 profile_target_allocation?:Record<string,number>|null;
 profile_geographic_exposure?:string|null;
 profile_currency_hedging?:string|null;
 profile_distribution_policy?:string|null;
 profile_management_style?:string|null;
 profile_replication_method?:string|null;
 profile_ideal_for?:string|null;
 profile_key_risks?:string[]|null;
 profile_model_version?:string|null;

 // Latest market-price layer. These values come from audited price history,
 // not the slower research-metrics snapshot.
 market_price_date?:string|null;
 market_price_source_key?:string|null;
 market_price_source_name?:string|null;
 market_price_ingested_at?:string|null;

 // Shared cross-asset Investment DNA structure layer.
 structure_model_version?:string|null;
 capital_protection?:string|null;
 liquidity_level?:string|null;
 price_volatility?:string|null;
 income_predictability?:string|null;
 growth_participation?:string|null;
 interest_rate_sensitivity?:string|null;
 credit_exposure?:string|null;
 diversification_level?:string|null;
 complexity_level?:string|null;
 time_structure?:string|null;
 principal_protection_basis?:string|null;
 structure_as_of_date?:string|null;

 // Fixed-income / money-market fields. Null for unrelated asset classes.
 instrument_subtype?:string|null;
 coupon_pct?:number|null;
 yield_to_maturity_pct?:number|null;
 issue_date?:string|null;
 maturity_date?:string|null;
 remaining_term_months?:number|null;
 duration_years?:number|null;
 face_value?:number|null;
 credit_rating?:string|null;
 credit_rating_agency?:string|null;
 discount_instrument?:boolean|null;
 market_access_note?:string|null;
 fixed_income_source_name?:string|null;
 fixed_income_source_url?:string|null;
 fixed_income_as_of_date?:string|null;

 // Mutual-fund series / dealing terms. Null for unrelated asset classes.
 series_name?:string|null;
 fund_code?:string|null;
 cifsc_category?:string|null;
 load_structure?:string|null;
 sales_status?:string|null;
 minimum_initial_investment?:number|null;
 minimum_additional_investment?:number|null;
 mf_income_distribution_frequency?:string|null;
 capital_gains_distribution_frequency?:string|null;
 mutual_fund_source_name?:string|null;
 mutual_fund_source_url?:string|null;
 mutual_fund_as_of_date?:string|null;

 // GIC/deposit fields. Null for unrelated asset classes.
 deposit_rate_pct?:number|null;
 term_months?:number|null;
 redeemability?:string|null;
 minimum_deposit?:number|null;
 interest_payment_frequency?:string|null;
 registered_account_eligibility?:string[]|null;
 deposit_insurance_scheme?:string|null;
 deposit_insurance_eligible?:boolean|null;
 lockup_note?:string|null;
 deposit_source_name?:string|null;
 deposit_source_url?:string|null;
 deposit_as_of_date?:string|null;
 deposit_term_options?:DepositTermOption[]|null;
};

export type SavedInstrument={
 investment_id:string;
 symbol:string;
 name:string;
 display_name?:string|null;
 note?:string;
 created_at?:string;
};

export type MarketDataStatus={
 investment_id:string;
 latest_price:number|null;
 previous_price:number|null;
 daily_change_pct:number|null;
 volume:number|null;
 currency:string|null;
 price_date:string|null;
 source_key:string|null;
 source_name:string|null;
 ingested_at:string|null;
};

export async function marketDataStatus(ids:string[]){
 const unique=[...new Set(ids.filter(Boolean))];
 if(unique.length===0)return [] as MarketDataStatus[];
 return rpc<MarketDataStatus[]>('app_market_data_status',{p_investment_ids:unique});
}

function mergeMarketData(items:Instrument[],statuses:MarketDataStatus[]){
 if(statuses.length===0)return items;
 const byId=new Map(statuses.map(status=>[status.investment_id,status]));
 return items.map(item=>{
  const status=byId.get(item.id);
  if(!status)return item;
  return {
   ...item,
   price:status.latest_price??item.price,
   daily_change_pct:status.daily_change_pct??item.daily_change_pct,
   volume:status.volume??item.volume,
   currency:status.currency??item.currency,
   market_price_date:status.price_date,
   market_price_source_key:status.source_key,
   market_price_source_name:status.source_name,
   market_price_ingested_at:status.ingested_at,
  };
 });
}

/** Search the public cross-asset research universe. */
export async function searchInstruments(args:{assetType?:string|null;search?:string|null;limit?:number}={}){
 const items=await rpc<Instrument[]>('app_search_instruments',{
  p_asset_type:args.assetType??null,
  p_search:args.search??null,
  p_limit:args.limit??100,
 });
 const statuses=await marketDataStatus(items.map(item=>item.id)).catch(()=>[]);
 return mergeMarketData(items,statuses);
}

export async function getInstrument(id:string){
 const item=await rpc<Instrument|null>('app_get_instrument',{p_investment_id:id});
 if(!item)return null;
 const statuses=await marketDataStatus([item.id]).catch(()=>[]);
 return mergeMarketData([item],statuses)[0]??item;
}

export async function compareInstruments(ids:string[]){
 const items=await rpc<Instrument[]>('app_compare_instruments',{p_investment_ids:ids});
 const statuses=await marketDataStatus(items.map(item=>item.id)).catch(()=>[]);
 return mergeMarketData(items,statuses);
}

/** Account-scoped Watchlist adapter; storage is instrument-neutral. */
export function instrumentWatchlist(){
 return rpc<{items:SavedInstrument[]}>('app_watchlist',{p_action:'list'});
}

export function saveInstrument(id:string){
 return rpc<{item?:{investment_id:string}}>('app_watchlist',{p_action:'add',p_investment_id:id});
}

export function removeInstrument(id:string){
 return rpc<{removed:boolean}>('app_watchlist',{p_action:'remove',p_investment_id:id});
}


/** User-facing descriptive name; official product name remains on `name`. */
export function instrumentDisplayName(item:Pick<Instrument,'name'|'display_name'>){
 const friendly=item.display_name?.trim();
 return friendly||item.name;
}

export function hasFriendlyDisplayName(item:Pick<Instrument,'name'|'display_name'>){
 const friendly=item.display_name?.trim();
 return !!friendly&&friendly!==item.name;
}


export function depositTermOptions(item:Pick<Instrument,'deposit_term_options'>){
 return Array.isArray(item.deposit_term_options)?item.deposit_term_options:[];
}

export function gicTermRange(item:Pick<Instrument,'deposit_term_options'|'term_months'>){
 const terms=depositTermOptions(item).map(option=>option.term_months).filter(Number.isFinite).sort((a,b)=>a-b);
 if(!terms.length&&item.term_months)return formatTerm(item.term_months);
 if(!terms.length)return null;
 const min=terms[0],max=terms[terms.length-1];
 return min===max?formatTerm(min):`${formatTerm(min)}–${formatTerm(max)}`;
}

export function gicRateRange(item:Pick<Instrument,'deposit_term_options'|'deposit_rate_pct'>){
 const rates=depositTermOptions(item).map(option=>option.annual_rate_pct).filter((value):value is number=>typeof value==='number'&&Number.isFinite(value)).sort((a,b)=>a-b);
 if(!rates.length&&typeof item.deposit_rate_pct==='number')return formatRate(item.deposit_rate_pct);
 if(!rates.length)return null;
 const min=rates[0],max=rates[rates.length-1];
 return Math.abs(max-min)<0.0001?formatRate(min):`${formatRate(min)}–${formatRate(max)}`;
}

function formatTerm(months:number){
 if(months%12===0)return `${months/12} ${months===12?'year':'years'}`;
 return months<12?`${months} months`:`${months/12} years`;
}
function formatRate(value:number){
 return new Intl.NumberFormat('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+'%';
}
