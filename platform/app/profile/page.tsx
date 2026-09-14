"use client";
import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import Link from "next/link";
import {supabase,rpc,pilot} from "@/lib/supabase";
import {AppState,Draft,readDraft,clearDraft} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";
export default function Profile(){
 const [user,setUser]=useState<User|null>(null),[state,setState]=useState<AppState|null>(null),[pending,setPending]=useState<Draft|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[email,setEmail]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{let active=true,revision=0;
  async function refresh(u:User|null){const current=++revision;if(!active)return;setUser(u);setState(null);setLoading(true);setError('');const draft=readDraft(u?.id||null);setPending(draft?.result&&!draft.result.account_linked?draft:null);
   try{if(u){const app=await rpc<AppState>('get_current_investor_app_state');if(active&&current===revision)setState(app);}}
   catch(e){if(active&&current===revision)setError(e instanceof Error?e.message:'Could not load your profile.');}finally{if(active&&current===revision)setLoading(false);}}
  if(!supabase){setLoading(false);setError('Account sign-in is not configured yet.');return;}
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{void refresh(s?.user||null)});
  return ()=>{active=false;subscription.unsubscribe()};
 },[retry]);
 async function signIn(e:React.FormEvent){e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');setMessage('');
  try{const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:`${location.origin}/profile`}});if(error)throw error;setMessage('Check your email for a sign-in link. Open it in this browser to keep your assessment available.');}catch(e){setError(e instanceof Error?e.message:'Unable to send a sign-in link.');}finally{setBusy(false)}}
 async function claim(){if(!pending||!user||busy)return;setBusy(true);setError('');setMessage('');
  try{const result=await pilot<{claimed:boolean}>('claim_assessment',pending.session);if(!result.claimed)throw new Error('The service has not confirmed saving your DNA.');clearDraft();setPending(null);setMessage('Your DNA is saved to your account.');setRetry(n=>n+1);}catch(e){setError(e instanceof Error?e.message:'Unable to save. Your result remains on this browser.');}finally{setBusy(false)}}
 async function signOut(){if(!supabase||busy)return;setBusy(true);setError('');try{const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;clearDraft();setPending(null);setState(null);setUser(null);setMessage('You have signed out.');}catch(e){setError(e instanceof Error?e.message:'Unable to sign out.');}finally{setBusy(false)}}
 return <section className="section"><div className="container narrow"><div className="card"><div className="eyebrow">My Investing DNA</div><h1>{user?'Your investor profile':'Keep your DNA with you.'}</h1>
 {loading?<p role="status">Loading your profile…</p>:user?<><p className="muted">{user.email}</p>{pending&&<div className="notice"><h2>Your new DNA is ready to save</h2><p>Save this assessment to {user.email}. It will become your current DNA.</p><button className="btn primary" disabled={busy} onClick={claim}>{busy?'Saving…':'Save this DNA to my account'}</button></div>}
 {state?.dna?<><div className="section compact"><DnaSummary dna={state.dna} report={state.report}/></div><div className="actions"><Link className="btn" href="/dna/result">View my DNA</Link><Link className="btn" href="/watchlist">My watchlist</Link></div></>:state&&!pending?<><p>You do not have a saved DNA yet.</p><Link className="btn primary" href="/dna/assessment">Start / resume assessment</Link></>:null}
 {state?.dna&&!pending&&<div className="notice revisit"><h2>Has something changed?</h2><p>Revisit your DNA when your goals, finances or comfort with risk change.</p><button className="btn" onClick={()=>{clearDraft();location.assign('/dna/assessment')}}>Take a new assessment</button></div>}
 <div className="actions"><button className="btn" disabled={busy} onClick={signOut}>Sign out</button></div></>:<><p className="muted">Sign in or create a free account using an email link. Save your assessment and return to your profile whenever you need it.</p>{pending&&<p className="notice">Your completed DNA is ready on this browser. You can save it after signing in.</p>}<form onSubmit={signIn} className="auth-form"><label htmlFor="email">Email address</label><input id="email" className="field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><button className="btn primary" disabled={busy||!supabase}>{busy?'Sending…':'Email me a sign-in link'}</button></form><p className="fine muted">First time here? This creates your account. Taking the assessment does not require signing in.</p><Link href={pending?'/dna/result':'/dna/assessment'}>{pending?'Back to my result':'Continue without an account'} →</Link></>}
 {message&&<p className="notice" role="status">{message}</p>}{error&&<div className="notice" role="alert"><p>{error}</p>{user&&<button className="btn" onClick={()=>setRetry(n=>n+1)}>Retry loading profile</button>}</div>}
 </div></div></section>;
}
