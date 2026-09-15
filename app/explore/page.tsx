"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {searchInstruments} from '@/lib/instruments';
import type {Instrument} from '@/lib/instruments';
import {
 EXPLORE_TABS,
 assetLabel,
 heroMetrics,
 inExploreTab,
 researchMatchNote
} from '@/lib/instrument-model';
import type {ExploreTab} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';

/** Cross-asset research catalog. Asset rules come from `lib/instrument-model.ts`. */
export default function Explore(){
 const [items,setItems]=useState<Instrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 const [tab,setTab]=useState<ExploreTab>('all');

 useEffect(()=>{
  let active=true;
  setLoading(true);
  setError('');

  searchInstruments({limit:100})
   .then(data=>{if(active)setItems(data)})
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[retry]);

 const visible=useMemo(
  ()=>items.filter(item=>inExploreTab(item.asset_type,tab)),
  [items,tab]
 );

 return <section className="section">
  <div className="container">
   <div className="eyebrow">Investment universe</div>
   <h1>Explore investments</h1>
   <p className="muted">
    Compare ETFs with representative Canadian GIC, T-Bill, bond and money-market structures using a shared Investment DNA language. Personalized DNA Match remains ETF-only while the newer asset models are research-stage.
   </p>

   <ExploreTabs selected={tab} onSelect={setTab}/>

   {loading
    ? <p>Loading investments…</p>
    : error
      ? <CatalogError error={error} onRetry={()=>setRetry(value=>value+1)}/>
      : visible.length===0
        ? <EmptyCategory/>
        : <div className="grid3">
           {visible.map(item=><InvestmentCard key={item.id} item={item}/>) }
          </div>}
  </div>
 </section>;
}

function ExploreTabs({selected,onSelect}:{selected:ExploreTab;onSelect:(tab:ExploreTab)=>void}){
 return <div className="actions" role="tablist" aria-label="Investment categories">
  {EXPLORE_TABS.map(tab=><button
   key={tab.key}
   role="tab"
   aria-selected={selected===tab.key}
   className={'btn '+(selected===tab.key?'primary':'')}
   onClick={()=>onSelect(tab.key)}
  >
   {tab.label}
  </button>)}
 </div>;
}

function InvestmentCard({item}:{item:Instrument}){
 const metrics=heroMetrics(item.asset_type).slice(0,3);

 return <article className="card">
  <div className="actions compact">
   <span className="pill">{assetLabel(item.asset_type)}</span>
   {item.symbol&&<span className="pill">{item.symbol}</span>}
  </div>

  <h2>{item.name}</h2>
  <p className="muted">{item.profile_summary||item.description||'Research profile available.'}</p>

  {metrics.map(metric=><p key={metric.key}>
   <strong>{metric.label}:</strong>{' '}
   {metricValue(item,metric.key,metric.suffix,metric.digits)}
  </p>)}

  <p className="fine muted">{researchMatchNote(item.asset_type)}</p>
  <Link className="btn primary" href={'/investment/'+item.id}>View research</Link>
 </article>;
}

function CatalogError({error,onRetry}:{error:string;onRetry:()=>void}){
 return <div className="notice" role="alert">
  <p>Could not load the investment catalog: {error}</p>
  <button className="btn" onClick={onRetry}>Try again</button>
 </div>;
}

function EmptyCategory(){
 return <div className="card">
  <h2>No research examples in this category yet</h2>
  <p className="muted">The architecture is ready, but we only show instruments after their source and freshness requirements are met.</p>
 </div>;
}

function metricValue(item:Instrument,key:string,suffix='',digits=2){
 const raw=(item as unknown as Record<string,unknown>)[key];
 if(raw===null||raw===undefined||raw==='')return 'Not available';
 if(typeof raw==='number')return formatMetric(raw,suffix,digits);
 return pretty(raw);
}

function pretty(value:unknown){
 if(typeof value==='string'){
  return value.replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
 }
 return String(value??'Not available');
}
