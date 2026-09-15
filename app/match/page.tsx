"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {Fund} from '@/lib/investments';
import type {AppState,MatchItem,MatchPayload} from '@/lib/dna';

function unique(items:MatchItem[]){const seen=new Set<string>();return items.filter(x=>{if(seen.has(x.symbol))return false;seen.add(x.symbol);return true;});}
function label(m:MatchItem){return m.explanation?.fit_label||m.fit_label||({top_match:'Closer fit',alternative:'Possible fit',consider:'DNA-only comparison',mismatch:'Outside current fit limits'}[m.recommendation_tier||'']||'Compatibility');}
function strengths(m:MatchItem){return m.explanation?.strengths||m.strengths||[];}
function watchouts(m:MatchItem){return m.explanation?.watchouts||m.watchouts||[];}
function scoreValue(m:MatchItem){return m.match_score==null?'—':Math.round(m.match_score);}
type ConstraintShape={reasons?:string[];codes?:string[];context_complete?:boolean;equity_ceiling?:number;horizon_months?:number};
function constraintShape(match?:MatchPayload){return (match?.constraints||{}) as ConstraintShape;}
function breakdown(m:MatchItem){const s=m.explanation?.scores||{};return [
 ['Official risk fit',s.official_risk_fit],['Market exposure fit',s.market_exposure_fit],['Goal role fit',s.goal_role_fit],['Exposure breadth',s.exposure_breadth]
 ].filter((x):x is [string,number]=>typeof x[1]==='number'&&Number.isFinite(x[1]));}
function changeNote(m:MatchItem,match?:MatchPayload){const s=m.explanation?.scores||{};
 if(m.eligibility==='review_required')return 'This comparison is paused by a safety or data-review gate. Resolve the review point rather than trying to raise the score.';
 if(match?.status==='context_required')return 'Add the real goal, withdrawal horizon, liquidity need and principal requirement for this money. That turns this from DNA-only comparison into context-aware matching.';
 if(typeof s.market_exposure_fit==='number'&&s.market_exposure_fit<95)return 'A lower-equity structure would fit the current exposure ceiling more closely. A genuinely longer horizon may also change that ceiling; do not change your inputs just to improve a score.';
 if(typeof s.official_risk_fit==='number'&&s.official_risk_fit<85)return 'A fund with a lower issuer-disclosed risk category would align more closely with the risk tolerance and capacity in your current DNA.';
 if(typeof s.goal_role_fit==='number'&&s.goal_role_fit<60)return 'An investment whose asset mix better serves the goal you entered for this money would improve role fit.';
 if(typeof s.exposure_breadth==='number'&&s.exposure_breadth<75)return 'A structure with broader market or asset-class exposure would improve the breadth component.';
 return 'The score should move only when your genuine inputs change, the fund structure changes, or newer verified fund data becomes available.';
}

export default function Matches(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null),[funds,setFunds]=useState<Fund[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;setState(null);setFunds([]);setError('');if(!user){setLoading(false);return;}setLoading(true);
 Promise.all([rpc<AppState>('get_current_investor_app_state'),rpc<Fund[]>('app_search_investments',{p_limit:100})]).then(([s,f])=>{if(!active)return;setState(s);setFunds(f)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false};},[user?.id]);
 const match=state?.matches;const constraints=constraintShape(match);
 const eligibleRows=useMemo(()=>unique([...(match?.top_matches||[]),...(match?.alternatives||[]),...(match?.consider||[])]),[match]);
 const fallbackRows=useMemo(()=>unique(match?.mismatch||[]),[match]);
 const rows=eligibleRows.length?eligibleRows:(match?.status==='no_suitable_options'?fallbackRows:[]);
 const idBySymbol=useMemo(()=>new Map(funds.map(f=>[f.symbol,f.id])),[funds]);
 const featured=rows.slice(0,3), more=rows.slice(3,9);const hasContext=!!state?.report?.investment_context;
 const compareIds=featured.map(m=>idBySymbol.get(m.symbol)).filter((x):x is string=>!!x);

 return <section className="match-dna-page"><div className="container">
   <div className="match-dna-hero"><div className="eyebrow">Investor DNA × Investment DNA</div><h1>Your closest compatible structures</h1><p>We compare your capacity and comfort with risk against what each fund is structurally built to do, then apply the real goal and withdrawal horizon for this money.</p><p className="fine muted">A higher score means closer research compatibility — not a better investment, a return forecast, or a recommendation to buy.</p></div>
   {authLoading||loading?<div className="card"><h2>Building your matches…</h2><p className="muted">Comparing your Investor DNA with the current verified Investment DNA universe.</p></div>:error?<div role="alert" className="notice"><p>{error}</p><button className="btn" onClick={()=>location.reload()}>Try again</button></div>:!user?<div className="card"><h2>Your matches stay connected to your DNA</h2><p>Sign in to see compatibility linked to your saved Investor DNA.</p><Link className="btn primary" href="/profile">Sign in / create account</Link></div>:!state?.dna?<div className="card"><h2>Discover your Investor DNA first</h2><p>Complete the assessment before we compare you with investments.</p><Link className="btn primary" href="/dna/assessment">Discover my DNA</Link></div>:<>
     {match?.status==='review_required'&&<div className="match-status-card warning"><div className="eyebrow">Matching paused</div><h2>Review this money before ranking ETFs</h2><p>The engine found a financial or product-data condition that should not be converted into a ranked recommendation.</p>{constraints.reasons?.length?<ul>{constraints.reasons.map(x=><li key={x}>{x}</li>)}</ul>:null}<div className="actions"><Link className="btn" href="/dna/context">Review investment context</Link><Link className="btn" href="/profile">My profile</Link></div></div>}
     {match?.status==='no_suitable_options'&&<div className="match-status-card warning"><div className="eyebrow">Honest no-match state</div><h2>No ETF in the current research universe passes your fit limits</h2><p>We are not forcing a recommendation. The comparisons below are the closest outside the current limits and are shown only to explain the mismatch.</p></div>}
     {match?.status==='context_required'&&<div className="match-status-card"><div className="eyebrow">DNA-only view</div><h2>Add the purpose of this money for a more useful match</h2><p>Your DNA is available, but goal, horizon, liquidity and principal needs are still missing. Scores below are intentionally limited-context comparisons.</p><Link className="btn primary" href="/dna/context">Add investment context</Link></div>}
     {match?.status==='available'&&<div className="match-status-card ok"><div className="eyebrow">Context-aware match</div><h2>{match.eligible_count||featured.length} current option{(match.eligible_count||featured.length)===1?'':'s'} passed the research fit limits</h2><p>These results use your saved DNA, investment context and the current verified fund-data version.</p>{match.data_as_of&&<p className="fine muted">Fund data through {match.data_as_of} · Match model {match.model_version}</p>}</div>}
     {!hasContext&&match?.status!=='review_required'&&<div className="match-context-nudge"><div><strong>Make these matches more useful</strong><p>Add what the money is for, when you may need it, and how important access is. That context stays separate from your Investor DNA.</p></div><Link className="btn" href="/dna/context">Add investment context</Link></div>}
     {featured.length?<section className="match-section"><div className="eyebrow">{match?.status==='no_suitable_options'?'Closest comparisons outside limits':'Closest alignment'}</div><h2>{match?.status==='no_suitable_options'?'Why the nearest options still miss':'Start with these'}</h2><div className="match-dna-grid">{featured.map((m,index)=>{const id=idBySymbol.get(m.symbol);const good=strengths(m);const watch=watchouts(m);const scores=breakdown(m);return <article className="match-dna-card" key={m.symbol}>
       <div className="match-card-top"><div><span className="pill">{m.symbol}</span>{index===0&&match?.status!=='no_suitable_options'&&<span className="match-rank">Closest match</span>}</div><div className="match-score"><strong>{scoreValue(m)}</strong><span>{m.match_score==null?'':'/100'}</span></div></div>
       <h3>{m.name||m.symbol}</h3><div className="match-meta"><span className="match-fit">{label(m)}</span>{m.risk_band&&<span className="pill">Official risk: {m.risk_band}</span>}</div>{m.explanation?.summary&&<p className="match-summary">{m.explanation.summary}</p>}
       {scores.length?<div className="match-breakdown">{scores.map(([name,value])=><div key={name}><span>{name}</span><strong>{Math.round(value)}/100</strong></div>)}</div>:null}
       {good.length>0&&<div className="match-why"><small>Why it may fit</small>{good.slice(0,2).map(x=><p key={x}>✓ {x}</p>)}</div>}
       {watch.length>0&&<div className="match-watch"><small>What conflicts</small>{watch.slice(0,2).map(x=><p key={x}>! {x}</p>)}</div>}
       <p className="match-change"><strong>What would change this comparison?</strong><br/>{changeNote(m,match)}</p>
       {id?<Link className="btn primary" href={'/investment/'+id}>View Investment DNA</Link>:<Link className="btn" href="/explore">Find in Explore</Link>}
     </article>})}</div></section>:match?.status!=='review_required'?<div className="card"><h2>No ranked comparisons are available</h2><p>Explore the fund research universe without treating the list as a personal match.</p><Link className="btn" href="/explore">Explore investments</Link></div>:null}
     {more.length>0&&match?.status!=='no_suitable_options'&&<section className="match-section match-more"><div className="eyebrow">Also worth comparing</div><h2>Other compatible options</h2><div className="match-more-grid">{more.map(m=>{const id=idBySymbol.get(m.symbol);return <article className="match-mini-card" key={m.symbol}><div><span className="pill">{m.symbol}</span><h3>{m.name||m.symbol}</h3><p>{label(m)}{m.risk_band?` · Official risk: ${m.risk_band}`:''}</p></div><div className="match-mini-score">{scoreValue(m)}{m.match_score==null?null:<small>/100</small>}</div>{id&&<Link href={'/investment/'+id}>See details →</Link>}</article>})}</div></section>}
     <div className="match-footer-actions">{compareIds.length>=2&&<Link className="btn primary" href={`/compare?ids=${compareIds.join(',')}`}>Compare these side by side</Link>}<Link className="btn" href="/screener">Screen with my DNA</Link><Link className="btn" href="/explore">Explore all investments</Link></div>
   </>}
 </div></section>;
}
