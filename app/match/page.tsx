"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import type {Fund} from '@/lib/investments';
import {hasCompleteInvestmentContext,readDraft} from '@/lib/dna';
import {formatInvestmentContext} from '@/lib/dna-presentation';
import {effectiveMatchStatus,matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';
import type {AppState,InvestmentContextProfile,MatchItem,MatchPayload} from '@/lib/dna';
import {useLocale} from '@/lib/locale';

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
           compareIds={compareIds}
          />}
  </div>
 </section>;
}

function MatchHero(){
 const {pick}=useLocale();
 return <div className="match-dna-hero">
  <div className="eyebrow">{pick("DNA Match · ETFs","DNA Match · FNB")}</div>
  <h1><span className="desktop-match-title">{pick("See how your DNA lines up with ETFs","Voyez comment votre DNA se compare aux FNB")}</span><span className="mobile-match-title">{pick("Your ETF matches","Vos correspondances FNB")}</span></h1>
  <p><span className="desktop-match-copy">{pick("We compare your comfort and capacity for risk with what each ETF is built to do, then layer in the real goal, time horizon, access needs and principal-protection requirement for this money.","Nous comparons votre tolérance et votre capacité de risque avec la structure de chaque FNB, puis nous ajoutons l’objectif, l’horizon, les besoins d’accès et l’exigence de protection du capital pour cet argent.")}</span><span className="mobile-match-copy">{pick("See which ETFs align more closely with your DNA and the context for this money.","Voyez quels FNB correspondent le mieux à votre DNA et au contexte de cet argent.")}</span></p>
  <p className="fine muted">{pick("A higher score means closer research compatibility with the inputs shown on this page — not a better investment, a return forecast, or a recommendation to buy.","Un score plus élevé indique une compatibilité de recherche plus proche avec les données de cette page — pas un meilleur placement, une prévision de rendement ni une recommandation d’achat.")}</p>
 </div>;
}

function LoadingState(){
 const {pick}=useLocale();
 return <div className="card mobile-match-loading" role="status">
  <div className="mobile-loading-line wide"/><div className="mobile-loading-line"/><div className="mobile-loading-line short"/>
  <span>{pick("Building your matches…","Préparation de vos correspondances…")}</span>
 </div>;
}

function ErrorState({error}:{error:string}){
 const {pick}=useLocale();
 return <div role="alert" className="notice">
  <p>{error}</p>
  <button className="btn" onClick={()=>location.reload()}>{pick("Try again","Réessayer")}</button>
 </div>;
}

function SignedOutState(){
 const {pick}=useLocale();
 return <div className="card">
  <h2>{pick("Discover your DNA to unlock Match","Découvrez votre DNA pour accéder à Match")}</h2>
  <p>{pick("You can complete the assessment and see your current ETF compatibility as a guest. Create an account only if you want to keep it across visits.","Vous pouvez terminer l’évaluation et voir votre compatibilité actuelle avec les FNB sans compte. Créez un compte seulement si vous souhaitez la conserver entre vos visites.")}</p>
  <div className="actions">
   <Link className="btn primary" href="/dna/assessment">{pick("Discover my Investing DNA","Découvrir mon Investing DNA")}</Link>
   <Link className="btn" href="/profile">{pick("Sign in to saved DNA","Se connecter à mon DNA enregistré")}</Link>
  </div>
 </div>;
}

function MissingDnaState(){
 const {pick}=useLocale();
 return <div className="card">
  <h2>{pick("Discover your Investor DNA first","Découvrez d’abord votre Investor DNA")}</h2>
  <p>{pick("Complete the assessment before we compare you with investments.","Terminez l’évaluation avant de comparer votre profil aux placements.")}</p>
  <Link className="btn primary" href="/dna/assessment">{pick("Discover my DNA","Découvrir mon DNA")}</Link>
 </div>;
}

function MatchContent({
 match,constraints,featured,more,context,idBySymbol,compareIds
}:{
 match?:MatchPayload;
 constraints:ConstraintShape;
 featured:MatchItem[];
 more:MatchItem[];
 context:InvestmentContextProfile|null;
 idBySymbol:Map<string,string>;
 compareIds:string[];
}){
 const {pick}=useLocale();
 const goalLens=match?.status==='available'
  ? featured.map(goalLensFor).find((value):value is string=>!!value)
  : undefined;

 return <>
  <MatchStatus match={match} constraints={constraints} featuredCount={featured.length}/>

  {context&&<MoneyContextSummary context={context} goalLens={goalLens}/>} 

  {match?.status==='context_required'&&<div className="match-context-nudge">
   <div>
    <strong>{pick("Make these comparisons specific to this money","Adapter ces comparaisons à cet argent")}</strong>
    <p>{pick("Add what the money is for, when you may need it, how important access is, and whether the full amount must be protected. That context stays separate from your Investor DNA.","Ajoutez l’objectif de cet argent, le moment où vous pourriez en avoir besoin, l’importance de l’accès et le besoin de protéger le montant total. Ce contexte reste distinct de votre Investor DNA.")}</p>
   </div>
   <Link className="btn" href="/dna/context?returnTo=/match">{pick("Add investment context","Ajouter le contexte du placement")}</Link>
  </div>}

  {featured.length
   ? <FeaturedMatches featured={featured} match={match} idBySymbol={idBySymbol}/>
   : match?.status!=='review_required'
     ? <div className="card">
        <h2>{match?.status==='context_required'?pick('No DNA-only comparisons are available','Aucune comparaison DNA seule n’est disponible'):pick('No ranked comparisons are available','Aucune comparaison classée n’est disponible')}</h2>
        <p>{pick("Explore the ETF research universe without treating the list as a personal match.","Explorez l’univers de recherche des FNB sans considérer la liste comme une recommandation personnalisée.")}</p>
        <Link className="btn" href="/explore">{pick("Explore investments","Explorer les placements")}</Link>
       </div>
     : null}

  {more.length>0&&match?.status!=='no_suitable_options'&&<MoreMatches rows={more} match={match} idBySymbol={idBySymbol}/>} 

  <div className="match-footer-actions">
   {compareIds.length>=2&&<Link className="btn primary" href={`/compare?ids=${compareIds.join(',')}`}>{pick("Compare these side by side","Comparer côte à côte")}</Link>}
   <Link className="btn" href="/screener">{pick("Open ETF screener","Ouvrir le filtre FNB")}</Link>
   <Link className="btn" href="/explore">{pick("Explore all investments","Explorer tous les placements")}</Link>
  </div>
 </>;
}

function MoneyContextSummary({context,goalLens}:{context:InvestmentContextProfile;goalLens?:string}){
 const {locale,pick}=useLocale();
 const [open,setOpen]=useState(false);
 const rows=[
  [pick('Goal','Objectif'),formatInvestmentContext('goal',context.goal)],
  [pick('Time horizon','Horizon'),formatInvestmentContext('time_horizon',context.time_horizon)],
  [pick('Access need','Besoin d’accès'),formatInvestmentContext('liquidity_need',context.liquidity_need)],
  [pick('Principal protection','Protection du capital'),formatInvestmentContext('principal_required',context.principal_required)]
 ];

 return <section className={open?"card match-context-disclosure open":"card match-context-disclosure"}>
  <button type="button" className="match-context-summary" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
   <span><span className="eyebrow">{pick("What this Match is using","Ce que ce Match utilise")}</span><strong>{pick("Your money context","Votre contexte financier")}</strong></span>
   <span className="match-context-summary-meta">{pick("4 inputs","4 données")} <b aria-hidden="true">+</b></span>
  </button>
  <div className="match-context-body">
   <div className="match-context-desktop-heading">
    <div className="eyebrow">{pick("What this Match is using","Ce que ce Match utilise")}</div>
    <h2>{pick("Your money context","Votre contexte financier")}</h2>
    <p className="muted">{pick("These answers affect the ETF comparison below. They do not change your underlying Investor DNA.","Ces réponses influencent la comparaison des FNB ci-dessous. Elles ne modifient pas votre Investor DNA sous-jacent.")}</p>
   </div>
   <div className="grid2 section compact">
    {rows.map(([label,value])=><div className="fingerprint" key={label}>
     <span>{label}</span>
     <strong>{value}</strong>
    </div>)}
   </div>
   {goalLens&&<div className="notice match-goal-lens">
    <strong>{pick("How this goal changes Match","Comment cet objectif modifie Match")}</strong>
    <p>{goalLens}</p>
   </div>}
   <div className="actions compact">
    <Link className="btn" href="/dna/context?returnTo=/match">{pick("Edit this context","Modifier ce contexte")}</Link>
   </div>
  </div>
 </section>;
}

function MatchStatus({match,constraints,featuredCount}:{match?:MatchPayload;constraints:ConstraintShape;featuredCount:number}){
 const {locale,pick}=useLocale();
 if(match?.status==='review_required'){
  return <div className="match-status-card warning">
   <div className="eyebrow">{pick("Matching paused","Match en pause")}</div>
   <h2>{pick("Review this money before ranking ETFs","Révisez ce contexte avant de classer les FNB")}</h2>
   <p>{pick("The current inputs or ETF data triggered a review point, so we are not turning them into a ranked list.","Les données actuelles ont déclenché une vérification; nous ne les transformons donc pas en liste classée.")}</p>
   {constraints.reasons?.length?<ul>{constraints.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>:null}
   <div className="actions">
    <Link className="btn" href="/dna/context?returnTo=/match">{pick("Review investment context","Réviser le contexte du placement")}</Link>
    <Link className="btn" href="/profile">{pick("My profile","Mon profil")}</Link>
   </div>
  </div>;
 }

 if(match?.status==='no_suitable_options'){
  return <div className="match-status-card warning">
   <div className="eyebrow">{pick("No forced match","Aucune correspondance forcée")}</div>
   <h2>{pick("No ETF in the current research universe passes your fit limits","Aucun FNB de l’univers actuel ne respecte vos limites de compatibilité")}</h2>
   <p>{pick("We are not forcing a result. The comparisons below sit outside at least one current limit and are shown only to explain the mismatch.","Nous ne forçons pas de résultat. Les comparaisons ci-dessous dépassent au moins une limite actuelle et sont affichées uniquement pour expliquer l’écart.")}</p>
  </div>;
 }

 if(match?.status==='context_required'){
  return <div className="match-status-card">
   <div className="eyebrow">{pick("DNA-only view","Vue DNA seulement")}</div>
   <h2>{pick("Add the purpose of this money for a more useful match","Ajoutez l’objectif de cet argent pour un Match plus utile")}</h2>
   <p>{pick("Your DNA is available, but goal, horizon, liquidity or principal-protection needs are still missing. Numeric Match scores stay hidden until that context is complete.","Votre DNA est disponible, mais il manque encore l’objectif, l’horizon, les besoins de liquidité ou la protection du capital. Les scores numériques restent masqués jusqu’à ce que le contexte soit complet.")}</p>
   <Link className="btn primary" href="/dna/context?returnTo=/match">{pick("Add investment context","Ajouter le contexte du placement")}</Link>
  </div>;
 }

 if(match?.status==='available'){
  const count=match.eligible_count??featuredCount;
  return <div className="match-status-card ok">
   <div className="eyebrow">{pick("Context-aware match","Match tenant compte du contexte")}</div>
   <h2>{locale==='fr'?`${count} option${count===1?'':'s'} actuelle${count===1?'':'s'} respecte${count===1?'':'nt'} les limites de compatibilité`:`${count} current option${count===1?'':'s'} passed the research fit limits`}</h2>
   <p>{pick("Use the context summary and the reasons on each card to understand what is driving the comparison.","Utilisez le résumé du contexte et les raisons sur chaque fiche pour comprendre ce qui influence la comparaison.")}</p>
   {match.data_as_of&&<p className="fine muted">ETF data through {match.data_as_of} · Match model {match.model_version}</p>}
  </div>;
 }

 return null;
}

function FeaturedMatches({featured,match,idBySymbol}:{featured:MatchItem[];match?:MatchPayload;idBySymbol:Map<string,string>}){
 const {pick}=useLocale();
 const noSuitable=match?.status==='no_suitable_options';
 const contextOnly=match?.status==='context_required';
 return <section className="match-section">
  <div className="eyebrow">{contextOnly?pick('DNA-only comparisons','Comparaisons DNA seulement'):noSuitable?pick('Closest comparisons outside limits','Comparaisons les plus proches hors limites'):pick('Closest current alignment','Compatibilité actuelle la plus proche')}</div>
  <h2>{contextOnly?pick('Explore these before adding context','Explorez-les avant d’ajouter le contexte'):noSuitable?pick('Why the nearest options still miss','Pourquoi les options les plus proches restent insuffisantes'):pick('Compare these more closely','Comparez-les de plus près')}</h2>
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
 const {pick}=useLocale();
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
    {index===0&&match?.status!=='no_suitable_options'&&<span className="match-rank">{contextOnly?pick('DNA-only comparison','Comparaison DNA seulement'):pick('Closest current fit','Compatibilité actuelle la plus proche')}</span>}
   </div>
   <div className="match-score">
    <strong>{score.numericValue??score.text}</strong>
    <span>{score.numericValue==null?'':'/100'}</span>
   </div>
  </div>

  <h3>{item.name||item.symbol}</h3>
  <div className="match-meta">
   <span className="match-fit">{matchFitLabel(item,match?.status)}</span>
   {item.risk_band&&<span className="pill">{pick("Official risk","Risque officiel")}: {item.risk_band}</span>}
  </div>
  {summary&&<p className="match-summary">{summary}</p>}

  {scores.length>0&&<div className="match-breakdown">
   {scores.map(([name,value])=><div key={name}>
    <span>{name}</span><strong>{Math.round(value)}/100</strong>
   </div>)}
  </div>}

  {good.length>0&&<div className="match-why">
   <small>{pick("Why it may fit","Pourquoi cela peut convenir")}</small>
   {good.slice(0,2).map(text=><p key={text}>✓ {text}</p>)}
  </div>}

  {watch.length>0&&<div className="match-watch">
   <small>{pick("What to watch","Points à surveiller")}</small>
   {watch.slice(0,2).map(text=><p key={text}>! {text}</p>)}
  </div>}

  <p className="match-change">
   <strong>{pick("What could change the fit?","Qu’est-ce qui pourrait changer la compatibilité?")}</strong><br/>
   {changeNote(item,match)}
  </p>

  {investmentId
   ? <Link className="btn primary" href={'/investment/'+investmentId}>{pick("View ETF details","Voir les détails du FNB")}</Link>
   : <Link className="btn" href="/explore">{pick("Find in Explore","Trouver dans Explorer")}</Link>}
 </article>;
}

function MoreMatches({rows,match,idBySymbol}:{rows:MatchItem[];match?:MatchPayload;idBySymbol:Map<string,string>}){
 const {pick}=useLocale();
 const contextOnly=match?.status==='context_required';
 return <section className="match-section match-more">
  <div className="eyebrow">{contextOnly?pick('More DNA-only comparisons','Autres comparaisons DNA seulement'):pick('Also passed current limits','Respectent aussi les limites actuelles')}</div>
  <h2>{contextOnly?pick('Continue exploring the ETF universe','Continuer à explorer l’univers des FNB'):pick('Other ETFs to compare','Autres FNB à comparer')}</h2>
  <div className="match-more-grid">
   {rows.map(item=>{
    const id=idBySymbol.get(item.symbol);
    const score=matchScorePresentation(item,match?.status);
    return <article className="match-mini-card" key={item.symbol}>
     <div>
      <span className="pill">{item.symbol}</span>
      <h3>{item.name||item.symbol}</h3>
      <p>{matchFitLabel(item,match?.status)}{item.risk_band?` · Official risk: ${item.risk_band}`:''}</p>
     </div>
     <div className="match-mini-score">{score.text}</div>
     {id&&<Link href={'/investment/'+id}>{pick("View details →","Voir les détails →")}</Link>}
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
  return 'A lower-equity ETF would sit closer to the current exposure limit. A genuinely longer horizon may also change that limit; do not change your inputs just to improve a score.';
 }
 if(typeof scores.official_risk_fit==='number'&&scores.official_risk_fit<85){
  return 'An ETF with a lower issuer-disclosed risk category would align more closely with the risk tolerance and capacity in your current DNA.';
 }
 if(typeof scores.goal_role_fit==='number'&&scores.goal_role_fit<60){
  return 'An ETF whose structure better serves the goal and horizon you entered for this money would improve the goal-fit component.';
 }
 if(typeof scores.exposure_breadth==='number'&&scores.exposure_breadth<75){
  return 'A structure with broader market or asset-class exposure would improve the diversification component.';
 }
 return 'The fit can move when your genuine money context changes, the ETF structure changes, or newer verified ETF data becomes available.';
}
