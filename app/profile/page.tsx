"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase,rpc,pilot} from '@/lib/supabase';
import {readDraft,readClaimTicket,clearDraft} from '@/lib/dna';
import type {AppState,ClaimTicket} from '@/lib/dna';
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
 * This route coordinates optional magic-link auth, guest DNA claim continuity,
 * saved-investment intent and returning account state. Ownership remains
 * server-authoritative; URL IDs and browser state are never proof of ownership.
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
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [listError,setListError]=useState('');
 const [retry,setRetry]=useState(0);
 const [mode,setMode]=useState<'signin'|'signup'>('signin');
 const [autoSave,setAutoSave]=useState(false);
 const [canReturnToResult,setCanReturnToResult]=useState(false);

 // Read the incoming auth/save intent once. The investment itself is public
 // research data; account ownership is checked later by server-side APIs.
 useEffect(()=>{
  const url=new URL(location.href);
  setMode(url.searchParams.get('mode')==='signup'?'signup':'signin');
  setAutoSave(url.searchParams.get('save')==='dna');

  const authError=
   new URLSearchParams(location.hash.slice(1)).get('error_description') ||
   url.searchParams.get('error_description');
  if(authError)setError(authError);

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

 // Load account state and the limited guest claim/recovery state whenever auth
 // identity changes or the user explicitly retries a failed account read.
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

 async function sendMagicLink(event:React.FormEvent){
  event.preventDefault();
  if(!supabase||busy)return;

  setBusy(true);
  setError('');
  setMessage('');

  try{
   const redirect=new URL('/profile',location.origin);
   if(intentId)redirect.searchParams.set('investment',intentId);
   if(pending)redirect.searchParams.set('save','dna');

   const {error:authError}=await supabase.auth.signInWithOtp({
    email:email.trim(),
    options:{
     shouldCreateUser:mode==='signup',
     emailRedirectTo:redirect.toString()
    }
   });
   if(authError)throw authError;

   setMessage(
    mode==='signup'
     ? 'Check your email to confirm your free account.'
     : 'Check your email for a sign-in link.'
   );
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to send an email link.');
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
   setMessage('You have signed out.');
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to sign out.');
  }finally{
   setBusy(false);
  }
 }

 const intentSaved=items.some(item=>item.investment_id===intent?.id);
 const closest=state?.matches?.top_matches?.[0]||state?.matches?.alternatives?.[0];
 const matchStatus=state?.matches?.status;

 return <section className="section">
  <div className="container narrow">
   <div className="card">
    <div className="eyebrow">My Investing DNA</div>
    <h1>{user?'Your investor profile':mode==='signup'?'Create your free account':'Welcome back'}</h1>

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
          mode={mode}
          email={email}
          busy={busy}
          intent={intent}
          intentId={intentId}
          pending={pending}
          canReturnToResult={canReturnToResult}
          onMode={next=>{setMode(next);setError('');setMessage('')}}
          onEmail={setEmail}
          onSubmit={sendMagicLink}
         />}

    {message&&<p className="notice" role="status">{message}</p>}
    {error&&<div className="notice" role="alert">
     <p>{error}</p>
     {user&&<button className="btn" onClick={()=>{setError('');setRetry(value=>value+1)}}>Retry loading profile</button>}
    </div>}
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
 closest:NonNullable<AppState['matches']>['results'] extends (infer T)[]|undefined ? T|undefined : never;
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
   closest={closest as any}
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
        <p>Your account can keep saved investments now. Complete and save your assessment to add personal ETF compatibility.</p>
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

function NextStep({matchStatus,closest,savedCount}:{matchStatus?:string;closest?:any;savedCount:number}){
 let content:React.ReactNode;

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
 mode,email,busy,intent,intentId,pending,canReturnToResult,onMode,onEmail,onSubmit
}:{
 mode:'signin'|'signup';
 email:string;
 busy:boolean;
 intent:Instrument|null;
 intentId:string|null;
 pending:ClaimTicket|null;
 canReturnToResult:boolean;
 onMode:(mode:'signin'|'signup')=>void;
 onEmail:(value:string)=>void;
 onSubmit:(event:React.FormEvent)=>void;
}){
 return <>
  <p className="muted">{mode==='signup'
   ? 'Save investment research and your DNA in one place. You can return from another device after signing in.'
   : 'Sign in with an email link to return to your saved investments and Investing DNA.'}</p>

  <div className="mode-tabs" role="group" aria-label="Account options">
   <button className="btn" aria-pressed={mode==='signin'} onClick={()=>onMode('signin')}>Sign in</button>
   <button className="btn" aria-pressed={mode==='signup'} onClick={()=>onMode('signup')}>Create account</button>
  </div>

  {intent&&<p className="notice">Ready to save: {intent.symbol?`${intent.symbol} — `:''}{intent.name}</p>}
  {pending&&<p className="notice">Your completed assessment can still be attached to an account for a limited time. The guest report itself disappears after refresh.</p>}

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
   <button className="btn primary" disabled={busy||!supabase}>
    {busy?'Sending…':mode==='signup'?'Create my free account':'Email me a sign-in link'}
   </button>
  </form>

  <p className="fine muted">No password needed. If you have an unsaved DNA result, open the email link in this browser so we can attach that assessment to your account.</p>
  {canReturnToResult
   ? <Link href="/dna/result">Back to my one-time report →</Link>
   : <Link href={intentId?'/investment/'+intentId:'/dna/assessment'}>{intentId?'Back to investment':'Continue without an account'} →</Link>}
 </>;
}
