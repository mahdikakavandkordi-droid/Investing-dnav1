import {rpc} from '@/lib/supabase';
import type {ProductRiskResponse} from '@/lib/product-risk/types';

/** Thin public read adapter. Canonical product-risk calculation stays server-side. */
export function getProductRisk(investmentId:string,includeDetails=false){
 return rpc<ProductRiskResponse>('app_get_product_risk',{
  p_investment_id:investmentId,
  p_include_details:includeDetails
 });
}
