"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {readDraft,AppState,DNA,MatchItem,MatchPayload} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";

function normalizeMatches(payload?:MatchPayload|null):MatchItem[]{
  if(!payload)return [];
  if(Array.isArray(payload.results))return [...payload.results].sort((a,b)=>(b.match_score||0)-(a.match_score||0));
  return [...(payload.top_matches||[]),...(payload.alternatives||[])].sort((a,b)=>(b.match_score||0)-(a.match_score||0));
}

export default function Result(){
 const [dna,setDna]=useState<DNA|null>(null),[report,setReport]=useState<DNA|null>(null),[matches,setMatches]=useState<MatchPayload|null>(null),[pending,setPending]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{
  const session=supabase?(await supabase.auth.getSession()).data.session:null;
  const local=readDraft(session?.user.id||null);
  if(local?.result){if(active){setDna(local.result.result);setReport(local.result.report?.report||null);setMatches(local.result.match||null);setPending(!local.result.account_linked);}return;}
  if(session){const state=await rpc<AppState>('get_current_investor_app_state');if(active){setDna(state.dna);setReport(state.report);setMatches(state.matches||null);}}
 })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[]);
 const topMatches=useMemo(()=>normalizeMatches(matches).slice(0,3),[matches]);
 const hasContext=!!report?.investment_context;

 if(loading)return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>Building your Investor DNA report…</h1><p className="muted">Turning your answers into a profile you can actually use.</p></div></div></main>;
 if(!dna)return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>{error?'Could not load your DNA':'Your DNA starts here'}</h1>{error?<p role="alert">{error}</p>:<p>No completed assessment is available on this browser. Sign in to view a saved result.</p>}<div className="actions"><Link className="btn primary" href="/dna/assessment">Start / resume assessment</Link><Link className="btn" href="/profile">Sign in</Link>{error&&<button className="btn" onClick={()=>location.reload()}>Retry</button>}</div></div></div></main>;

 return <main className="result-page"><div className="container result-container">
   <DnaSummary dna={dna} report={report}/>

   <section className="result-next-card result-context-cta">
     <div><div className="eyebrow">From DNA to a real decision</div><h2>{hasContext?'This money now has context.':'Tell us what this money is for.'}</h2><p>{hasContext?'Your goal, time horizon and liquidity needs are kept separate from your DNA and used only to make compatibility more specific.':'Your DNA describes you. Add the goal, time horizon and access needs for this particular pool of money before looking at investments.'}</p></div>
     <Link className="btn primary" href="/dna/context">{hasContext?'Edit investment context':'Add investment context'}</Link>
   </section>

   {topMatches.length>0&&<section className="report-section matches-section">
     <div className="eyebrow">05 · From DNA to discovery</div>
     <h2>Investments worth exploring</h2>
     <p className="report-lede">These are compatibility signals based on your DNA{hasContext?' and the context you added':''}. They are not buy recommendations.</p>
     <div className="match-preview-grid">{topMatches.map(m=>{
       const why=m.explanation?.strengths?.[0]||m.explanation?.why_it_fits?.[0]||m.explanation?.watchouts?.[0];
       return <article className="match-preview-card" key={m.investment_id||m.symbol}><div className="match-preview-top"><span className="pill">{m.symbol}</span><strong>{Math.round(m.match_score||0)}<small>/100</small></strong></div><h3>{m.name||m.symbol}</h3><p className="match-fit-label">{m.fit_label||m.recommendation_tier?.replaceAll('_',' ')||'Compatibility signal'}</p>{why&&<p className="muted">{why}</p>}{m.investment_id?<Link className="btn" href={`/investment/${m.investment_id}`}>See why it fits</Link>:<Link className="btn" href="/match">See my matches</Link>}</article>;
     })}</div>
     <div className="matches-more"><Link className="btn primary" href="/match">See all DNA matches</Link></div>
   </section>}

   {pending?<section className="result-save-card"><div><strong>Keep your Investor DNA</strong><p>This result currently lives only in this browser. Create a free account to save the profile, future reassessments, matches and watchlist.</p></div><div className="result-actions"><Link className="btn primary" href="/profile?mode=signup">Create free account</Link><Link className="btn" href="/profile">Sign in</Link></div></section>:<section className="result-save-card"><div><strong>Your Investor DNA is saved.</strong><p>You can return to it from your profile and use it across Match, Explore and your watchlist.</p></div><div className="result-actions"><Link className="btn primary" href="/profile">My profile</Link><Link className="btn" href="/explore">Explore investments</Link></div></section>}
 </div></main>;
}
