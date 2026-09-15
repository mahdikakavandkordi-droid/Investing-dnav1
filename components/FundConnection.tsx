"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {Fit,watchlist,saveFund,removeFund,formatMetric} from '@/lib/investments';
import {finiteSignal} from '@/lib/match';
export function FundConnection({id}:{id:string}){
 const {user,loading}=useAccount();const [saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[fit,setFit]=useState<Fit|null>(null),[error,setError]=useState(''),[fitError,setFitError]=useState(''),[message,setMessage]=useState(''),[retry,setRetry]=useState(0);
 const lock=useRef(false);const owner=useRef(user?.id);owner.current=user?.id;
 useEffect(()=>{let active=true;setFit(null);setSaved(false);setReady(false);setMessage('');setError('');setFitError('');if(!user)return;
 watchlist().then(d=>{if(active){setSaved(d.items.some(x=>x.investment_id===id));setReady(true)}}).catch(e=>{if(active)setError(e.message)});
 rpc<Fit>('app_investment_fit',{p_investment_id:id}).then(d=>{if(active)setFit(d)}).catch(e=>{if(active)setFitError(e.message)});
 return ()=>{active=false};},[id,user?.id,retry]);
 async function toggle(){if(lock.current||!user)return;lock.current=true;setBusy(true);setError('');setMessage('');const uid=user.id;
 try{if(saved){await removeFund(id)}else{const d=await saveFund(id);if(!d.item)throw new Error('Saving was not confirmed. Please try again.');}if(owner.current===uid){setSaved(!saved);setMessage(saved?'Removed from your watchlist.':'Saved to your watchlist.')}}catch(e){if(owner.current===uid)setError(e instanceof Error?e.message:'Could not update your watchlist.')}finally{lock.current=false;setBusy(false)}}
 if(loading)return <div className="card"><p>Loading your account…</p></div>;
 if(!user)return <div className="card"><h2>Keep this fund on your radar</h2><p>Create a free account to save funds and return to your watchlist. Add your DNA when you are ready to see personal compatibility.</p><div className="actions"><Link className="btn primary" href={'/profile?mode=signup&investment='+id}>Create a free account</Link><Link className="btn" href={'/profile?investment='+id}>Sign in</Link></div><p className="muted fine">Browsing fund details and taking the assessment are available without an account.</p></div>;
 return <div className="card"><div className="eyebrow">Connected to your profile</div><h2>This fund and your DNA</h2>
 {fit?.status==='available'&&fit.fit?<>{fit.fit.eligibility==='eligible'&&finiteSignal(fit.fit.match_score)!==null?<div className="kpi">{formatMetric(fit.fit.match_score,' / 100',0)}</div>:<div className="notice"><p>This fund is not currently featured as a suitable match for you.</p><Link href="/dna/context">Review your investment context</Link></div>}<p>{fit.fit.explanation?.fit_label||fit.fit.recommendation_tier.replaceAll('_',' ')}</p>{fit.fit.explanation?.summary&&<p>{fit.fit.explanation.summary}</p>}{fit.fit.explanation?.watchouts?.length?<><h3>What to consider</h3><ul>{fit.fit.explanation.watchouts.filter(x=>typeof x==='string').map((x,i)=><li key={i}>{x}</li>)}</ul></>:null}<p className="muted fine">Based on your saved DNA and available fund data. A compatibility signal, not a recommendation to buy.</p></>:fit?.status==='no_dna'?<><p>Save your Investor DNA to see how this fund relates to your profile.</p><Link href="/dna/assessment" className="btn">Discover my DNA</Link></>:fit?.status==='unavailable'?<p>No compatibility result is available for this fund and your current DNA yet.</p>:!fitError?<p>Loading your DNA connection…</p>:null}
 <div className="actions"><button className="btn primary" onClick={toggle} disabled={busy||!ready}>{busy?'Updating…':saved?'Remove from watchlist':'Save to my watchlist'}</button><Link className="btn" href="/watchlist">Open my watchlist</Link><Link className="btn" href="/profile">My profile</Link></div>
 {message&&<p role="status">{message}</p>}{(error||fitError)&&<div className="notice" role="alert"><p>{error||fitError}</p><button className="btn" onClick={()=>setRetry(x=>x+1)}>Retry connection</button></div>}
 </div>;
}
