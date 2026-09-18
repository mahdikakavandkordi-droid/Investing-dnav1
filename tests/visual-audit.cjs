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

const dna={archetype:'ANCHOR',risk_tolerance:50,risk_capacity:58,model_version:'dna-v1.10-research',calibration_status:'pre_validation',behavioral_profile:{decision_independence:70,long_term_orientation:80,reference_flexibility:60,evidence_discipline:65,emotional_decision_control:75},experience_profile:{role:'context_only',overall_score:62,dimensions:{decision_experience:2,product_exposure:2,downturn_experience:2}},quality_profile:{supported:true,consistency_score:86,consistency_label:'high',clarification_recommended:false,conflict_count:0,mixed_count:0},methodology_note:'Pre-validation research output.'};
let contextReady=false;
function report(){return{...dna,investment_context:contextReady?{goal:'retirement',time_horizon:'gt_10y',amount_to_invest:25000,liquidity_need:'low',principal_required:'no',first_name:'Mahdi',age:35}:undefined}}
const matchItem={investment_id:'48580aac-8147-4054-b99f-5d696ce3ceca',symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio',match_score:84,eligibility:'eligible',recommendation_tier:'top_match',risk_band:'Low to Medium',explanation:{fit_label:'Closer fit',strengths:['Balanced structure supports the goal.'],watchouts:['Market values can decline.'],scores:{official_risk_fit:90,market_exposure_fit:88,goal_role_fit:84,exposure_breadth:86},goal_fit:{model_version:'goal-fit-v1',score:84,components:{growth:.5,stability:.35,liquidity:.15},summary:'Long-horizon retirement context supports a balanced growth and stability role.'}}};
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
  if(url.includes('/rest/v1/rpc/get_current_investor_app_state'))return send({has_profile:true,assessment_id:assessmentId,dna,report:report(),matches:matchPayload()});
  if(url.includes('/rest/v1/rpc/app_watchlist'))return send({items:[{investment_id:matchItem.investment_id,symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio'}]});
  if(url.includes('/rest/v1/rpc/app_get_instrument'))return send({id:matchItem.investment_id,symbol:'VBAL',name:'Vanguard Balanced ETF Portfolio',asset_type:'ETF',currency:'CAD'});
  if(url.includes('/rest/v1/rpc/'))return send(null);
  return route.abort();
 });
}

async function shot(page,name){
 await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:true});
}

async function runViewport(browser,label,viewport){
 contextReady=false;
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1});
 await installMocks(ctx);
 const page=await ctx.newPage();
 page.setDefaultTimeout(20000);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));

 await page.goto(ORIGIN+'/',{waitUntil:'networkidle'});
 await shot(page,label+'-01-home');

 await page.goto(ORIGIN+'/dna/assessment',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Start as guest'}).waitFor();
 await shot(page,label+'-02-assessment-intro');
 await page.getByRole('button',{name:'Start as guest'}).click();

 await page.getByText('Question 1 of 4',{exact:true}).waitFor();
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
 await page.getByLabel('Primary goal').waitFor();
 await shot(page,label+'-08-goal-context');
 await page.getByLabel('Primary goal').selectOption('retirement');
 await page.getByLabel('When might you first need this money?').selectOption('gt_10y');
 const amount=page.getByLabel(/amount/i);
 if(await amount.count())await amount.fill('25000');
 await page.getByLabel('How important is quick access?').selectOption('low');
 await page.getByLabel(/must the full amount be protected/i).selectOption('no');
 await page.getByRole('button',{name:/Use this context/}).click();
 await page.waitForURL(url=>url.pathname==='/dna/result');
 await shot(page,label+'-09-applied-report');

 // Seed an authenticated Supabase session for the signed-in dashboard visual.
 await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:'sb-bxjjannguzzzqsamnhem-auth-token',value:session});
 await page.goto(ORIGIN+'/profile',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:/Welcome back, Mahdi/}).waitFor();
 await shot(page,label+'-10-dashboard');

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
