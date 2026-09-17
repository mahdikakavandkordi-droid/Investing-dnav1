"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {searchInstruments,compareInstruments} from '@/lib/instruments';
import type {Instrument} from '@/lib/instruments';
import {assetLabel,matchEligible,heroMetrics} from '@/lib/instrument-model';
import {formatMetric,validId} from '@/lib/investments';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {readDraft} from '@/lib/dna';
import type {AppState,MatchItem} from '@/lib/dna';
import {matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';

const SHARED_DIMENSIONS:[keyof Instrument,string][] = [
 ['capital_protection','Capital protection'],
 ['liquidity_level','Liquidity'],
 ['price_volatility','Price volatility'],
 ['income_predictability','Income predictability'],
 ['growth_participation','Growth participation'],
 ['interest_rate_sensitivity','Interest-rate sensitivity'],
 ['diversification_level','Diversification'],
 ['complexity_level','Complexity']
];

/** Structure-first comparison. Personalized fit is layered only onto ETFs. */
export default function Compare(){
 const {user}=useAccount();
 const [items,setItems]=useState<Instrument[]>([]);
 const [selected,setSelected]=useState<string[]>(['','','']);
 const [rows,setRows]=useState<Instrument[]>([]);
 const [state,setState]=useState<AppState|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 useEffect(()=>{
  let active=true;
  setLoading(true);

  const ids=readRequestedIds();
  if(ids.length){setSelected([ids[0]||'',ids[1]||'',ids[2]||'']);}

  const local=!user?readDraft(null):null;
  const guestState:AppState|null=local?.result?{
   has_profile:false,
   assessment_id:local.session.assessment_id,
   dna:local.result.result,
   report:local.result.report?.report||local.result.result,
   matches:local.result.match
  }:null;

  const stateRequest=user?rpc<AppState>('get_current_investor_app_state').catch(()=>null):Promise.resolve(guestState);

  Promise.all([searchInstruments({limit:100}),stateRequest])
   .then(([catalog,appState])=>{
    if(!active)return;
    setItems(catalog);setState(appState);
    if(ids.length>=2)void runComparison(ids);
   })
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[user?.id]);

 const matches=useMemo(()=>new Map(currentMatchRows(state).map(match=>[match.symbol,match])),[state]);

 async function runComparison(override?:string[]){
  const ids=(override||selected).filter(validId);
  if(ids.length<2){setError('Choose at least two investments to compare.');return;}
  setBusy(true);setError('');
  try{
   const data=await compareInstruments(ids);
   setRows(data);
   history.replaceState(null,'',`/compare?ids=${ids.join(',')}`);
  }catch(e){setError(e instanceof Error?e.message:'Could not compare these investments.');}
  finally{setBusy(false);}
 }

 function setSlot(index:number,id:string){setSelected(current=>current.map((value,currentIndex)=>currentIndex===index?id:value));}

 return <section className="section compare-page-v2">
  <div className="container">
   <div className="eyebrow">Compare</div>
   <h1>Compare Investment DNA side by side</h1>
   <p className="muted">Compare two or three investment structures. Shared structural traits come first; asset-specific facts stay separate. ETF DNA Match is layered in when your current-session or saved Investor DNA is available.</p>

   {loading?<p>Loading comparison tools…</p>:<ComparisonPicker items={items} selected={selected} busy={busy} onSelect={setSlot} onCompare={()=>void runComparison()}/>} 
   {error&&<p className="notice" role="alert">{error}</p>}

   {rows.length>=2&&<>
    <div className="compare-grid">
     {rows.map(item=><ComparisonCard key={item.id} item={item} dnaPresent={!!state?.dna} match={matchEligible(item.asset_type)?matches.get(item.symbol):undefined}/>) }
    </div>
    <p className="fine muted">Historical returns and quoted rates/yields are not forecasts. Cross-asset Investment DNA labels are research descriptors. ETF DNA Match is a compatibility signal, not a recommendation to buy.</p>
   </>}
  </div>
 </section>;
}

function ComparisonPicker({items,selected,busy,onSelect,onCompare}:{items:Instrument[];selected:string[];busy:boolean;onSelect:(index:number,id:string)=>void;onCompare:()=>void;}){
 return <>
  <div className="compare-picker">
   {selected.map((id,index)=><label key={index}>Investment {index+1}<select className="field" value={id} onChange={event=>onSelect(index,event.target.value)}>
    <option value="">{index<2?'Choose an investment':'Optional third investment'}</option>
    {items.filter(item=>!selected.includes(item.id)||item.id===id).map(item=><option key={item.id} value={item.id}>{assetLabel(item.asset_type)} · {item.symbol?`${item.symbol} — `:''}{item.name}</option>)}
   </select></label>)}
  </div>
  <div className="actions"><button className="btn primary" disabled={busy} onClick={onCompare}>{busy?'Comparing…':'Compare investments'}</button><Link className="btn" href="/explore">Back to Explore</Link></div>
 </>;
}

function ComparisonCard({item,dnaPresent,match}:{item:Instrument;dnaPresent:boolean;match?:MatchItem;}){
 const canMatch=matchEligible(item.asset_type);
 const metrics=heroMetrics(item.asset_type);

 return <article className="compare-card">
  <div className="actions compact"><span className="pill">{assetLabel(item.asset_type)}</span>{item.symbol&&<span className="pill">{item.symbol}</span>}</div>
  <h2>{item.name}</h2>
  <FitSummary canMatch={canMatch} match={match} dnaPresent={dnaPresent}/>
  <h3>Shared Investment DNA</h3>
  {SHARED_DIMENSIONS.map(([key,label])=><div className="compare-metric" key={String(key)}><span>{label}</span><strong>{pretty(item[key])}</strong></div>)}
  <h3>{assetLabel(item.asset_type)} facts</h3>
  {metrics.map(metric=><div className="compare-metric" key={metric.key}><span>{metric.label}</span><strong>{displayValue(item,metric.key,metric.suffix,metric.digits)}</strong></div>)}
  {item.credit_exposure&&<div className="compare-metric"><span>Credit exposure</span><strong>{pretty(item.credit_exposure)}</strong></div>}
  {item.time_structure&&<div className="compare-metric"><span>Time structure</span><strong>{pretty(item.time_structure)}</strong></div>}
  {match?.explanation?.strengths?.length?<><strong>Why this ETF may fit</strong><ul className="compare-fit-list">{match.explanation.strengths.slice(0,2).map(text=><li key={text}>{text}</li>)}</ul></>:null}
  {match?.explanation?.watchouts?.length?<><strong>What conflicts</strong><ul className="compare-fit-list">{match.explanation.watchouts.slice(0,2).map(text=><li key={text}>{text}</li>)}</ul></>:null}
  <Link className="btn" href={`/investment/${item.id}`}>Open research</Link>
 </article>;
}

function FitSummary({canMatch,match,dnaPresent}:{canMatch:boolean;match?:MatchItem;dnaPresent:boolean}){
 if(!canMatch)return <div className="notice"><span>Research profile · personalized Match not enabled for this asset type yet</span></div>;
 if(!match)return <div className="notice"><span>{dnaPresent?'No ranked ETF fit is available for this item':'Complete Investing DNA to add an ETF compatibility layer'}</span></div>;
 const score=matchScorePresentation(match);
 return <div><div className="compare-score">{score.text}</div><strong>{matchFitLabel(match)}</strong><p className="fine muted">Personal ETF compatibility layer</p></div>;
}

function currentMatchRows(state:AppState|null):MatchItem[]{
 const payload=state?.matches;if(!payload)return [];if(Array.isArray(payload.results))return payload.results;
 return [...(payload.top_matches||[]),...(payload.alternatives||[]),...(payload.consider||[]),...(payload.mismatch||[])];
}
function readRequestedIds(){return new URLSearchParams(location.search).get('ids')?.split(',').filter(validId).slice(0,3)||[];}
function displayValue(item:Instrument,key:string,suffix='',digits=2){
 const raw=(item as unknown as Record<string,unknown>)[key];
 if(raw===null||raw===undefined||raw==='')return '—';
 if(typeof raw==='number')return formatMetric(raw,suffix,digits);
 return pretty(raw);
}
function pretty(value:unknown){
 if(value===null||value===undefined||value==='')return '—';
 return String(value).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}
