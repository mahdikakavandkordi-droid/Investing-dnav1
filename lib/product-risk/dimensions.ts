import type {ConsumerRiskDimensionCode} from '@/lib/product-risk/types';

export type ConsumerRiskDimensionDefinition = {
 code:ConsumerRiskDimensionCode;
 label:string;
 shortDefinition:string;
 whyItMatters:string;
};

export const PRODUCT_RISK_DIMENSIONS:readonly ConsumerRiskDimensionDefinition[] = [
 {
  code:'loss_potential',
  label:'Loss Potential',
  shortDefinition:'How much of the invested value could realistically be at risk under adverse conditions.',
  whyItMatters:'A product can look stable day to day and still expose principal to credit, leverage or structural losses. This indicator focuses on the consequence of things going wrong.'
 },
 {
  code:'price_movement',
  label:'Price Movement',
  shortDefinition:'How much the product’s economically relevant value may move before you exit or reach maturity.',
  whyItMatters:'Larger movements can make the value of your investment change quickly. Low day-to-day movement does not automatically mean low overall risk.'
 },
 {
  code:'access_to_money',
  label:'Access to Money',
  shortDefinition:'How easily you can sell, redeem or withdraw without a major delay or value concession.',
  whyItMatters:'Limited access can matter when you need cash. Lock-ups, thin markets, redemption rules and stressed-market liquidity can all reduce access.'
 },
 {
  code:'diversification',
  label:'Diversification',
  shortDefinition:'How widely the product itself spreads exposure across holdings, issuers, sectors, geographies or underlying assets.',
  whyItMatters:'More diversification can reduce the damage caused by one holding or issuer performing badly. It does not protect against a broad market decline.'
 }
] as const;

export function productRiskDimensionDefinition(code:ConsumerRiskDimensionCode){
 return PRODUCT_RISK_DIMENSIONS.find(item=>item.code===code);
}
