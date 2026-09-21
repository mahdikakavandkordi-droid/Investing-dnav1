const {chromium}=require('playwright');
const assert=require('node:assert/strict');

const ORIGIN=process.env.TEST_ORIGIN||'http://127.0.0.1:3001';
const UUID=/^[0-9a-f-]{36}$/i;

const questions=[
 {
  question_id:'RC01',
  section:'risk_capacity',
  prompt:'Thinking about an average month over the next 12 months, what share of the after-tax money available for your household budget would remain after essential costs and required debt payments? Include pay, pension, benefits and planned withdrawals from savings. For irregular income, use a cautious monthly average; do not count borrowing or hoped-for investment gains.',
  question_type:'single_choice',
  options:[
   {value:'low',label:'Less than 10%'},
   {value:'moderate',label:'10% to 25%'}
  ]
 },
 {
  question_id:'RC03',
  section:'risk_capacity',
  prompt:'If the funds you normally use for living costs stopped being available, how long could your accessible emergency money cover essential household expenses without borrowing or selling the investments you are assessing? A separate account is not required: count only money available for emergencies, outside the investments at risk and not already committed to planned spending.',
  question_type:'single_choice',
  options:[
   {value:'short',label:'Less than 3 months'},
   {value:'medium',label:'About 3 to 6 months'}
  ]
 },
 {
  question_id:'EX02',
  section:'investment_experience',
  prompt:'Which types of investments have you personally owned and followed? Select all that apply.',
  question_type:'multi_choice',
  options:[
   {value:'none',label:'I have not invested before'},
   {value:'cash',label:'Cash, savings, or GICs'},
   {value:'funds',label:'Mutual funds or unleveraged ETFs'},
   {value:'stocks',label:'Individual stocks'}
  ]
 }
];

const dna={
 archetype:'MAVERICK',
 risk_tolerance:56,
 risk_capacity:64,
 model_version:'dna-v1.10-research',
 calibration_status:'pre_validation',
 behavioral_profile:{decision_independence:60},
 experience_profile:{role:'context_only',overall_score:50,dimensions:{product_exposure:2}},
 quality_profile:{supported:true,consistency_score:90,consistency_label:'high'},
 methodology_note:'Pre-validation research output.'
};

(async()=>{
 const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.CHROME_BIN||undefined,
  args:['--no-sandbox','--disable-dev-shm-usage']
 });
 for(const personalization of ['both','name','age','neither']){
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage();
 page.setDefaultTimeout(15000);

 let saveCalls=0;
 let submitCalls=0;
 const runtimeErrors=[];
 page.on('pageerror',error=>runtimeErrors.push(error.message));

 await ctx.route('https://dna-test.supabase.co/**',async route=>{
  const req=route.request();
  const url=req.url();
  const body=req.postDataJSON()||{};
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});

  if(url.includes('/functions/v1/investor-dna-report')){
   if(body.action==='status')return send({email_pdf_enabled:false});
   throw Error('Unexpected report action: '+body.action);
  }
  if(url.includes('/functions/v1/investing-dna-pilot')){
   assert.ok(UUID.test(body.browser_session_id));
   assert.ok(UUID.test(body.visitor_id));

   if(body.action==='track_event')return send({tracked:true});
   if(body.action==='start'){
    assert.equal(body.cohort_code,'DEV_V1_10_CLARITY');
    return send({
     assessment_id:'assessment-multi-1',
     session_token:'guest-capability',
     account_linked:false,
     questionnaire_version:'v1.10-clarity-1',
     model_version:'dna-v1.10-research',
     language_code:'en'
    });
   }
   if(body.action==='questionnaire'){
    return send({questions,questionnaire_version:'v1.10-clarity-1'});
   }
   if(body.action==='save_answers'){
    saveCalls++;
    assert.deepEqual(body.answers,[
     {question_id:'RC01',answer_value:{value:'moderate'}},
     {question_id:'RC03',answer_value:{value:'medium'}},
     {question_id:'EX02',answer_value:{value:['cash','funds']}}
    ]);
    return send({saved:2});
   }
   if(body.action==='submit'){
    submitCalls++;
    return send({
     result:dna,
     report:{report:dna},
     account_linked:false,
     quality:dna.quality_profile
    });
   }
  }

  if(url.includes('/auth/v1/'))return send({});
  throw Error('Unexpected request: '+url);
 });

 await page.goto(ORIGIN+'/dna/assessment');
 await page.getByRole('button',{name:'Start as guest'}).click();

 await page.getByRole('heading',{name:/Thinking about an average month over the next 12 months/}).waitFor();
 await page.getByText(/Include pay, pension, benefits and planned withdrawals from savings/).waitFor();
 assert.equal(await page.locator('progress').getAttribute('value'),'0');
 await page.getByRole('button',{name:'10% to 25%',exact:true}).click();
 assert.equal(await page.locator('progress').getAttribute('value'),'1');
 await page.getByRole('button',{name:'Next',exact:true}).click();

 await page.getByRole('heading',{name:/If the funds you normally use for living costs stopped being available/}).waitFor();
 await page.getByText(/A separate account is not required/).waitFor();
 assert.equal(await page.locator('progress').getAttribute('value'),'1');
 await page.getByRole('button',{name:'About 3 to 6 months',exact:true}).click();
 assert.equal(await page.locator('progress').getAttribute('value'),'2');
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByRole('heading',{name:/Which types of investments/}).waitFor();

 assert.equal(await page.locator('progress').getAttribute('value'),'2');
 await page.getByRole('button',{name:'I have not invested before',exact:true}).click();
 assert.equal(await page.locator('progress').getAttribute('value'),'3');
 assert.equal(await page.getByRole('button',{name:'I have not invested before',exact:true}).getAttribute('aria-pressed'),'true');

 await page.getByRole('button',{name:'Cash, savings, or GICs',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'I have not invested before',exact:true}).getAttribute('aria-pressed'),'false');
 assert.equal(await page.getByRole('button',{name:'Cash, savings, or GICs',exact:true}).getAttribute('aria-pressed'),'true');

 await page.getByRole('button',{name:'Mutual funds or unleveraged ETFs',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Cash, savings, or GICs',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await page.getByRole('button',{name:'Mutual funds or unleveraged ETFs',exact:true}).getAttribute('aria-pressed'),'true');

 await page.getByRole('button',{name:/Continue/}).click();
 await page.getByRole('heading',{name:'Almost there.'}).waitFor();
 assert.equal(await page.getByRole('button',{name:/See my Investor DNA/}).isEnabled(),true);
 await page.getByLabel('Age').fill('17');
 assert.equal(await page.getByRole('button',{name:/See my Investor DNA/}).isEnabled(),false);
 await page.getByLabel('Age').fill('');
 if(personalization==='both'||personalization==='name')await page.getByLabel('First name').fill('Mahdi');
 if(personalization==='both'||personalization==='age')await page.getByLabel('Age').fill('35');
 await page.getByRole('button',{name:/See my Investor DNA/}).click();
 await page.waitForURL('**/dna/result');
 await page.getByRole('heading',{name:'MAVERICK'}).waitFor();
 if(personalization==='both'||personalization==='name')assert.match(await page.locator('body').innerText(),/Mahdi/);

 assert.equal(saveCalls,1);
 assert.equal(submitCalls,1);
 assert.deepEqual(runtimeErrors,[]);
 console.log('PASS answered progress, exclusive multi-choice, optional personalization: '+personalization);
 await ctx.close();
 }

 await browser.close();
})().catch(error=>{
 console.error(error);
 process.exitCode=1;
});
