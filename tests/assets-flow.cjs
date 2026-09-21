const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3001';
const artifacts=path.join(__dirname,'artifacts');fs.mkdirSync(artifacts,{recursive:true});

const ids={
 etf:'11111111-1111-4111-8111-111111111111',
 mf:'22222222-2222-4222-8222-222222222222',
 mf2:'33333333-3333-4333-8333-333333333333',
 gic:'44444444-4444-4444-8444-444444444444'
};
const common={capital_protection:'none',liquidity_level:'high',income_predictability:'medium',diversification_level:'diversified',complexity_level:'medium',time_structure:'open_ended',structure_model_version:'structure-v1',structure_as_of_date:'2026-09-18'};
const etf={...common,id:ids.etf,symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio',display_name:'Balanced All-in-One Portfolio',asset_type:'ETF',issuer_name:'Vanguard Canada',price:35.2,return_1y_pct:13.89,mer_pct:.22,risk_level:'Low to Medium',price_volatility:'low',growth_participation:'medium',interest_rate_sensitivity:'medium',profile_summary:'Diversified ETF research example.'};
const mf={...common,id:ids.mf,symbol:'RBF460',name:'RBC Select Balanced Portfolio - Series A',display_name:'Balanced Global Portfolio',asset_type:'MUTUAL_FUND',issuer_name:'RBC Global Asset Management Inc.',price:38.81,return_1y_pct:17.5,return_3y_annualized_pct:13.3,return_5y_annualized_pct:7,mer_pct:1.94,risk_level:'Low to Medium',series_name:'Series A',fund_code:'RBF460',cifsc_category:'Global Neutral Balanced',load_structure:'No Load',sales_status:'Open',minimum_initial_investment:500,minimum_additional_investment:25,mf_income_distribution_frequency:'Annually',capital_gains_distribution_frequency:'Annually',mutual_fund_source_name:'RBC Global Asset Management',mutual_fund_source_url:'https://example.test/rbf460',mutual_fund_as_of_date:'2026-06-30',profile_target_allocation:{equity:60,fixed_income:38,cash:2},profile_summary:'Balanced mutual fund research example.',market_price_date:'2026-09-18',market_price_source_key:'yahoo_free'};
const mf2={...common,id:ids.mf2,symbol:'RBF461',name:'RBC Select Conservative Portfolio - Series A',display_name:'Conservative Global Portfolio',asset_type:'MUTUAL_FUND',issuer_name:'RBC Global Asset Management Inc.',price:26.53,return_1y_pct:12.2,return_3y_annualized_pct:10,return_5y_annualized_pct:5,mer_pct:1.70,risk_level:'Low to Medium',series_name:'Series A',fund_code:'RBF461',cifsc_category:'Global Fixed Income Balanced',load_structure:'No Load',sales_status:'Open',minimum_initial_investment:500,minimum_additional_investment:25,mf_income_distribution_frequency:'Quarterly',capital_gains_distribution_frequency:'Annually',mutual_fund_source_name:'RBC Global Asset Management',mutual_fund_source_url:'https://example.test/rbf461',mutual_fund_as_of_date:'2026-06-30',profile_target_allocation:{equity:40,fixed_income:58,cash:2},profile_summary:'Conservative mutual fund research example.',market_price_date:'2026-09-18',market_price_source_key:'yahoo_free'};
const gic={...common,id:ids.gic,symbol:'RBC-GIC-1Y-NR',name:'RBC 1-Year Non-Redeemable GIC',asset_type:'GIC',issuer_name:'Royal Bank of Canada',capital_protection:'insured_deposit',liquidity_level:'locked',price_volatility:'none',income_predictability:'very_high',time_structure:'locked_term',deposit_rate_pct:2.45,term_months:12,redeemability:'non_redeemable',minimum_deposit:1000,interest_payment_frequency:'At maturity',registered_account_eligibility:['TFSA','RRSP'],deposit_insurance_scheme:'CDIC',deposit_insurance_eligible:true,deposit_source_name:'RBC Royal Bank',deposit_source_url:'https://example.test/rbc',deposit_as_of_date:'2026-09-11',profile_summary:'Fixed-rate deposit research example.'};
const catalog=[etf,mf,mf2,gic];

const dnaFor=item=>item.asset_type==='MUTUAL_FUND'?{
 investment_id:item.id,symbol:item.symbol,name:item.name,asset_type:item.asset_type,risk_band:item.risk_level,official_risk_rating:item.risk_level,
 official_risk_issuer:'RBC Global Asset Management Inc.',official_risk_source_type:'Fund Facts',official_risk_source_url:'https://example.test/fund-facts',
 official_risk_source_date:'2025-12-17',growth_score:item.symbol==='RBF460'?60:40,income_score:item.symbol==='RBF460'?50:66,stability_score:item.symbol==='RBF460'?51:63,
 diversification_score:93,equity_pct:item.profile_target_allocation.equity,fixed_income_pct:item.profile_target_allocation.fixed_income+item.profile_target_allocation.cash,mer_pct:item.mer_pct,
 explanation:{signal_inputs:{meaningful_geographic_regions:3}}
}:null;
const factsFor=item=>item.asset_type==='MUTUAL_FUND'?{
 investment_id:item.id,symbol:item.symbol,source_name:'RBC Global Asset Management',product_url:'https://example.test/product',etf_facts_url:'https://example.test/fund-facts',
 etf_facts_date:'2025-12-17',management_fee_pct:item.symbol==='RBF460'?1.65:1.45,mer_pct:item.mer_pct,fee_source_note:'Series A fees from issuer disclosure.',
 summary:item.profile_summary,objective:'Long-term growth with an income component.',asset_mix:item.profile_target_allocation,management_style:'Active',distribution_policy:item.mf_income_distribution_frequency
}:null;
const researchFor=item=>item.asset_type==='MUTUAL_FUND'?{
 investment_id:item.id,coverage:{has_official_facts:true,has_official_risk:true,has_return_1y:true,has_return_3y:true,has_return_5y:true,data_status:'verified_partial'},
 performance:{return_1y_pct:item.return_1y_pct,return_3y_annualized_pct:item.return_3y_annualized_pct,return_5y_annualized_pct:item.return_5y_annualized_pct,return_1y_as_of_date:'2026-06-30',return_3y_as_of_date:'2026-06-30',return_5y_as_of_date:'2026-06-30',return_1y_verification_status:'issuer_verified',return_3y_verification_status:'issuer_verified',return_5y_verification_status:'issuer_verified'},
 holdings:{mode:'no_holdings',as_of_date:null,weight_coverage_pct:0,known_underlying_weight_pct:0,items:[]}
}:null;

const gicRisk={status:'available',model_version:'product-risk-dna-v1-research',module_code:'gic-risk',module_version:'gic-risk-v1-research',overall_risk:{band:'Low',confidence:'High'},summary:'A fixed-term deposit with low loss potential and restricted access.',dominant_risks:['Access restrictions'],key_flags:[],as_of_date:'2026-09-11',details:null,dimensions:[]};

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage();page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));

 await ctx.route('https://dna-test.supabase.co/**',async route=>{
  const req=route.request(),url=req.url(),body=req.postDataJSON()||{};
  const send=(d,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(d)});
  if(url.includes('/functions/v1/investing-dna-pilot')&&body.action==='track_event')return send({tracked:true});
  if(url.includes('/auth/v1/user'))return send({message:'No active session'},401);
  if(url.includes('/rpc/app_search_instruments'))return send(catalog);
  if(url.includes('/rpc/app_market_data_status'))return send([]);
  if(url.includes('/rpc/app_get_instrument'))return send(catalog.find(x=>x.id===body.p_investment_id)||null);
  if(url.includes('/rpc/app_compare_instruments'))return send((body.p_investment_ids||[]).map(id=>catalog.find(x=>x.id===id)).filter(Boolean));
  if(url.includes('/rpc/app_get_investment_dna'))return send(dnaFor(catalog.find(x=>x.id===body.p_investment_id)||{}));
  if(url.includes('/rpc/app_get_official_fund_facts'))return send(factsFor(catalog.find(x=>x.id===body.p_investment_id)||{}));
  if(url.includes('/rpc/app_get_investment_research_context'))return send(researchFor(catalog.find(x=>x.id===body.p_investment_id)||{}));
  if(url.includes('/rpc/app_get_product_risk'))return send(body.p_investment_id===ids.gic?gicRisk:{status:'not_available',reason:'No published Product Risk DNA profile.'});
  if(url.includes('/rpc/get_current_investor_app_state'))return send(null);
  throw Error('Unexpected request '+url);
 });

 const check=n=>console.log('PASS '+n);

 await page.goto(origin+'/explore');
 await page.getByRole('heading',{name:'Explore',exact:true}).waitFor();
 for(const tab of ['All','ETFs','Mutual Funds','GICs'])await page.getByRole('tab',{name:tab,exact:true}).waitFor();
 assert.equal(await page.getByRole('tab',{name:'T-Bills',exact:true}).count(),0);
 assert.equal(await page.getByRole('tab',{name:'Bonds',exact:true}).count(),0);
 assert.equal(await page.getByRole('tab',{name:'Money Market',exact:true}).count(),0);
 await page.getByRole('heading',{name:'Balanced Global Portfolio',exact:true}).waitFor();
 let text=await page.locator('body').innerText();
 assert.match(text,/Balanced Global Portfolio/);
 assert.match(text,/RBC 1-Year Non-Redeemable GIC/);
 check('Explore is focused on ETF, Mutual Fund and GIC only');

 await page.getByRole('tab',{name:'Mutual Funds',exact:true}).click();
 await page.getByRole('heading',{name:mf.display_name,exact:true}).waitFor();
 assert.equal(await page.getByRole('heading',{name:gic.name,exact:true}).count(),0);
 const mfCard=page.locator('.investment-card-mutual_fund').filter({hasText:'RBF460'});
 assert.equal(await mfCard.count(),1);
 assert.match(await mfCard.innerText(),/NAV/);
 assert.match(await mfCard.innerText(),/1\.94%/);
 assert.match(await mfCard.innerText(),/NAV updated/i);

 await Promise.all([page.waitForURL(`**/investment/${ids.mf}`),mfCard.getByRole('link',{name:'Open research',exact:true}).click()]);
 await page.getByRole('button',{name:'Fund profile & fees',exact:true}).click();
 text=await page.locator('body').innerText();
 assert.match(text,/Series A/);
 assert.match(text,/RBF460/);
 assert.match(text,/Global Neutral Balanced/);
 assert.match(text,/Minimum initial/i);
 assert.match(text,/How this fund is allocated/i);
 assert.match(text,/Latest NAV/i);
 await page.getByRole('button',{name:'Save & official documents',exact:true}).click();
 text=await page.locator('body').innerText();
 assert.match(text,/Fund Facts/);assert.match(text,/Official name: RBC Select Balanced Portfolio - Series A/);
 check('Mutual-fund detail exposes series, fees, allocation, NAV freshness and Fund Facts');

 await page.goto(origin+`/compare?ids=${ids.mf}`);
 await page.getByRole('heading',{name:/Compare Mutual Funds(?: side by side)?/i}).waitFor();
 const selectors=page.locator('.compare-picker select');
 await selectors.nth(1).selectOption(ids.mf2);
 const secondOptions=await selectors.nth(1).locator('option').allTextContents();
 assert.ok(secondOptions.some(x=>x.includes('RBF461')));
 assert.ok(secondOptions.every(x=>!x.includes('GIC')&&!x.includes('VBAL')));
 await page.getByRole('button',{name:'Compare investments',exact:true}).click();
 await page.getByRole('heading',{name:mf2.display_name,exact:true}).waitFor();
 assert.equal(await page.getByRole('heading',{name:gic.name,exact:true}).count(),0);
 check('Compare is same-type only and keeps Mutual Funds separate from ETFs and GICs');

 await page.goto(origin+`/compare?ids=${ids.mf},${ids.gic}`);
 await page.getByText(/V1 comparisons stay within one product type/i).waitFor();
 assert.equal(await page.locator('.compare-card').count(),0);
 check('Cross-type compare URLs are rejected instead of silently mixing product types');

 await page.goto(origin+'/explore');
 await page.getByRole('tab',{name:'GICs',exact:true}).click();
 const gicCard=page.locator('.investment-card-gic').filter({hasText:'RBC-GIC-1Y-NR'});
 await Promise.all([page.waitForURL(`**/investment/${ids.gic}`),gicCard.getByRole('link',{name:'Open research',exact:true}).click()]);
 await page.getByRole('button',{name:'Structure & terms',exact:true}).click();
 text=await page.locator('body').innerText();
 assert.match(text,/2\.45%/);assert.match(text,/12 months/);assert.match(text,/CDIC/);
 check('GIC remains a focused terms-and-protection research path');

 await page.screenshot({path:path.join(artifacts,'v1-focused-assets-mobile.png'),fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 check('Focused V1 asset flow is mobile-safe and runtime-clean');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});