"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {rpc} from '@/lib/supabase';
import {formatMetric} from '@/lib/investments';
import {matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';
import {readDraft} from '@/lib/dna';
import type {Fund} from '@/lib/investments';
import {useAccount} from '@/lib/use-account';
import type {AppState,MatchItem} from '@/lib/dna';

/**
 * ETF-only screener.
 *
 * The broader research universe is cross-asset, but personalized Match remains
 * ETF-only. Keep this route explicit rather than quietly treating GICs/bonds as
 * if they shared fund metrics such as MER or historical fund returns.
 */
export default function Screener(){
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

 const matches=useMemo(
  ()=>new Map((state?.matches?.results||[]).map(match=>[match.symbol,match])),
  [state]
 );

 const displayed=useMemo(()=>{
  let output=[...rows];
  if(eligibleOnly){
   output=output.filter(fund=>matches.get(fund.symbol)?.eligibility==='eligible');
  }
  if(sort==='dna_desc'){
   output.sort((a,b)=>(matches.get(b.symbol)?.match_score??-1)-(matches.get(a.symbol)?.match_score??-1));
  }
  return output;
 },[rows,eligibleOnly,sort,matches]);

 const matchReady=!!state?.dna&&!!state?.matches;
 const matchStatus=state?.matches?.status;

 function toggleSelection(id:string){
  setSelected(current=>{
   if(current.includes(id))return current.filter(value=>value!==id);
   return current.length<3?[...current,id]:current;
  });
 }

 return <section className="section">
  <div className="container">
   <div className="eyebrow">ETF Screener · DNA-powered</div>
   <h1>Find ETFs, then see how they relate to you</h1>
   <p className="muted">
    This screener intentionally remains ETF-only while Investor DNA expands its research universe to GICs, T-Bills, bonds and money-market structures. ETF facts come first; your current Investing DNA adds compatibility on top.
   </p>

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
    ? <p>Loading ETFs…</p>
    : displayed.length===0&&!error
      ? <p>No ETFs match these filters.</p>
      : <ScreenerTable
         rows={displayed}
         matches={matches}
         matchReady={matchReady}
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
 if(matchReady){
  const text=
   matchStatus==='available'
    ? 'Eligible ETF matches are identified using your current context.'
    : matchStatus==='context_required'
      ? 'You are seeing DNA-only ETF comparisons until you add investment context. Numeric Match scores stay hidden until then.'
      : matchStatus==='no_suitable_options'
        ? 'No ETF currently passes all fit limits; the screener still shows the research universe without forcing a recommendation.'
        : 'Your current match is under review, so rankings are not treated as eligible recommendations.';
  const statusClass=
   matchStatus==='available'
    ? 'match-status-card ok'
    : matchStatus==='review_required'||matchStatus==='no_suitable_options'
      ? 'match-status-card warning'
      : 'match-status-card';

  return <div className={statusClass}>
   <strong>Your DNA is connected.</strong>
   <p>{text}</p>
  </div>;
 }

 if(authLoading)return null;
 return <div className="notice">
  <p>{userPresent
   ? 'Complete or save your Investing DNA to add personal compatibility to the ETF screener.'
   : 'You can screen ETFs without an account. Complete Investing DNA to add your same-session compatibility layer; create an account only if you want to keep it across visits.'}</p>
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
 return <form className="dna-toolbar" onSubmit={event=>{event.preventDefault();onSubmit()}}>
  <label>
   Search
   <input className="field" placeholder="Symbol or name" value={query} onChange={event=>onQuery(event.target.value)}/>
  </label>

  <label>
   Official risk
   <select className="field" value={risk} onChange={event=>onRisk(event.target.value)}>
    <option value="">All risk levels</option>
    <option>Low</option>
    <option>Low to Medium</option>
    <option>Medium</option>
    <option>Medium to High</option>
    <option>High</option>
   </select>
  </label>

  <label>
   Sort
   <select className="field" value={sort} onChange={event=>onSort(event.target.value)}>
    <option value="name">Name</option>
    <option value="return_1y_desc">1-year return</option>
    <option value="mer_asc">Lowest MER</option>
    <option value="aum_desc">Largest AUM</option>
    {matchReady&&matchStatus==='available'&&<option value="dna_desc">Closest DNA fit</option>}
   </select>
  </label>

  <button className="btn primary" disabled={loading}>Apply</button>

  {matchReady&&matchStatus==='available'&&<label>
   <span>DNA filter</span>
   <button type="button" className="btn" aria-pressed={eligibleOnly} onClick={onToggleEligible}>
    {eligibleOnly?'Showing eligible only':'Show eligible only'}
   </button>
  </label>}
 </form>;
}

function ScreenerTable({
 rows,matches,matchReady,selected,onToggle
}:{
 rows:Fund[];
 matches:Map<string,MatchItem>;
 matchReady:boolean;
 selected:string[];
 onToggle:(id:string)=>void;
}){
 return <table className="table">
  <thead><tr>
   <th>Compare</th><th>ETF</th><th>Official risk</th><th>DNA fit</th><th>1-year return</th><th>MER</th><th>Details</th>
  </tr></thead>
  <tbody>{rows.map(fund=>{
   const match=matches.get(fund.symbol);
   return <tr key={fund.id}>
    <td><input
     aria-label={`Select ${fund.symbol} for comparison`}
     type="checkbox"
     checked={selected.includes(fund.id)}
     disabled={!selected.includes(fund.id)&&selected.length>=3}
     onChange={()=>onToggle(fund.id)}
    /></td>
    <td><b>{fund.symbol}</b> · {fund.name}</td>
    <td>{fund.risk_level||'Not available'}</td>
    <td><FitCell match={match} matchReady={matchReady}/></td>
    <td>{formatMetric(fund.return_1y_pct,'%')}</td>
    <td>{formatMetric(fund.mer_pct,'%')}</td>
    <td><Link className="btn" href={'/investment/'+fund.id}>View ETF</Link></td>
   </tr>;
  })}</tbody>
 </table>;
}

function FitCell({match,matchReady}:{match?:MatchItem;matchReady:boolean}){
 if(!match)return <span className="muted">{matchReady?'Not ranked':'Add DNA'}</span>;
 const score=matchScorePresentation(match);
 return <div className="dna-fit-cell">
  <strong>{score.text}</strong>
  <small>{matchFitLabel(match)}</small>
 </div>;
}

function SelectionBar({selected,onClear}:{selected:string[];onClear:()=>void}){
 return <div className="selection-bar">
  <span>{selected.length} selected · choose up to 3</span>
  <div className="actions" style={{margin:0}}>
   {selected.length>=2&&<Link className="btn primary" href={`/compare?ids=${selected.join(',')}`}>Compare selected</Link>}
   <button className="btn" onClick={onClear}>Clear</button>
  </div>
 </div>;
}
