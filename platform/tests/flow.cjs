// Uses intercepted backend responses. Never sends email or creates production assessments.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const ORIGIN=process.env.TEST_ORIGIN||'http://localhost:3000';
const path=require('node:path');const fs=require('node:fs');const artifacts=path.join(__dirname,'artifacts');fs.mkdirSync(artifacts,{recursive:true});
const KEY='investing-dna:draft:v1';
const dna={archetype:'MAVERICK',risk_tolerance:56,risk_capacity:64,model_version:'dna-v1.3',behavioral_profile:{loss_aversion:60}};
const questions=[{question_id:'RT01',prompt:'Choose your response',question_type:'single_choice',options:[{value:'A',label:'Stay invested'},{value:'B',label:'Sell'}]},{question_id:'BE01',prompt:'Rate your confidence',question_type:'scale',options:[]}];
const authUser={id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'test@example.com',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
const jwt=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:authUser.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');
const authSession={access_token:jwt,refresh_token:'fake-refresh-token',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:authUser};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});const ctx=await browser.newContext({viewport:{width:390,height:844}});const page=await ctx.newPage();page.setDefaultTimeout(15000);
 const runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(e.message));
 let starts=0,claims=0,saved=false,failSave=true,failClaim=true,failEmail=false;
 await page.route('https://dna-test.supabase.co/**',async route=>{
  const req=route.request(),url=req.url();const body=req.postDataJSON()||{};
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.includes('/auth/v1/otp')) {assert.equal(body.email,'test@example.com');assert.equal(new URL(url).searchParams.get('redirect_to'),ORIGIN+'/profile');return failEmail?send({msg:'Email delivery unavailable'},500):send({});}
  if(url.includes('/auth/v1/user'))return send(authUser);
  if(url.includes('/auth/v1/logout'))return send({});
  if(url.includes('/rest/v1/rpc/get_current_investor_app_state'))return send({has_profile:true,assessment_id:saved?'assessment-1':null,dna:saved?dna:null,report:null});
  if(url.includes('/functions/v1/investing-dna-pilot')){
   if(body.action==='start'){starts++;return send({assessment_id:'assessment-1',session_token:'guest-capability',account_linked:false});}
   if(body.action==='questionnaire')return send({questions});
   if(body.action==='save_answers'){assert.deepEqual(body.answers,[{question_id:'RT01',answer_value:{value:'A'}},{question_id:'BE01',answer_value:{value:'7'}}]);if(failSave){failSave=false;return send({error:'Temporary save error'},503);}return send({saved:2});}
   if(body.action==='submit')return send({result:dna,account_linked:false});
   if(body.action==='claim_assessment'){claims++;assert.equal(req.headers().authorization,'Bearer '+jwt);if(failClaim){failClaim=false;return send({error:'Temporary claim error'},503);}saved=true;return send({claimed:true});}
  }
  throw Error('Unexpected request: '+url);
 });
 const check=(name)=>console.log('PASS '+name);
 await page.goto(ORIGIN+'/dna/assessment');await page.getByRole('button',{name:'Agree and start assessment'}).click();await page.getByRole('button',{name:'Stay invested',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.reload();await page.getByRole('heading',{name:'Rate your confidence'}).waitFor();assert.equal(starts,1);check('refresh resumes existing assessment without creating a second session');
 await page.getByRole('button',{name:'7',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Stay invested',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Next',exact:true}).click();check('back navigation preserves answers and scale has all eleven options');assert.equal(await page.locator('.scale-options button').count(),11);
 await page.getByRole('button',{name:'See my DNA'}).click();await page.getByRole('alert').filter({hasText:'Temporary save error'}).waitFor();await page.getByRole('button',{name:'See my DNA'}).click();await page.waitForURL('**/dna/result');await page.getByRole('heading',{name:'MAVERICK'}).waitFor();assert.match(await page.locator('body').innerText(),/56/);assert.match(await page.locator('body').innerText(),/64/);check('submission uses server answer envelope, can retry save, and displays actual score fields');
 await page.screenshot({path:path.join(artifacts,'result-mobile.png'),fullPage:true});
 await page.reload();await page.getByRole('heading',{name:'MAVERICK'}).waitFor();await page.getByRole('link',{name:'Save my DNA',exact:true}).click();await page.getByLabel('Email address').fill('test@example.com');failEmail=true;await page.getByRole('button',{name:'Email me a sign-in link'}).click();await page.getByRole('alert').filter({hasText:'Email delivery unavailable'}).waitFor();failEmail=false;await page.getByRole('button',{name:'Email me a sign-in link'}).click();await page.getByRole('status').filter({hasText:'Check your email'}).waitFor();assert.ok(await page.evaluate(k=>localStorage.getItem(k),KEY));check('email errors and success are distinct, pending result survives sign-in request');
 // Simulate a successful email session, not real email delivery.
 await page.evaluate(s=>localStorage.setItem('sb-dna-test-auth-token',JSON.stringify(s)),authSession);await page.reload();await page.getByRole('button',{name:'Save this DNA to my account'}).waitFor();assert.equal(claims,0);await page.getByRole('button',{name:'Save this DNA to my account'}).click();await page.getByRole('alert').filter({hasText:'Temporary claim error'}).waitFor();assert.ok(await page.evaluate(k=>localStorage.getItem(k),KEY));check('linking requires explicit consent and retains result when backend rejects claim');
 await page.getByRole('button',{name:'Save this DNA to my account'}).click();await page.getByRole('heading',{name:'MAVERICK'}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null);await page.reload();await page.getByRole('heading',{name:'MAVERICK'}).waitFor();check('confirmed claim clears guest capability and profile reload reads server DNA');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Email address').waitFor();assert.equal(await page.getByRole('heading',{name:'MAVERICK'}).count(),0);check('sign out clears personal result');
 await page.screenshot({path:path.join(artifacts,'profile-mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('mobile profile fits viewport');
 assert.deepEqual(runtimeErrors,[]);check('no browser runtime errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
