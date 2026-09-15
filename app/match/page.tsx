"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {Fund} from '@/lib/investments';
import type {AppState,MatchItem} from '@/lib/dna';

function unique(items:MatchItem[]){const seen=new Set<string>();return items.filter(x=>{if(seen.has(x.symbol))return false;seen.add(x.symbol);return true;});}
function label(m:MatchItem){return m.explanation?.fit_label||m.fit_label||({top_match:'Strong fit',alternative:'Good fit',consider:'Mixed fit',mismatch:'Lower fit'}[m.recommendation_tier||'']||'Compatibility');}
function strengths(m:MatchItem){return m.explanation?.strengths||m.strengths||[];}
function watchouts(m:MatchItem){return m.explanation?.watchouts||m.watchouts||[];}
function scoreValue(m:MatchItem){return m.match_score==null?'—':Math.round(m.match_score);}

export default function Matches(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null),[funds,setFunds]=useState<Fund[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;setState(null);setFunds([]);setError('');if(!user){setLoading(false);return;}setLoading(true);
 Promise.all([rpc<AppState>('get_current_investor_app_state'),rpc<Fund[]>('app_search_investments',{p_limit:200})]).then(([s,f])=>{if(!active)return;setState(s);setFunds(f)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false};},[user?.id]);
 const rows=useMemo(()=>unique([...(state?.matches?.top_matches||[]),...(state?.matches?.alternatives||[]),...(state?.matches?.consider||[])]),[state]);
 const idBySymbol=useMemo(()=>new Map(funds.map(f=>[f.symbol,f.id])),[funds]);
 const featured=rows.slice(0,3), more=rows.slice(3,9);
 const hasContext=!!state?.report?.investment_context;

 return <section className="match-dna-page"><div className="container">
   <div className="match-dna-hero"><div className="eyebrow">Investor DNA × Investment DNA</div><h1>Your closest matches</h1><p>We compare the way you handle risk with what each investment is built to do. Your goal, time horizon and need for access make the match more specific.</p><p className="fine muted">A higher score means closer compatibility — not a better investment or a recommendation to buy.</p></div>
   {authLoading||loading?<div className="card"><h2>Building your matches…</h2><p className="muted">Comparing your Investor DNA with the available Investment DNA profiles.</p></div>:error?<div role="alert" className="notice"><p>{error}</p><button className="btn" onClick={()=>location.reload()}>Try again</button></div>:!user?<div className="card"><h2>Your matches can be saved with your DNA</h2><p>Sign in to see the matches connected to your saved Investor DNA.</p><Link className="btn primary" href="/profile">Sign in / create account</Link></div>:!state?.dna?<div className="card"><h2>Discover your Investor DNA first</h2><p>Complete the assessment before we compare you with investments.</p><Link className="btn primary" href="/dna/assessment">Discover my DNA</Link></div>:!rows.length?<div className="card"><h2>No matches are ready yet</h2><p>You can still browse the available investments while the match data is being prepared.</p><Link className="btn" href="/explore">Explore investments</Link></div>:<>
     {!hasContext&&<div className="match-context-nudge"><div><strong>Make these matches more useful</strong><p>Add what the money is for, when you may need it, and how important access is. That context stays separate from your Investor DNA.</p></div><Link className="btn" href="/dna/context">Add investment context</Link></div>}
     <section className="match-section"><div className="eyebrow">Closest alignment</div><h2>Start with these</h2><div className="match-dna-grid">{featured.map((m,index)=>{const id=idBySymbol.get(m.symbol);const good=strengths(m);const watch=watchouts(m);return <article className="match-dna-card" key={m.symbol}>
       <div className="match-card-top"><div><span className="pill">{m.symbol}</span>{index===0&&<span className="match-rank">Closest match</span>}</div><div className="match-score"><strong>{scoreValue(m)}</strong><span>{m.match_score==null?'':'/100'}</span></div></div>
       <h3>{m.name||m.symbol}</h3><div className="match-meta"><span className="match-fit">{label(m)}</span>{m.risk_band&&<span className="pill">Official risk: {m.risk_band}</span>}</div>{m.explanation?.summary&&<p className="match-summary">{m.explanation.summary}</p>}
       {good.length>0&&<div className="match-why"><small>Why it may fit</small>{good.slice(0,2).map(x=><p key={x}>✓ {x}</p>)}</div>}
       {watch.length>0&&<div className="match-watch"><small>What to watch</small><p>! {watch[0]}</p></div>}
       {id?<Link className="btn primary" href={'/investment/'+id}>View Investment DNA</Link>:<Link className="btn" href="/explore">Find in Explore</Link>}
     </article>})}</div></section>
     {more.length>0&&<section className="match-section match-more"><div className="eyebrow">Also worth comparing</div><h2>Other compatible options</h2><div className="match-more-grid">{more.map(m=>{const id=idBySymbol.get(m.symbol);return <article className="match-mini-card" key={m.symbol}><div><span className="pill">{m.symbol}</span><h3>{m.name||m.symbol}</h3><p>{label(m)}{m.risk_band?` · Official risk: ${m.risk_band}`:''}</p></div><div className="match-mini-score">{scoreValue(m)}{m.match_score==null?null:<small>/100</small>}</div>{id&&<Link href={'/investment/'+id}>See details →</Link>}</article>})}</div></section>}
     <div className="match-footer-actions"><Link className="btn" href="/explore">Explore all investments</Link><Link className="btn" href="/compare">Compare investments</Link></div>
   </>}
 </div></section>;
}
