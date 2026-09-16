"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import type {Fund} from '@/lib/investments';
import {readDraft} from '@/lib/dna';
import type {AppState,MatchItem,MatchPayload} from '@/lib/dna';

type ConstraintShape={
 reasons?:string[];
 codes?:string[];
 context_complete?:boolean;
 equity_ceiling?:number;
 horizon_months?:number;
};

/** Personalized ETF compatibility surface backed by the canonical Match payload. */
export default function Matches(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null);
 const [funds,setFunds]=useState<Fund[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');

 useEffect(()=>{
  let active=true;
  setState(null);
  setFunds([]);
  setError('');

  if(!user){
   const local=readDraft(null);
   if(!local?.result){
    setLoading(false);
    return;
   }

   setState({
    has_profile:false,
    assessment_id:local.session.assessment_id,
    dna:local.result.result,
    report:local.result.report?.report||local.result.result,
    matches:local.result.match
   });
   setLoading(true);
   rpc<Fund[]>('app_search_investments',{p_asset_type:'ETF',p_limit:100})
    .then(rows=>{if(active)setFunds(rows)})
    .catch(e=>{if(active)setError(e.message)})
    .finally(()=>{if(active)setLoading(false)});
   return ()=>{active=false};
  }

  setLoading(true);
  Promise.all([
   rpc<AppState>('get_current_investor_app_state'),
   rpc<Fund[]>('app_search_investments',{p_asset_type:'ETF',p_limit:100})
  ])
   .then(([appState,fundRows])=>{
    if(!active)return;
    setState(appState);
    setFunds(fundRows);
   })
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[user?.id]);

 const match=state?.matches;
 const constraints=constraintShape(match);

 const eligibleRows=useMemo(
  ()=>unique([...(match?.top_matches||[]),...(match?.alternatives||[]),...(match?.consider||[])]),
  [match]
 );
 const fallbackRows=useMemo(()=>unique(match?.mismatch||[]),[match]);
 const rows=eligibleRows.length
  ? eligibleRows
  : match?.status==='no_suitable_options'
    ? fallbackRows
    : [];

 const idBySymbol=useMemo(()=>new Map(funds.map(fund=>[fund.symbol,fund.id])),[funds]);
 const featured=rows.slice(0,3);
 const more=rows.slice(3,9);
 const hasContext=!!state?.report?.investment_context;
 const compareIds=featured
  .map(item=>idBySymbol.get(item.symbol))
  .filter((id):id is string=>!!id);

 return <section className="match-dna-page">
  <div className="container">
   <MatchHero/>

   {authLoading||loading
    ? <LoadingState/>
    : error
      ? <ErrorState error={error}/>
      : !state?.dna
        ? user?<MissingDnaState/>:<SignedOutState/>
        : <MatchContent
           match={match}
           constraints={constraints}
           featured={featured}
           more={more}
           hasContext={hasContext}
           idBySymbol={idBySymbol}
           compareIds={compareIds}
          />}
  </div>
 </section>;
}

function MatchHero(){
 return <div className="match-dna-hero">
  <div className="eyebrow">DNA Match · ETFs</div>
  <h1>See how your DNA lines up with ETFs</h1>
  <p>We compare your comfort and capacity for risk with what each ETF is built to do, then layer in the real goal, time horizon and access needs for this money.</p>
  <p className="fine muted">A higher score means closer research compatibility — not a better investment, a return forecast, or a recommendation to buy.</p>
 </div>;
}

function LoadingState(){
 return <div className="card">
  <h2>Building your matches…</h2>
  <p className="muted">Comparing your Investor DNA with the current verified ETF research universe.</p>
 </div>;
}

function ErrorState({error}:{error:string}){
 return <div role="alert" className="notice">
  <p>{error}</p>
  <button className="btn" onClick={()=>location.reload()}>Try again</button>
 </div>;
}

function SignedOutState(){
 return <div className="card">
  <h2>Discover your DNA to unlock Match</h2>
  <p>You can complete the assessment and see your current ETF compatibility as a guest. Create an account only if you want to keep it across visits.</p>
  <div className="actions">
   <Link className="btn primary" href="/dna/assessment">Discover my Investing DNA</Link>
   <Link className="btn" href="/profile">Sign in to saved DNA</Link>
  </div>
 </div>;
}

function MissingDnaState(){
 return <div className="card">
  <h2>Discover your Investor DNA first</h2>
  <p>Complete the assessment before we compare you with investments.</p>
  <Link className="btn primary" href="/dna/assessment">Discover my DNA</Link>
 </div>;
}

function MatchContent({
 match,constraints,featured,more,hasContext,idBySymbol,compareIds
}:{
 match?:MatchPayload;
 constraints:ConstraintShape;
 featured:MatchItem[];
 more:MatchItem[];
 hasContext:boolean;
 idBySymbol:Map<string,string>;
 compareIds:string[];
}){
 return <>
  <MatchStatus match={match} constraints={constraints} featuredCount={featured.length}/>

  {!hasContext&&match?.status!=='review_required'&&<div className="match-context-nudge">
   <div>
    <strong>Make these matches more useful</strong>
    <p>Add what the money is for, when you may need it, how important access is, and whether the full amount must be protected. That context stays separate from your Investor DNA.</p>
   </div>
   <Link className="btn" href="/dna/context">Add investment context</Link>
  </div>}

  {featured.length
   ? <FeaturedMatches featured={featured} match={match} idBySymbol={idBySymbol}/>
   : match?.status!=='review_required'
     ? <div className="card">
        <h2>No ranked comparisons are available</h2>
        <p>Explore the ETF research universe without treating the list as a personal match.</p>
        <Link className="btn" href="/explore">Explore investments</Link>
       </div>
     : null}

  {more.length>0&&match?.status!=='no_suitable_options'&&<MoreMatches rows={more} idBySymbol={idBySymbol}/>} 

  <div className="match-footer-actions">
   {compareIds.length>=2&&<Link className="btn primary" href={`/compare?ids=${compareIds.join(',')}`}>Compare these side by side</Link>}
   <Link className="btn" href="/screener">Open ETF screener</Link>
   <Link className="btn" href="/explore">Explore all investments</Link>
  </div>
 </>;
}

function MatchStatus({match,constraints,featuredCount}:{match?:MatchPayload;constraints:ConstraintShape;featuredCount:number}){
 if(match?.status==='review_required'){
  return <div className="match-status-card warning">
   <div className="eyebrow">Matching paused</div>
   <h2>Review this money before ranking ETFs</h2>
   <p>The engine found a financial or product-data condition that should not be converted into a ranked recommendation.</p>
   {constraints.reasons?.length?<ul>{constraints.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>:null}
   <div className="actions">
    <Link className="btn" href="/dna/context">Review investment context</Link>
    <Link className="btn" href="/profile">My profile</Link>
   </div>
  </div>;
 }

 if(match?.status==='no_suitable_options'){
  return <div className="match-status-card warning">
   <div className="eyebrow">No forced match</div>
   <h2>No ETF in the current research universe passes your fit limits</h2>
   <p>We are not forcing a recommendation. The comparisons below are the closest outside the current limits and are shown only to explain the mismatch.</p>
  </div>;
 }

 if(match?.status==='context_required'){
  return <div className="match-status-card">
   <div className="eyebrow">DNA-only view</div>
   <h2>Add the purpose of this money for a more useful match</h2>
   <p>Your DNA is available, but goal, horizon, liquidity or principal-protection needs are still missing. Scores below are intentionally limited-context comparisons.</p>
   <Link className="btn primary" href="/dna/context">Add investment context</Link>
  </div>;
 }

 if(match?.status==='available'){
  const count=match.eligible_count||featuredCount;
  return <div className="match-status-card ok">
   <div className="eyebrow">Context-aware match</div>
   <h2>{count} current option{count===1?'':'s'} passed the research fit limits</h2>
   <p>These results use your Investor DNA, investment context and the current verified ETF data version.</p>
   {match.data_as_of&&<p className="fine muted">ETF data through {match.data_as_of} · Match model {match.model_version}</p>}
  </div>;
 }

 return null;
}

function FeaturedMatches({featured,match,idBySymbol}:{featured:MatchItem[];match?:MatchPayload;idBySymbol:Map<string,string>}){
 const noSuitable=match?.status==='no_suitable_options';
 return <section className="match-section">
  <div className="eyebrow">{noSuitable?'Closest comparisons outside limits':'Closest alignment'}</div>
  <h2>{noSuitable?'Why the nearest options still miss':'Start with these'}</h2>
  <div className="match-dna-grid">
   {featured.map((item,index)=><MatchCard
    key={item.symbol}
    item={item}
    index={index}
    match={match}
    investmentId={idBySymbol.get(item.symbol)}
   />)}
  </div>
 </section>;
}

function MatchCard({item,index,match,investmentId}:{item:MatchItem;index:number;match?:MatchPayload;investmentId?:string}){
 const good=strengths(item);
 const watch=watchouts(item);
 const scores=breakdown(item);

 return <article className="match-dna-card">
  <div className="match-card-top">
   <div>
    <span className="pill">{item.symbol}</span>
    {index===0&&match?.status!=='no_suitable_options'&&<span className="match-rank">Closest match</span>}
   </div>
   <div className="match-score">
    <strong>{scoreValue(item)}</strong>
    <span>{item.match_score==null?'':'/100'}</span>
   </div>
  </div>

  <h3>{item.name||item.symbol}</h3>
  <div className="match-meta">
   <span className="match-fit">{fitLabel(item)}</span>
   {item.risk_band&&<span className="pill">Official risk: {item.risk_band}</span>}
  </div>
  {item.explanation?.summary&&<p className="match-summary">{item.explanation.summary}</p>}

  {scores.length>0&&<div className="match-breakdown">
   {scores.map(([name,value])=><div key={name}>
    <span>{name}</span><strong>{Math.round(value)}/100</strong>
   </div>)}
  </div>}

  {good.length>0&&<div className="match-why">
   <small>Why it may fit</small>
   {good.slice(0,2).map(text=><p key={text}>✓ {text}</p>)}
  </div>}

  {watch.length>0&&<div className="match-watch">
   <small>What conflicts</small>
   {watch.slice(0,2).map(text=><p key={text}>! {text}</p>)}
  </div>}

  <p className="match-change">
   <strong>What would change this comparison?</strong><br/>
   {changeNote(item,match)}
  </p>

  {investmentId
   ? <Link className="btn primary" href={'/investment/'+investmentId}>View Investment DNA</Link>
   : <Link className="btn" href="/explore">Find in Explore</Link>}
 </article>;
}

function MoreMatches({rows,idBySymbol}:{rows:MatchItem[];idBySymbol:Map<string,string>}){
 return <section className="match-section match-more">
  <div className="eyebrow">Also worth comparing</div>
  <h2>Other compatible options</h2>
  <div className="match-more-grid">
   {rows.map(item=>{
    const id=idBySymbol.get(item.symbol);
    return <article className="match-mini-card" key={item.symbol}>
     <div>
      <span className="pill">{item.symbol}</span>
      <h3>{item.name||item.symbol}</h3>
      <p>{fitLabel(item)}{item.risk_band?` · Official risk: ${item.risk_band}`:''}</p>
     </div>
     <div className="match-mini-score">{scoreValue(item)}{item.match_score==null?null:<small>/100</small>}</div>
     {id&&<Link href={'/investment/'+id}>See details →</Link>}
    </article>;
   })}
  </div>
 </section>;
}

function unique(items:MatchItem[]){
 const seen=new Set<string>();
 return items.filter(item=>{
  if(seen.has(item.symbol))return false;
  seen.add(item.symbol);
  return true;
 });
}

function fitLabel(item:MatchItem){
 return item.explanation?.fit_label ||
  item.fit_label ||
  ({
   top_match:'Closer fit',
   alternative:'Possible fit',
   consider:'DNA-only comparison',
   mismatch:'Outside current fit limits'
  }[item.recommendation_tier||'']||'Compatibility');
}

function strengths(item:MatchItem){return item.explanation?.strengths||item.strengths||[];}
function watchouts(item:MatchItem){return item.explanation?.watchouts||item.watchouts||[];}
function scoreValue(item:MatchItem){return item.match_score==null?'—':Math.round(item.match_score);}

function constraintShape(match?:MatchPayload){
 return (match?.constraints||{}) as ConstraintShape;
}

function breakdown(item:MatchItem){
 const scores=item.explanation?.scores||{};
 return [
  ['Official risk fit',scores.official_risk_fit],
  ['Market exposure fit',scores.market_exposure_fit],
  ['Goal role fit',scores.goal_role_fit],
  ['Exposure breadth',scores.exposure_breadth]
 ].filter((entry):entry is [string,number]=>typeof entry[1]==='number'&&Number.isFinite(entry[1]));
}

function changeNote(item:MatchItem,match?:MatchPayload){
 const scores=item.explanation?.scores||{};

 if(item.eligibility==='review_required'){
  return 'This comparison is paused by a safety or data-review gate. Resolve the review point rather than trying to raise the score.';
 }
 if(match?.status==='context_required'){
  return 'Add the real goal, withdrawal horizon, liquidity need and principal requirement for this money. That turns this from DNA-only comparison into context-aware matching.';
 }
 if(typeof scores.market_exposure_fit==='number'&&scores.market_exposure_fit<95){
  return 'A lower-equity structure would fit the current exposure ceiling more closely. A genuinely longer horizon may also change that ceiling; do not change your inputs just to improve a score.';
 }
 if(typeof scores.official_risk_fit==='number'&&scores.official_risk_fit<85){
  return 'A fund with a lower issuer-disclosed risk category would align more closely with the risk tolerance and capacity in your current DNA.';
 }
 if(typeof scores.goal_role_fit==='number'&&scores.goal_role_fit<60){
  return 'An investment whose asset mix better serves the goal you entered for this money would improve role fit.';
 }
 if(typeof scores.exposure_breadth==='number'&&scores.exposure_breadth<75){
  return 'A structure with broader market or asset-class exposure would improve the breadth component.';
 }
 return 'The score should move only when your genuine inputs change, the fund structure changes, or newer verified fund data becomes available.';
}
