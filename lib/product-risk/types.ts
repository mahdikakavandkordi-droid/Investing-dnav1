export const PRODUCT_RISK_MODEL_VERSION = 'product-risk-dna-v1-research' as const;

export type RiskBand =
 | 'Low'
 | 'Low to Medium'
 | 'Medium'
 | 'Medium to High'
 | 'High'
 | 'Unknown'
 | 'N/A';

export type RiskConfidence = 'High' | 'Medium' | 'Low' | 'Insufficient';

export type ConsumerRiskDimensionCode =
 | 'loss_potential'
 | 'price_movement'
 | 'access_to_money'
 | 'diversification';

export type RiskFamilyCode =
 | 'MKT'
 | 'CRD'
 | 'LIQ'
 | 'CON'
 | 'LEV'
 | 'CMP'
 | 'OPS';

export type RiskModifierCode =
 | 'RATE'
 | 'FX'
 | 'INF'
 | 'TIME'
 | 'PROTECT'
 | 'VAL';

export type ProductRiskFlag = {
 code:string;
 label:string;
 severity?:'info'|'attention'|'important';
 explanation?:string;
};

export type ProductRiskDimension = {
 code:ConsumerRiskDimensionCode;
 band:RiskBand;
 confidence:RiskConfidence;
 headline?:string|null;
 explanation?:string|null;
 why_it_matters?:string|null;
};

export type ProductRiskFamilyDetail = {
 code:RiskFamilyCode;
 band:RiskBand;
 confidence:RiskConfidence;
 explanation?:string|null;
};

export type ProductRiskAvailable = {
 status:'available';
 model_version:string;
 module_code:string;
 module_version:string;
 overall_risk:{band:RiskBand|null;confidence:RiskConfidence};
 summary:string|null;
 dominant_risks:string[];
 key_flags:ProductRiskFlag[];
 as_of_date:string|null;
 dimensions:ProductRiskDimension[];
 details:ProductRiskFamilyDetail[]|null;
};

export type ProductRiskUnavailable = {
 status:'not_available';
 reason?:string;
};

export type ProductRiskResponse = ProductRiskAvailable|ProductRiskUnavailable;
