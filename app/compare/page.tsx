"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {instrumentDisplayName,searchInstruments,compareInstruments} from '@/lib/instruments';
import type {Instrument} from '@/lib/instruments';
import {assetLabel,matchEligible,heroMetrics,isPublicV1AssetType} from '@/lib/instrument-model';
import {formatMetric,validId} from '@/lib/investments';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {hasCompleteInvestmentContext,readDraft} from '@/lib/dna';
import type {AppState,MatchItem} from '@/lib/dna';
import {effectiveMatchStatus,matchFitLabel,matchScorePresentation} from '@/lib/match-presentation';

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

/** Same-type comparison with personalized fit layered onto supported fund vehicles. */
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

 const comparisonType=items.find(item=>item.id===selected[0])?.asset_type;
 const rawMatchStatus=state?.matches?.status;
 const context=state?.report?.investment_context||state?.dna?.investment_context||null;
 const matchStatus=effectiveMatchStatus(rawMatchStatus,hasCompleteInvestmentContext(context))||undefined;
 const rowsTrusted=!(matchStatus==='context_required'&&rawMatchStatus!=='context_required');
 const matches=useMemo(()=>new Map((rowsTrusted?currentMatchRows(state):[]).map(match=>[match.symbol,match])),[state,rowsTrusted]);

 async function runComparison(override?:string[]){
  const ids=[...new Set((override||selected).filter(validId))];
  if(ids.length<2){setRows([]);setError('Choose at least two different investments to compare.');return;}
  setBusy(true);setError('');
  try{
   const data=await compareInstruments(ids);
   if(data.length<2){setRows([]);setError('At least two of the selected investments must still be available in the research catalog.');return;}
   const types=[...new Set(data.map(item=>item.asset_type))];
   if(types.length!==1||!isPublicV1AssetType(types[0])){setRows([]);setError('V1 comparisons stay within one product type: ETF vs ETF, Mutual Fund vs Mutual Fund, or GIC vs GIC.');return;}
   setRows(data);
   history.replaceState(null,'',`/compare?ids=${ids.join(',')}`);
  }catch(e){setRows([]);setError(e instanceof Error?e.message:'Could not compare these investments.');}
  finally{setBusy(false);}
 }

 function setSlot(index:number,id:string){
  setSelected(current=>{
   if(index===0)return [id,'',''];
   return current.map((value,currentIndex)=>currentIndex===index?id:value);
  });
  setRows([]);
  setError('');
 }

 return <section className="section compare-page-v2">
  <div className="container">
   <div className="eyebrow">Compare</div>
   <h1><span className="desktop-compare-title">{comparisonType?`Compare ${assetLabel(comparisonType)}s side by side`:'Compare investments side by side'}</span><span className="mobile-compare-title">{comparisonType?`Compare ${assetLabel(comparisonType)}s`:'Compare investments'}</span></h1>
   <p className="muted"><span className="desktop-compare-copy">V1 keeps comparisons apples-to-apples: ETF vs ETF, Mutual Fund vs Mutual Fund, or GIC vs GIC. Choose the first product and the remaining selectors stay within that type.</span><span className="mobile-compare-copy">Choose one product type, then compare two or three similar investments.</span></p>

   {loading?<p>Loading comparison tools…</p>:<ComparisonPicker items={items.filter(item=>isPublicV1AssetType(item.asset_type))} selected={selected} busy={busy} onSelect={setSlot} onCompare={()=>void runComparison()}/>} 
   {error&&<p className="notice" role="alert">{error}</p>}

   {rows.length>=2&&<>
    <div className="compare-grid mobile-compare-rail">
     {rows.map(item=><ComparisonCard key={item.id} item={item} dnaPresent={!!state?.dna} matchStatus={matchStatus} match={matchEligible(item.asset_type)?matches.get(item.symbol):undefined}/>) }
    </div>
    <p className="fine muted">Historical returns and quoted rates are not forecasts. DNA Match is a research compatibility signal, not a recommendation to buy. GIC comparisons use product terms rather than a personalized Match score.</p>
   </>}
  </div>
 </section>;
}

function ComparisonPicker({items,selected,busy,onSelect,onCompare}:{items:Instrument[];selected:string[];busy:boolean;onSelect:(index:number,id:string)=>void;onCompare:()=>void;}){
 const anchorType=items.find(item=>item.id===selected[0])?.asset_type;
 return <>
  <div className="compare-picker">
   {selected.map((id,index)=>{
    const choices=items.filter(item=>{
     if(index>0&&anchorType&&item.asset_type!==anchorType)return false;
     return !selected.includes(item.id)||item.id===id;
    });
    const disabled=index>0&&!anchorType;
    return <label key={index}>Investment {index+1}<select className="field" value={id} disabled={disabled} onChange={event=>onSelect(index,event.target.value)}>
     <option value="">{index===0?'Choose a product':disabled?'Choose the first product first':index===1?`Choose another ${assetLabel(anchorType)}`:`Optional third ${assetLabel(anchorType)}`}</option>
     {choices.map(item=><option key={item.id} value={item.id}>{assetLabel(item.asset_type)} · {item.symbol?`${item.symbol} — `:''}{instrumentDisplayName(item)}</option>)}
    </select></label>;
   })}
  </div>
  <div className="actions"><button className="btn primary" disabled={busy||!selected[0]||!selected[1]} onClick={onCompare}>{busy?'Comparing…':'Compare investments'}</button><Link className="btn" href="/explore">Back to Explore</Link></div>
  </>;
}

function ComparisonCard({item,dnaPresent,matchStatus,match}:{item:Instrument;dnaPresent:boolean;matchStatus?:string;match?:MatchItem;}){
 const canMatch=matchEligible(item.asset_type);
 const metrics=heroMetrics(item.asset_type);
 const contextOnly=matchStatus==='context_required';
 const rowContextOnly=match?.eligibility==='context_required'||match?.recommendation_tier==='consider';
 const showExplanation=matchStatus!=='review_required'&&(!contextOnly||rowContextOnly);

 return <article className={'compare-card compare-card-'+String(item.asset_type||'unknown').toLowerCase()}>
  <div className="actions compact"><span className="pill">{assetLabel(item.asset_type)}</span>{item.symbol&&<span className="pill">{item.symbol}</span>}</div>
  <h2>{instrumentDisplayName(item)}</h2>
  <FitSummary canMatch={canMatch} match={match} matchStatus={matchStatus} dnaPresent={dnaPresent}/>
  <h3>Shared Investment DNA</h3>
  {SHARED_DIMENSIONS.map(([key,label])=><div className="compare-metric" key={String(key)}><span>{label}</span><strong>{pretty(item[key])}</strong></div>)}
  <h3>{assetLabel(item.asset_type)} facts</h3>
  {metrics.map(metric=><div className="compare-metric" key={metric.key}><span>{metric.label}</span><strong>{displayValue(item,metric.key,metric.suffix,metric.digits)}</strong></div>)}
  {item.credit_exposure&&<div className="compare-metric"><span>Credit exposure</span><strong>{pretty(item.credit_exposure)}</strong></div>}
  {item.time_structure&&<div className="compare-metric"><span>Time structure</span><strong>{pretty(item.time_structure)}</strong></div>}
  {showExplanation&&match?.explanation?.strengths?.length?<><strong>{contextOnly?'DNA-only alignment':`Why this ${assetLabel(item.asset_type)} may fit`}</strong><ul className="compare-fit-list">{match.explanation.strengths.slice(0,2).map(text=><li key={text}>{text}</li>)}</ul></>:null}
  {showExplanation&&match?.explanation?.watchouts?.length?<><strong>What conflicts</strong><ul className="compare-fit-list">{match.explanation.watchouts.slice(0,2).map(text=><li key={text}>{text}</li>)}</ul></>:null}
  <Link className="btn" href={`/investment/${item.id}`}>Open research</Link>
 </article>;
}

function FitSummary({canMatch,match,matchStatus,dnaPresent}:{canMatch:boolean;match?:MatchItem;matchStatus?:string;dnaPresent:boolean}){
 if(!canMatch)return <div className="notice"><span>Research profile · personalized Match not enabled for this asset type yet</span></div>;
 if(!match)return <div className="notice"><span>{dnaPresent?'No fund compatibility row is available for this item':'Complete Investing DNA to add a fund compatibility layer'}</span></div>;
 const score=matchScorePresentation(match,matchStatus);
 const layerCopy=matchStatus==='context_required'?'DNA-only fund compatibility layer':matchStatus==='review_required'?'Personalized ranking paused':'Personal fund compatibility layer';
 return <div><div className="compare-score">{score.text}</div><strong>{matchFitLabel(match,matchStatus)}</strong><p className="fine muted">{layerCopy}</p></div>;
}

function currentMatchRows(state:AppState|null):MatchItem[]{
 const payload=state?.matches;if(!payload)return [];if(Array.isArray(payload.results)&&payload.results.length)return payload.results;
 return [...(payload.top_matches||[]),...(payload.alternatives||[]),...(payload.consider||[]),...(payload.mismatch||[])];
}
function readRequestedIds(){const raw=new URLSearchParams(location.search).get('ids')?.split(',').filter(validId)||[];return [...new Set(raw)].slice(0,3);}
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
