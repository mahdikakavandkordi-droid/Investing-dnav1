"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useAccount} from "@/lib/use-account";
import {rpc} from "@/lib/supabase";
import {instrumentWatchlist} from "@/lib/instruments";
import type {SavedInstrument} from "@/lib/instruments";
import type {AppState,MatchItem} from "@/lib/dna";
import {hasCompleteInvestmentContext} from "@/lib/dna";
import {displayArchetype} from "@/lib/dna-presentation";
import {openReturningWorkspace} from "@/lib/returning-workspace";
import type {ReturningWorkspaceSummary} from "@/lib/returning-workspace";
import {trackProductEvent} from "@/lib/analytics";
import {useLocale} from "@/lib/locale";

export function HomeWorkspaceReturn(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null);
 const [saved,setSaved]=useState<SavedInstrument[]>([]);
 const [retention,setRetention]=useState<ReturningWorkspaceSummary|null>(null);
 const [loading,setLoading]=useState(true);
 const trackedUser=useRef<string|null>(null);
 const {locale,pick}=useLocale();

 useEffect(()=>{
  let active=true;
  setState(null);
  setSaved([]);
  setRetention(null);
  if(authLoading||!user)return;

  setLoading(true);
  Promise.all([
   rpc<AppState>("get_current_investor_app_state").catch(()=>null),
   instrumentWatchlist().catch(()=>({items:[] as SavedInstrument[]})),
  ]).then(([appState,watchlist])=>{
   if(!active)return;
   setState(appState);
   setSaved(watchlist.items||[]);

   // The return summary is additive. Never hold the core workspace behind a
   // second network boundary after account state and Watchlist are ready.
   if(appState?.has_profile){
    void openReturningWorkspace(user.id)
     .then(summary=>{if(active)setRetention(summary)})
     .catch(()=>{});
   }
  }).finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[user?.id,authLoading]);

 useEffect(()=>{
  if(!user||loading||authLoading||trackedUser.current===user.id)return;
  trackedUser.current=user.id;
  void trackProductEvent("workspace_viewed",{
   metadata:{
    returning:retention?.returning??false,
    new_market_data_count:retention?.new_market_data_count??0,
    match_updated:retention?.match_updated??false
   }
  });
 },[user?.id,loading,authLoading,retention]);

 if(authLoading||!user)return null;

 const metadata=(user.user_metadata||{}) as Record<string,unknown>;
 const firstName=typeof metadata.first_name==="string"?metadata.first_name.trim():"";
 const dna=state?.dna;
 const context=state?.report?.investment_context||dna?.investment_context||null;
 const contextReady=hasCompleteInvestmentContext(context);
 const closest:MatchItem|undefined=
  state?.matches?.top_matches?.[0]||
  state?.matches?.alternatives?.[0]||
  state?.matches?.results?.find(item=>item.eligibility==="eligible");
 const matchReady=state?.matches?.status==="available"&&closest?.match_score!=null;
 const archetype=dna?.archetype?displayArchetype(dna.archetype):null;
 const welcome=firstName?pick("Welcome back, ","Bon retour, ")+firstName:pick("Welcome back","Bon retour");
 const matchLabel=matchReady&&closest
  ? closest.symbol+" · "+Math.round(closest.match_score||0)+"/100"
  : contextReady?pick("Ready to calculate","Prêt à calculer"):pick("Context required","Contexte requis");
 const resume=(target:string)=>void trackProductEvent("workspace_resume_clicked",{metadata:{target}});

 return <section className="home-returning-workspace" aria-label={pick("Your Investor DNA workspace","Votre espace Investor DNA")}>
  <div className="container">
   <div className="home-returning-card">
    <div className="home-returning-head">
     <div>
      <span className="eyebrow">{pick("Your workspace","Votre espace")}</span>
      <h2>{welcome}</h2>
      <p>{loading?pick("Loading your saved research…","Chargement de votre recherche enregistrée…"):pick("Pick up where you left off. Your DNA, goal and saved investments stay connected.","Reprenez là où vous vous êtes arrêté. Votre DNA, votre objectif et vos placements enregistrés restent connectés.")}</p>
     </div>
     <Link className="btn primary" href="/profile" onClick={()=>resume("dashboard")}>{pick("Open dashboard","Ouvrir le tableau de bord")} <span aria-hidden>→</span></Link>
    </div>

    {!loading&&retention?.returning&&<ReturnUpdate summary={retention} locale={locale}/>}

    {!loading&&<div className="home-returning-grid">
     <Link className="home-returning-tile" href="/dna/result" onClick={()=>resume("dna")}>
      <span>Investor DNA</span>
      <strong>{archetype||pick("Not saved yet","Pas encore enregistré")}</strong>
      <small>{dna?pick("View your current profile","Voir votre profil actuel"):pick("Complete the assessment","Terminer l’évaluation")}</small>
     </Link>

     <Link className="home-returning-tile" href="/dna/context?returnTo=/profile" onClick={()=>resume("context")}>
      <span>{pick("Investment context","Contexte du placement")}</span>
      <strong>{contextReady?pick("Ready","Prêt"):pick("Needs context","Contexte requis")}</strong>
      <small>{contextReady?pick("Goal, horizon and access needs saved","Objectif, horizon et besoins d’accès enregistrés"):pick("Add the purpose of this money","Ajouter l’objectif de cet argent")}</small>
     </Link>

     <Link className="home-returning-tile" href="/watchlist" onClick={()=>resume("watchlist")}>
      <span>{pick("Watchlist","Liste de suivi")}</span>
      <strong>{locale==="fr"?`${saved.length} enregistré${saved.length===1?"":"s"}`:`${saved.length} saved`}</strong>
      <small>{saved.length?pick("Revisit your research","Revoir votre recherche"):pick("Save investments to compare later","Enregistrer des placements pour les comparer plus tard")}</small>
     </Link>

     <Link className="home-returning-tile" href={matchReady?"/match":contextReady?"/match":"/dna/context?returnTo=/match"} onClick={()=>resume("match")}>
      <span>DNA Match</span>
      <strong>{matchLabel}</strong>
      <small>{matchReady?pick("Review why it fits","Comprendre la compatibilité"):contextReady?pick("Open your current Match","Ouvrir votre Match actuel"):pick("Add context before numeric matching","Ajouter le contexte avant le score numérique")}</small>
     </Link>
    </div>}
   </div>
  </div>
 </section>;
}

function ReturnUpdate({summary,locale}:{summary:ReturningWorkspaceSummary;locale:"en"|"fr"}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 const newData=summary.new_market_data_count||0;
 const changed=summary.match_updated||summary.assessment_changed;
 const previous=summary.previous_seen_at?formatDateTime(summary.previous_seen_at,locale):null;

 if(newData>0){
  return <div className="home-returning-update" aria-label={pick("Updates since your last visit","Mises à jour depuis votre dernière visite")}>
   <div className="home-returning-update-copy">
    <span className="home-returning-update-kicker">{pick("Since your last visit","Depuis votre dernière visite")}</span>
    <strong>{locale==="fr"?`De nouvelles données de marché sont disponibles pour ${newData} placement${newData===1?"":"s"} enregistré${newData===1?"":"s"}.`:`New market data is ready for ${newData} saved investment${newData===1?"":"s"}.`}</strong>
    <p>{previous?pick("Previous workspace visit: ","Visite précédente : ")+previous+". ":""}{pick("Open your watchlist to review the latest sourced post-close data.","Ouvrez votre liste de suivi pour consulter les plus récentes données sourcées après clôture.")}</p>
   </div>
   {summary.updated_saved_items?.length>0&&<div className="home-returning-update-items">
    {summary.updated_saved_items.slice(0,3).map(item=><span key={item.investment_id}>
     <b>{item.symbol}</b>
     <small>{item.price_date?formatDate(item.price_date,locale):pick("New data","Nouvelles données")}</small>
    </span>)}
   </div>}
   <Link href="/watchlist" className="text-link" onClick={()=>void trackProductEvent("workspace_resume_clicked",{metadata:{target:"market_updates"}})}>{pick("Review updates →","Voir les mises à jour →")}</Link>
  </div>;
 }

 if(changed){
  return <div className="home-returning-update">
   <div className="home-returning-update-copy">
    <span className="home-returning-update-kicker">{pick("Since your last visit","Depuis votre dernière visite")}</span>
    <strong>{pick("Your saved research context has changed.","Le contexte de votre recherche enregistrée a changé.")}</strong>
    <p>{summary.assessment_changed?pick("Your current Investor DNA changed. ","Votre Investor DNA actuel a changé. "):""}{summary.match_updated?pick("Your Match inputs changed and the compatibility view may be different. ","Les données de votre Match ont changé et la vue de compatibilité peut être différente. "):""}{pick("Review the current state before comparing investments.","Revoyez l’état actuel avant de comparer des placements.")}</p>
   </div>
  </div>;
 }

 return <div className="home-returning-update quiet">
  <div className="home-returning-update-copy">
   <span className="home-returning-update-kicker">{pick("Since your last visit","Depuis votre dernière visite")}</span>
   <strong>{pick("You’re caught up.","Vous êtes à jour.")}</strong>
   <p>{previous?pick("Previous workspace visit: ","Visite précédente : ")+previous+". ":""}{pick("No newer saved-investment market data needs your attention.","Aucune donnée de marché plus récente ne nécessite votre attention.")}</p>
  </div>
 </div>;
}

function formatDate(value:string,locale:"en"|"fr"="en"){
 const parsed=new Date(value+"T12:00:00Z");
 if(Number.isNaN(parsed.getTime()))return value;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-CA":"en-CA",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(parsed);
}

function formatDateTime(value:string,locale:"en"|"fr"="en"){
 const parsed=new Date(value);
 if(Number.isNaN(parsed.getTime()))return value;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-CA":"en-CA",{year:"numeric",month:"short",day:"numeric"}).format(parsed);
}
