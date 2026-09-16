"use client";

import './dashboard.css';
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
 useEffect(()=>{if(authLoading)return;if(!user){setLoading(false);return;}let active=true;setLoading(true);setError('');Promise.all([rpc<AppState>('get_current_investor_app_state'),instrumentWatchlist()]).then(([next,list])=>{if(active){setState(next);setItems(list.items||[])}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Could not load your workspace.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[user?.id,authLoading]);
 if(authLoading||loading)return <main className="dashboard-page"><div className="container dashboard-shell"><div className="dashboard-loading">Loading your workspace…</div></div></main>;
 if(!user)return <main className="dashboard-page"><div className="container dashboard-shell"><section className="dashboard-empty"><div className="eyebrow">Investment DNA</div><h1>Your personal research workspace.</h1><p>Sign in to keep your Investing DNA, investment context, DNA Matches and saved investments together.</p><Link className="btn primary" href="/profile">Continue with email</Link></section></div></main>;

 const dna=state?.dna; const context=dna?.investment_context; const matchStatus=state?.matches?.status;
 const matches=(state?.matches?.top_matches||state?.matches?.alternatives||[]).slice(0,3);
 const archetype=dna?.narrative?.archetype_name||dna?.narrative?.archetype||dna?.archetype;
 const contextReady=!!(context?.goal&&context?.time_horizon);
 const tolerance=scoreLabel(dna?.risk_tolerance); const capacity=scoreLabel(dna?.risk_capacity);

 return <main className="dashboard-page"><div className="container dashboard-shell">
  <header className="dashboard-hero"><div><div className="eyebrow">Investment DNA</div><h1>Welcome back</h1><p>Your profile, compatibility research and saved investments — in one place.</p></div><Link className="dashboard-account" href="/profile"><span className="dashboard-avatar">{(user.email||'U').slice(0,1).toUpperCase()}</span><span><strong>Account</strong><small>{user.email}</small></span><span aria-hidden>›</span></Link></header>
  {error&&<div className="notice" role="alert">{error}</div>}

  <section className="dashboard-dna-card">
   <div className="dashboard-dna-copy"><div className="eyebrow">Your Investing DNA</div><h2>{dna?(archetype||'Your current DNA'):'Discover your Investing DNA'}</h2><p>{dna?(dna.narrative?.summary||'Your saved Investing DNA is the behavioral foundation for compatibility research across Investment DNA.'):'Complete the assessment to build the profile used throughout your research workspace.'}</p><div className="dashboard-dna-tags">{dna&&<><span>{tolerance} risk tolerance</span><span>{capacity} risk capacity</span>{dna.decision_style&&<span>{pretty(dna.decision_style)}</span>}</>}</div></div>
   <div className="dashboard-dna-actions"><Link className="btn primary" href={dna?'/dna/result':'/dna/assessment'}>{dna?'View DNA':'Start assessment'}</Link>{dna&&<Link className="btn" href="/dna/assessment">Update DNA</Link>}</div>
  </section>

  <section className="dashboard-context-card"><div className="dashboard-section-head"><div><div className="eyebrow">Investment context</div><h2>{contextReady?'Context for this money':'Add context for this money'}</h2></div><Link className="btn" href="/dna/context">{contextReady?'Edit':'Add context'}</Link></div>
   {contextReady?<div className="dashboard-context-grid"><Context label="Goal" value={pretty(context?.goal)}/><Context label="Time horizon" value={context?.time_horizon}/><Context label="Liquidity" value={pretty(context?.liquidity_need)}/><Context label="Amount" value={money(context?.amount_to_invest,context?.amount_currency)}/></div>:<p className="dashboard-empty-copy">Goal, time horizon and liquidity help turn DNA-only compatibility into context-aware Match.</p>}
  </section>

  <section className="dashboard-section"><div className="dashboard-section-head"><div><div className="eyebrow">DNA Match</div><h2>Top ETF compatibility</h2><p>Based on your current Investing DNA{contextReady?' and investment context':''}.</p></div><Link className="dashboard-text-link" href="/match">View all matches →</Link></div>
   {matches.length?<div className="dashboard-match-grid">{matches.map((item:MatchItem)=><MatchCard key={item.investment_id||item.symbol} item={item} status={matchStatus}/>)}</div>:<div className="dashboard-inline-empty"><p>{dna?'Open Match to generate your current ETF compatibility view.':'Complete your DNA first to unlock compatibility research.'}</p><Link className="btn" href={dna?'/match':'/dna/assessment'}>{dna?'Open DNA Match':'Start assessment'}</Link></div>}
  </section>

  <section className="dashboard-section"><div className="dashboard-section-head"><div><div className="eyebrow">Saved investments</div><h2>Your watchlist</h2><p>{items.length?`${items.length} saved for later research`:'Keep interesting investments easy to revisit.'}</p></div><Link className="dashboard-text-link" href="/watchlist">View all →</Link></div>
   {items.length?<div className="dashboard-saved-list">{items.slice(0,4).map(item=><Link href={'/investment/'+item.investment_id} key={item.investment_id} className="dashboard-saved-row"><span className="dashboard-symbol">{item.symbol||'—'}</span><span><strong>{item.name||item.symbol}</strong><small>Saved investment</small></span><span className="dashboard-row-action">View ›</span></Link>)}</div>:<div className="dashboard-inline-empty"><p>No saved investments yet.</p><Link className="btn" href="/explore">Explore investments</Link></div>}
  </section>

  <p className="fine muted dashboard-footnote">Investment DNA supports research and compatibility comparison. DNA Match is not a return forecast or a recommendation to buy or sell.</p>
 </div></main>;
}

function Context({label,value}:{label:string,value?:string|null}){return <div className="dashboard-context-item"><span>{label}</span><strong>{value||'Not set'}</strong></div>}
function MatchCard({item,status}:{item:MatchItem,status?:string}){const numeric=status==='available'&&item.match_score!=null;return <article className="dashboard-match-card"><div className="dashboard-match-top"><span className="dashboard-symbol">{item.symbol}</span>{numeric?<span className="dashboard-score">{Math.round(item.match_score!)}% match</span>:<span className="pill">{matchLabel(status)}</span>}</div><h3>{item.name||item.symbol}</h3><p>{item.explanation?.summary||item.fit_label||'Open the research view to understand this compatibility result.'}</p>{item.investment_id?<Link href={'/investment/'+item.investment_id}>View research →</Link>:<Link href="/match">View Match →</Link>}</article>}
function pretty(value?:string|null){return value?value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()):undefined}
function scoreLabel(value?:number){if(!Number.isFinite(value))return 'Current';if((value as number)>=67)return 'Higher';if((value as number)>=34)return 'Moderate';return 'Lower'}
function money(value?:number|null,currency?:string|null){if(!Number.isFinite(value))return 'Not set';try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:currency||'CAD',maximumFractionDigits:0}).format(value as number)}catch{return `${value} ${currency||'CAD'}`}}
function matchLabel(status?:string){if(status==='context_required')return 'DNA-only';if(status==='review_required')return 'Review';if(status==='no_suitable_options')return 'No current fit';if(status==='available')return 'Available';return 'Not ready'}
