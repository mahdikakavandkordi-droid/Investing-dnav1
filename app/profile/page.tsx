"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase,rpc,pilot} from '@/lib/supabase';
import {AppState,ClaimTicket,readDraft,readClaimTicket,clearDraft} from '@/lib/dna';
import {DnaSummary} from '@/components/DnaSummary';
import {useAccount} from '@/lib/use-account';
import {Fund,WatchItem,fund,watchlist,saveFund,validId} from '@/lib/investments';
export default function Profile(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null),[pending,setPending]=useState<ClaimTicket|null>(null),[items,setItems]=useState<WatchItem[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[email,setEmail]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[listError,setListError]=useState('');
 const [retry,setRetry]=useState(0),[mode,setMode]=useState<'signin'|'signup'>('signin'),[intent,setIntent]=useState<Fund|null>(null),[intentId,setIntentId]=useState<string|null>(null),[autoSave,setAutoSave]=useState(false),[canReturnToResult,setCanReturnToResult]=useState(false);
 useEffect(()=>{
  const url=new URL(location.href);setMode(url.searchParams.get('mode')==='signup'?'signup':'signin');setAutoSave(url.searchParams.get('save')==='dna');const id=url.searchParams.get('investment');
  const authError=new URLSearchParams(location.hash.slice(1)).get('error_description')||url.searchParams.get('error_description');
  if(authError)setError(authError);
  if(!validId(id))return;
  setIntentId(id);let active=true;fund(id).then(d=>{if(active)setIntent(d)}).catch(()=>{if(active)setError('Could not load the fund you wanted to save. You can return to Explore.')});return ()=>{active=false;};
 },[]);
 useEffect(()=>{let active=true;setState(null);setItems([]);setListError('');setLoading(true);
  const draft=readDraft(user?.id||null);setCanReturnToResult(!!draft?.result);
  const claim=readClaimTicket()||(draft?.result&&!draft.result.account_linked?{version:1 as const,createdAt:draft.createdAt,session:draft.session}:null);setPending(claim);
  if(authLoading)return;
  if(!user){setLoading(false);return;}
  rpc<AppState>('get_current_investor_app_state').then(d=>{if(active)setState(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  watchlist().then(d=>{if(active)setItems(d.items)}).catch(e=>{if(active)setListError(e.message)});
  return ()=>{active=false;};
 },[user?.id,authLoading,retry]);
 useEffect(()=>{if(autoSave&&user&&pending&&!busy){setAutoSave(false);void claim();}},[autoSave,user?.id,pending?.session.assessment_id]);
 async function signIn(e:React.FormEvent){e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');setMessage('');
  try{const redirect=new URL('/profile',location.origin);if(intentId)redirect.searchParams.set('investment',intentId);if(pending)redirect.searchParams.set('save','dna');
   const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:mode==='signup',emailRedirectTo:redirect.toString()}});if(error)throw error;
   setMessage(mode==='signup'?'Check your email to confirm your free account.':'Check your email for a sign-in link.');
  }catch(e){setError(e instanceof Error?e.message:'Unable to send an email link.')}finally{setBusy(false)}}
 async function claim(){if(!pending||!user||busy)return;setBusy(true);setError('');setMessage('');
  try{const result=await pilot<{claimed:boolean}>('claim_assessment',pending.session);if(!result.claimed)throw new Error('The service has not confirmed saving your DNA.');clearDraft();setPending(null);setCanReturnToResult(false);setMessage('Your Investor DNA is now saved to your account.');setRetry(n=>n+1)}catch(e){setError(e instanceof Error?e.message:'Unable to save this DNA right now. Your claim link remains available for a limited time.')}finally{setBusy(false)}}
 async function saveIntent(){if(!intent||!user||busy)return;setBusy(true);setError('');
  try{const result=await saveFund(intent.id);if(!result.item)throw new Error('Saving was not confirmed.');setMessage(`${intent.symbol} is saved to your watchlist.`);setRetry(n=>n+1)}catch(e){setError(e instanceof Error?e.message:'Unable to save this fund.')}finally{setBusy(false)}}
 async function signOut(){if(!supabase||busy)return;setBusy(true);setError('');try{const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;clearDraft();setPending(null);setState(null);setItems([]);setMessage('You have signed out.')}catch(e){setError(e instanceof Error?e.message:'Unable to sign out.')}finally{setBusy(false)}}
 const intentSaved=items.some(x=>x.investment_id===intent?.id);const closest=state?.matches?.top_matches?.[0]||state?.matches?.alternatives?.[0];const matchStatus=state?.matches?.status;
 return <section className="section"><div className="container narrow"><div className="card"><div className="eyebrow">My Investing DNA</div><h1>{user?'Your investor profile':mode==='signup'?'Create your free account':'Welcome back'}</h1>
 {authLoading||loading?<p role="status">Loading your profile…</p>:user?<>
 <p className="muted">{user.email}</p>
 {intent&&<div className="notice"><h2>{intent.name}</h2><p>{intentSaved?'This fund is in your watchlist.':`Save this fund to ${user.email} so you can return to it later.`}</p><div className="actions">{!intentSaved&&<button className="btn primary" disabled={busy} onClick={saveIntent}>Save this fund to my watchlist</button>}<Link className="btn" href={'/investment/'+intent.id}>Back to fund</Link></div></div>}
 {pending&&<div className="notice"><h2>Your new DNA is ready to save</h2><p>Attach this completed assessment to {user.email}. The guest report itself is not stored in this browser after a refresh.</p><button className="btn primary" disabled={busy} onClick={claim}>{busy?'Saving…':'Save this DNA to my account'}</button></div>}
 {state?.dna&&!pending&&<div className="profile-next"><div className="eyebrow">Continue where you left off</div>{matchStatus==='available'&&closest?<><h2>Your closest current comparison: {closest.symbol}</h2><p>{closest.name||closest.symbol} is currently {closest.match_score==null?'under review':`${Math.round(closest.match_score)}/100`} on compatibility. Re-open the explanation or compare it with other eligible structures.</p><div className="actions"><Link className="btn primary" href="/match">Open my matches</Link><Link className="btn" href="/screener">Screen with my DNA</Link></div></>:matchStatus==='context_required'?<><h2>Your DNA is saved; your investment context is the missing piece</h2><p>Add the real goal and withdrawal horizon for this money so the product can move from DNA-only comparison to context-aware matching.</p><Link className="btn primary" href="/dna/context">Add investment context</Link></>:matchStatus==='no_suitable_options'?<><h2>No current ETF passes all of your fit limits</h2><p>The platform kept the no-match state instead of forcing a recommendation. Open Match to see which constraints are creating the gap.</p><Link className="btn primary" href="/match">Understand the no-match result</Link></>:matchStatus==='review_required'?<><h2>Your match is paused for review</h2><p>A safety or data-review gate is active. Open Match before treating any fund as personally compatible.</p><Link className="btn primary" href="/match">Review match status</Link></>:<><h2>Your research workspace is ready</h2><p>You have {items.length} saved fund{items.length===1?'':'s'}. Continue with your watchlist, screen the universe, or revisit your matches.</p><div className="actions"><Link className="btn primary" href="/watchlist">Open my watchlist</Link><Link className="btn" href="/screener">Screen funds</Link></div></>}</div>}
 <section className="section compact"><h2>My saved funds</h2>{listError?<div role="alert"><p>{listError}</p><button className="btn" onClick={()=>setRetry(n=>n+1)}>Reload saved funds</button></div>:items.length?<><p>{items.length} fund{items.length===1?'':'s'} in your watchlist</p>{items.slice(0,3).map(x=><p key={x.investment_id}><Link href={'/investment/'+x.investment_id}>{x.symbol} — {x.name} →</Link></p>)}</>:<p>No saved funds yet. Open a fund and save it to keep it here.</p>}<div className="actions"><Link className="btn" href="/watchlist">My watchlist</Link><Link className="btn" href="/explore">Explore funds</Link></div></section>
 {state?.dna?<><div className="section compact"><DnaSummary dna={state.dna} report={state.report}/></div><div className="actions"><Link className="btn" href="/dna/result">View my DNA</Link><Link className="btn" href="/match">My DNA matches</Link></div></>:state&&!pending?<><h2>Connect your DNA</h2><p>Your account can keep saved funds now. Complete and save your assessment to add personal compatibility.</p><Link className="btn primary" href="/dna/assessment">Start assessment</Link></>:null}
 {state?.dna&&!pending&&<div className="notice revisit"><h2>Has something changed?</h2><p>Revisit your DNA when your goals, finances or comfort with risk change.</p><button className="btn" onClick={()=>{clearDraft();location.assign('/dna/assessment')}}>Take a new assessment</button></div>}
 <div className="actions"><button className="btn" disabled={busy} onClick={signOut}>Sign out</button></div>
 </>:<>
 <p className="muted">{mode==='signup'?'Save your favorite funds and your DNA in one place. You can return from another device after signing in.':'Sign in with an email link to return to your saved funds and Investor DNA.'}</p>
 <div className="mode-tabs" role="group" aria-label="Account options"><button className="btn" aria-pressed={mode==='signin'} onClick={()=>{setMode('signin');setError('');setMessage('')}}>Sign in</button><button className="btn" aria-pressed={mode==='signup'} onClick={()=>{setMode('signup');setError('');setMessage('')}}>Create account</button></div>
 {intent&&<p className="notice">Ready to save: {intent.symbol} — {intent.name}</p>}
 {pending&&<p className="notice">Your completed assessment can still be attached to an account for a limited time. The guest report itself disappears after refresh.</p>}
 <form onSubmit={signIn} className="auth-form"><label htmlFor="email">Email address</label><input id="email" className="field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><button className="btn primary" disabled={busy||!supabase}>{busy?'Sending…':mode==='signup'?'Create my free account':'Email me a sign-in link'}</button></form>
 <p className="fine muted">No password needed. If you have an unsaved DNA result, open the email link in this browser so we can attach that assessment to your account.</p>{canReturnToResult?<Link href="/dna/result">Back to my one-time report →</Link>:<Link href={intentId?'/investment/'+intentId:'/dna/assessment'}>{intentId?'Back to fund':'Continue without an account'} →</Link>}
 </>}
 {message&&<p className="notice" role="status">{message}</p>}{error&&<div className="notice" role="alert"><p>{error}</p>{user&&<button className="btn" onClick={()=>{setError('');setRetry(n=>n+1)}}>Retry loading profile</button>}</div>}
 </div></div></section>;
}
