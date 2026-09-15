import {rpc} from "@/lib/supabase";
import type {Investment} from "@/lib/types";

export type Fund = Investment & {
 currency?:string;description?:string;issuer_name?:string;profile_objective?:string;profile_benchmark?:string;profile_key_risks?:string[];
 profile_target_allocation?:Record<string,number>;profile_management_style?:string;profile_distribution_policy?:string;profile_summary?:string;
 metrics_as_of_date?:string;profile_as_of_date?:string;data_status?:string;
};

export type InvestmentDna = {
 investment_id:string;symbol:string;name:string;asset_type?:string;category?:string;subcategory?:string;
 risk_band?:string;risk_score?:number;growth_score?:number;income_score?:number;stability_score?:number;diversification_score?:number;liquidity_score?:number;complexity_score?:number;
 official_risk_rating?:string;official_risk_band_min?:number;official_risk_band_max?:number;official_risk_issuer?:string;official_risk_source_type?:string;official_risk_source_title?:string;official_risk_source_url?:string;official_risk_source_date?:string;official_risk_effective_date?:string;official_risk_methodology?:string;official_risk_verification_note?:string;official_risk_verified_at?:string;
 minimum_horizon_months?:number;concentration_level?:string;geographic_scope?:string;currency_exposure?:string;equity_pct?:number;fixed_income_pct?:number;mer_pct?:number;
 style_class?:string;objective_class?:string;ideal_investor?:unknown;best_use_cases?:unknown;key_tradeoffs?:unknown;explanation?:unknown;data_quality_status?:string;data_quality_score?:number;as_of_date?:string;
};

export type OfficialFundFacts = {
 investment_id:string;symbol:string;source_name:string;product_url?:string;etf_facts_url:string;etf_facts_date?:string;management_fee_pct?:number;mer_pct?:number;fee_source_note?:string;verified_at?:string;
 summary?:string;objective?:string;asset_mix?:Record<string,number>;management_style?:string;distribution_policy?:string;
};

export type ResearchHolding = {
 holding_symbol?:string|null;holding_name?:string|null;weight_pct?:number|null;asset_type?:string|null;country_code?:string|null;sector?:string|null;as_of_date?:string|null;
 known_investment_id?:string|null;known_investment_name?:string|null;
};
export type ResearchContext = {
 investment_id:string;
 coverage?:{has_official_facts?:boolean;has_official_risk?:boolean;has_return_1y?:boolean;has_return_3y?:boolean;has_return_5y?:boolean;has_sourced_income?:boolean;has_portfolio_characteristics?:boolean;has_complete_exposure_set?:boolean;has_full_holdings_detail?:boolean;holdings_weight_coverage_pct?:number|null;data_status?:string;return_1y_date?:string|null;return_3y_date?:string|null;return_5y_date?:string|null;holdings_date?:string|null;characteristics_date?:string|null;exposure_date?:string|null};
 performance?:{return_1y_pct?:number|null;return_3y_annualized_pct?:number|null;return_5y_annualized_pct?:number|null;return_1y_as_of_date?:string|null;return_3y_as_of_date?:string|null;return_5y_as_of_date?:string|null;return_1y_verification_status?:string|null;return_3y_verification_status?:string|null;return_5y_verification_status?:string|null};
 characteristics?:{number_of_holdings?:number|null;number_of_underlying_holdings?:number|null;number_of_stocks?:number|null;number_of_bonds?:number|null;yield_to_maturity_pct?:number|null;average_duration_years?:number|null;average_maturity_years?:number|null;average_credit_quality?:string|null;pe_ratio?:number|null;pb_ratio?:number|null;roe_pct?:number|null;earnings_growth_pct?:number|null};
 exposure_coverage?:{country_complete?:boolean;region_complete?:boolean;sector_complete?:boolean;asset_class_complete?:boolean;credit_quality_complete?:boolean;maturity_complete?:boolean;complete_dimensions?:string[]|null};
 holdings?:{mode:'fund_of_funds_structure'|'full_holdings'|'top_holdings_sample'|'no_holdings';as_of_date?:string|null;weight_coverage_pct?:number|null;known_underlying_weight_pct?:number|null;items:ResearchHolding[]};
};

export type WatchItem = {investment_id:string;symbol:string;name:string;note?:string;created_at?:string};
export type Fit = {status:'available'|'no_dna'|'unavailable';assessment_id?:string;run_id?:string;fit?:{match_score:number|null;recommendation_tier:string;model_version:string;eligibility?:string;explanation?:{summary?:string;fit_label?:string;eligibility?:string;why_it_fits?:string[];strengths?:string[];watchouts?:string[];scores?:Record<string,number|null>}}};

export function formatMetric(value:unknown,suffix='',digits=2){
 if(value===null||value===undefined||value==='')return 'Not available';
 const n=Number(value);return Number.isFinite(n)?new Intl.NumberFormat('en-CA',{maximumFractionDigits:digits}).format(n)+suffix:'Not available';
}
export function validId(value:string|null|undefined):value is string {return !!value&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
export function fund(id:string){return rpc<Fund|null>('app_get_investment',{p_investment_id:id});}
export function investmentDna(id:string){return rpc<InvestmentDna|null>('app_get_investment_dna',{p_investment_id:id});}
export function officialFundFacts(id:string){return rpc<OfficialFundFacts|null>('app_get_official_fund_facts',{p_investment_id:id});}
export function researchContext(id:string){return rpc<ResearchContext|null>('app_get_investment_research_context',{p_investment_id:id});}
export function watchlist(){return rpc<{items:WatchItem[]}>('app_watchlist',{p_action:'list'});}
export function saveFund(id:string){return rpc<{item?:{investment_id:string}}>('app_watchlist',{p_action:'add',p_investment_id:id});}
export function removeFund(id:string){return rpc<{removed:boolean}>('app_watchlist',{p_action:'remove',p_investment_id:id});}
