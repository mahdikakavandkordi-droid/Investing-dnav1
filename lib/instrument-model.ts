import type {Investment} from '@/lib/types';

/**
 * Canonical asset taxonomy for Investor DNA.
 *
 * V1 intentionally exposes only ETFs, mutual funds and GICs. The broader
 * research taxonomy stays in the code/database so later versions can re-enable
 * individual bonds and money-market instruments without a data migration.
 */
export const ASSET_TYPES = [
 'ETF',
 'MUTUAL_FUND',
 'GIC',
 'T_BILL',
 'BOND',
 'COMMERCIAL_PAPER',
 'ABCP'
] as const;

export const PUBLIC_V1_ASSET_TYPES = ['ETF','MUTUAL_FUND','GIC'] as const;

export type AssetType = typeof ASSET_TYPES[number];
export type PublicV1AssetType = typeof PUBLIC_V1_ASSET_TYPES[number];
export type InstrumentFamily =
 | 'etfs'
 | 'mutual_funds'
 | 'deposits'
 | 'bonds'
 | 'government_money_market'
 | 'money_market'
 | 'other';

export type InstrumentMetric = {
 key:string;
 label:string;
 suffix?:string;
 digits?:number;
};

export type AssetDefinition = {
 label:string;
 plural:string;
 family:InstrumentFamily;
 familyLabel:string;
 matchEligible:boolean;
 fundResearch:boolean;
 heroMetrics:InstrumentMetric[];
};

/** Compact catalog facts; detail pages retain their fuller metric set. */
export function catalogMetrics(type:unknown):InstrumentMetric[]{
 if(type==='ETF')return [{key:'risk_level',label:'Risk'},{key:'mer_pct',label:'Annual cost (MER)',suffix:'%'},{key:'return_1y_pct',label:'Past 1-year return',suffix:'%'}];
 if(type==='MUTUAL_FUND')return [{key:'risk_level',label:'Risk'},{key:'mer_pct',label:'Annual cost (MER)',suffix:'%'},{key:'minimum_initial_investment',label:'Minimum investment'}];
 return [];
}

const DEFINITIONS:Record<AssetType,AssetDefinition> = {
 ETF:{
  label:'ETF',
  plural:'ETFs',
  family:'etfs',
  familyLabel:'ETFs',
  matchEligible:true,
  fundResearch:true,
  heroMetrics:[
   {key:'price',label:'Price'},
   {key:'return_1y_pct',label:'1-year return',suffix:'%'},
   {key:'mer_pct',label:'MER',suffix:'%'}
  ]
 },
 MUTUAL_FUND:{
  label:'Mutual Fund',
  plural:'Mutual Funds',
  family:'mutual_funds',
  familyLabel:'Mutual Funds',
  matchEligible:true,
  fundResearch:true,
  heroMetrics:[
   {key:'price',label:'NAV'},
   {key:'risk_level',label:'Risk'},
   {key:'mer_pct',label:'MER',suffix:'%'}
  ]
 },
 GIC:{
  label:'GIC',
  plural:'GICs',
  family:'deposits',
  familyLabel:'GICs',
  matchEligible:false,
  fundResearch:false,
  heroMetrics:[
   {key:'deposit_rate_pct',label:'Annual rate',suffix:'%'},
   {key:'term_months',label:'Term',suffix:' months',digits:0},
   {key:'redeemability',label:'Access'}
  ]
 },
 T_BILL:{
  label:'T-Bill',
  plural:'T-Bills',
  family:'government_money_market',
  familyLabel:'T-Bills',
  matchEligible:false,
  fundResearch:false,
  heroMetrics:[
   {key:'yield_to_maturity_pct',label:'Yield',suffix:'%'},
   {key:'remaining_term_months',label:'Remaining term',suffix:' months',digits:0},
   {key:'maturity_date',label:'Maturity'}
  ]
 },
 BOND:{
  label:'Bond',
  plural:'Bonds',
  family:'bonds',
  familyLabel:'Bonds',
  matchEligible:false,
  fundResearch:false,
  heroMetrics:[
   {key:'yield_to_maturity_pct',label:'Yield to maturity',suffix:'%'},
   {key:'coupon_pct',label:'Coupon',suffix:'%'},
   {key:'maturity_date',label:'Maturity'}
  ]
 },
 COMMERCIAL_PAPER:{
  label:'Commercial Paper',
  plural:'Commercial Paper',
  family:'money_market',
  familyLabel:'Money Market',
  matchEligible:false,
  fundResearch:false,
  heroMetrics:[
   {key:'yield_to_maturity_pct',label:'Yield',suffix:'%'},
   {key:'remaining_term_months',label:'Remaining term',suffix:' months',digits:0},
   {key:'credit_rating',label:'Short-term rating'}
  ]
 },
 ABCP:{
  label:'ABCP',
  plural:'ABCP',
  family:'money_market',
  familyLabel:'Money Market',
  matchEligible:false,
  fundResearch:false,
  heroMetrics:[
   {key:'yield_to_maturity_pct',label:'Yield',suffix:'%'},
   {key:'remaining_term_months',label:'Remaining term',suffix:' months',digits:0},
   {key:'credit_rating',label:'Short-term rating'}
  ]
 }
};

const FALLBACK_DEFINITION:AssetDefinition = {
 label:'Investment',
 plural:'Investments',
 family:'other',
 familyLabel:'Other',
 matchEligible:false,
 fundResearch:false,
 heroMetrics:[]
};

function normalized(value?:string|null):AssetType|null{
 const key=(value||'').trim().toUpperCase() as AssetType;
 return ASSET_TYPES.includes(key)?key:null;
}

export function assetTypeOf(item:Pick<Investment,'asset_type'>):AssetType|null{
 return normalized(item.asset_type);
}

export function assetDefinition(value?:string|null):AssetDefinition{
 const key=normalized(value);
 if(key)return DEFINITIONS[key];
 return {...FALLBACK_DEFINITION,label:value||FALLBACK_DEFINITION.label};
}

export function assetLabel(value?:string|null){return assetDefinition(value).label;}
export function assetFamily(value?:string|null){return assetDefinition(value).family;}
export function assetFamilyLabel(value?:string|null){return assetDefinition(value).familyLabel;}
export function matchEligible(value?:string|null){return assetDefinition(value).matchEligible;}
export function usesFundResearch(value?:string|null){return assetDefinition(value).fundResearch;}
export function heroMetrics(value?:string|null){return assetDefinition(value).heroMetrics;}
export function isPublicV1AssetType(value?:string|null):value is PublicV1AssetType{
 return PUBLIC_V1_ASSET_TYPES.includes((value||'').toUpperCase() as PublicV1AssetType);
}

export const EXPLORE_TABS = [
 {key:'all',label:'All'},
 {key:'etfs',label:'ETFs'},
 {key:'mutual_funds',label:'Mutual Funds'},
 {key:'deposits',label:'GICs'}
] as const;

export type ExploreTab = typeof EXPLORE_TABS[number]['key'];

export function inExploreTab(assetType:string|undefined,tab:ExploreTab){
 if(!isPublicV1AssetType(assetType))return false;
 return tab==='all'||assetFamily(assetType)===tab;
}

/** Explain current Match scope without implying that missing Match is an error. */
export function researchMatchNote(assetType?:string|null){
 if(assetType==='ETF'||assetType==='MUTUAL_FUND'){
  return 'Personalized DNA Match is available for this fund when you have a saved Investor DNA and investment context.';
 }
 return 'Research profile — personalized Match is not enabled for this asset type yet.';
}
