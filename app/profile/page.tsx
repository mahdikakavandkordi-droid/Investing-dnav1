"use client";

import {useEffect,useState} from 'react';
import type {FormEvent,ReactNode} from 'react';
import Link from 'next/link';
import {supabase,rpc,pilot} from '@/lib/supabase';
import {readDraft,readClaimTicket,clearDraft} from '@/lib/dna';
import type {AppState,ClaimTicket,MatchItem} from '@/lib/dna';
import {DnaSummary} from '@/components/DnaSummary';
import {useAccount} from '@/lib/use-account';
import {validId} from '@/lib/investments';
import {
 getInstrument,
 instrumentWatchlist,
 saveInstrument
} from '@/lib/instruments';
import type {Instrument,SavedInstrument} from '@/lib/instruments';

/**
 * Account/retention surface.
 *
 * Email auth is deliberately one path: an existing email signs in and a new
 * email creates an account after confirmation. The user never has to decide
 * which auth mode applies. Ownership remains server-authoritative; URL IDs and
 * browser state are never proof of ownership.
 */
export default function Profile(){
 const {user,loading:authLoading}=useAccount();

 const [state,setState]=useState<AppState|null>(null);
 const [pending,setPending]=useState<ClaimTicket|null>(null);
 const [items,setItems]=useState<SavedInstrument[]>([]);
 const [intent,setIntent]=useState<Instrument|null>(null);
 const [intentId,setIntentId]=useState<string|null>(null);

 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [email,setEmail]=useState('');
 const [sentTo,setSentTo]=useState('');
 const [cooldown,setCooldown]=useState(0);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [listError,setListError]=useState('');
 const [retry,setRetry]=useState(0);
 const [autoSave,setAutoSave]=useState(false);
 const [canReturnToResult,setCanReturnToResult]=useState(false);

 // Read the incoming auth/save intent once. The investment itself is public
 // research data; account ownership is checked later by server-side APIs.
 useEffect(()=>{
  const url=new URL(location.href);
  setAutoSave(url.searchParams.get('save')==='dna');

  const fragment=new URLSearchParams(location.hash.slice(1));
  const authError=fragment.get('error_description') || url.searchParams.get('error_description');
  if(authError){
   setError(friendlyAuthError(authError));

   // Error fragments/search params are safe to remove immediately. Successful
   // access/refresh token fragments are only removed after a real session exists.
   const clean=new URL(location.href);
   clean.searchParams.delete('error');
   clean.searchParams.delete('error_code');
   clean.searchParams.delete('error_description');
   clean.hash='';
   history.replaceState(history.state,'',clean.pathname+clean.search);
  }

  const id=url.searchParams.get('investment');
  if(!validId(id))return;

  setIntentId(id);
  let active=true;
  getInstrument(id)
   .then(data=>{if(active)setIntent(data)})
   .catch(()=>{
    if(active)setError('Could not load the investment you wanted to save. You can return to Explore.');
   });

  return ()=>{active=false};
 },[]);

 // Successful implicit email auth returns access/refresh tokens in the fragment.
 // Only remove them after Supabase has established a real authenticated session.
 useEffect(()=>{
  if(!user||!location.hash)return;
  const fragment=new URLSearchParams(location.hash.slice(1));
  const authKeys=[
   'access_token','refresh_token','expires_in','expires_at','token_type','type',
   'error','error_code','error_description'
  ];
  if(!authKeys.some(key=>fragment.has(key)))return;
  const url=new URL(location.href);
  history.replaceState(history.state,'',url.pathname+url.search);
 },[user?.id]);

 // A visible resend delay prevents accidental bursts that trigger provider rate
 // limits. Provider-wide hourly limits can still be stricter than this cooldown.
 useEffect(()=>{
  if(cooldown<=0)return;
  const timer=window.setInterval(()=>setCooldown(value=>Math.max(0,value-1)),1000);
  return ()=>window.clearInterval(timer);
 },[cooldown>0]);

 // Load account state and limited guest recovery state whenever identity changes.
 useEffect(()=>{
  let active=true;
  setState(null);
  setItems([]);
  setListError('');
  setLoading(true);

  const draft=readDraft(user?.id||null);
  setCanReturnToResult(!!draft?.result);

  const claim=readClaimTicket() || (
   draft?.result&&!draft.result.account_linked
    ? {version:1 as const,createdAt:draft.createdAt,session:draft.session}
    : null
  );
  setPending(claim);

  if(authLoading)return;
  if(!user){
   setLoading(false);
   return;
  }

  rpc<AppState>('get_current_investor_app_state')
   .then(data=>{if(active)setState(data)})
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  instrumentWatchlist()
   .then(data=>{if(active)setItems(data.items)})
   .catch(e=>{if(active)setListError(e.message)});

  return ()=>{active=false};
 },[user?.id,authLoading,retry]);

 // After a magic-link callback, automatically claim only when the URL requested
 // save=dna and a valid limited claim ticket still exists.
 useEffect(()=>{
  if(autoSave&&user&&pending&&!busy){
   setAutoSave(false);
   void claimAssessment();
  }
 },[autoSave,user?.id,pending?.session.assessment_id]);

 async function sendMagicLink(event:FormEvent){
  event.preventDefault();
  if(!supabase||busy||cooldown>0)return;

  const address=email.trim();
  if(!address)return;

  setBusy(true);
  setError('');
  setMessage('');

  try{
   const redirect=new URL('/profile',location.origin);
   if(intentId)redirect.searchParams.set('investment',intentId);
   if(pending)redirect.searchParams.set('save','dna');

   const {error:authError}=await supabase.auth.signInWithOtp({
    email:address,
    options:{
     shouldCreateUser:true,
     emailRedirectTo:redirect.toString()
    }
   });
   if(authError)throw authError;

   setSentTo(address);
   setCooldown(60);
   setMessage('Check your email to confirm your free account or sign in.');
  }catch(e){
   const raw=e instanceof Error?e.message:'Unable to send an email link.';
   const friendly=friendlyAuthError(raw);
   setError(friendly);
   if(/rate limit|too many/i.test(raw))setCooldown(60);
  }finally{
   setBusy(false);
  }
 }

 async function claimAssessment(){
  if(!pending||!user||busy)return;
  setBusy(true);
  setError('');
  setMessage('');

  try{
   const result=await pilot<{claimed:boolean}>('claim_assessment',pending.session);
   if(!result.claimed)throw new Error('The service has not confirmed saving your DNA.');

   clearDraft();
   setPending(null);
   setCanReturnToResult(false);
   setMessage('Your Investing DNA is now saved to your account.');
   setRetry(value=>value+1);
  }catch(e){
   setError(e instanceof Error
    ? e.message
    : 'Unable to save this DNA right now. Your claim link remains available for a limited time.');
  }finally{
   setBusy(false);
  }
 }

 async function saveIncomingInvestment(){
  if(!intent||!user||busy)return;
  setBusy(true);
  setError('');

  try{
   const result=await saveInstrument(intent.id);
   if(!result.item)throw new Error('Saving was not confirmed.');
   setMessage(`${intent.symbol||intent.name} is saved to your watchlist.`);
   setRetry(value=>value+1);
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to save this investment.');
  }finally{
   setBusy(false);
  }
 }

 async function signOut(){
  if(!supabase||busy)return;
  setBusy(true);
  setError('');

  try{
   const {error:authError}=await supabase.auth.signOut({scope:'local'});
   if(authError)throw authError;
   clearDraft();
   setPending(null);
   setState(null);
   setItems([]);
   setSentTo('');
   setCooldown(0);
   setMessage('You have signed out.');
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to sign out.');
  }finally{
   setBusy(false);
  }
 }

 const intentSaved=items.some(item=>item.investment_id===intent?.id);
 const closest:MatchItem|undefined=state?.matches?.top_matches?.[0]||state?.matches?.alternatives?.[0];
 const matchStatus=state?.matches?.status;

 return <section className="section">
  <div className="container narrow">
   <div className="card">
    <div className="eyebrow">My Investor DNA</div>
    <h1>{user?'Your investor profile':'Create your free account or sign in'}</h1>

    {error&&<div className="notice" role="alert">
     <p>{error}</p>
     {user&&<button className="btn" onClick={()=>{setError('');setRetry(value=>value+1)}}>Retry loading profile</button>}
    </div>}

    {authLoading||loading
     ? <p role="status">Loading your profile…</p>
     : user
       ? <SignedInContent
          email={user.email||''}
          intent={intent}
          intentSaved={intentSaved}
          pending={pending}
          state={state}
          items={items}
          listError={listError}
          closest={closest}
          matchStatus={matchStatus}
          busy={busy}
          onSaveIntent={()=>void saveIncomingInvestment()}
          onClaim={()=>void claimAssessment()}
          onRetryList={()=>setRetry(value=>value+1)}
          onSignOut={()=>void signOut()}
         />
       : <SignedOutContent
          email={email}
          sentTo={sentTo}
          cooldown={cooldown}
          busy={busy}
          intent={intent}
          intentId={intentId}
          pending={pending}
          canReturnToResult={canReturnToResult}
          onEmail={value=>{setEmail(value);setError('')}}
          onSubmit={sendMagicLink}
         />}

    {message&&<p className="notice" role="status">{message}</p>}
   </div>
  </div>
 </section>;
}

function SignedInContent({
 email,intent,intentSaved,pending,state,items,listError,closest,matchStatus,busy,
 onSaveIntent,onClaim,onRetryList,onSignOut
}:{
 email:string;
 intent:Instrument|null;
 intentSaved:boolean;
 pending:ClaimTicket|null;
 state:AppState|null;
 items:SavedInstrument[];
 listError:string;
 closest?:MatchItem;
 matchStatus?:string;
 busy:boolean;
 onSaveIntent:()=>void;
 onClaim:()=>void;
 onRetryList:()=>void;
 onSignOut:()=>void;
}){
 return <>
  <p className="muted">{email}</p>

  {intent&&<div className="notice">
   <h2>{intent.name}</h2>
   <p>{intentSaved
    ? 'This investment is in your watchlist.'
    : `Save this investment to ${email} so you can return to it later.`}</p>
   <div className="actions">
    {!intentSaved&&<button className="btn primary" disabled={busy} onClick={onSaveIntent}>Save this investment to my watchlist</button>}
    <Link className="btn" href={'/investment/'+intent.id}>Back to investment</Link>
   </div>
  </div>}

  {pending&&<div className="notice">
   <h2>Your new DNA is ready to save</h2>
   <p>Attach this completed assessment to {email}. The guest report itself is not stored in this browser after a refresh.</p>
   <button className="btn primary" disabled={busy} onClick={onClaim}>{busy?'Saving…':'Save this DNA to my account'}</button>
  </div>}

  {state?.dna&&!pending&&<NextStep
   matchStatus={matchStatus}
   closest={closest}
   savedCount={items.length}
  />}

  <SavedInvestments items={items} listError={listError} onRetry={onRetryList}/>

  {state?.dna
   ? <>
      <div className="section compact"><DnaSummary dna={state.dna} report={state.report}/></div>
      <div className="actions">
       <Link className="btn" href="/dna/result">View my DNA</Link>
       <Link className="btn" href="/match">My ETF matches</Link>
      </div>
     </>
   : state&&!pending
     ? <>
        <h2>Connect your DNA</h2>
        <p>Your account can keep saved investments now. Complete and save your Investing DNA assessment to add personal ETF compatibility.</p>
        <Link className="btn primary" href="/dna/assessment">Start Investing DNA assessment</Link>
       </>
     : null}

  {state?.dna&&!pending&&<div className="notice revisit">
   <h2>Has something changed?</h2>
   <p>Revisit your DNA when your goals, finances or comfort with risk change.</p>
   <button className="btn" onClick={()=>{clearDraft();location.assign('/dna/assessment')}}>Take a new assessment</button>
  </div>}

  <div className="actions">
   <button className="btn" disabled={busy} onClick={onSignOut}>Sign out</button>
  </div>
 </>;
}

function NextStep({matchStatus,closest,savedCount}:{matchStatus?:string;closest?:MatchItem;savedCount:number}){
 let content:ReactNode;

 if(matchStatus==='available'&&closest){
  content=<>
   <h2>Your closest current ETF comparison: {closest.symbol}</h2>
   <p>{closest.name||closest.symbol} is currently {closest.match_score==null?'under review':`${Math.round(closest.match_score)}/100`} on compatibility. Re-open the explanation or compare it with other eligible ETFs.</p>
   <div className="actions">
    <Link className="btn primary" href="/match">Open my matches</Link>
    <Link className="btn" href="/screener">Screen ETFs with my DNA</Link>
   </div>
  </>;
 }else if(matchStatus==='context_required'){
  content=<>
   <h2>Your DNA is saved; your investment context is the missing piece</h2>
   <p>Add the real goal and withdrawal horizon for this money so the product can move from DNA-only comparison to context-aware ETF matching.</p>
   <Link className="btn primary" href="/dna/context">Add investment context</Link>
  </>;
 }else if(matchStatus==='no_suitable_options'){
  content=<>
   <h2>No current ETF passes all of your fit limits</h2>
   <p>The platform kept the no-match state instead of forcing a recommendation. Open Match to see which constraints are creating the gap.</p>
   <Link className="btn primary" href="/match">Understand the no-match result</Link>
  </>;
 }else if(matchStatus==='review_required'){
  content=<>
   <h2>Your ETF match is paused for review</h2>
   <p>A safety or data-review gate is active. Open Match before treating any ETF as personally compatible.</p>
   <Link className="btn primary" href="/match">Review match status</Link>
  </>;
 }else{
  content=<>
   <h2>Your research workspace is ready</h2>
   <p>You have {savedCount} saved investment{savedCount===1?'':'s'}. Continue with your watchlist, Explore the cross-asset universe, or revisit ETF matches.</p>
   <div className="actions">
    <Link className="btn primary" href="/watchlist">Open my watchlist</Link>
    <Link className="btn" href="/explore">Explore investments</Link>
   </div>
  </>;
 }

 return <div className="profile-next">
  <div className="eyebrow">Continue where you left off</div>
  {content}
 </div>;
}

function SavedInvestments({items,listError,onRetry}:{items:SavedInstrument[];listError:string;onRetry:()=>void}){
 return <section className="section compact">
  <h2>My saved investments</h2>
  {listError
   ? <div role="alert"><p>{listError}</p><button className="btn" onClick={onRetry}>Reload saved investments</button></div>
   : items.length
     ? <>
        <p>{items.length} investment{items.length===1?'':'s'} in your watchlist</p>
        {items.slice(0,3).map(item=><p key={item.investment_id}>
         <Link href={'/investment/'+item.investment_id}>{item.symbol?`${item.symbol} — `:''}{item.name} →</Link>
        </p>)}
       </>
     : <p>No saved investments yet. Open an investment and save it to keep it here.</p>}
  <div className="actions">
   <Link className="btn" href="/watchlist">My watchlist</Link>
   <Link className="btn" href="/explore">Explore investments</Link>
  </div>
 </section>;
}

function SignedOutContent({
 email,sentTo,cooldown,busy,intent,intentId,pending,canReturnToResult,onEmail,onSubmit
}:{
 email:string;
 sentTo:string;
 cooldown:number;
 busy:boolean;
 intent:Instrument|null;
 intentId:string|null;
 pending:ClaimTicket|null;
 canReturnToResult:boolean;
 onEmail:(value:string)=>void;
 onSubmit:(event:FormEvent)=>void;
}){
 return <>
  <p className="muted">Enter your email once. If you already have an Investor DNA account, we’ll sign you in. If this is your first time, we’ll create a free account after you confirm your email. No password needed.</p>

  {intent&&<p className="notice">Ready to save: {intent.symbol?`${intent.symbol} — `:''}{intent.name}</p>}
  {pending&&<div className="notice">
   <strong>Your completed Investing DNA assessment is ready to attach.</strong>
   <p>Keep this browser open while you check your email. The limited claim ticket stays available for a short time; the full guest report is not stored after refresh.</p>
  </div>}

  {sentTo&&<div className="notice" role="status">
   <h2>Check your email</h2>
   <p>We sent a secure one-time link to <strong>{sentTo}</strong>.</p>
   <p>Open the <strong>newest</strong> Investor DNA email in this same browser. Each link works once.</p>
   <p className="fine muted">If your mail app opens a different browser, copy the email link and paste it into this browser instead.</p>
  </div>}

  <form onSubmit={onSubmit} className="auth-form">
   <label htmlFor="email">Email address</label>
   <input
    id="email"
    className="field"
    type="email"
    autoComplete="email"
    required
    value={email}
    onChange={event=>onEmail(event.target.value)}
    placeholder="you@example.com"
   />
   <button className="btn primary" disabled={busy||!supabase||cooldown>0}>
    {busy
     ? 'Sending…'
     : cooldown>0
       ? `Send another link in ${cooldown}s`
       : sentTo
         ? 'Send a new secure link'
         : 'Create my free account or sign in'}
   </button>
  </form>

  <p className="fine muted">You do not need to choose between “sign in” and “create account.” We handle that from the email address you enter.</p>
  {canReturnToResult
   ? <Link href="/dna/result">Back to my one-time report →</Link>
   : <Link href={intentId?'/investment/'+intentId:'/dna/assessment'}>{intentId?'Back to investment':'Continue without an account'} →</Link>}
 </>;
}

function friendlyAuthError(raw:string):string {
 const value=raw.replaceAll('+',' ').trim();
 const lower=value.toLowerCase();

 if(lower.includes('invalid')&&lower.includes('expired') || lower.includes('otp_expired') || lower.includes('token has expired')){
  return 'This email link is no longer valid or has already been used. Request one new secure link below and open only the newest email.';
 }
 if(lower.includes('rate limit') || lower.includes('too many')){
  return 'Too many email links were requested recently. Wait a few minutes, then request one new link. Your saved intent is still here.';
 }
 if(lower.includes('email address not authorized')){
  return 'This test environment can only send authentication email to an authorized pilot address right now.';
 }
 return value || 'We could not finish email sign-in. Request a new secure link and try again.';
}
