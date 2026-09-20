const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

const ORIGIN=(process.env.VISUAL_AUDIT_ORIGIN||'http://127.0.0.1:3000').replace(/\/$/,'');
const OUT=path.resolve(process.env.VISUAL_AUDIT_DIR||'visual-audit');
fs.mkdirSync(OUT,{recursive:true});

const assessmentId='11111111-1111-4111-8111-111111111111';
const userId='22222222-2222-4222-8222-222222222222';
const now=Math.floor(Date.now()/1000);
const authUser={id:userId,aud:'authenticated',role:'authenticated',email:'mahdi@example.com',email_confirmed_at:new Date().toISOString(),user_metadata:{first_name:'Mahdi',age:35},app_metadata:{provider:'email',providers:['email']},created_at:new Date().toISOString()};
const session={access_token:'visual-audit-access-token',refresh_token:'visual-audit-refresh-token',expires_in:86400,expires_at:now+86400,token_type:'bearer',user:authUser};

const questions=[
 {question_id:'RT01',section:'risk_tolerance',prompt:'Which balance feels most comfortable for this money?',question_type:'single_choice',options:[{value:'A',label:'Smaller ups and downs'},{value:'B',label:'Moderate ups and downs'},{value:'C',label:'Larger ups and downs'},{value:'D',label:'Very large ups and downs'}]},
 {question_id:'RT02',section:'risk_tolerance',prompt:'If markets fell for a while, what would feel most like you?',question_type:'single_choice',options:[{value:'A',label:'Protect what I have'},{value:'B',label:'Stay measured and wait'},{value:'C',label:'Add gradually'},{value:'D',label:'Lean into the opportunity'}]},
 {question_id:'BD01',section:'behavioral_dna',prompt:'How do you usually make an important financial decision?',question_type:'single_choice',options:[{value:'A',label:'I prefer a familiar option'},{value:'B',label:'I compare a few clear choices'},{value:'C',label:'I research widely first'},{value:'D',label:'I move quickly when conviction is high'}]},
 {question_id:'BD02',section:'behavioral_dna',prompt:'When new information challenges your first view, what do you tend to do?',question_type:'single_choice',options:[{value:'A',label:'Stick with my first instinct'},{value:'B',label:'Pause and re-check'},{value:'C',label:'Actively look for opposing evidence'},{value:'D',label:'Change direction quickly'}]}
];

const dna={
 archetype:'ANCHOR',
 risk_tolerance:34,
 risk_capacity:58,
 model_version:'dna-v1.10-research',
 calibration_status:'pre_validation',
 capacity_profile:{raw_index:58,guarded_capacity:58,review_required:false,reason:null},
 behavioral_profile:{decision_independence:70,long_term_orientation:80,reference_flexibility:60,evidence_discipline:65,emotional_decision_control:75},
 experience_profile:{role:'context_only',overall_score:66.67,dimensions:{decision_experience:2,downturn_experience:2},owned_products:['cash','funds','stocks'],score_basis:'decision_and_downturn_experience_only'},
 assessment_dimensions:{
  question_count:28,
  questionnaire_version:'v1.10-cognitive-candidate',
  risk_tolerance:{answer_count:10,overall_score:34,dimensions:{growth_risk_tradeoff:33,loss_tolerance:33,uncertainty_volatility:33,risk_emotion:33,crash_resilience:38}},
  behavioral_dna:{answer_count:10,dimensions:{decision_independence:70,long_term_orientation:80,reference_flexibility:60,evidence_discipline:65,emotional_decision_control:75}},
  risk_capacity:{answer_count:5,overall_score:58,raw_score:58,dimensions:{financial_buffer:67,income_stability:67,emergency_reserve:33,financial_responsibility:67,loss_impact:56},guard:{raw_index:58,guarded_capacity:58,review_required:false,reason:null}},
  investment_experience:{answer_count:3,overall_score:66.67,dimensions:{decision_experience:2,downturn_experience:2},decision_experience:'2–5 years',downturn_experience:'Yes, once',owned_products:['Cash, savings, or GICs','Mutual funds or unleveraged ETFs','Individual stocks'],role:'context_only'}
 },
 quality_profile:{supported:true,heuristic_version:'response-review-v1',pair_count:2,conflict_count:0,consistency_label:'not_validated',clarification_recommended:false,note:'Related answers are discussion prompts, not contradictions.'},
 narrative:{
  character:'The Steady Builder',
  summary:'You currently show a lower willingness to take investment risk with a moderate financial ability to absorb losses.',
  how_you_think:'You tend to use your own criteria and evidence before making an investment decision.',
  pressure_style:'Sharp market moves are less likely to pull you away from a decision process you set while calm.',
  strength:'You tend to keep recent performance in perspective and stay focused on the longer-term case.',
  blind_spot:'Your natural caution can sometimes lead you to use less of your financial capacity than you could comfortably support.'
 },
 methodology_note:'Pre-validation research output.'
};
let contextReady=false;
function report(){return{...dna,investment_context:contextReady?{goal:'retirement',time_horizon:'gt_10y',amount_to_invest:25000,liquidity_need:'low',principal_required:'no',first_name:'Mahdi',age:35}:undefined}}
const matchItem={investment_id:'48580aac-8147-4054-b99f-5d696ce3ceca',symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio',match_score:84,eligibility:'eligible',recommendation_tier:'top_match',risk_band:'Low to Medium',explanation:{fit_label:'Closer fit',strengths:['Balanced structure supports the goal.'],watchouts:['Market values can decline.'],scores:{official_risk_fit:90,market_exposure_fit:88,goal_role_fit:84,exposure_breadth:86},goal_fit:{model_version:'goal-fit-v1',score:84,components:{growth:.5,stability:.35,liquidity:.15},summary:'Long-horizon retirement context supports a balanced growth and stability role.'}}};
const vbalInstrument={
 id:matchItem.investment_id,symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio',legal_name:'Vanguard Balanced ETF Portfolio',
 asset_type:'ETF',category:'Asset Allocation',subcategory:'All-in-one',issuer_name:'Vanguard Canada',currency:'CAD',exchange:'TSX',
 price:39.35,mer_pct:.22,yield_pct:2.21,return_1y_pct:13.89,return_3y_annualized_pct:13.73,return_5y_annualized_pct:7.77,
 equity_pct:60,fixed_income_pct:40,risk_level:'Medium',liquidity_level:'high',price_volatility:'low',diversification_level:'diversified',
 data_status:'verified_partial',metrics_as_of_date:'2026-09-14',structure_as_of_date:'2026-07-31',
 profile_summary:'A one-ticket balanced portfolio combining global equities and bonds, designed as a long-term core holding.',
 description:'Approximately 60% equity and 40% fixed income; designed for long-term capital growth with moderate income.',
 profile_objective:'Long-term capital growth with moderate income.',
 profile_benchmark:'FTSE Canada All Cap Index / FTSE Global All Cap ex Canada Index / Bloomberg Global Aggregate Float Adjusted Bond Index (CAD-hedged).',
 profile_key_risks:['Equity market risk','Interest-rate risk','Currency risk','Credit risk'],
 profile_management_style:'Passive index-based allocation with automatic rebalancing.',
 profile_distribution_policy:'Typically quarterly distributions.'
};
const gicInstrument={
 id:'34ebca65-b84e-4e2d-9395-072abb447fcc',symbol:'RBC-GIC-1Y-CASH',name:'RBC 1-Year Cashable GIC',
 asset_type:'GIC',issuer_name:'Royal Bank of Canada',currency:'CAD',deposit_rate_pct:1.95,term_months:12,
 redeemability:'redeemable',deposit_insurance_eligible:true,deposit_insurance_scheme:'CDIC',
 capital_protection:'insured_deposit',liquidity_level:'medium',price_volatility:'none',income_predictability:'high',
 growth_participation:'none',diversification_level:'concentrated',complexity_level:'low',time_structure:'fixed_term',
 principal_protection_basis:'Eligible deposit principal is protected subject to CDIC rules and limits.',
 data_status:'verified_partial',deposit_as_of_date:'2026-09-14',
 description:'A one-year cashable GIC reference product designed to preserve principal while allowing earlier access subject to product terms.'
};
const bondInstrument={
 id:'cd91b07d-41b5-46d1-b311-f33451057c9f',symbol:'GOC-BOND-5Y',name:'Government of Canada 5-Year Benchmark Bond',
 asset_type:'BOND',issuer_name:'Government of Canada',currency:'CAD',coupon_pct:3,yield_to_maturity_pct:3.65,
 maturity_date:'2031-09-01',remaining_term_months:60,capital_protection:'contractual',liquidity_level:'high',
 price_volatility:'medium',income_predictability:'high',growth_participation:'none',interest_rate_sensitivity:'medium',
 credit_exposure:'low',diversification_level:'single_issuer',complexity_level:'medium',time_structure:'fixed_maturity',
 principal_protection_basis:'Face value is repaid at maturity subject to issuer credit risk.',
 data_status:'verified_partial',fixed_income_as_of_date:'2026-09-14',
 description:'Current five-year Government of Canada benchmark-bond reference.'
};
const tbillInstrument={
 id:'3e242851-3263-4d96-a360-3ed79f2f599c',symbol:'GOC-TBILL-3M',name:'Government of Canada 3-Month T-Bill',
 asset_type:'T_BILL',issuer_name:'Government of Canada',currency:'CAD',yield_to_maturity_pct:2.34,
 remaining_term_months:3,discount_instrument:true,capital_protection:'contractual',liquidity_level:'high',
 price_volatility:'very_low',income_predictability:'high',growth_participation:'none',interest_rate_sensitivity:'low',
 credit_exposure:'low',diversification_level:'single_issuer',complexity_level:'low',time_structure:'fixed_maturity',
 principal_protection_basis:'Face value is paid at maturity subject to Government of Canada credit risk.',
 data_status:'verified_partial',fixed_income_as_of_date:'2026-09-14',
 description:'A short-term Government of Canada Treasury Bill reference based on the Bank of Canada secondary-market yield series.'
};
const instrumentById={
 [vbalInstrument.id]:vbalInstrument,
 [gicInstrument.id]:gicInstrument,
 [bondInstrument.id]:bondInstrument,
 [tbillInstrument.id]:tbillInstrument
};

const vbalDna={
 investment_id:matchItem.investment_id,symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio',asset_type:'ETF',category:'Asset Allocation',subcategory:'All-in-one',
 risk_band:'Low to Medium',official_risk_rating:'Low to Medium',official_risk_issuer:'Vanguard Investments Canada Inc.',
 official_risk_source_type:'ETF Facts',official_risk_source_date:'2026-07-16',
 official_risk_source_url:'https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf',
 growth_score:60,income_score:52,stability_score:52,diversification_score:93,liquidity_score:95,complexity_score:0,
 equity_pct:60,fixed_income_pct:40,mer_pct:.22,geographic_scope:'Global',as_of_date:'2026-07-31',
 explanation:{signal_inputs:{meaningful_geographic_regions:3}}
};
const vbalFacts={
 investment_id:matchItem.investment_id,symbol:'VBAL',source_name:'Vanguard Canada',
 etf_facts_url:'https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf',etf_facts_date:'2026-07-16',
 management_fee_pct:.17,mer_pct:.22,summary:'A one-ticket balanced portfolio combining global equities and bonds, designed as a long-term core holding.',
 objective:'Long-term capital growth with moderate income.',asset_mix:{equity:60,fixed_income:40},
 management_style:'Passive index-based allocation with automatic rebalancing.',distribution_policy:'Typically quarterly distributions.',
 fee_source_note:'Management fee is current; MER is the issuer-reported figure and can lag a recent fee cut.'
};
const vbalResearch={
 investment_id:matchItem.investment_id,
 coverage:{data_status:'verified_partial',has_official_facts:true,has_official_risk:true,has_return_1y:true,has_return_3y:true,has_return_5y:true,
  has_sourced_income:true,has_portfolio_characteristics:true,has_complete_exposure_set:false,has_full_holdings_detail:true,holdings_weight_coverage_pct:99.97,
  return_1y_date:'2026-09-10',return_3y_date:'2026-07-31',return_5y_date:'2026-07-31',holdings_date:'2026-08-31',characteristics_date:'2026-07-31'},
 performance:{return_1y_pct:13.89,return_3y_annualized_pct:13.73,return_5y_annualized_pct:7.77,return_1y_as_of_date:'2026-09-10',return_3y_as_of_date:'2026-07-31',return_5y_as_of_date:'2026-07-31',
  return_1y_verification_status:'issuer_linked',return_3y_verification_status:'issuer_linked',return_5y_verification_status:'issuer_linked'},
 characteristics:{number_of_holdings:30948,number_of_stocks:13725,number_of_bonds:17230,yield_to_maturity_pct:4,average_duration_years:6.5,average_credit_quality:'AA-',pe_ratio:20.3,pb_ratio:3.1,roe_pct:14.9,earnings_growth_pct:16.5},
 holdings:{mode:'fund_of_funds_structure',as_of_date:'2026-08-31',weight_coverage_pct:99.97,known_underlying_weight_pct:84.54,items:[
  {holding_symbol:'VUN',holding_name:'Vanguard Morningstar U.S. Total Market Index ETF',weight_pct:27.37,asset_type:'ETF',as_of_date:'2026-08-31',known_investment_id:'5ea92c7f-c804-4410-8674-e7d88b3589b1',known_investment_name:'Vanguard U.S. Total Market Index ETF'},
  {holding_symbol:'VAB',holding_name:'Vanguard Canadian Aggregate Bond Index ETF',weight_pct:22.93,asset_type:'ETF',as_of_date:'2026-08-31',known_investment_id:'fcaa4c7a-f39c-468e-a961-3a638bdcf3ca',known_investment_name:'Vanguard Canadian Aggregate Bond Index ETF'},
  {holding_symbol:'VCN',holding_name:'Vanguard FTSE Canada All Cap Index ETF',weight_pct:18.54,asset_type:'ETF',as_of_date:'2026-08-31',known_investment_id:'b6553e19-67db-44a1-8d7f-59ee7c3a5863',known_investment_name:'Vanguard FTSE Canada All Cap Index ETF'},
  {holding_symbol:'VIU',holding_name:'Vanguard FTSE Developed All Cap ex North America Index ETF',weight_pct:11.05,asset_type:'ETF',as_of_date:'2026-08-31',known_investment_id:'48d70abc-b2be-44da-a118-98a0168c39bc',known_investment_name:'Vanguard FTSE Developed All Cap ex North America Index ETF'}
 ]}
};
const vbalRisk={status:'available',summary:'An asset-allocation ETF with high access to money and high diversification. Loss potential is medium while price movement is low to medium.',as_of_date:'2026-09-14',
 overall_risk:{band:'Low to Medium',confidence:'High'},dominant_risks:[],key_flags:[],dimensions:[
  {code:'loss_potential',level:'Medium',direction:'higher_is_worse',confidence:'High'},
  {code:'price_movement',level:'Low to Medium',direction:'higher_is_worse',confidence:'High'},
  {code:'access_to_money',level:'High',direction:'higher_is_better',confidence:'High'},
  {code:'diversification',level:'High',direction:'higher_is_better',confidence:'High'}
 ]};

function matchPayload(){return contextReady?{status:'available',model_version:'investment-dna-match-v7',goal_model_version:'goal-fit-v1',results:[matchItem],top_matches:[matchItem],alternatives:[],consider:[],mismatch:[],eligible_count:1,universe_count:40,data_as_of:'2026-09-18'}:{status:'context_required',model_version:'investment-dna-match-v7',goal_model_version:'goal-fit-v1',results:[],top_matches:[],alternatives:[],consider:[],mismatch:[],eligible_count:0,universe_count:40,data_as_of:'2026-09-18',context_only_score_policy:'hidden_until_context_complete'}}

async function installMocks(ctx){
 await ctx.route('https://*.supabase.co/**',async route=>{
  const req=route.request();
  const url=req.url();
  const body=req.postDataJSON?.()||{};
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.includes('/auth/v1/user')) return send(authUser);
  if(url.includes('/auth/v1/logout')) return send({});
  if(url.includes('/auth/v1/token')) return send(session);
  if(url.includes('/functions/v1/investing-dna-pilot')){
   if(body.action==='track_event')return send({tracked:true});
   if(body.action==='start')return send({assessment_id:assessmentId,session_token:'visual-audit-capability',account_linked:false,questionnaire_version:'v1.10-cognitive-candidate',model_version:'dna-v1.10-research',language_code:'en'});
   if(body.action==='questionnaire')return send({questions,questionnaire_version:'v1.10-cognitive-candidate'});
   if(body.action==='save_answers')return send({saved:Object.keys(body.answers||{}).length||1});
   if(body.action==='submit')return send({result:dna,quality:dna.quality_profile,fingerprint:{decision_style:'Measured',pressure_style:'Steady',strengths:['evidence_discipline','long_term_orientation'],watchouts:['over_caution']},report:{report:report()},match:matchPayload(),account_linked:false});
   if(body.action==='save_context'){contextReady=true;return send({report:{report:report()},match:matchPayload()})}
   if(body.action==='claim_assessment')return send({claimed:true});
   if(body.action==='submit_feedback')return send({saved:true});
  }
  if(url.includes('/rest/v1/rpc/app_search_investments'))return send([vbalInstrument]);
  if(url.includes('/rest/v1/rpc/app_search_instruments'))return send([
   {id:'a414ecb2-e63f-4127-8009-ea9471723cb9',symbol:'VGRO',name:'Vanguard Growth ETF Portfolio',asset_type:'ETF',issuer_name:'Vanguard Canada',currency:'CAD',mer_pct:.22,equity_pct:80,fixed_income_pct:20,liquidity_level:'high',price_volatility:'low',profile_management_style:'passive',diversification_level:'high',profile_summary:'A growth-oriented one-ticket portfolio with broad global equity exposure and a smaller bond allocation.'},
   {id:'34ebca65-b84e-4e2d-9395-072abb447fcc',symbol:'RBC-GIC-1Y-CASH',name:'RBC 1-Year Cashable GIC',asset_type:'GIC',issuer_name:'Royal Bank of Canada',currency:'CAD',deposit_rate_pct:1.95,term_months:12,redeemability:'redeemable',deposit_insurance_eligible:true,deposit_insurance_scheme:'CDIC',capital_protection:'insured_deposit',liquidity_level:'medium',price_volatility:'none',description:'A one-year cashable GIC reference product designed to preserve principal while allowing earlier access subject to product terms.'},
   {id:'cd91b07d-41b5-46d1-b311-f33451057c9f',symbol:'GOC-BOND-5Y',name:'Government of Canada 5-Year Benchmark Bond',asset_type:'BOND',issuer_name:'Government of Canada',currency:'CAD',coupon_pct:3,yield_to_maturity_pct:3.65,maturity_date:'2031-09-01',capital_protection:'contractual',liquidity_level:'high',price_volatility:'medium',credit_exposure:'low',interest_rate_sensitivity:'medium',description:'Current five-year Government of Canada benchmark-bond reference.'},
   {id:'3e242851-3263-4d96-a360-3ed79f2f599c',symbol:'GOC-TBILL-3M',name:'Government of Canada 3-Month T-Bill',asset_type:'T_BILL',issuer_name:'Government of Canada',currency:'CAD',yield_to_maturity_pct:2.34,capital_protection:'contractual',liquidity_level:'high',price_volatility:'very_low',description:'A short-term Government of Canada Treasury Bill reference based on the Bank of Canada secondary-market yield series.'},
   {id:'3e295468-5d29-4e43-8de8-0089d3736382',symbol:'CA-CP-REF',name:'Canadian Commercial Paper — Research Reference',asset_type:'COMMERCIAL_PAPER',currency:'CAD',capital_protection:'conditional',liquidity_level:'medium',price_volatility:'very_low',description:'Educational reference for Canadian commercial paper. It is not a live quoted issue and intentionally does not display an invented current yield.'}
  ]);
  if(url.includes('/rest/v1/rpc/get_current_investor_app_state'))return send({has_profile:true,assessment_id:assessmentId,dna,report:report(),matches:matchPayload()});
  if(url.includes('/rest/v1/rpc/app_watchlist'))return send({items:[{investment_id:matchItem.investment_id,symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio'}]});
  if(url.includes('/rest/v1/rpc/app_get_instrument_dna'))return send(vbalDna);
  if(url.includes('/rest/v1/rpc/app_get_official_fund_facts'))return send(vbalFacts);
  if(url.includes('/rest/v1/rpc/app_get_investment_research_context'))return send(vbalResearch);
  if(url.includes('/rest/v1/rpc/app_get_product_risk'))return send(body.p_investment_id===vbalInstrument.id?vbalRisk:{status:'unavailable'});
  if(url.includes('/rest/v1/rpc/app_get_instrument'))return send(instrumentById[body.p_investment_id]||vbalInstrument);
  if(url.includes('/rest/v1/rpc/'))return send(null);
  return route.abort();
 });
}

async function shot(page,name){
 await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:true});
}

async function assertMobileShell(page,activeLabel){
 assert.equal(await page.locator('.mobile-app-nav-item').count(),5);
 assert.ok(await page.locator('.mobile-app-nav').isVisible());
 assert.ok(await page.locator('.mobile-app-header').isVisible());
 assert.equal(await page.getByRole('link',{name:activeLabel,exact:true}).getAttribute('aria-current'),'page');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
}

async function runViewport(browser,label,viewport){
 contextReady=false;
 const mobile=label==='mobile';
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1});
 await installMocks(ctx);
 const page=await ctx.newPage();
 page.setDefaultTimeout(20000);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));

 await page.goto(ORIGIN+'/',{waitUntil:'networkidle'});
 if(mobile){
  await page.getByRole('heading',{name:'Know your investor DNA.',exact:true}).waitFor();
  assert.ok(await page.locator('.mobile-home-landing').isVisible());
  assert.equal(await page.locator('.desktop-home-experience:visible').count(),0);
  await assertMobileShell(page,'Home');
 }else{
  assert.ok(await page.locator('.desktop-home-experience').isVisible());
  assert.equal(await page.locator('.mobile-home-landing:visible').count(),0);
 }
 await shot(page,label+'-01-home');

 await page.goto(ORIGIN+'/explore',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:mobile?'Explore':/Research different structures without the jargon\./}).waitFor();
 if(mobile){
  const exploreCard=page.locator('.investment-card-v2').first();
  await exploreCard.waitFor();
  const box=await exploreCard.boundingBox();
  assert.ok(box&&box.height<360);
  assert.ok(await page.locator('.explore-tabs-v2').isVisible());
 }
 await shot(page,label+'-01b-explore');

 await page.goto(ORIGIN+'/investment/'+matchItem.investment_id,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Vanguard Balanced ETF Portfolio',exact:true}).waitFor();
 if(mobile){
  assert.ok((await page.locator('.mobile-research-summary').count())>=5);
  assert.equal(await page.locator('.mobile-research-disclosure-body').first().isVisible(),false);
  await page.locator('.mobile-research-summary').first().click();
  assert.equal(await page.locator('.mobile-research-disclosure-body').first().isVisible(),true);
  await page.locator('.mobile-research-summary').first().click();
 }else{
  await page.getByRole('heading',{name:'How this ETF is allocated',exact:true}).waitFor();
  await page.getByRole('heading',{name:'How this investment behaves under risk',exact:true}).waitFor();
  await page.getByRole('heading',{name:'What we actually know about this fund',exact:true}).waitFor();
 }
 await shot(page,label+'-01c-investment-detail');

 await page.goto(ORIGIN+'/investment/'+gicInstrument.id,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'RBC 1-Year Cashable GIC',exact:true}).waitFor();
 await shot(page,label+'-01d-gic-detail');

 await page.goto(ORIGIN+'/investment/'+bondInstrument.id,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Government of Canada 5-Year Benchmark Bond',exact:true}).waitFor();
 await shot(page,label+'-01e-bond-detail');

 await page.goto(ORIGIN+'/investment/'+tbillInstrument.id,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Government of Canada 3-Month T-Bill',exact:true}).waitFor();
 await shot(page,label+'-01f-tbill-detail');

 await page.goto(ORIGIN+'/dna/assessment',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Start as guest'}).waitFor();
 await shot(page,label+'-02-assessment-intro');

 await page.goto(ORIGIN+'/research/investor-dna',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:/How the 28 answers become an Investor DNA profile/}).waitFor();
 await shot(page,label+'-02b-investor-dna-methodology');
 await page.goto(ORIGIN+'/dna/assessment',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Start as guest'}).waitFor();
 await page.getByRole('button',{name:'Start as guest'}).click();

 await page.getByText('Question 1 of 4',{exact:true}).waitFor();
 if(mobile){
  assert.equal(await page.locator('.mobile-app-nav').count(),0);
  assert.ok(await page.locator('.mobile-app-header').isVisible());
  assert.equal(await page.locator('.platform-nav:visible').count(),0);
  assert.equal(await page.locator('footer.section:visible').count(),0);
 }
 await shot(page,label+'-03-question-1-step-1');
 await page.getByRole('button',{name:'Moderate ups and downs',exact:true}).click();
 await page.getByRole('button',{name:'Next',exact:true}).click();

 await page.getByText('Question 2 of 4',{exact:true}).waitFor();
 await shot(page,label+'-04-question-2-same-step');
 await page.getByRole('button',{name:'Stay measured and wait',exact:true}).click();
 await page.getByRole('button',{name:'Next',exact:true}).click();

 await page.getByText('Question 3 of 4',{exact:true}).waitFor();
 await shot(page,label+'-05-question-3-next-step');
 await page.getByRole('button',{name:'I research widely first',exact:true}).click();
 await page.getByRole('button',{name:'Next',exact:true}).click();

 await page.getByText('Question 4 of 4',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Pause and re-check',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();

 await page.getByRole('heading',{name:'Almost there.'}).waitFor();
 await shot(page,label+'-06-name-age');
 await page.getByLabel('First name').fill('Mahdi');
 await page.getByLabel('Age').fill('35');
 await page.getByRole('button',{name:/See my Investor DNA/}).click();
 await page.waitForURL(url=>url.pathname==='/dna/result');
 await page.getByRole('heading',{name:'ANCHOR',exact:true}).waitFor();
 await shot(page,label+'-07-personal-report');

 await page.goto(ORIGIN+'/dna/context?returnTo=/dna/result',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Investment goal').waitFor();
 await shot(page,label+'-08-goal-context');
 await page.getByLabel('Investment goal').selectOption('retirement');
 await page.getByLabel('When might you first need this money?').selectOption('gt_10y');
 const amount=page.getByLabel('Amount you are considering (CAD) · optional');
 if(await amount.count())await amount.fill('25000');
 await page.getByLabel('How important is quick access?').selectOption('low');
 await page.getByLabel(/must the full amount be protected/i).selectOption('no');
 await page.getByRole('button',{name:/See my personalized insights|Update this goal/}).click();
 await page.waitForURL(url=>url.pathname==='/dna/result');
 await shot(page,label+'-09-applied-report');

 // Seed an authenticated Supabase session for the signed-in dashboard visual.
 await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:'sb-bxjjannguzzzqsamnhem-auth-token',value:session});
 await page.goto(ORIGIN+'/profile',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:mobile?/Good to see you, Mahdi/:/Welcome back, Mahdi/}).waitFor();
 await shot(page,label+'-10-dashboard');

 if(mobile){
  await assertMobileShell(page,'Home');

  await page.goto(ORIGIN+'/match',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Your ETF matches',exact:true}).waitFor();
  await assertMobileShell(page,'DNA');
  await shot(page,label+'-11-match');

  await page.goto(ORIGIN+'/compare',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Compare investments',exact:true}).waitFor();
  await assertMobileShell(page,'Explore');
  await shot(page,label+'-12-compare');

  await page.goto(ORIGIN+'/screener',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'ETF Screener',exact:true}).waitFor();
  await page.getByText('1 ETF shown',{exact:true}).waitFor();
  await assertMobileShell(page,'Explore');
  await shot(page,label+'-13-screener');

  await page.goto(ORIGIN+'/watchlist',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Your watchlist',exact:true}).waitFor();
  await assertMobileShell(page,'Watchlist');
  await shot(page,label+'-14-watchlist');

  // Exercise signed-out edge states without changing product data contracts.
  await page.evaluate(key=>localStorage.removeItem(key),'sb-bxjjannguzzzqsamnhem-auth-token');
  await page.goto(ORIGIN+'/watchlist',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Your watchlist',exact:true}).waitFor();
  await page.getByRole('heading',{name:'A place to come back to',exact:true}).waitFor();
  await assertMobileShell(page,'Watchlist');
  await shot(page,label+'-14b-watchlist-signed-out');

  await page.goto(ORIGIN+'/account',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Your Investing DNA account',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Save your DNA when it becomes useful.',exact:true}).waitFor();
  await assertMobileShell(page,'Profile');
  await shot(page,label+'-14c-account-signed-out');

  await page.goto(ORIGIN+'/profile',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:/Save your Investor DNA|Create your free account or sign in/}).waitFor();
  assert.ok(await page.locator('.auth-card').isVisible());
  const viewportContent=await page.locator('meta[name="viewport"]').getAttribute('content');
  assert.match(viewportContent||'',/viewport-fit=cover/);
  const emailInput=page.getByLabel('Email address');
  assert.ok(parseFloat(await emailInput.evaluate(el=>getComputedStyle(el).fontSize))>=16);
  await assertMobileShell(page,'Home');
  await shot(page,label+'-14d-profile-signed-out');

  await page.goto(ORIGIN+'/explore',{waitUntil:'networkidle'});
  await page.getByLabel('Search investments').fill('zz-no-such-investment');
  await page.getByRole('heading',{name:'No investments match that search',exact:true}).waitFor();
  await assertMobileShell(page,'Explore');
  await shot(page,label+'-14e-explore-empty');

  await page.goto(ORIGIN+'/investment/not-a-valid-id',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Could not load this investment',exact:true}).waitFor();
  await assertMobileShell(page,'Explore');
  await shot(page,label+'-14f-investment-invalid');

  // Restore the authenticated session for the account-state visual.
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:'sb-bxjjannguzzzqsamnhem-auth-token',value:session});
  await page.goto(ORIGIN+'/account',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Your Investing DNA account',exact:true}).waitFor();
  await assertMobileShell(page,'Profile');
  await shot(page,label+'-15-account');
 }

 assert.deepEqual(errors,[]);
 await ctx.close();
}

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  await runViewport(browser,'desktop',{width:1440,height:1000});
  await runViewport(browser,'mobile',{width:390,height:844});
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({generated_at:new Date().toISOString(),origin:ORIGIN,files:fs.readdirSync(OUT).filter(x=>x.endsWith('.png')).sort()},null,2));
  console.log('PASS visual audit screenshots:',fs.readdirSync(OUT).filter(x=>x.endsWith('.png')).length);
 }finally{await browser.close()}
})().catch(error=>{console.error('VISUAL AUDIT FAILED');console.error(error);process.exit(1)});
