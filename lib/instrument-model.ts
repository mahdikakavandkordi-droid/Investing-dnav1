import type {Investment} from '@/lib/types';

/**
 * Canonical asset taxonomy for Investor DNA.
 *
 * Keep page components dumb: they should ask this module how to label/group an
 * instrument instead of duplicating asset-type conditionals across Explore,
 * Detail and Compare. See docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md.
 */
export const ASSET_TYPES=['ETF','GIC','T_BILL','BOND','COMMERCIAL_PAPER','ABCP'] as const;
export type AssetType=typeof ASSET_TYPES[number];
export type InstrumentFamily='funds'|'deposits'|'bonds'|'government_money_market'|'money_market'|'other';

export type InstrumentMetric={key:string;label:string;suffix?:string;digits?:number};

type AssetDefinition={
 label:string;
 plural:string;
 family:InstrumentFamily;
 familyLabel:string;
 matchEligible:boolean;
 fundResearch:boolean;
 heroMetrics:InstrumentMetric[];
};

const DEFINITIONS:Record<AssetType,AssetDefinition>={
 ETF:{
  label:'ETF',plural:'ETFs',family:'funds',familyLabel:'ETFs',matchEligible:true,fundResearch:true,
  heroMetrics:[{key:'price',label:'Price'},{key:'return_1y_pct',label:'1-year return',suffix:'%'},{key:'mer_pct',label:'MER',suffix:'%'}],
 },
 GIC:{
  label:'GIC',plural:'GICs',family:'deposits',familyLabel:'GICs',matchEligible:false,fundResearch:false,
  heroMetrics:[{key:'deposit_rate_pct',label:'Annual rate',suffix:'%'},{key:'term_months',label:'Term',suffix:' months',digits:0},{key:'redeemability',label:'Access'}],
 },
 T_BILL:{
  label:'T-Bill',plural:'T-Bills',family:'government_money_market',familyLabel:'T-Bills',matchEligible:false,fundResearch:false,
  heroMetrics:[{key:'yield_to_maturity_pct',label:'Yield',suffix:'%'},{key:'remaining_term_months',label:'Remaining term',suffix:' months',digits:0},{key:'maturity_date',label:'Maturity'}],
 },
 BOND:{
  label:'Bond',plural:'Bonds',family:'bonds',familyLabel:'Bonds',matchEligible:false,fundResearch:false,
  heroMetrics:[{key:'yield_to_maturity_pct',label:'Yield to maturity',suffix:'%'},{key:'coupon_pct',label:'Coupon',suffix:'%'},{key:'maturity_date',label:'Maturity'}],
 },
 COMMERCIAL_PAPER:{
  label:'Commercial Paper',plural:'Commercial Paper',family:'money_market',familyLabel:'Money Market',matchEligible:false,fundResearch:false,
  heroMetrics:[{key:'yield_to_maturity_pct',label:'Yield',suffix:'%'},{key:'remaining_term_months',label:'Remaining term',suffix:' months',digits:0},{key:'credit_rating',label:'Short-term rating'}],
 },
 ABCP:{
  label:'ABCP',plural:'ABCP',family:'money_market',familyLabel:'Money Market',matchEligible:false,fundResearch:false,
  heroMetrics:[{key:'yield_to_maturity_pct',label:'Yield',suffix:'%'},{key:'remaining_term_months',label:'Remaining term',suffix:' months',digits:0},{key:'credit_rating',label:'Short-term rating'}],
 },
};

function normalized(value?:string|null):AssetType|null{
 const key=(value||'').trim().toUpperCase() as AssetType;
 return ASSET_TYPES.includes(key)?key:null;
}

export function assetTypeOf(item:Pick<Investment,'asset_type'>):AssetType|null{return normalized(item.asset_type);}
export function assetDefinition(value?:string|null):AssetDefinition{
 const key=normalized(value);return key?DEFINITIONS[key]:{label:value||'Investment',plural:'Investments',family:'other',familyLabel:'Other',matchEligible:false,fundResearch:false,heroMetrics:[]};
}
export function assetLabel(value?:string|null){return assetDefinition(value).label;}
export function assetFamily(value?:string|null){return assetDefinition(value).family;}
export function assetFamilyLabel(value?:string|null){return assetDefinition(value).familyLabel;}
export function matchEligible(value?:string|null){return assetDefinition(value).matchEligible;}
export function usesFundResearch(value?:string|null){return assetDefinition(value).fundResearch;}
export function heroMetrics(value?:string|null){return assetDefinition(value).heroMetrics;}

export const EXPLORE_TABS=[
 {key:'all',label:'All'},
 {key:'funds',label:'ETFs'},
 {key:'deposits',label:'GICs'},
 {key:'government_money_market',label:'T-Bills'},
 {key:'bonds',label:'Bonds'},
 {key:'money_market',label:'Money Market'},
] as const;
export type ExploreTab=typeof EXPLORE_TABS[number]['key'];

export function inExploreTab(assetType:string|undefined,tab:ExploreTab){return tab==='all'||assetFamily(assetType)===tab;}

export function researchMatchNote(assetType?:string|null){
 return matchEligible(assetType)
  ? 'Personalized DNA Match is available for this ETF when you have a saved Investor DNA and investment context.'
  : 'Research profile — personalized DNA Match is not enabled for this asset type yet.';
}
