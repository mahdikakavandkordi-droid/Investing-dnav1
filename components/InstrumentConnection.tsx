"use client";

import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {trackProductEvent} from '@/lib/analytics';
import {hasCompleteInvestmentContext,readDraft} from '@/lib/dna';
import {effectiveMatchStatus,matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';
import type {MatchItem} from '@/lib/dna';
import {instrumentWatchlist,saveInstrument,removeInstrument} from '@/lib/instruments';
import {matchEligible,assetLabel} from '@/lib/instrument-model';
import type {Fit} from '@/lib/investments';

type GuestMatch={match:MatchItem;status?:string};

/**
 * Account/watchlist connection for any research instrument.
 *
 * Saving is asset-neutral. ETF fit is shown from either the persisted account
 * contract or the current guest-session Match payload. Account creation remains
 * a persistence action rather than a gate to same-session research value.
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
 const guestMatch=useMemo(()=>!user&&canMatch?guestMatchFor(id):null,[id,user,canMatch]);

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
  return <div className="card instrument-connection-card">
   {guestMatch&&<GuestEtfFit guest={guestMatch}/>} 
   <div className={guestMatch?'connection-save-block':''}>
    <h2>{guestMatch?'Save this research for later':`Keep this ${typeLabel.toLowerCase()} on your radar`}</h2>
    <p>Create a free passwordless account only if you want to save research items and return to your watchlist later.</p>
    <div className="actions">
     <Link className="btn primary" href={'/profile?mode=signup&investment='+id}>Save with an account</Link>
     <Link className="btn" href={'/profile?investment='+id}>Already have an account? Sign in</Link>
    </div>
    <p className="muted fine">Browsing research, Investor DNA results and same-session ETF Match stay available without an account.</p>
   </div>
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

function GuestEtfFit({guest}:{guest:GuestMatch}){
 const {match,status}=guest;
 const score=matchScorePresentation(match,status);
 const rowContextOnly=match.eligibility==='context_required'||match.recommendation_tier==='consider';
 const allowExplanation=score.kind!=='review'&&(score.kind!=='context_only'||rowContextOnly);
 const strengths=allowExplanation?(match.explanation?.strengths||match.strengths||[]):[];
 const watchouts=allowExplanation?(match.explanation?.watchouts||match.watchouts||[]):[];

 return <div className="guest-fit-block">
  <div className="eyebrow">Your current-session ETF match</div>
  <div className="kpi">{score.text}</div>
  <strong>{matchFitLabel(match,status)}</strong>
  {allowExplanation&&match.explanation?.summary&&<p>{match.explanation.summary}</p>}
  {strengths.length>0&&<p className="muted fine">{score.kind==='context_only'?'DNA-only alignment':'Why it may fit'}: {strengths[0]}</p>}
  {watchouts.length>0&&<p className="muted fine">What to consider: {watchouts[0]}</p>}
  <p className="muted fine">{score.kind==='context_only'
   ? 'This is a DNA-only comparison. Add complete investment context before a numeric context-aware Match is shown.'
   : score.kind==='review'
     ? 'Personalized ranking is paused while this Match requires review.'
     : 'This is a compatibility signal from your current guest session, not a recommendation to buy.'}</p>
 </div>;
}

/** ETF-only fit presentation for persisted accounts. */
function EtfFit({fit,fitError}:{fit:Fit|null;fitError:string}){
 if(fit?.status==='available'&&fit.fit){
  const score=matchScorePresentation(fit.fit);
  const watchouts=fit.fit.explanation?.watchouts?.filter(item=>typeof item==='string')||[];
  return <>
   <div className="kpi">{score.text}</div>
   <p>{matchFitLabel(fit.fit)}</p>
   {score.kind!=='review'&&fit.fit.explanation?.summary&&<p>{fit.fit.explanation.summary}</p>}
   {score.kind!=='review'&&watchouts.length>0&&<>
    <h3>What to consider</h3>
    <ul>{watchouts.map((item,index)=><li key={index}>{item}</li>)}</ul>
   </>}
   <p className="muted fine">{score.kind==='context_only'
    ? 'Add the goal, horizon, access and principal-protection needs for this money before a numeric Match score is shown.'
    : score.kind==='review'
      ? 'Personalized ranking is paused while this Match requires review.'
      : 'Based on your saved DNA and available ETF data. A compatibility signal, not a recommendation to buy.'}</p>
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

function guestMatchFor(investmentId:string):GuestMatch|null{
 const draft=readDraft(null);
 const payload=draft?.result?.match;
 if(!payload)return null;
 const context=draft?.result?.report?.report?.investment_context||draft?.result?.result.investment_context||null;
 const status=effectiveMatchStatus(payload.status,hasCompleteInvestmentContext(context))||undefined;
 if(status==='context_required'&&payload.status!=='context_required')return null;
 const rows=Array.isArray(payload.results)&&payload.results.length
  ? payload.results
  : [
     ...(payload.top_matches||[]),
     ...(payload.alternatives||[]),
     ...(payload.consider||[]),
     ...(payload.mismatch||[])
    ];
 const match=rows.find(item=>item.investment_id===investmentId);
 return match?{match,status}:null;
}
