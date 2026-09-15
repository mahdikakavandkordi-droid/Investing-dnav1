import {rpc} from "@/lib/supabase";
import type {Investment} from "@/lib/types";
export type Fund = Investment & {currency?:string;description?:string;issuer_name?:string;profile_objective?:string;profile_benchmark?:string;profile_key_risks?:string[];profile_target_allocation?:Record<string,number>;profile_management_style?:string;profile_distribution_policy?:string;metrics_as_of_date?:string;profile_as_of_date?:string;data_status?:string};
export type InvestmentDna = {
 investment_id:string;symbol:string;name:string;asset_type?:string;category?:string;subcategory?:string;
 risk_band?:string;risk_score?:number;growth_score?:number;income_score?:number;stability_score?:number;diversification_score?:number;liquidity_score?:number;complexity_score?:number;
 official_risk_rating?:string;official_risk_band_min?:number;official_risk_band_max?:number;official_risk_issuer?:string;official_risk_source_type?:string;official_risk_source_title?:string;official_risk_source_url?:string;official_risk_source_date?:string;official_risk_effective_date?:string;official_risk_methodology?:string;official_risk_verification_note?:string;official_risk_verified_at?:string;
 minimum_horizon_months?:number;concentration_level?:string;geographic_scope?:string;currency_exposure?:string;equity_pct?:number;fixed_income_pct?:number;mer_pct?:number;
 style_class?:string;objective_class?:string;ideal_investor?:unknown;best_use_cases?:unknown;key_tradeoffs?:unknown;explanation?:unknown;data_quality_status?:string;data_quality_score?:number;as_of_date?:string;
};
export type WatchItem = {investment_id:string;symbol:string;name:string;note?:string;created_at?:string};
export type Fit = {status:'available'|'no_dna'|'unavailable';assessment_id?:string;fit?:{match_score:number;recommendation_tier:string;model_version:string;explanation?:{summary?:string;fit_label?:string;why_it_fits?:string[];strengths?:string[];watchouts?:string[]}}};
export function formatMetric(value:unknown,suffix='',digits=2){
 if(value===null||value===undefined||value==='')return 'Not available';
 const n=Number(value);return Number.isFinite(n)?new Intl.NumberFormat('en-CA',{maximumFractionDigits:digits}).format(n)+suffix:'Not available';
}
export function validId(value:string|null|undefined):value is string {return !!value&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
export function fund(id:string){return rpc<Fund|null>('app_get_investment',{p_investment_id:id});}
export function investmentDna(id:string){return rpc<InvestmentDna|null>('app_get_investment_dna',{p_investment_id:id});}
export function watchlist(){return rpc<{items:WatchItem[]}>('app_watchlist',{p_action:'list'});}
export function saveFund(id:string){return rpc<{item?:{investment_id:string}}>('app_watchlist',{p_action:'add',p_investment_id:id});}
export function removeFund(id:string){return rpc<{removed:boolean}>('app_watchlist',{p_action:'remove',p_investment_id:id});}
