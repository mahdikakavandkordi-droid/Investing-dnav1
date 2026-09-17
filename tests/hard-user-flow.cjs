const {chromium}=require('playwright');
const assert=require('node:assert/strict');

const ORIGIN=(process.env.TEST_ORIGIN||'http://127.0.0.1:3001').replace(/\/$/,'');
const SHARE_TOKEN=process.env.VERCEL_PREVIEW_SHARE_TOKEN||'';
const EPHEMERAL_RESULT_KEY='investing-dna:result:v1';
const DRAFT_KEY='investing-dna:draft:v2';
const CLAIM_KEY='investing-dna:claim:v1';
const ETF1='11111111-1111-4111-8111-111111111111';
const ETF2='22222222-2222-4222-8222-222222222222';

const archetypes=[
 ['VAULT','VAULT'],['ANCHOR','ANCHOR'],['COOLHAND','COOLHAND'],
 ['SCOUT','SCOUT'],['MAVERICK','MAVERICK'],['STRIKER','STRIKER'],
 ['HOTSHOT','CHARGER'],['HIGHROLLER','PATHFINDER'],['JACKPOT','VANGUARD']
];

const behavioral={
 decision_independence:75,
 long_term_orientation:62,
 reference_flexibility:38,
 evidence_discipline:80,
 emotional_decision_control:55
};

const etf1={id:ETF1,symbol:'AAA',name:'Alpha Broad Market ETF',asset_type:'ETF',risk_level:'Medium',return_1y_pct:8.1,mer_pct:.12,capital_protection:'none',liquidity_level:'high',price_volatility:'medium',income_predictability:'medium',growth_participation:'high',interest_rate_sensitivity:'low',diversification_level:'diversified',complexity_level:'low',data_status:'verified'};
const etf2={id:ETF2,symbol:'BBB',name:'Beta Balanced ETF',asset_type:'ETF',risk_level:'Low to Medium',return_1y_pct:5.4,mer_pct:.2,capital_protection:'none',liquidity_level:'high',price_volatility:'low_to_medium',income_predictability:'medium',growth_participation:'medium',interest_rate_sensitivity:'medium',diversification_level:'diversified',complexity_level:'low',data_status:'verified'};

function row(investment=etf1,score=91){
 return {
  investment_id:investment.id,
  symbol:investment.symbol,
  name:investment.name,
  match_score:score,
  eligibility:'eligible',
  recommendation_tier:'top_match',
  risk_band:investment.risk_level,
  explanation:{
   fit_label:'Closer fit',
   summary:'A context-aware explanation that must never leak into a DNA-only state.',
   strengths:['Broad diversification aligns with the current profile.'],
   watchouts:['Market prices can fall.'],
   scores:{official_risk_fit:90,market_exposure_fit:88,goal_role_fit:86,exposure_breadth:92},
   goal_fit:{model_version:'goal-fit-v1',score:86,summary:'Goal-aware explanation.'}
  }
 };
}

function matchPayload(status='context_required'){
 const first=row(etf1,91),second=row(etf2,84);
 return {
  model_version:'investment-dna-match-v7',
  goal_model_version:'goal-fit-v1',
  status,
  eligible_count:status==='available'?2:0,
  universe_count:40,
  constraints:{context_complete:status!=='context_required'},
  results:[first,second],
  top_matches:[first],
  alternatives:[second],
  consider:[],
  mismatch:[]
 };
}

function dna(archetype,context,withBehavior=true){
 return {
  archetype,
  risk_tolerance:archetype==='VAULT'||archetype==='ANCHOR'||archetype==='COOLHAND'?20:archetype==='SCOUT'||archetype==='MAVERICK'||archetype==='STRIKER'?55:85,
  risk_capacity:archetype==='VAULT'||archetype==='SCOUT'||archetype==='HOTSHOT'?20:archetype==='ANCHOR'||archetype==='MAVERICK'||archetype==='HIGHROLLER'?55:85,
  model_version:'dna-v1.10-research',
  calibration_status:'pre_validation',
  behavioral_profile:withBehavior?behavioral:{},
  quality_profile:{supported:true,consistency_score:82,consistency_label:'high',clarification_recommended:false},
  narrative:{character:'Research profile',summary:'A test profile used to exercise report rendering.',strength:'You tend to use a repeatable decision process.',blind_spot:'Fast-moving markets can still create pressure.'},
  ...(context?{investment_context:context}:{})
 };
}

function draftFor(archetype,status='context_required',context=null,withBehavior=true){
 const d=dna(archetype,context,withBehavior);
 return {
  version:1,
  createdAt:Date.now(),
  ownerId:null,
  session:{assessment_id:'33333333-3333-4333-8333-333333333333',session_token:'hard-test-token',account_linked:false,language_code:'en'},
  answers:{},
  index:0,
  personalization:{first_name:'Mahdi',age:35},
  result:{result:d,report:{report:d},match:matchPayload(status),account_linked:false}
 };
}

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage();
 page.setDefaultTimeout(20000);
 const runtimeErrors=[];
 page.on('pageerror',error=>runtimeErrors.push(error.message));

 await ctx.route('https://*.supabase.co/**',async route=>{
  const req=route.request();
  const url=req.url();
  const body=req.postDataJSON()||{};
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.includes('/auth/v1/user'))return send({message:'No active session'},401);
  if(url.includes('/auth/v1/logout'))return send({});
  if(url.includes('/functions/v1/investing-dna-pilot')){
   if(body.action==='track_event')return send({tracked:true});
   if(body.action==='submit_feedback')return send({saved:true});
   throw new Error('Unexpected Edge action in hard flow: '+body.action);
  }
  if(url.includes('/rest/v1/rpc/app_search_investments'))return send([etf1,etf2]);
  if(url.includes('/rest/v1/rpc/app_search_instruments'))return send([etf1,etf2]);
  if(url.includes('/rest/v1/rpc/app_compare_instruments')){
   const ids=body.p_investment_ids||[];
   return send(ids.map(id=>id===ETF1?etf1:id===ETF2?etf2:null).filter(Boolean));
  }
  if(url.includes('/rest/v1/rpc/app_watchlist'))return send({items:[]});
  throw new Error('Unexpected Supabase request in hard flow: '+url);
 });

 if(SHARE_TOKEN){
  await page.goto(ORIGIN+'/?_vercel_share='+encodeURIComponent(SHARE_TOKEN),{waitUntil:'domcontentloaded'});
  assert.equal(new URL(page.url()).host,new URL(ORIGIN).host,'Protected-preview bootstrap left the target deployment.');
 }

 async function seed(draft){
  await page.goto(ORIGIN+'/privacy',{waitUntil:'domcontentloaded'});
  await page.evaluate(({draftKey,resultKey,claimKey,value})=>{
   localStorage.removeItem(draftKey);
   localStorage.removeItem(claimKey);
   sessionStorage.setItem(resultKey,JSON.stringify(value));
  },{draftKey:DRAFT_KEY,resultKey:EPHEMERAL_RESULT_KEY,claimKey:CLAIM_KEY,value:draft});
 }

 for(const [canonical,display] of archetypes){
  await seed(draftFor(canonical,'context_required'));
  await page.goto(ORIGIN+'/dna/result');
  await page.getByRole('heading',{name:display,exact:true}).waitFor();
  assert.equal((await page.locator('.matrix-cell.active').innerText()).trim(),display,canonical+' matrix highlight');
  const src=decodeURIComponent((await page.locator('.dna-character img').getAttribute('src'))||'');
  assert.match(src,new RegExp(canonical.toLowerCase()+'\\.png'),canonical+' character asset');
  const text=await page.locator('body').innerText();
  assert.doesNotMatch(text,/91\/100|84\/100/,canonical+' leaked stale DNA-only numeric Match');
  assert.match(text,/cognitive & emotional bias signals/i,canonical+' report lost bias section');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),canonical+' mobile horizontal overflow');
 }
 console.log('PASS all 9 archetypes render the right public name, character, matrix cell, bias section and mobile width');

 await seed(draftFor('MAVERICK','context_required',null,false));
 await page.goto(ORIGIN+'/dna/result');
 const noBehaviorText=await page.locator('body').innerText();
 assert.match(noBehaviorText,/Not enough data/i);
 assert.doesNotMatch(noBehaviorText,/Possible signal/i);
 console.log('PASS missing behavioral data stays unavailable instead of inventing a bias signal');

 // Corrupted/stale client state defense: a payload that claims `available` but
 // has no complete money context must not expose numeric or goal-aware output.
 await seed(draftFor('MAVERICK','available'));
 await page.goto(ORIGIN+'/dna/result');
 let text=await page.locator('body').innerText();
 assert.doesNotMatch(text,/91\/100|84\/100/,'Result leaked numeric Match without complete context');
 assert.match(text,/DNA-only|investment context|Tell us what this money is for/i);

 await page.goto(ORIGIN+'/match');
 await page.getByRole('heading',{name:'See how your DNA lines up with ETFs'}).waitFor();
 text=await page.locator('body').innerText();
 assert.doesNotMatch(text,/91\/100|84\/100/,'Match leaked numeric score from stale available state without context');
 assert.match(text,/DNA-only|Add investment context/i);

 await page.goto(ORIGIN+'/screener');
 await page.getByRole('heading',{name:'Find ETFs, then see how they relate to you'}).waitFor();
 text=await page.locator('body').innerText();
 assert.doesNotMatch(text,/91\/100|84\/100/,'Screener leaked numeric score without complete context');
 assert.equal(await page.locator('option[value="dna_desc"]').count(),0,'DNA ranking sort appeared without complete context');

 await page.goto(ORIGIN+`/compare?ids=${ETF1},${ETF2}`);
 await page.getByRole('heading',{name:'Compare Investment DNA side by side'}).waitFor();
 await page.getByText('AAA',{exact:true}).first().waitFor();
 await page.getByText('BBB',{exact:true}).first().waitFor();
 text=await page.locator('body').innerText();
 assert.doesNotMatch(text,/91\/100|84\/100/,'Compare leaked numeric score without complete context');
 console.log('PASS stale available client state cannot bypass the complete-context rule across Result, Match, Screener or Compare');

 const context={first_name:'Mahdi',age:35,goal:'growth',time_horizon:'gt_10y',liquidity_need:'low',principal_required:'no',amount_to_invest:null};
 await seed(draftFor('MAVERICK','available',context));
 await page.goto(ORIGIN+'/dna/result');
 await page.getByText('91').first().waitFor();
 text=await page.locator('body').innerText();
 assert.match(text,/Mahdi, see what your DNA means for this money\./);
 assert.match(text,/91\s*\/100|91\/100/);
 assert.match(text,/same DNA/i);

 await page.goto(ORIGIN+'/match');
 await page.getByText('Context-aware match',{exact:true}).waitFor();
 text=await page.locator('body').innerText();
 assert.match(text,/91\s*\/100|91\/100/);
 assert.match(text,/Long-term growth/i);

 await page.goto(ORIGIN+'/screener');
 await page.getByText(etf1.name,{exact:true}).waitFor();
 assert.equal(await page.locator('option[value="dna_desc"]').count(),1,'Context-aware DNA ranking sort missing');
 text=await page.locator('body').innerText();
 assert.match(text,/91\/100/);

 await page.goto(ORIGIN+`/compare?ids=${ETF1},${ETF2}`);
 await page.getByText('AAA',{exact:true}).first().waitFor();
 await page.getByText('BBB',{exact:true}).first().waitFor();
 text=await page.locator('body').innerText();
 assert.match(text,/91\/100/);
 console.log('PASS complete context unlocks numeric compatibility consistently across the connected ETF surfaces');

 await seed(draftFor('MAVERICK','review_required',context));
 await page.goto(ORIGIN+'/dna/result');
 text=await page.locator('body').innerText();
 assert.match(text,/DNA Match paused/i);
 assert.doesNotMatch(text,/91\/100|84\/100/);
 await page.goto(ORIGIN+'/match');
 text=await page.locator('body').innerText();
 assert.match(text,/Review this money before ranking ETFs/i);
 assert.doesNotMatch(text,/91\/100|84\/100/);
 assert.equal(await page.locator('.match-dna-card').count(),0);
 console.log('PASS review-required remains a true ranking stop even when stale numeric rows are present');

 await page.setViewportSize({width:1366,height:900});
 await seed(draftFor('JACKPOT','available',context));
 await page.goto(ORIGIN+'/dna/result');
 await page.getByRole('heading',{name:'VANGUARD',exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desktop report has horizontal overflow');
 assert.deepEqual(runtimeErrors,[],'Browser runtime errors were observed during hard flow');
 console.log('PASS hard user flow: archetypes + defensive Match states + mobile/desktop + connected ETF surfaces');
 await browser.close();
})().catch(error=>{
 console.error('HARD USER FLOW FAILED');
 console.error(error);
 process.exit(1);
});