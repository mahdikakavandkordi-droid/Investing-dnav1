"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useAccount} from "@/lib/use-account";
import {rpc} from "@/lib/supabase";
import {instrumentWatchlist} from "@/lib/instruments";
import type {SavedInstrument} from "@/lib/instruments";
import type {AppState,MatchItem} from "@/lib/dna";
import {hasCompleteInvestmentContext} from "@/lib/dna";
import {displayArchetype} from "@/lib/dna-presentation";

export function HomeWorkspaceReturn(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null);
 const [saved,setSaved]=useState<SavedInstrument[]>([]);
 const [loading,setLoading]=useState(false);

 useEffect(()=>{
  let active=true;
  setState(null);
  setSaved([]);
  if(authLoading||!user)return;

  setLoading(true);
  Promise.all([
   rpc<AppState>("get_current_investor_app_state").catch(()=>null),
   instrumentWatchlist().catch(()=>({items:[] as SavedInstrument[]})),
  ]).then(([appState,watchlist])=>{
   if(!active)return;
   setState(appState);
   setSaved(watchlist.items||[]);
  }).finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[user?.id,authLoading]);

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

 return <section className="home-returning-workspace" aria-label="Your Investor DNA workspace">
  <div className="container">
   <div className="home-returning-card">
    <div className="home-returning-head">
     <div>
      <span className="eyebrow">Your workspace</span>
      <h2>{welcome}</h2>
      <p>{loading?"Loading your saved research…":"Pick up where you left off. Your DNA, goal and saved investments stay connected."}</p>
     </div>
     <Link className="btn primary" href="/profile">Open dashboard <span aria-hidden>→</span></Link>
    </div>

    {!loading&&<div className="home-returning-grid">
     <Link className="home-returning-tile" href="/dna/result">
      <span>Investor DNA</span>
      <strong>{archetype||"Not saved yet"}</strong>
      <small>{dna?"View your current profile":"Complete the assessment"}</small>
     </Link>

     <Link className="home-returning-tile" href="/dna/context?returnTo=/profile">
      <span>Investment context</span>
      <strong>{contextReady?"Ready":"Needs context"}</strong>
      <small>{contextReady?"Goal, horizon and access needs saved":"Add the purpose of this money"}</small>
     </Link>

     <Link className="home-returning-tile" href="/watchlist">
      <span>Watchlist</span>
      <strong>{saved.length} saved</strong>
      <small>{saved.length?"Revisit your research":"Save investments to compare later"}</small>
     </Link>

     <Link className="home-returning-tile" href={matchReady?"/match":contextReady?"/match":"/dna/context?returnTo=/match"}>
      <span>DNA Match</span>
      <strong>{matchLabel}</strong>
      <small>{matchReady?"Review why it fits":contextReady?"Open your current Match":"Add context before numeric matching"}</small>
     </Link>
    </div>}
   </div>
  </div>
 </section>;
}
