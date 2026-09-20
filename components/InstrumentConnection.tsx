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
import {useLocale} from '@/lib/locale';

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
 const {pick}=useLocale();

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
    if(!result.item)throw new Error(pick('Saving was not confirmed. Please try again.','L’enregistrement n’a pas été confirmé. Réessayez.'));
   }

   if(owner.current===uid){
    setSaved(!wasSaved);
    setMessage(wasSaved?pick('Removed from your watchlist.','Retiré de votre liste de suivi.'):pick('Saved to your watchlist.','Enregistré dans votre liste de suivi.'));
    void trackProductEvent(wasSaved?'watchlist_removed':'watchlist_saved',{investment_id:id});
   }
  }catch(e){
   if(owner.current===uid){
    setError(e instanceof Error?e.message:pick('Could not update your watchlist.','Impossible de mettre à jour votre liste de suivi.'));
   }
  }finally{
   lock.current=false;
   setBusy(false);
  }
 }

 if(loading){
  return <div className="card"><p>{pick("Loading your account…","Chargement de votre compte…")}</p></div>;
 }

 if(!user){
  return <div className="card instrument-connection-card">
   {guestMatch&&<GuestEtfFit guest={guestMatch}/>} 
   <div className={guestMatch?'connection-save-block':''}>
    <h2>{guestMatch?pick('Save this research for later','Enregistrer cette recherche pour plus tard'):(pick('Keep this','Garder ce')+' '+typeLabel.toLowerCase()+' '+pick('on your radar','à surveiller'))}</h2>
    <p>{pick("Create a free passwordless account only if you want to save research items and return to your watchlist later.","Créez un compte gratuit sans mot de passe seulement si vous souhaitez enregistrer des recherches et revenir à votre liste de suivi plus tard.")}</p>
    <div className="actions">
     <Link className="btn primary" href={'/profile?mode=signup&investment='+id}>{pick("Save with an account","Enregistrer avec un compte")}</Link>
     <Link className="btn" href={'/profile?investment='+id}>{pick("Already have an account? Sign in","Vous avez déjà un compte? Connexion")}</Link>
    </div>
    <p className="muted fine">{pick("Browsing research, Investor DNA results and same-session ETF Match stay available without an account.","La recherche, les résultats Investor DNA et le Match FNB de la session restent disponibles sans compte.")}</p>
   </div>
  </div>;
 }

 return <div className="card">
  <div className="eyebrow">{pick("Connected to your profile","Connecté à votre profil")}</div>
  <h2>{canMatch?pick('This ETF and your DNA','Ce FNB et votre DNA'):pick('Save this research item','Enregistrer cette recherche')}</h2>

  {canMatch
   ? <EtfFit fit={fit} fitError={fitError}/>
   : <p className="muted">{pick("Personalized DNA Match is intentionally disabled for","DNA Match personnalisé est volontairement désactivé pour")} {typeLabel} {pick("research in this phase. You can still save it and compare its structure with other investments.","à cette étape. Vous pouvez tout de même l’enregistrer et comparer sa structure avec d’autres placements.")}</p>}

  <div className="actions">
   <button className="btn primary" onClick={toggleSaved} disabled={busy||!ready}>
    {busy?pick('Updating…','Mise à jour…'):saved?pick('Remove from watchlist','Retirer de la liste'):pick('Save to my watchlist','Enregistrer dans ma liste')}
   </button>
   <Link className="btn" href="/watchlist">{pick("Open my watchlist","Ouvrir ma liste de suivi")}</Link>
   <Link className="btn" href="/profile">{pick("My profile","Mon profil")}</Link>
  </div>

  {message&&<p role="status">{message}</p>}
  {(error||fitError)&&<div className="notice" role="alert">
   <p>{error||fitError}</p>
   <button className="btn" onClick={()=>setRetry(value=>value+1)}>{pick("Retry connection","Réessayer la connexion")}</button>
  </div>}
 </div>;
}

function GuestEtfFit({guest}:{guest:GuestMatch}){
 const {pick}=useLocale();
 const {match,status}=guest;
 const score=matchScorePresentation(match,status);
 const rowContextOnly=match.eligibility==='context_required'||match.recommendation_tier==='consider';
 const allowExplanation=score.kind!=='review'&&(score.kind!=='context_only'||rowContextOnly);
 const strengths=allowExplanation?(match.explanation?.strengths||match.strengths||[]):[];
 const watchouts=allowExplanation?(match.explanation?.watchouts||match.watchouts||[]):[];

 return <div className="guest-fit-block">
  <div className="eyebrow">{pick("Your current-session ETF match","Votre Match FNB de la session actuelle")}</div>
  <div className="kpi">{score.text}</div>
  <strong>{matchFitLabel(match,status)}</strong>
  {allowExplanation&&match.explanation?.summary&&<p>{match.explanation.summary}</p>}
  {strengths.length>0&&<p className="muted fine">{score.kind==='context_only'?pick('DNA-only alignment','Alignement DNA seulement'):pick('Why it may fit','Pourquoi cela peut convenir')}: {strengths[0]}</p>}
  {watchouts.length>0&&<p className="muted fine">{pick("What to consider","À considérer")}: {watchouts[0]}</p>}
  <p className="muted fine">{score.kind==='context_only'
   ? pick('This is a DNA-only comparison. Add complete investment context before a numeric context-aware Match is shown.','Il s’agit d’une comparaison basée uniquement sur le DNA. Ajoutez un contexte de placement complet avant d’afficher un Match numérique tenant compte du contexte.')
   : score.kind==='review'
     ? pick('Personalized ranking is paused while this Match requires review.','Le classement personnalisé est suspendu pendant que ce Match nécessite une révision.')
     : pick('This is a compatibility signal from your current guest session, not a recommendation to buy.','Il s’agit d’un signal de compatibilité de votre session invitée actuelle, et non d’une recommandation d’achat.')}</p>
 </div>;
}

/** ETF-only fit presentation for persisted accounts. */
function EtfFit({fit,fitError}:{fit:Fit|null;fitError:string}){
 const {pick}=useLocale();
 if(fit?.status==='available'&&fit.fit){
  const score=matchScorePresentation(fit.fit);
  const watchouts=fit.fit.explanation?.watchouts?.filter(item=>typeof item==='string')||[];
  return <>
   <div className="kpi">{score.text}</div>
   <p>{matchFitLabel(fit.fit)}</p>
   {score.kind!=='review'&&fit.fit.explanation?.summary&&<p>{fit.fit.explanation.summary}</p>}
   {score.kind!=='review'&&watchouts.length>0&&<>
    <h3>{pick("What to consider","À considérer")}</h3>
    <ul>{watchouts.map((item,index)=><li key={index}>{item}</li>)}</ul>
   </>}
   <p className="muted fine">{score.kind==='context_only'
    ? pick('Add the goal, horizon, access and principal-protection needs for this money before a numeric Match score is shown.','Ajoutez l’objectif, l’horizon, les besoins d’accès et de protection du capital avant d’afficher un score Match numérique.')
    : score.kind==='review'
      ? pick('Personalized ranking is paused while this Match requires review.','Le classement personnalisé est suspendu pendant que ce Match nécessite une révision.')
      : pick('Based on your saved DNA and available ETF data. A compatibility signal, not a recommendation to buy.','Fondé sur votre DNA enregistré et les données FNB disponibles. Il s’agit d’un signal de compatibilité, pas d’une recommandation d’achat.')}</p>
  </>;
 }

 if(fit?.status==='no_dna'){
  return <>
   <p>{pick("Save your Investing DNA to see ETF compatibility.","Enregistrez votre Investing DNA pour voir la compatibilité avec les FNB.")}</p>
   <Link href="/dna/assessment" className="btn">{pick("Discover my Investing DNA","Découvrir mon Investing DNA")}</Link>
  </>;
 }

 if(fit?.status==='unavailable'){
  return <p>{pick("No compatibility result is available for this ETF and your current DNA yet.","Aucun résultat de compatibilité n’est encore disponible pour ce FNB et votre DNA actuel.")}</p>;
 }

 if(!fitError)return <p>{pick("Loading your DNA connection…","Chargement de votre connexion DNA…")}</p>;
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
