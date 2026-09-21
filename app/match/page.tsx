"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {instrumentDisplayName,searchInstruments} from '@/lib/instruments';
import type {Instrument} from '@/lib/instruments';
import {hasCompleteInvestmentContext,readDraft} from '@/lib/dna';
import {formatInvestmentContext} from '@/lib/dna-presentation';
import {effectiveMatchStatus,matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';
import type {AppState,InvestmentContextProfile,MatchItem,MatchPayload} from '@/lib/dna';

type ConstraintShape={
 reasons?:string[];
 codes?:string[];
 context_complete?:boolean;
 equity_ceiling?:number;
 horizon_months?:number;
};

type GoalAwareExplanation=NonNullable<MatchItem['explanation']>&{
 goal_fit?:{
  model_version?:string;
  score?:number|null;
  components?:Record<string,number>;
  summary?:string;
 }|null;
};

/** Personalized fund compatibility surface backed by the canonical Match payload. */
export default function Matches(){
 const {user,loading:authLoading}=useAccount();
 const [state,setState]=useState<AppState|null>(null);
 const [funds,setFunds]=useState<Instrument[]>([]);
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
   Promise.all([
    searchInstruments({assetType:'ETF',limit:100}),
    searchInstruments({assetType:'MUTUAL_FUND',limit:100})
   ]).then(([etfs,mutualFunds])=>{if(active)setFunds([...etfs,...mutualFunds])})
    .catch(e=>{if(active)setError(e.message)})
    .finally(()=>{if(active)setLoading(false)});
   return ()=>{active=false};
  }

  setLoading(true);
  Promise.all([
   rpc<AppState>('get_current_investor_app_state'),
   Promise.all([
    searchInstruments({assetType:'ETF',limit:100}),
    searchInstruments({assetType:'MUTUAL_FUND',limit:100})
   ]).then(([etfs,mutualFunds])=>[...etfs,...mutualFunds])
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

 const context=state?.report?.investment_context||state?.dna?.investment_context||null;
 const rawMatch=state?.matches;
 const displayStatus=effectiveMatchStatus(rawMatch?.status,hasCompleteInvestmentContext(context))||undefined;
 const staleContextRows=displayStatus==='context_required'&&rawMatch?.status!=='context_required';
 const match:MatchPayload|undefined=rawMatch?{
  ...rawMatch,
  status:displayStatus,
  ...(staleContextRows?{results:[],top_matches:[],alternatives:[],consider:[],mismatch:[],eligible_count:0}:{})
 }:undefined;
 const constraints=constraintShape(match);

 const eligibleRows=useMemo(()=>{
  const buckets=unique([...(match?.top_matches||[]),...(match?.alternatives||[]),...(match?.consider||[])]);
  if(buckets.length)return buckets;
  return match?.status==='no_suitable_options'?[]:unique(match?.results||[]);
 },[match]);
 const fallbackRows=useMemo(()=>{
  const mismatch=unique(match?.mismatch||[]);
  if(mismatch.length)return mismatch;
  return match?.status==='no_suitable_options'?unique(match?.results||[]):[];
 },[match]);
 const rows=match?.status==='review_required'
  ? []
  : match?.status==='no_suitable_options'
    ? fallbackRows
    : eligibleRows;

 const idBySymbol=useMemo(()=>new Map(funds.map(fund=>[fund.symbol,fund.id])),[funds]);
 const displayNameBySymbol=useMemo(()=>new Map(funds.map(fund=>[fund.symbol,instrumentDisplayName(fund)])),[funds]);
 const featured=rows.slice(0,3);
 const more=rows.slice(3,9);
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
           context={context}
           idBySymbol={idBySymbol}
           displayNameBySymbol={displayNameBySymbol}
           compareIds={compareIds}
          />}
  </div>
 </section>;
}

function MatchHero(){
 return <div className="match-dna-hero">
  <div className="eyebrow">DNA Match · Funds</div>
  <h1><span className="desktop-match-title">See how your DNA lines up with funds</span><span className="mobile-match-title">Your fund matches</span></h1>
  <p><span className="desktop-match-copy">We compare your comfort and capacity for risk with what each ETF or mutual fund is built to do, then layer in the real goal, time horizon, access needs and principal-protection requirement for this money.</span><span className="mobile-match-copy">See which funds align more closely with your DNA and the context for this money.</span></p>
  <p className="fine muted">A higher score means closer research compatibility with the inputs shown on this page — not a better investment, a return forecast, or a recommendation to buy.</p>
 </div>;
}

function LoadingState(){
 return <div className="card mobile-match-loading" role="status">
  <div className="mobile-loading-line wide"/><div className="mobile-loading-line"/><div className="mobile-loading-line short"/>
  <span>Building your matches…</span>
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
  <p>You can complete the assessment and see your current fund compatibility as a guest. Create an account only if you want to keep it across visits.</p>
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
 match,constraints,featured,more,context,idBySymbol,displayNameBySymbol,compareIds
}:{
 match?:MatchPayload;
 constraints:ConstraintShape;
 featured:MatchItem[];
 more:MatchItem[];
 context:InvestmentContextProfile|null;
 idBySymbol:Map<string,string>;
 displayNameBySymbol:Map<string,string>;
 compareIds:string[];
}){
 const goalLens=match?.status==='available'
  ? featured.map(goalLensFor).find((value):value is string=>!!value)
  : undefined;

 return <>
  <MatchStatus match={match} constraints={constraints} featuredCount={featured.length}/>

  {context&&<MoneyContextSummary context={context} goalLens={goalLens}/>} 

  {match?.status==='context_required'&&<div className="match-context-nudge">
   <div>
    <strong>Make these comparisons specific to this money</strong>
    <p>Add what the money is for, when you may need it, how important access is, and whether the full amount must be protected. That context stays separate from your Investor DNA.</p>
   </div>
   <Link className="btn" href="/dna/context?returnTo=/match">Add investment context</Link>
  </div>}

  {featured.length
   ? <FeaturedMatches featured={featured} match={match} idBySymbol={idBySymbol} displayNameBySymbol={displayNameBySymbol}/>
   : match?.status!=='review_required'
     ? <div className="card">
        <h2>{match?.status==='context_required'?'No DNA-only comparisons are available':'No ranked comparisons are available'}</h2>
        <p>Explore the fund research universe without treating the list as a personal match.</p>
        <Link className="btn" href="/explore">Explore investments</Link>
       </div>
     : null}

  {more.length>0&&match?.status!=='no_suitable_options'&&<MoreMatches rows={more} match={match} idBySymbol={idBySymbol} displayNameBySymbol={displayNameBySymbol}/>} 

  <div className="match-footer-actions">
   {compareIds.length>=2&&<Link className="btn primary" href={`/compare?ids=${compareIds.join(',')}`}>Compare these side by side</Link>}
   <Link className="btn" href="/screener">Open ETF screener</Link>
   <Link className="btn" href="/explore">Explore all investments</Link>
  </div>
 </>;
}

function MoneyContextSummary({context,goalLens}:{context:InvestmentContextProfile;goalLens?:string}){
 const [open,setOpen]=useState(false);
 const rows=[
  ['Goal',formatInvestmentContext('goal',context.goal)],
  ['Time horizon',formatInvestmentContext('time_horizon',context.time_horizon)],
  ['Access need',formatInvestmentContext('liquidity_need',context.liquidity_need)],
  ['Principal protection',formatInvestmentContext('principal_required',context.principal_required)]
 ];

 return <section className={open?"card match-context-disclosure open":"card match-context-disclosure"}>
  <button type="button" className="match-context-summary" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
   <span><span className="eyebrow">What this Match is using</span><strong>Your money context</strong></span>
   <span className="match-context-summary-meta">4 inputs <b aria-hidden="true">+</b></span>
  </button>
  <div className="match-context-body">
   <div className="match-context-desktop-heading">
    <div className="eyebrow">What this Match is using</div>
    <h2>Your money context</h2>
    <p className="muted">These answers affect the fund comparison below. They do not change your underlying Investor DNA.</p>
   </div>
   <div className="grid2 section compact">
    {rows.map(([label,value])=><div className="fingerprint" key={label}>
     <span>{label}</span>
     <strong>{value}</strong>
    </div>)}
   </div>
   {goalLens&&<div className="notice match-goal-lens">
    <strong>How this goal changes Match</strong>
    <p>{goalLens}</p>
   </div>}
   <div className="actions compact">
    <Link className="btn" href="/dna/context?returnTo=/match">Edit this context</Link>
   </div>
  </div>
 </section>;
}

function MatchStatus({match,constraints,featuredCount}:{match?:MatchPayload;constraints:ConstraintShape;featuredCount:number}){
 if(match?.status==='review_required'){
  return <div className="match-status-card warning">
   <div className="eyebrow">Matching paused</div>
   <h2>Review this money before ranking funds</h2>
   <p>The current inputs or fund data triggered a review point, so we are not turning them into a ranked list.</p>
   {constraints.reasons?.length?<ul>{constraints.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>:null}
   <div className="actions">
    <Link className="btn" href="/dna/context?returnTo=/match">Review investment context</Link>
    <Link className="btn" href="/profile">My profile</Link>
   </div>
  </div>;
 }

 if(match?.status==='no_suitable_options'){
  return <div className="match-status-card warning">
   <div className="eyebrow">No forced match</div>
   <h2>No fund in the current research universe passes your fit limits</h2>
   <p>We are not forcing a result. The comparisons below sit outside at least one current limit and are shown only to explain the mismatch.</p>
  </div>;
 }

 if(match?.status==='context_required'){
  return <div className="match-status-card">
   <div className="eyebrow">DNA-only view</div>
   <h2>Add the purpose of this money for a more useful match</h2>
   <p>Your DNA is available, but goal, horizon, liquidity or principal-protection needs are still missing. Numeric Match scores stay hidden until that context is complete.</p>
   <Link className="btn primary" href="/dna/context?returnTo=/match">Add investment context</Link>
  </div>;
 }

 if(match?.status==='available'){
  const count=match.eligible_count??featuredCount;
  return <div className="match-status-card ok">
   <div className="eyebrow">Context-aware match</div>
   <h2>{count} current option{count===1?'':'s'} passed the research fit limits</h2>
   <p>Use the context summary and the reasons on each card to understand what is driving the comparison.</p>
   {match.data_as_of&&<p className="fine muted">Fund data through {match.data_as_of} · Match model {match.model_version}</p>}
  </div>;
 }

 return null;
}

function FeaturedMatches({featured,match,idBySymbol,displayNameBySymbol}:{featured:MatchItem[];match?:MatchPayload;idBySymbol:Map<string,string>;displayNameBySymbol:Map<string,string>}){
 const noSuitable=match?.status==='no_suitable_options';
 const contextOnly=match?.status==='context_required';
 return <section className="match-section">
  <div className="eyebrow">{contextOnly?'DNA-only comparisons':noSuitable?'Closest comparisons outside limits':'Closest current alignment'}</div>
  <h2>{contextOnly?'Explore these before adding context':noSuitable?'Why the nearest options still miss':'Compare these more closely'}</h2>
  <div className="match-dna-grid">
   {featured.map((item,index)=><MatchCard
    key={item.symbol}
    item={item}
    index={index}
    match={match}
    investmentId={idBySymbol.get(item.symbol)}
    displayName={displayNameBySymbol.get(item.symbol)}
   />)}
  </div>
 </section>;
}

function MatchCard({item,index,match,investmentId,displayName}:{item:MatchItem;index:number;match?:MatchPayload;investmentId?:string;displayName?:string}){
 const contextOnly=match?.status==='context_required';
 const rowContextOnly=item.eligibility==='context_required'||item.recommendation_tier==='consider';
 const allowExplanation=!contextOnly||rowContextOnly;
 const good=allowExplanation?strengths(item):[];
 const watch=allowExplanation?watchouts(item):[];
 const scores=contextOnly?[]:breakdown(item);
 const score=matchScorePresentation(item,match?.status);
 const summary=allowExplanation&&(contextOnly||match?.status==='no_suitable_options')?item.explanation?.summary:null;

 return <article className="match-dna-card">
  <div className="match-card-top">
   <div>
    <span className="pill">{item.symbol}</span>
    {index===0&&match?.status!=='no_suitable_options'&&<span className="match-rank">{contextOnly?'DNA-only comparison':'Closest current fit'}</span>}
   </div>
   <div className="match-score">
    <strong>{score.numericValue??score.text}</strong>
    <span>{score.numericValue==null?'':'/100'}</span>
   </div>
  </div>

  <h3>{displayName||item.name||item.symbol}</h3>
  <div className="match-meta">
   <span className="match-fit">{matchFitLabel(item,match?.status)}</span>
   {item.risk_band&&<span className="pill">Official risk: {item.risk_band}</span>}
  </div>
  {summary&&<p className="match-summary">{summary}</p>}

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
   <small>What to watch</small>
   {watch.slice(0,2).map(text=><p key={text}>! {text}</p>)}
  </div>}

  <p className="match-change">
   <strong>What could change the fit?</strong><br/>
   {changeNote(item,match)}
  </p>

  {investmentId
   ? <Link className="btn primary" href={'/investment/'+investmentId}>Open fund research</Link>
   : <Link className="btn" href="/explore">Find in Explore</Link>}
 </article>;
}

function MoreMatches({rows,match,idBySymbol,displayNameBySymbol}:{rows:MatchItem[];match?:MatchPayload;idBySymbol:Map<string,string>;displayNameBySymbol:Map<string,string>}){
 const contextOnly=match?.status==='context_required';
 return <section className="match-section match-more">
  <div className="eyebrow">{contextOnly?'More DNA-only comparisons':'Also passed current limits'}</div>
  <h2>{contextOnly?'Continue exploring the fund universe':'Other funds to compare'}</h2>
  <div className="match-more-grid">
   {rows.map(item=>{
    const id=idBySymbol.get(item.symbol);
    const score=matchScorePresentation(item,match?.status);
    return <article className="match-mini-card" key={item.symbol}>
     <div>
      <span className="pill">{item.symbol}</span>
      <h3>{displayNameBySymbol.get(item.symbol)||item.name||item.symbol}</h3>
      <p>{matchFitLabel(item,match?.status)}{item.risk_band?` · Official risk: ${item.risk_band}`:''}</p>
     </div>
     <div className="match-mini-score">{score.text}</div>
     {id&&<Link href={'/investment/'+id}>Open research →</Link>}
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

function strengths(item:MatchItem){return item.explanation?.strengths||item.strengths||[];}
function watchouts(item:MatchItem){return item.explanation?.watchouts||item.watchouts||[];}

function goalLensFor(item:MatchItem):string|null{
 const explanation=item.explanation as GoalAwareExplanation|undefined;
 return explanation?.goal_fit?.summary||null;
}

function constraintShape(match?:MatchPayload){
 return (match?.constraints||{}) as ConstraintShape;
}

function breakdown(item:MatchItem){
 const scores=item.explanation?.scores||{};
 return [
  ['Risk level',scores.official_risk_fit],
  ['Equity exposure',scores.market_exposure_fit],
  ['Goal fit',scores.goal_role_fit],
  ['Diversification',scores.exposure_breadth]
 ].filter((entry):entry is [string,number]=>typeof entry[1]==='number'&&Number.isFinite(entry[1]));
}

function changeNote(item:MatchItem,match?:MatchPayload){
 const scores=item.explanation?.scores||{};

 if(item.eligibility==='review_required'){
  return 'This comparison is paused by a safety or data-review gate. Resolve the review point rather than trying to raise the score.';
 }
 if(match?.status==='context_required'){
  return 'Add the real goal, withdrawal horizon, liquidity need and principal requirement for this money. That turns this from a DNA-only comparison into a context-aware Match.';
 }
 if(typeof scores.market_exposure_fit==='number'&&scores.market_exposure_fit<95){
  return 'A lower-equity fund would sit closer to the current exposure limit. A genuinely longer horizon may also change that limit; do not change your inputs just to improve a score.';
 }
 if(typeof scores.official_risk_fit==='number'&&scores.official_risk_fit<85){
  return 'A fund with a lower issuer-disclosed risk category would align more closely with the risk tolerance and capacity in your current DNA.';
 }
 if(typeof scores.goal_role_fit==='number'&&scores.goal_role_fit<60){
  return 'A fund whose structure better serves the goal and horizon you entered for this money would improve the goal-fit component.';
 }
 if(typeof scores.exposure_breadth==='number'&&scores.exposure_breadth<75){
  return 'A structure with broader market or asset-class exposure would improve the diversification component.';
 }
 return 'The fit can move when your genuine money context changes, the fund structure changes, or newer verified fund data becomes available.';
}
