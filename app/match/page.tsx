"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {readDraft,AppState,MatchPayload,MatchItem} from '@/lib/dna';
import {eligibleMatches,matchRows,matchStatus,displayMatchScore,matchWatchouts,matchStrengths} from '@/lib/match';

function MatchCard({item}:{item:MatchItem}){
 const watch=matchWatchouts(item),good=matchStrengths(item);
 return <article className="match-dna-card"><div className="match-card-top"><span className="pill">{item.symbol}</span><div className="match-score"><strong>{displayMatchScore(item)}</strong><span>/100</span></div></div>
   <h3>{item.name||item.symbol}</h3><div className="match-meta"><span className="match-fit">{item.fit_label}</span>{item.official_risk_rating&&<span className="pill">Official risk: {item.official_risk_rating}</span>}</div>
   {watch.length>0&&<div className="match-watch"><small>Review the trade-offs</small>{watch.map(x=><p key={x}>{x}</p>)}</div>}
   {good.length>0&&<div className="match-why"><small>Where it aligns</small>{good.map(x=><p key={x}>{x}</p>)}</div>}
   {item.investment_id&&<Link className="btn primary" href={'/investment/'+item.investment_id}>View Investment DNA</Link>}
 </article>;
}
export default function Matches(){
 const {user,loading:authLoading}=useAccount();
 const [payload,setPayload]=useState<MatchPayload|null>(null),[hasDna,setHasDna]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{if(authLoading)return;let active=true;setLoading(true);setError('');setPayload(null);setHasDna(false);
 (async()=>{
   if(user){const state=await rpc<AppState>('get_current_investor_app_state');if(active){setHasDna(!!state.dna);setPayload(state.matches||null);}}
   else {const local=readDraft(null);if(active){setHasDna(!!local?.result);setPayload(local?.result?.match||null);}}
 })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[user?.id,authLoading]);
 const rows=eligibleMatches(payload),status=matchStatus(payload),other=matchRows(payload).filter(x=>x.eligibility!=='eligible');
 return <section className="match-dna-page"><div className="container"><div className="match-dna-hero"><div className="eyebrow">Investor DNA × Investment DNA</div><h1>{status.title}</h1><p>{status.body}</p><p className="fine muted">Compatibility is a research signal, not a recommendation to buy or a prediction of returns.</p></div>
 {authLoading||loading?<div className="card"><h2>Loading your matches…</h2></div>:error?<div className="notice" role="alert"><p>{error}</p><button className="btn" onClick={()=>location.reload()}>Try again</button></div>:!hasDna?<div className="card"><h2>Discover your Investor DNA first</h2><Link className="btn primary" href="/dna/assessment">Discover my DNA</Link><Link className="btn" href="/profile">Use my saved profile</Link></div>:<>
   {payload?.constraints?.reasons?.length? <div className="notice" role="status">{payload.constraints.reasons.map(x=><p key={x}>{x}</p>)}</div>:null}
   <div className="match-context-nudge"><div><strong>Keep your investment context current</strong><p>Use the goal and earliest withdrawal for this pool of money.</p></div><Link className="btn" href="/dna/context">{payload?.context_applied?'Edit investment context':'Add investment context'}</Link></div>
   {rows.length>0&&<section className="match-section"><h2>Options within the current fit limits</h2><div className="match-dna-grid">{rows.map(m=><MatchCard key={m.investment_id||m.symbol} item={m}/>)}</div></section>}
   {other.length>0&&<details className="card"><summary>Other funds and why they are not featured ({other.length})</summary>{other.map(m=><article key={m.investment_id||m.symbol}><h3>{m.symbol} · {m.fit_label}</h3>{matchWatchouts(m).map(x=><p key={x}>{x}</p>)}{m.investment_id&&<Link href={'/investment/'+m.investment_id}>View fund details</Link>}</article>)}</details>}
   <div className="match-footer-actions"><Link className="btn" href="/explore">Explore the collection</Link><Link className="btn" href="/dna/result">My DNA report</Link></div>
 </>}
 </div></section>;
}
