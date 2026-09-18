import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const types=read('lib/product-risk/types.ts');
const dimensions=read('lib/product-risk/dimensions.ts');
const modules=read('lib/product-risk/modules.ts');
const baseEvaluators=read('supabase/migrations/20260917233349_product_risk_shadow_evaluators.sql');
const drafts=read('supabase/migrations/20260917233435_product_risk_shadow_drafts_and_consumer_contract.sql');
const etfCalibration=read('supabase/migrations/20260917235755_product_risk_etf_source_of_truth_calibration.sql');
const crossAsset=read('supabase/migrations/20260917235954_product_risk_cross_asset_overall_calibration.sql');
const confidence=read('supabase/migrations/20260918002215_product_risk_confidence_calibration.sql');
const bondConfidence=read('supabase/migrations/20260918003711_product_risk_bond_confidence_calibration.sql');
const tbillConfidence=read('supabase/migrations/20260918004145_product_risk_tbill_confidence_calibration.sql');
const reviewQueue=read('supabase/migrations/20260918004312_product_risk_private_review_queue.sql');
const riskCard=read('components/ProductRiskCard.tsx');
const detailPage=read('app/investment/[id]/page.tsx');
const methodology=read('app/research/product-risk/page.tsx');

for(const code of ['loss_potential','price_movement','access_to_money','diversification']){
 assert.match(dimensions,new RegExp("code:'"+code+"'"),'missing consumer dimension '+code);
}
assert.equal((dimensions.match(/code:'/g)||[]).length,4,'default consumer layer must stay at four dimensions');
assert.match(types,/level:RiskBand/);
assert.match(types,/direction:ProductRiskDirection/);
assert.match(dimensions,/access_to_money[\s\S]*higher_is_better/);
assert.match(dimensions,/diversification[\s\S]*higher_is_better/);
assert.match(dimensions,/loss_potential[\s\S]*higher_is_worse/);

for(const asset of ['ETF','GIC','T_BILL','BOND','COMMERCIAL_PAPER','ABCP']){
 assert.match(modules,new RegExp("assetType:'"+asset+"'"),'missing Product Risk module '+asset);
}
assert.match(baseEvaluators,/overall_risk'[\s\S]*'Unknown'[\s\S]*'Insufficient'/,'reference assets must fail closed');
assert.match(drafts,/publication_status='draft'/);
assert.match(drafts,/publication_status='published'/,'public RPC must have a publication gate');

assert.match(etfCalibration,/investment_official_risk_ratings/,'ETF calibration must consume verified official risk');
assert.match(etfCalibration,/product_risk_etf_official_rating/);
assert.match(etfCalibration,/product_risk_etf_effective_holdings/);
assert.match(etfCalibration,/number_of_underlying_holdings/);
assert.match(etfCalibration,/bid_ask_spread_pct/);
assert.match(etfCalibration,/sector_concentration/);
assert.match(etfCalibration,/product_risk_overall_v1/);
assert.doesNotMatch(
 etfCalibration.match(/create or replace function investor_private\.product_risk_eval_etf[\s\S]*?end \$\$;/)?.[0]||'',
 /v\.risk_level/,
 'ETF evaluator must not use generic risk_level as official Product Risk source'
);

assert.match(crossAsset,/product_risk_overall_v1\('GIC'/);
assert.match(crossAsset,/product_risk_overall_v1\('T_BILL'/);
assert.match(crossAsset,/product_risk_overall_v1\('BOND'/);
assert.match(confidence,/product_risk_overall_confidence_v1/);
assert.match(confidence,/ae->>'confidence'/);
assert.match(confidence,/de->>'confidence'/);
assert.match(bondConfidence,/credit_rating_unavailable/);
assert.match(bondConfidence,/duration_years is not null/);
assert.match(bondConfidence,/product_risk_overall_confidence_v1/);
assert.match(tbillConfidence,/remaining_term_months/);
assert.match(tbillConfidence,/direct_liquidity_measure_unavailable/);
assert.match(tbillConfidence,/product_risk_overall_confidence_v1/);
assert.match(reviewQueue,/v_product_risk_review_queue/);
assert.match(reviewQueue,/evidence_ready_for_review/);
assert.match(reviewQueue,/revoke all on investor_private\.v_product_risk_review_queue from public,anon,authenticated/);
assert.match(riskCard,/getProductRisk\(investmentId\)/);
assert.match(riskCard,/status==='available'/);
assert.match(riskCard,/Product Risk describes the investment/);
assert.match(detailPage,/<ProductRiskCard investmentId=\{item\.id\}\/>/);
assert.match(methodology,/Overall Risk is not DNA Match/);
assert.match(methodology,/Only explicitly reviewed and published profiles/);

console.log('PASS Product Risk DNA contracts: calibrated confidence, published-only UI, directed dimensions and modular hidden overall');
