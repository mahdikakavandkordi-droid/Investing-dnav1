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

export function HomeWorkspaceReturn(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null);
 const [saved,setSaved]=useState<SavedInstrument[]>([]);
 const [retention,setRetention]=useState<ReturningWorkspaceSummary|null>(null);
 const [loading,setLoading]=useState(false);
 const trackedUser=useRef<string|null>(null);

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
 const welcome=firstName?"Welcome back, "+firstName:"Welcome back";
 const matchLabel=matchReady&&closest
  ? closest.symbol+" · "+Math.round(closest.match_score||0)+"/100"
  : contextReady?"Ready to calculate":"Context required";
 const resume=(target:string)=>void trackProductEvent("workspace_resume_clicked",{metadata:{target}});

 return <section className="home-returning-workspace" aria-label="Your Investor DNA workspace">
  <div className="container">
   <div className="home-returning-card">
    <div className="home-returning-head">
     <div>
      <span className="eyebrow">Your workspace</span>
      <h2>{welcome}</h2>
      <p>{loading?"Loading your saved research…":"Pick up where you left off. Your DNA, goal and saved investments stay connected."}</p>
     </div>
     <Link className="btn primary" href="/profile" onClick={()=>resume("dashboard")}>Open dashboard <span aria-hidden>→</span></Link>
    </div>

    {!loading&&retention?.returning&&<ReturnUpdate summary={retention}/>}

    {!loading&&<div className="home-returning-grid">
     <Link className="home-returning-tile" href="/dna/result" onClick={()=>resume("dna")}>
      <span>Investor DNA</span>
      <strong>{archetype||"Not saved yet"}</strong>
      <small>{dna?"View your current profile":"Complete the assessment"}</small>
     </Link>

     <Link className="home-returning-tile" href="/dna/context?returnTo=/profile" onClick={()=>resume("context")}>
      <span>Investment context</span>
      <strong>{contextReady?"Ready":"Needs context"}</strong>
      <small>{contextReady?"Goal, horizon and access needs saved":"Add the purpose of this money"}</small>
     </Link>

     <Link className="home-returning-tile" href="/watchlist" onClick={()=>resume("watchlist")}>
      <span>Watchlist</span>
      <strong>{saved.length} saved</strong>
      <small>{saved.length?"Revisit your research":"Save investments to compare later"}</small>
     </Link>

     <Link className="home-returning-tile" href={matchReady?"/match":contextReady?"/match":"/dna/context?returnTo=/match"} onClick={()=>resume("match")}>
      <span>DNA Match</span>
      <strong>{matchLabel}</strong>
      <small>{matchReady?"Review why it fits":contextReady?"Open your current Match":"Add context before numeric matching"}</small>
     </Link>
    </div>}
   </div>
  </div>
 </section>;
}

function ReturnUpdate({summary}:{summary:ReturningWorkspaceSummary}){
 const newData=summary.new_market_data_count||0;
 const changed=summary.match_updated||summary.assessment_changed;
 const previous=summary.previous_seen_at?formatDateTime(summary.previous_seen_at):null;

 if(newData>0){
  return <div className="home-returning-update" aria-label="Updates since your last visit">
   <div className="home-returning-update-copy">
    <span className="home-returning-update-kicker">Since your last visit</span>
    <strong>New market data is ready for {newData} saved investment{newData===1?"":"s"}.</strong>
    <p>{previous?"Previous workspace visit: "+previous+". ":""}Open your watchlist to review the latest sourced post-close data.</p>
   </div>
   {summary.updated_saved_items?.length>0&&<div className="home-returning-update-items">
    {summary.updated_saved_items.slice(0,3).map(item=><span key={item.investment_id}>
     <b>{item.symbol}</b>
     <small>{item.price_date?formatDate(item.price_date):"New data"}</small>
    </span>)}
   </div>}
   <Link href="/watchlist" className="text-link" onClick={()=>void trackProductEvent("workspace_resume_clicked",{metadata:{target:"market_updates"}})}>Review updates →</Link>
  </div>;
 }

 if(changed){
  return <div className="home-returning-update">
   <div className="home-returning-update-copy">
    <span className="home-returning-update-kicker">Since your last visit</span>
    <strong>Your saved research context has changed.</strong>
    <p>{summary.assessment_changed?"Your current Investor DNA changed. ":""}{summary.match_updated?"Your Match inputs changed and the compatibility view may be different. ":""}Review the current state before comparing investments.</p>
   </div>
  </div>;
 }

 return <div className="home-returning-update quiet">
  <div className="home-returning-update-copy">
   <span className="home-returning-update-kicker">Since your last visit</span>
   <strong>You’re caught up.</strong>
   <p>{previous?"Previous workspace visit: "+previous+". ":""}No newer saved-investment market data needs your attention.</p>
  </div>
 </div>;
}

function formatDate(value:string){
 const parsed=new Date(value+"T12:00:00Z");
 if(Number.isNaN(parsed.getTime()))return value;
 return new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(parsed);
}

function formatDateTime(value:string){
 const parsed=new Date(value);
 if(Number.isNaN(parsed.getTime()))return value;
 return new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"short",day:"numeric"}).format(parsed);
}
