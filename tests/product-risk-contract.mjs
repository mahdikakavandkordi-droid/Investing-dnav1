import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const types=read('lib/product-risk/types.ts');
const dimensions=read('lib/product-risk/dimensions.ts');
const modules=read('lib/product-risk/modules.ts');
const evaluators=read('supabase/migrations/20260917233349_product_risk_shadow_evaluators.sql');
const drafts=read('supabase/migrations/20260917233435_product_risk_shadow_drafts_and_consumer_contract.sql');

for(const code of ['loss_potential','price_movement','access_to_money','diversification']){
 assert.match(dimensions,new RegExp("code:'"+code+"'"),'missing consumer dimension '+code);
}
assert.equal((dimensions.match(/code:'/g)||[]).length,4,'default consumer layer must stay at four dimensions');
assert.match(types,/level:RiskBand/,'consumer dimensions should expose level, not a universal risk-direction band');
assert.match(types,/direction:ProductRiskDirection/,'consumer dimensions must expose scale direction');
assert.match(dimensions,/access_to_money[\s\S]*higher_is_better/);
assert.match(dimensions,/diversification[\s\S]*higher_is_better/);
assert.match(dimensions,/loss_potential[\s\S]*higher_is_worse/);

for(const asset of ['ETF','GIC','T_BILL','BOND','COMMERCIAL_PAPER','ABCP']){
 assert.match(modules,new RegExp("assetType:'"+asset+"'"),'missing Product Risk module '+asset);
}
assert.match(evaluators,/product_risk_eval_etf/);
assert.match(evaluators,/product_risk_eval_gic/);
assert.match(evaluators,/product_risk_eval_t_bill/);
assert.match(evaluators,/product_risk_eval_bond/);
assert.match(evaluators,/overall_risk'[\s\S]*'Unknown'[\s\S]*'Insufficient'/,'reference-only assets must fail closed');
assert.match(drafts,/publication_status='draft'/);
assert.match(drafts,/where pr\.investment_id=p_investment_id and pr\.publication_status='published'/,'public RPC must read only published profiles');

console.log('PASS Product Risk DNA contracts: modular assets, four directed consumer dimensions, shadow-only publication gate');
