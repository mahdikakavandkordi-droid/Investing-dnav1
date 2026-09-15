"use client";

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {trackProductEvent} from '@/lib/analytics';
import {instrumentWatchlist,saveInstrument,removeInstrument} from '@/lib/instruments';
import {matchEligible,assetLabel} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';
import type {Fit} from '@/lib/investments';

/**
 * Account/watchlist connection for any research instrument.
 *
 * Saving is asset-neutral. Personalized DNA Match is requested only for asset
 * types marked eligible by the canonical taxonomy (`lib/instrument-model.ts`).
 * This keeps non-ETF research from accidentally displaying a fake/missing fit.
 */
export function InstrumentConnection({id,assetType}:{id:string;assetType?:string|null}){
 const {user,loading}=useAccount();
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const [fit,setFit]=useState<Fit|null>(null);
 const [error,setError]=useState('');
 const [fitError,setFitError]=useState('');
 const [message,setMessage]=useState('');
 const [retry,setRetry]=useState(0);

 const lock=useRef(false);
 const owner=useRef(user?.id);
 owner.current=user?.id;

 const canMatch=matchEligible(assetType);
 const typeLabel=assetLabel(assetType);

 useEffect(()=>{
  let active=true;
  setFit(null);
  setSaved(false);
  setReady(false);
  setMessage('');
  setError('');
  setFitError('');

  if(!user)return;

  instrumentWatchlist()
   .then(data=>{
    if(!active)return;
    setSaved(data.items.some(item=>item.investment_id===id));
    setReady(true);
   })
   .catch(e=>{
    if(active)setError(e.message);
   });

  if(canMatch){
   rpc<Fit>('app_investment_fit',{p_investment_id:id})
    .then(data=>{if(active)setFit(data)})
    .catch(e=>{if(active)setFitError(e.message)});
  }

  return ()=>{active=false};
 },[id,user?.id,retry,canMatch]);

 async function toggleSaved(){
  if(lock.current||!user)return;

  lock.current=true;
  setBusy(true);
  setError('');
  setMessage('');

  const uid=user.id;
  const wasSaved=saved;

  try{
   if(wasSaved){
    await removeInstrument(id);
   }else{
    const result=await saveInstrument(id);
    if(!result.item)throw new Error('Saving was not confirmed. Please try again.');
   }

   // Ignore a stale async response if the signed-in account changed meanwhile.
   if(owner.current===uid){
    setSaved(!wasSaved);
    setMessage(wasSaved?'Removed from your watchlist.':'Saved to your watchlist.');
    void trackProductEvent(wasSaved?'watchlist_removed':'watchlist_saved',{investment_id:id});
   }
  }catch(e){
   if(owner.current===uid){
    setError(e instanceof Error?e.message:'Could not update your watchlist.');
   }
  }finally{
   lock.current=false;
   setBusy(false);
  }
 }

 if(loading){
  return <div className="card"><p>Loading your account…</p></div>;
 }

 if(!user){
  return <div className="card">
   <h2>Keep this {typeLabel.toLowerCase()} on your radar</h2>
   <p>Create a free account to save research items and return to your watchlist.</p>
   <div className="actions">
    <Link className="btn primary" href={'/profile?mode=signup&investment='+id}>Create a free account</Link>
    <Link className="btn" href={'/profile?investment='+id}>Sign in</Link>
   </div>
   <p className="muted fine">Browsing research and taking the Investing DNA assessment are available without an account.</p>
  </div>;
 }

 return <div className="card">
  <div className="eyebrow">Connected to your profile</div>
  <h2>{canMatch?'This ETF and your DNA':'Save this research item'}</h2>

  {canMatch
   ? <EtfFit fit={fit} fitError={fitError}/>
   : <p className="muted">Personalized DNA Match is intentionally disabled for {typeLabel} research in this phase. You can still save it and compare its structure with other investments.</p>}

  <div className="actions">
   <button className="btn primary" onClick={toggleSaved} disabled={busy||!ready}>
    {busy?'Updating…':saved?'Remove from watchlist':'Save to my watchlist'}
   </button>
   <Link className="btn" href="/watchlist">Open my watchlist</Link>
   <Link className="btn" href="/profile">My profile</Link>
  </div>

  {message&&<p role="status">{message}</p>}
  {(error||fitError)&&<div className="notice" role="alert">
   <p>{error||fitError}</p>
   <button className="btn" onClick={()=>setRetry(value=>value+1)}>Retry connection</button>
  </div>}
 </div>;
}

/** ETF-only fit presentation, kept separate from generic save/watchlist UI. */
function EtfFit({fit,fitError}:{fit:Fit|null;fitError:string}){
 if(fit?.status==='available'&&fit.fit){
  const label=fit.fit.explanation?.fit_label||fit.fit.recommendation_tier.replaceAll('_',' ');
  const watchouts=fit.fit.explanation?.watchouts?.filter(item=>typeof item==='string')||[];
  return <>
   <div className="kpi">{formatMetric(fit.fit.match_score,' / 100',0)}</div>
   <p>{label}</p>
   {fit.fit.explanation?.summary&&<p>{fit.fit.explanation.summary}</p>}
   {watchouts.length>0&&<>
    <h3>What to consider</h3>
    <ul>{watchouts.map((item,index)=><li key={index}>{item}</li>)}</ul>
   </>}
   <p className="muted fine">Based on your saved DNA and available ETF data. A compatibility signal, not a recommendation to buy.</p>
  </>;
 }

 if(fit?.status==='no_dna'){
  return <>
   <p>Save your Investing DNA to see ETF compatibility.</p>
   <Link href="/dna/assessment" className="btn">Discover my Investing DNA</Link>
  </>;
 }

 if(fit?.status==='unavailable'){
  return <p>No compatibility result is available for this ETF and your current DNA yet.</p>;
 }

 if(!fitError)return <p>Loading your DNA connection…</p>;
 return null;
}
