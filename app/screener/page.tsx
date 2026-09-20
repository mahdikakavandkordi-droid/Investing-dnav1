"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {rpc} from '@/lib/supabase';
import {formatMetric} from '@/lib/investments';
import {effectiveMatchStatus,matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';
import {hasCompleteInvestmentContext,readDraft} from '@/lib/dna';
import type {Fund} from '@/lib/investments';
import {useAccount} from '@/lib/use-account';
import type {AppState,MatchItem,MatchPayload} from '@/lib/dna';
import {useLocale} from '@/lib/locale';

/**
 * ETF-only screener.
 *
 * The broader research universe is cross-asset, but personalized Match remains
 * ETF-only. Keep this route explicit rather than quietly treating GICs/bonds as
 * if they shared fund metrics such as MER or historical fund returns.
 */
export default function Screener(){
 const {pick}=useLocale();
 const {user,loading:authLoading}=useAccount();
 const [rows,setRows]=useState<Fund[]>([]);
 const [query,setQuery]=useState('');
 const [risk,setRisk]=useState('');
 const [sort,setSort]=useState('name');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [state,setState]=useState<AppState|null>(null);
 const [eligibleOnly,setEligibleOnly]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);

 async function runSearch(){
  setLoading(true);
  setError('');
  try{
   const data=await rpc<Fund[]>('app_search_investments',{
    p_asset_type:'ETF',
    p_search:query||null,
    p_risk_level:risk||null,
    p_sort:sort==='dna_desc'?'name':sort,
    p_limit:100
   });
   setRows(data);
  }catch(e){
   setError(e instanceof Error?e.message:'Could not load ETFs.');
  }finally{
   setLoading(false);
  }
 }

 useEffect(()=>{void runSearch()},[]);

 useEffect(()=>{
  let active=true;
  setState(null);

  if(!user){
   const local=readDraft(null);
   if(local?.result){
    setState({
     has_profile:false,
     assessment_id:local.session.assessment_id,
     dna:local.result.result,
     report:local.result.report?.report||local.result.result,
     matches:local.result.match
    });
   }
   return;
  }

  rpc<AppState>('get_current_investor_app_state')
   .then(data=>{if(active)setState(data)})
   .catch(()=>{});

  return ()=>{active=false};
 },[user?.id]);

 const rawMatchStatus=state?.matches?.status;
 const context=state?.report?.investment_context||state?.dna?.investment_context||null;
 const matchStatus=effectiveMatchStatus(rawMatchStatus,hasCompleteInvestmentContext(context))||undefined;
 const rowsTrusted=!(matchStatus==='context_required'&&rawMatchStatus!=='context_required');
 const matches=useMemo(
  ()=>new Map((rowsTrusted?currentMatchRows(state?.matches):[]).map(match=>[match.symbol,match])),
  [state,rowsTrusted]
 );

 useEffect(()=>{
  if(matchStatus==='available')return;
  setEligibleOnly(false);
  setSort(current=>current==='dna_desc'?'name':current);
 },[matchStatus]);

 const displayed=useMemo(()=>{
  let output=[...rows];
  if(eligibleOnly&&matchStatus==='available'){
   output=output.filter(fund=>matches.get(fund.symbol)?.eligibility==='eligible');
  }
  if(sort==='dna_desc'&&matchStatus==='available'){
   output.sort((a,b)=>(matches.get(b.symbol)?.match_score??-1)-(matches.get(a.symbol)?.match_score??-1));
  }
  return output;
 },[rows,eligibleOnly,sort,matches,matchStatus]);

 const matchReady=!!state?.dna&&!!state?.matches;

 function toggleSelection(id:string){
  setSelected(current=>{
   if(current.includes(id))return current.filter(value=>value!==id);
   return current.length<3?[...current,id]:current;
  });
 }

 return <section className="section screener-page-v2">
  <div className="container">
   <div className="eyebrow">{pick("ETF Screener · DNA-powered","Filtre FNB · alimenté par DNA")}</div>
   <h1><span className="desktop-screener-title">{pick("Find ETFs, then see how they relate to you","Trouvez des FNB et voyez comment ils se rapportent à votre profil")}</span><span className="mobile-screener-title">{pick("ETF Screener","Filtre FNB")}</span></h1>
   <p className="muted"><span className="desktop-screener-copy">This screener intentionally remains ETF-only while Investor DNA expands its research universe to GICs, T-Bills, bonds and money-market structures. ETF facts come first; your current Investing DNA adds compatibility on top.</span><span className="mobile-screener-copy">Filter ETFs by the facts that matter, then add your DNA compatibility when it is available.</span></p>

   <MatchStatus
    matchReady={matchReady}
    matchStatus={matchStatus}
    authLoading={authLoading}
    userPresent={!!user}
   />

   <ScreenerToolbar
    query={query}
    risk={risk}
    sort={sort}
    loading={loading}
    matchReady={matchReady}
    matchStatus={matchStatus}
    eligibleOnly={eligibleOnly}
    onQuery={setQuery}
    onRisk={setRisk}
    onSort={setSort}
    onToggleEligible={()=>setEligibleOnly(value=>!value)}
    onSubmit={()=>void runSearch()}
   />

   <div className="screener-summary">
    <p className="muted">{loading?'Loading…':`${displayed.length} ETF${displayed.length===1?'':'s'} shown`}</p>
    <p className="fine muted">Select up to 3 ETFs to compare side by side. Use Explore for cross-asset research.</p>
   </div>

   {error&&<p className="notice" role="alert">{error}</p>}

   {loading
    ? <p>{pick("Loading ETFs…","Chargement des FNB…")}</p>
    : displayed.length===0&&!error
      ? <p>{pick("No ETFs match these filters.","Aucun FNB ne correspond à ces filtres.")}</p>
      : <ScreenerTable
         rows={displayed}
         matches={matches}
         matchReady={matchReady}
         matchStatus={matchStatus}
         selected={selected}
         onToggle={toggleSelection}
        />}

   {selected.length>0&&<SelectionBar selected={selected} onClear={()=>setSelected([])}/>} 
  </div>
 </section>;
}

function MatchStatus({
 matchReady,
 matchStatus,
 authLoading,
 userPresent
}:{
 matchReady:boolean;
 matchStatus?:string;
 authLoading:boolean;
 userPresent:boolean;
}){
 const {pick}=useLocale();
 if(matchReady){
  const text=
   matchStatus==='available'
    ? pick('Eligible ETF matches are identified using your current context.','Les correspondances FNB admissibles sont identifiées selon votre contexte actuel.')
    : matchStatus==='context_required'
      ? pick('You are seeing DNA-only ETF comparisons until you add complete investment context. Numeric Match scores stay hidden until then.','Vous voyez des comparaisons FNB basées uniquement sur le DNA jusqu’à ce que vous ajoutiez un contexte de placement complet. Les scores numériques restent masqués jusque-là.')
      : matchStatus==='no_suitable_options'
        ? pick('No ETF currently passes all fit limits; the screener still shows the research universe without forcing a match.','Aucun FNB ne respecte actuellement toutes les limites de compatibilité; le filtre affiche tout de même l’univers de recherche sans forcer une correspondance.')
        : pick('Your current Match is under review, so personalized rankings are paused.','Votre Match actuel est en révision; les classements personnalisés sont donc suspendus.');
  const statusClass=
   matchStatus==='available'
    ? 'match-status-card ok'
    : matchStatus==='review_required'||matchStatus==='no_suitable_options'
      ? 'match-status-card warning'
      : 'match-status-card';

  return <div className={statusClass}>
   <strong>{pick("Your DNA is connected.","Votre DNA est connecté.")}</strong>
   <p>{text}</p>
  </div>;
 }

 if(authLoading)return null;
 return <div className="notice">
  <p>{userPresent
   ? pick('Complete or save your Investing DNA to add personal compatibility to the ETF screener.','Terminez ou enregistrez votre Investing DNA pour ajouter une compatibilité personnelle au filtre FNB.')
   : pick('You can screen ETFs without an account. Complete Investing DNA to add your same-session compatibility layer; create an account only if you want to keep it across visits.','Vous pouvez filtrer les FNB sans compte. Terminez Investing DNA pour ajouter la compatibilité pendant cette session; créez un compte seulement si vous souhaitez la conserver entre les visites.')}</p>
 </div>;
}

function ScreenerToolbar({
 query,risk,sort,loading,matchReady,matchStatus,eligibleOnly,
 onQuery,onRisk,onSort,onToggleEligible,onSubmit
}:{
 query:string;
 risk:string;
 sort:string;
 loading:boolean;
 matchReady:boolean;
 matchStatus?:string;
 eligibleOnly:boolean;
 onQuery:(value:string)=>void;
 onRisk:(value:string)=>void;
 onSort:(value:string)=>void;
 onToggleEligible:()=>void;
 onSubmit:()=>void;
}){
 const {pick}=useLocale();
 return <form className="dna-toolbar" onSubmit={event=>{event.preventDefault();onSubmit()}}>
  <label>
   {pick("Search","Rechercher")}
   <input className="field" placeholder={pick("Symbol or name","Symbole ou nom")} value={query} onChange={event=>onQuery(event.target.value)}/>
  </label>

  <label>
   {pick("Official risk","Risque officiel")}
   <select className="field" value={risk} onChange={event=>onRisk(event.target.value)}>
    <option value="">{pick("All risk levels","Tous les niveaux de risque")}</option>
    <option>Low</option>
    <option>Low to Medium</option>
    <option>Medium</option>
    <option>Medium to High</option>
    <option>High</option>
   </select>
  </label>

  <label>
   {pick("Sort","Trier")}
   <select className="field" value={sort} onChange={event=>onSort(event.target.value)}>
    <option value="name">{pick("Name","Nom")}</option>
    <option value="return_1y_desc">{pick("1-year return","Rendement sur 1 an")}</option>
    <option value="mer_asc">{pick("Lowest MER","RFG le plus faible")}</option>
    <option value="aum_desc">{pick("Largest AUM","Actif sous gestion le plus élevé")}</option>
    {matchReady&&matchStatus==='available'&&<option value="dna_desc">{pick("Closest DNA fit","Compatibilité DNA la plus proche")}</option>}
   </select>
  </label>

  <button className="btn primary" disabled={loading}>{pick("Apply","Appliquer")}</button>

  {matchReady&&matchStatus==='available'&&<label>
   <span>{pick("DNA filter","Filtre DNA")}</span>
   <button type="button" className="btn" aria-pressed={eligibleOnly} onClick={onToggleEligible}>
    {eligibleOnly?pick('Showing eligible only','FNB admissibles seulement'):pick('Show eligible only','Afficher seulement les admissibles')}
   </button>
  </label>}
 </form>;
}

function ScreenerTable({
 rows,matches,matchReady,matchStatus,selected,onToggle
}:{
 rows:Fund[];
 matches:Map<string,MatchItem>;
 matchReady:boolean;
 matchStatus?:string;
 selected:string[];
 onToggle:(id:string)=>void;
}){
 const {pick}=useLocale();
 return <table className="table">
  <thead><tr>
   <th>{pick("Compare","Comparer")}</th><th>FNB</th><th>{pick("Official risk","Risque officiel")}</th><th>{pick("DNA fit","Compatibilité DNA")}</th><th>{pick("1-year return","Rendement 1 an")}</th><th>{pick("MER","RFG")}</th><th>{pick("Details","Détails")}</th>
  </tr></thead>
  <tbody>{rows.map(fund=>{
   const match=matches.get(fund.symbol);
   return <tr key={fund.id}>
    <td data-label="Compare"><input
     aria-label={`${pick('Select','Sélectionner')} ${fund.symbol} ${pick('for comparison','pour comparaison')}`}
     type="checkbox"
     checked={selected.includes(fund.id)}
     disabled={!selected.includes(fund.id)&&selected.length>=3}
     onChange={()=>onToggle(fund.id)}
    /></td>
    <td data-label="ETF"><b>{fund.symbol}</b> · {fund.name}</td>
    <td data-label="Official risk">{fund.risk_level||pick('Not available','Non disponible')}</td>
    <td data-label="DNA fit"><FitCell match={match} matchReady={matchReady} matchStatus={matchStatus}/></td>
    <td data-label="1-year return">{formatMetric(fund.return_1y_pct,'%')}</td>
    <td data-label="MER">{formatMetric(fund.mer_pct,'%')}</td>
    <td data-label="Details"><Link className="btn" href={'/investment/'+fund.id}>{pick("View details","Voir les détails")}</Link></td>
   </tr>;
  })}</tbody>
 </table>;
}

function FitCell({match,matchReady,matchStatus}:{match?:MatchItem;matchReady:boolean;matchStatus?:string}){ const {pick}=useLocale();
 if(!match)return <span className="muted">{matchReady?pick('Not ranked','Non classé'):pick('Add DNA','Ajouter DNA')}</span>;
 const score=matchScorePresentation(match,matchStatus);
 return <div className="dna-fit-cell">
  <strong>{score.text}</strong>
  <small>{matchFitLabel(match,matchStatus)}</small>
 </div>;
}

function SelectionBar({selected,onClear}:{selected:string[];onClear:()=>void}){ const {locale,pick}=useLocale();
 return <div className="selection-bar">
  <span>{locale==="fr"?`${selected.length} sélectionné${selected.length===1?"":"s"} · jusqu’à 3`:`${selected.length} selected · choose up to 3`}</span>
  <div className="actions" style={{margin:0}}>
   {selected.length>=2&&<Link className="btn primary" href={`/compare?ids=${selected.join(',')}`}>{pick("Compare selected","Comparer la sélection")}</Link>}
   <button className="btn" onClick={onClear}>{pick("Clear","Effacer")}</button>
  </div>
 </div>;
}

function currentMatchRows(payload?:MatchPayload):MatchItem[]{
 if(!payload)return [];
 if(Array.isArray(payload.results)&&payload.results.length)return payload.results;
 return [...(payload.top_matches||[]),...(payload.alternatives||[]),...(payload.consider||[]),...(payload.mismatch||[])];
}
