import type {
 ConsumerRiskDimensionCode,
 ProductRiskDirection
} from '@/lib/product-risk/types';

export type ConsumerRiskDimensionDefinition = {
 code:ConsumerRiskDimensionCode;
 label:string;
 direction:ProductRiskDirection;
 shortDefinition:string;
 whyItMatters:string;
};

export const PRODUCT_RISK_DIMENSIONS:readonly ConsumerRiskDimensionDefinition[] = [
 {
  code:'loss_potential',
  label:'Loss Potential',
  direction:'higher_is_worse',
  shortDefinition:'How much of the invested value could realistically be at risk under adverse conditions.',
  whyItMatters:'A product can look stable day to day and still expose principal to credit, leverage or structural losses. Higher loss potential means more of the money could be affected when things go wrong.'
 },
 {
  code:'price_movement',
  label:'Price Movement',
  direction:'higher_is_worse',
  shortDefinition:'How much the product’s economically relevant value may move before you exit or reach maturity.',
  whyItMatters:'Larger movements can create bigger short-term gains or losses. Low day-to-day movement does not automatically mean low overall risk.'
 },
 {
  code:'access_to_money',
  label:'Access to Money',
  direction:'higher_is_better',
  shortDefinition:'How easily you can sell, redeem or withdraw without a major delay or value concession.',
  whyItMatters:'Higher access generally makes it easier to get cash when you need it. Lock-ups, thin markets or redemption rules can reduce that flexibility.'
 },
 {
  code:'diversification',
  label:'Diversification',
  direction:'higher_is_better',
  shortDefinition:'How widely the product itself spreads exposure across holdings, issuers, sectors, geographies or underlying assets.',
  whyItMatters:'Higher diversification can reduce the damage caused by one holding or issuer performing badly. It does not protect against a broad market decline.'
 }
] as const;

export function productRiskDimensionDefinition(code:ConsumerRiskDimensionCode){
 return PRODUCT_RISK_DIMENSIONS.find(item=>item.code===code);
}
