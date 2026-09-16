"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import type {AppState,MatchItem} from '@/lib/dna';
import {instrumentWatchlist} from '@/lib/instruments';
import type {SavedInstrument} from '@/lib/instruments';

export default function Dashboard(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null);
 const [items,setItems]=useState<SavedInstrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');

 useEffect(()=>{
  if(authLoading)return;
  if(!user){setLoading(false);return;}
  let active=true;
  setLoading(true);setError('');
  Promise.all([rpc<AppState>('get_current_investor_app_state'),instrumentWatchlist()])
   .then(([next,list])=>{if(active){setState(next);setItems(list.items||[])}})
   .catch(e=>{if(active)setError(e instanceof Error?e.message:'Could not load your workspace.')})
   .finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[user?.id,authLoading]);

 if(authLoading||loading)return <main className="dashboard-page"><div className="container dashboard-shell"><div className="dashboard-loading">Loading your workspace…</div></div></main>;
 if(!user)return <main className="dashboard-page"><div className="container dashboard-shell"><section className="dashboard-empty"><div className="eyebrow">My Investor DNA</div><h1>Your research workspace starts here.</h1><p>Sign in once to keep your Investing DNA, investment context and saved research together.</p><Link className="btn primary" href="/profile">Continue with email</Link></section></div></main>;

 const dna=state?.dna;
 const context=dna?.investment_context;
 const matchStatus=state?.matches?.status;
 const closest:MatchItem|undefined=state?.matches?.top_matches?.[0]||state?.matches?.alternatives?.[0];
 const archetype=dna?.narrative?.archetype_name||dna?.narrative?.archetype||dna?.archetype;
 const contextReady=!!(context?.goal&&context?.time_horizon);

 return <main className="dashboard-page">
  <div className="container dashboard-shell">
   <header className="dashboard-hero">
    <div><div className="eyebrow">My Investor DNA</div><h1>Your research workspace</h1><p>Pick up where you left off without rebuilding your profile each visit.</p></div>
    <Link className="dashboard-account" href="/profile"><span className="dashboard-avatar">{(user.email||'U').slice(0,1).toUpperCase()}</span><span><strong>Account</strong><small>{user.email}</small></span><span aria-hidden>›</span></Link>
   </header>

   {error&&<div className="notice" role="alert">{error}</div>}

   <section className="dashboard-status-grid" aria-label="Investor workspace status">
    <article className="dashboard-status-card"><span>Investing DNA</span><strong>{dna?(archetype||'Completed'):'Not completed'}</strong><small>{dna?'Your current research profile':'Complete the assessment to unlock personal compatibility.'}</small><Link href={dna?'/dna/result':'/dna/assessment'}>{dna?'View DNA':'Start assessment'} →</Link></article>
    <article className="dashboard-status-card"><span>Investment context</span><strong>{contextReady?'Ready':'Needs context'}</strong><small>{contextReady?[context?.goal,context?.time_horizon].filter(Boolean).join(' · '):'Add the goal and horizon for this money.'}</small><Link href="/dna/context">{contextReady?'Review context':'Add context'} →</Link></article>
    <article className="dashboard-status-card"><span>Saved research</span><strong>{items.length} saved</strong><small>{items.length?'Your watchlist is ready when you return.':'Save investments you want to research again.'}</small><Link href="/watchlist">Open watchlist →</Link></article>
   </section>

   <section className="dashboard-main-grid">
    <article className="dashboard-panel dashboard-next">
     <div className="dashboard-panel-head"><div><div className="eyebrow">Next best step</div><h2>{nextTitle(!!dna,contextReady,matchStatus)}</h2></div><span className="dashboard-step">01</span></div>
     <p>{nextCopy(!!dna,contextReady,matchStatus)}</p>
     <div className="actions compact"><Link className="btn primary" href={nextHref(!!dna,contextReady,matchStatus)}>{nextCta(!!dna,contextReady,matchStatus)}</Link>{dna&&<Link className="btn" href="/explore">Explore investments</Link>}</div>
    </article>

    <article className="dashboard-panel">
     <div className="dashboard-panel-head"><div><div className="eyebrow">DNA Match</div><h2>{closest?closest.symbol:'ETF compatibility'}</h2></div>{closest?.match_score!=null&&matchStatus==='available'?<div className="dashboard-match-score"><strong>{Math.round(closest.match_score)}</strong><small>/100</small></div>:<span className="pill">{matchLabel(matchStatus)}</span>}</div>
     <p>{closest?(closest.explanation?.summary||closest.fit_label||'Open Match to review why this ETF aligns with your current inputs.'):'Your Match view appears here after your DNA and required context are ready.'}</p>
     <Link className="dashboard-text-link" href="/match">Open DNA Match →</Link>
    </article>
   </section>

   <section className="dashboard-panel dashboard-saved">
    <div className="dashboard-panel-head"><div><div className="eyebrow">Saved investments</div><h2>Your research queue</h2></div><Link className="dashboard-text-link" href="/watchlist">View all</Link></div>
    {items.length?<div className="dashboard-saved-list">{items.slice(0,4).map(item=><Link href={'/investment/'+item.investment_id} key={item.investment_id} className="dashboard-saved-row"><span className="dashboard-symbol">{item.symbol||'—'}</span><span><strong>{item.name||item.symbol}</strong><small>Saved for later research</small></span><span aria-hidden>›</span></Link>)}</div>:<div className="dashboard-inline-empty"><p>No saved investments yet.</p><Link className="btn" href="/explore">Explore investments</Link></div>}
   </section>

   <p className="fine muted dashboard-footnote">Investor DNA supports research and compatibility comparison. Match is not a return forecast or a recommendation to buy or sell.</p>
  </div>
 </main>;
}

function nextTitle(hasDna:boolean,contextReady:boolean,status?:string){if(!hasDna)return 'Build your Investing DNA';if(!contextReady||status==='context_required')return 'Add context for this money';if(status==='review_required')return 'Review your Match status';return 'Continue your ETF research';}
function nextCopy(hasDna:boolean,contextReady:boolean,status?:string){if(!hasDna)return 'Complete the assessment to create the profile used across your research workspace.';if(!contextReady||status==='context_required')return 'Your DNA is saved. Add the goal, horizon and liquidity needs that belong to this investment decision.';if(status==='review_required')return 'A data or safety review gate is active. Open Match to understand what needs attention.';return 'Re-open your compatibility results, inspect the explanation, then compare eligible ETFs side by side.';}
function nextHref(hasDna:boolean,contextReady:boolean,status?:string){if(!hasDna)return '/dna/assessment';if(!contextReady||status==='context_required')return '/dna/context?returnTo=/match';return '/match';}
function nextCta(hasDna:boolean,contextReady:boolean,status?:string){if(!hasDna)return 'Start Investing DNA';if(!contextReady||status==='context_required')return 'Add investment context';if(status==='review_required')return 'Review Match';return 'Continue to Match';}
function matchLabel(status?:string){if(status==='context_required')return 'DNA-only';if(status==='review_required')return 'Review';if(status==='no_suitable_options')return 'No current fit';if(status==='available')return 'Available';return 'Not ready';}
