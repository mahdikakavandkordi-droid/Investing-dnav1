import type {AssetType} from '@/lib/instrument-model';
import type {RiskFamilyCode,RiskModifierCode} from '@/lib/product-risk/types';

export type ProductRiskModuleReadiness = 'research'|'calibration'|'published';

export type ProductRiskModuleDefinition = {
 assetType:AssetType;
 moduleCode:string;
 moduleVersion:string;
 readiness:ProductRiskModuleReadiness;
 families:readonly RiskFamilyCode[];
 modifiers:readonly RiskModifierCode[];
 sensorCodes:readonly string[];
};

export const PRODUCT_RISK_MODULES:readonly ProductRiskModuleDefinition[] = [
 {
  assetType:'ETF',
  moduleCode:'etf-risk',
  moduleVersion:'etf-risk-v1-research',
  readiness:'research',
  families:['MKT','CRD','LIQ','CON','LEV','CMP','OPS'],
  modifiers:['RATE','FX','TIME','PROTECT'],
  sensorCodes:[
   'official_risk_rating','realized_volatility','max_drawdown','equity_exposure',
   'fixed_income_exposure','duration','credit_quality','bid_ask_spread','dollar_volume',
   'premium_discount_nav','underlying_liquidity','aum','top10_weight','holdings_hhi',
   'sector_concentration','geography_concentration','leverage_multiple','inverse_flag',
   'derivatives_use','replication_method','holdings_transparency'
  ]
 },
 {
  assetType:'GIC',
  moduleCode:'gic-risk',
  moduleVersion:'gic-risk-v1-research',
  readiness:'research',
  families:['CRD','LIQ','CON','CMP','OPS'],
  modifiers:['INF','TIME','PROTECT'],
  sensorCodes:[
   'issuer','deposit_insurance_eligible','deposit_insurance_scheme','redeemability',
   'term_months','early_redemption_rules','rate_type','minimum_deposit'
  ]
 },
 {
  assetType:'T_BILL',
  moduleCode:'t-bill-risk',
  moduleVersion:'t-bill-risk-v1-research',
  readiness:'research',
  families:['MKT','CRD','LIQ','CON','CMP','OPS'],
  modifiers:['RATE','INF','TIME'],
  sensorCodes:[
   'sovereign_issuer','remaining_term_months','yield_sensitivity','secondary_market_depth',
   'bid_ask_spread','dealer_access','reinvestment_exposure'
  ]
 },
 {
  assetType:'BOND',
  moduleCode:'bond-risk',
  moduleVersion:'bond-risk-v1-research',
  readiness:'research',
  families:['MKT','CRD','LIQ','CON','LEV','CMP','OPS'],
  modifiers:['RATE','FX','INF','TIME','PROTECT'],
  sensorCodes:[
   'duration','convexity','maturity','yield_volatility','credit_rating','credit_outlook',
   'credit_spread','seniority','security_collateral','guarantor','callability',
   'issue_size','secondary_market_activity','bid_ask_spread','dealer_depth'
  ]
 },
 {
  assetType:'COMMERCIAL_PAPER',
  moduleCode:'commercial-paper-risk',
  moduleVersion:'commercial-paper-risk-v1-research',
  readiness:'research',
  families:['MKT','CRD','LIQ','CON','CMP','OPS'],
  modifiers:['TIME','PROTECT'],
  sensorCodes:[
   'short_term_credit_rating','issuer_strength','secured_status','days_to_maturity',
   'dealer_liquidity','market_depth','refinancing_dependence','rollover_dependence'
  ]
 },
 {
  assetType:'ABCP',
  moduleCode:'abcp-risk',
  moduleVersion:'abcp-risk-v1-research',
  readiness:'research',
  families:['MKT','CRD','LIQ','CON','LEV','CMP','OPS'],
  modifiers:['TIME','PROTECT','VAL'],
  sensorCodes:[
   'asset_pool_quality','sponsor_strength','liquidity_provider','credit_enhancement',
   'overcollateralization','waterfall_complexity','trigger_structure','rollover_dependence',
   'bankruptcy_remoteness','pool_concentration','underlying_transparency'
  ]
 }
] as const;

const MODULE_BY_ASSET = new Map(PRODUCT_RISK_MODULES.map(module=>[module.assetType,module] as const));

export function productRiskModuleFor(assetType?:string|null){
 return MODULE_BY_ASSET.get((assetType||'').toUpperCase() as AssetType)||null;
}
