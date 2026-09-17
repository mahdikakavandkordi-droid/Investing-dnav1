// Uses intercepted backend responses. Never sends real email or creates production assessments.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');

const ORIGIN=process.env.TEST_ORIGIN||'http://127.0.0.1:3001';
const artifacts=path.join(__dirname,'artifacts');
fs.mkdirSync(artifacts,{recursive:true});
const DRAFT_KEY='investing-dna:draft:v2';
const CLAIM_KEY='investing-dna:claim:v1';
const UUID=/^[0-9a-f-]{36}$/i;
const TEST_COGNITIVE_CODE='TEST-COGNITIVE-CODE';
const ETF_ID='11111111-1111-4111-8111-111111111111';

const dna={
 archetype:'MAVERICK',risk_tolerance:56,risk_capacity:64,model_version:'dna-v1.10-research',calibration_status:'pre_validation',
 behavioral_profile:{decision_independence:75,long_term_orientation:50,reference_flexibility:67,evidence_discipline:75,emotional_decision_control:50},
 experience_profile:{role:'context_only',overall_score:66.67,dimensions:{decision_experience:2,product_exposure:2,downturn_experience:2}},
 quality_profile:{supported:true,consistency_score:83,consistency_label:'high',clarification_recommended:false,conflict_count:0,mixed_count:0},
 narrative:{character:'Independent Builder',summary:'You balance market participation with a measured decision process.',strength:'You tend to test ideas before acting.',blind_spot:'Recent market moves can still add pressure when uncertainty rises.'},
 methodology_note:'Pre-validation research output. Questionnaire wording, cut points and response-consistency rules remain provisional until cognitive testing and a real pilot are completed.'
};
const questions=[
 {question_id:'RT01',section:'risk_tolerance',prompt:'Which balance feels most comfortable?',question_type:'single_choice',options:[{value:'A',label:'Smaller ups and downs'},{value:'B',label:'Moderate ups and downs'},{value:'C',label:'Larger ups and downs'},{value:'D',label:'Very large ups and downs'}]},
 {question_id:'BD01',section:'behavioral_dna',prompt:'How much would someone else’s success increase your interest?',question_type:'single_choice',options:[{value:'A',label:'A lot'},{value:'B',label:'Some'},{value:'C',label:'A little'},{value:'D',label:'Not at all'}]}
];
const etf={id:ETF_ID,symbol:'VFV',name:'Vanguard S&P 500 Index ETF',asset_type:'ETF',risk_level:'Medium',return_1y_pct:12.3,mer_pct:.09};
const dnaOnlyMatch={
 model_version:'investment-dna-match-v7',status:'context_required',eligible_count:1,constraints:{context_complete:false},
 top_matches:[{investment_id:ETF_ID,symbol:'VFV',name:etf.name,match_score:82,eligibility:'eligible',recommendation_tier:'top_match',risk_band:'Medium',explanation:{fit_label:'Closer fit',summary:'A close DNA-only comparison while money context is still missing.',strengths:['Broad equity exposure aligns with your current DNA.'],watchouts:[],scores:{official_risk_fit:90,market_exposure_fit:80,goal_role_fit:50,exposure_breadth:90}}}],alternatives:[],consider:[],mismatch:[]
};
const authUser={id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'test@example.com',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
const testAccess=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:authUser.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage();page.setDefaultTimeout(15000);
 const runtimeErrors=[];page.on('pageerror',error=>runtimeErrors.push(error.message));
 let starts=0,cognitiveStarts=0,claims=0,feedbacks=0,contextSaves=0,saved=false,failSave=true,failClaim=true,failEmail=false;
 const tracked=[];

 await ctx.route('https://dna-test.supabase.co/**',async route=>{
  const req=route.request();const url=req.url();const body=req.postDataJSON()||{};
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.includes('/auth/v1/otp')){assert.equal(body.email,'test@example.com');return failEmail?send({msg:'Email delivery unavailable'},500):send({});}
  if(url.includes('/auth/v1/user')){if(body.data&&typeof body.data==='object')authUser.user_metadata={...authUser.user_metadata,...body.data};return send(authUser);}
  if(url.includes('/auth/v1/logout'))return send({});
  if(url.includes('/rest/v1/rpc/app_watchlist'))return send({items:[]});
  if(url.includes('/rest/v1/rpc/app_search_investments'))return send([etf]);
  if(url.includes('/rest/v1/rpc/get_current_investor_app_state'))return send({has_profile:true,assessment_id:saved?'assessment-1':null,dna:saved?dna:null,report:saved?dna:null,matches:saved?dnaOnlyMatch:null});
  if(url.includes('/functions/v1/investing-dna-pilot')){
   assert.ok(UUID.test(body.browser_session_id));assert.ok(UUID.test(body.visitor_id));
   if(body.action==='track_event'){tracked.push(body.event_name);return send({tracked:true});}
   if(body.action==='submit_feedback'){feedbacks++;assert.equal(body.ease_score,4);assert.equal(body.trust_score,4);assert.equal(body.usefulness_score,5);assert.equal(body.understood_match,true);assert.equal(body.would_return,true);assert.equal(body.assessment_id,'assessment-1');return send({saved:true});}
   if(body.action==='start'){
    if(body.cohort_code==='COGNITIVE_V1_10'){cognitiveStarts++;assert.match(body.consent_version,/cognitive-v1\.10-en/);assert.equal(body.cohort_access_code,TEST_COGNITIVE_CODE);}
    else{starts++;assert.equal(body.cohort_code,'DEV_V1_10');assert.match(body.consent_version,/prepilot-v1\.10-en/);assert.equal(body.cohort_access_code,undefined);}
    return send({assessment_id:'assessment-1',session_token:'guest-capability',account_linked:false,questionnaire_version:'v1.10-cognitive-candidate',model_version:'dna-v1.10-research',language_code:'en'});
   }
   if(body.action==='questionnaire')return send({questions,questionnaire_version:'v1.10-cognitive-candidate'});
   if(body.action==='save_answers'){
    assert.deepEqual(body.answers,[{question_id:'RT01',answer_value:{value:'C'}},{question_id:'BD01',answer_value:{value:'D'}}]);
    if(failSave){failSave=false;return send({error:'Temporary save error'},503);}return send({saved:2});
   }
   if(body.action==='submit')return send({result:dna,quality:dna.quality_profile,fingerprint:{decision_style:'Balanced',pressure_style:'Measured',strengths:['decision_independence'],watchouts:[]},report:{report:{...dna,decision_style:'Balanced',pressure_style:'Measured'}},match:dnaOnlyMatch,account_linked:false});
   if(body.action==='save_context'){
    contextSaves++;assert.equal(body.context.goal,'house_purchase');assert.equal(body.context.time_horizon,'1_3y');assert.equal(body.context.liquidity_need,'medium');assert.equal(body.context.principal_required,'yes');assert.equal(body.context.first_name,'Mahdi');assert.equal(body.context.age,35);
    const investment_context={...body.context};return send({report:{report:{...dna,investment_context}},match:{...dnaOnlyMatch,status:'review_required',constraints:{context_complete:true,reasons:['Principal protection is required for this money.']}}});
   }
   if(body.action==='claim_assessment'){
    claims++;if(failClaim){failClaim=false;return send({error:'Temporary claim error'},503);}saved=true;return send({claimed:true});
   }
  }
  throw Error('Unexpected request: '+url);
 });
 const check=name=>console.log('PASS '+name);

 await page.goto(ORIGIN+'/dna/assessment');
 await page.getByRole('button',{name:'Start as guest'}).waitFor();
 assert.match(await page.locator('body').innerText(),/28 questions/);assert.doesNotMatch(await page.locator('body').innerText(),/Create free account/);
 await page.getByRole('button',{name:'Start as guest'}).click();
 await page.getByRole('button',{name:'Larger ups and downs',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.reload();await page.getByRole('heading',{name:'How much would someone else’s success increase your interest?'}).waitFor();assert.equal(starts,1);check('refresh resumes canonical v1.10 assessment without a second session');
 await page.getByRole('button',{name:'Not at all',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Larger ups and downs',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Next',exact:true}).click();check('back navigation preserves v1.10 answers');

 await page.getByRole('button',{name:/Continue/}).click();
 await page.getByRole('heading',{name:'Almost there.'}).waitFor();
 await page.getByLabel('First name').fill('Mahdi');await page.getByLabel('Age').fill('35');
 await page.getByRole('button',{name:/See my Investor DNA/}).click();await page.getByRole('alert').filter({hasText:'Temporary save error'}).waitFor();
 await page.getByRole('button',{name:/See my Investor DNA/}).click();await page.waitForURL('**/dna/result');await page.getByRole('heading',{name:'MAVERICK'}).waitFor();
 const resultText=await page.locator('body').innerText();assert.match(resultText,/Mahdi/);assert.match(resultText,/age/i);assert.match(resultText,/risk tolerance/i);assert.match(resultText,/financial capacity/i);assert.match(resultText,/Your decision fingerprint/i);assert.match(resultText,/cognitive & emotional bias signals/i);assert.match(resultText,/Worth watching/i);assert.match(resultText,/Educational self-assessment only/i);
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),DRAFT_KEY),null);assert.ok(await page.evaluate(key=>localStorage.getItem(key),CLAIM_KEY));
 const resultContextLink=page.getByRole('link',{name:'Set an investment goal',exact:true});assert.equal(await resultContextLink.getAttribute('href'),'/dna/context?returnTo=/dna/result');
 check('submission retry reaches personalized ephemeral report with bias, strength and watchpoint content while retaining only a claim ticket');

 await page.getByRole('link',{name:'See all DNA matches'}).click();await page.waitForURL(url=>url.pathname==='/match');await page.getByRole('heading',{name:'See how your DNA lines up with ETFs'}).waitFor();await page.getByText('VFV',{exact:true}).first().waitFor();assert.doesNotMatch(await page.locator('body').innerText(),/Sign in to see compatibility/);check('same-session guest can open ETF DNA Match without creating an account');
 await page.getByRole('link',{name:'Add investment context'}).click();await page.waitForURL(url=>url.pathname==='/dna/context'&&url.searchParams.get('returnTo')==='/match');
 await page.getByRole('heading',{name:'Let’s put your DNA into action.'}).waitFor();assert.match(await page.locator('body').innerText(),/Mahdi · Age 35/);
 assert.equal(await page.getByLabel('Investment goal').inputValue(),'');assert.equal(await page.getByLabel('When might you first need this money?').inputValue(),'');assert.equal(await page.getByLabel('How important is quick access?').inputValue(),'');assert.equal(await page.getByLabel(/must the full amount be protected/i).inputValue(),'');assert.equal(await page.getByRole('button',{name:'See my personalized insights'}).isDisabled(),true);
 await page.getByLabel('Investment goal').selectOption('house_purchase');await page.getByLabel('When might you first need this money?').selectOption('1_3y');await page.getByLabel('How important is quick access?').selectOption('medium');await page.getByLabel(/must the full amount be protected/i).selectOption('yes');await page.getByRole('button',{name:'See my personalized insights'}).click();
 await page.waitForURL(url=>url.pathname==='/match');await page.getByRole('heading',{name:'Review this money before ranking ETFs'}).waitFor();assert.equal(contextSaves,1);assert.match(await page.locator('body').innerText(),/Matching paused/i);assert.doesNotMatch(await page.locator('body').innerText(),/82\/100/);check('goal context preserves identity, saves core constraints, and returns to review-required Match');

 await page.getByRole('link',{name:'My DNA',exact:true}).click();await page.waitForURL(url=>url.pathname==='/dna');await page.getByRole('link',{name:'View my current DNA',exact:true}).click();await page.waitForURL(url=>url.pathname==='/dna/result');await page.getByRole('heading',{name:/Mahdi, see what your DNA means for this money\./}).waitFor();assert.match(await page.locator('body').innerText(),/MAVERICK/);assert.match(await page.locator('body').innerText(),/same DNA/i);assert.match(await page.locator('body').innerText(),/DNA Match paused/i);check('applied report keeps personal name, age and archetype while layering goal context');

 const feedback=await ctx.newPage();await feedback.goto(ORIGIN+'/feedback');const groups=feedback.locator('fieldset');await groups.nth(0).getByRole('button',{name:'4',exact:true}).click();await groups.nth(1).getByRole('button',{name:'4',exact:true}).click();await groups.nth(2).getByRole('button',{name:'5',exact:true}).click();await groups.nth(3).getByRole('button',{name:'Yes',exact:true}).click();await groups.nth(4).getByRole('button',{name:'Yes',exact:true}).click();await feedback.getByLabel(/What was confusing or missing/).fill('Clear enough for a pilot test.');await feedback.getByRole('button',{name:'Send pilot feedback'}).click();await feedback.getByRole('heading',{name:/Thank you/}).waitFor();assert.equal(feedbacks,1);await feedback.close();check('structured pilot feedback submits without changing the DNA result');

 await page.getByRole('button',{name:'Save my report'}).click();await page.getByRole('dialog',{name:'Save your Investor DNA'}).waitFor();assert.equal(await page.getByLabel('First name *').inputValue(),'Mahdi');assert.match(await page.locator('.save-modal').innerText(),/Last name \(optional\)/);assert.match(await page.locator('.save-modal').innerText(),/Phone \(optional\)/);
 await page.getByLabel('Email *').fill('test@example.com');await page.getByLabel('Last name (optional)').fill('Kordi');await page.getByLabel('Phone (optional)').fill('+1 709 555 0101');failEmail=true;await page.getByRole('button',{name:'Save & email my report'}).click();await page.getByRole('alert').filter({hasText:'Email delivery unavailable'}).waitFor();failEmail=false;await page.getByRole('button',{name:'Save & email my report'}).click();await page.getByRole('status').filter({hasText:'Check your email'}).waitFor();check('optional account form preserves report identity and collects optional last name and phone before secure-link save');

 const callback=ORIGIN+'/profile?save=dna#access_token='+encodeURIComponent(testAccess)+'&refresh_token='+encodeURIComponent('test-refresh')+'&expires_in=3600&token_type=bearer&type=magiclink';
 await page.goto(callback);await page.getByRole('alert').filter({hasText:'Temporary claim error'}).waitFor();assert.ok(await page.evaluate(key=>localStorage.getItem(key),CLAIM_KEY));await page.getByRole('button',{name:'Save my DNA'}).click();await page.getByRole('heading',{name:'MAVERICK'}).waitFor();assert.equal(claims,2);assert.equal(await page.evaluate(key=>localStorage.getItem(key),CLAIM_KEY),null);assert.equal(authUser.user_metadata.first_name,'Mahdi');assert.equal(authUser.user_metadata.last_name,'Kordi');assert.equal(authUser.user_metadata.phone,'+1 709 555 0101');check('magic-link callback retries claim safely and retains optional account personalization');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Email address').waitFor();check('sign out clears personal profile view');

 await page.goto(ORIGIN+'/pilot/cognitive');await page.getByRole('heading',{name:'Start a clean v1.10 research assessment'}).waitFor();await page.getByLabel('Research invite code').fill(TEST_COGNITIVE_CODE);await page.getByRole('button',{name:'Continue to research assessment'}).click();await page.waitForURL('**/dna/assessment?cohort=COGNITIVE_V1_10');await page.getByText('Cognitive research session · v1.10',{exact:true}).waitFor();await page.getByRole('button',{name:'Start as guest'}).click();await page.getByRole('heading',{name:'Which balance feels most comfortable?'}).waitFor();assert.equal(cognitiveStarts,1);assert.equal(await page.evaluate(()=>sessionStorage.getItem('investing-dna:cognitive-access:v1')),null);check('moderator-gated cognitive entry still starts a clean research assessment');
 assert.ok(tracked.includes('app_session_started'));assert.ok(tracked.includes('dna_result_viewed'));assert.ok(tracked.includes('secure_link_requested'));check('first-party pilot events are emitted with privacy-safe session identifiers');
 await page.screenshot({path:path.join(artifacts,'assessment-v110-mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(runtimeErrors,[]);check('personalized assessment, report, account-save and goal-context flow have no browser runtime errors');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
