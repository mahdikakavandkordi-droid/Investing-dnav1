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
 matchEligible
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
 const [query,setQuery]=useState('');

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

 const visible=useMemo(()=>{
  const needle=query.trim().toLowerCase();
  return items.filter(item=>{
   if(!inExploreTab(item.asset_type,tab))return false;
   if(!needle)return true;
   const haystack=[item.symbol,item.name,item.issuer_name,assetLabel(item.asset_type),item.profile_summary,item.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
   return haystack.includes(needle);
  });
 },[items,tab,query]);

 return <main className="explore-page-v2">
  <section className="explore-hero-v2">
   <div className="container">
    <div className="eyebrow">Explore investments</div>
    <div className="explore-hero-row">
     <div>
      <h1><span className="desktop-explore-title">Research different structures without the jargon.</span><span className="mobile-explore-title">Explore</span></h1>
      <p><span className="desktop-explore-copy">Search ETFs, GICs, T-Bills and bonds, then compare what each investment is built to do using a shared Investment DNA language.</span><span className="mobile-explore-copy">Find investments, scan the key facts and open the research that matters to you.</span></p>
     </div>
     <Link className="btn" href="/compare">Compare investments</Link><Link className="mobile-explore-compare" href="/compare">Compare</Link>
    </div>

    <label className="explore-search-v2">
     <span className="sr-only">Search investments</span>
     <span className="explore-search-icon" aria-hidden="true">⌕</span>
     <input
      value={query}
      onChange={event=>setQuery(event.target.value)}
      placeholder="Search by name, symbol, issuer or asset type"
      aria-label="Search investments"
     />
    </label>

    <ExploreTabs selected={tab} onSelect={setTab}/>
   </div>
  </section>

  <section className="explore-catalog-v2">
   <div className="container">
    <div className="explore-catalog-head">
     <div>
      <strong>{loading?'Loading research…':`${visible.length} investment${visible.length===1?'':'s'}`}</strong>
      <span>Only sourced research fields are shown. Missing optional facts are hidden instead of filled with placeholders.</span>
     </div>
     <span className="pill">DNA Match: ETFs</span>
    </div>

    {loading
     ? <div className="explore-loading-grid">{[0,1,2,3,4,5].map(i=><div className="explore-skeleton" key={i}/>)}</div>
     : error
       ? <CatalogError error={error} onRetry={()=>setRetry(value=>value+1)}/>
       : visible.length===0
         ? <EmptyCategory query={query}/>
         : <div className="explore-grid-v2">
            {visible.map(item=><InvestmentCard key={item.id} item={item}/>) }
           </div>}
   </div>
  </section>
 </main>;
}

function ExploreTabs({selected,onSelect}:{selected:ExploreTab;onSelect:(tab:ExploreTab)=>void}){
 return <div className="explore-tabs-v2" role="tablist" aria-label="Investment categories">
  {EXPLORE_TABS.map(tab=><button
   key={tab.key}
   role="tab"
   aria-selected={selected===tab.key}
   className={selected===tab.key?'active':''}
   onClick={()=>onSelect(tab.key)}
  >
   {tab.label}
  </button>)}
 </div>;
}

function InvestmentCard({item}:{item:Instrument}){
 const metrics=heroMetrics(item.asset_type)
  .map(metric=>({...metric,value:metricValue(item,metric.key,metric.suffix,metric.digits)}))
  .filter(metric=>metric.value!==null)
  .slice(0,3);
 const canMatch=matchEligible(item.asset_type);

 return <article className={"investment-card-v2 investment-card-"+String(item.asset_type||"unknown").toLowerCase()}>
  <div className="investment-card-top">
   <div className="investment-card-tags">
    <span className="asset-tag">{assetLabel(item.asset_type)}</span>
    {item.symbol&&<span className="symbol-tag">{item.symbol}</span>}
   </div>
   <span className={canMatch?'research-state research-state-match':'research-state'}>{canMatch?'DNA Match':'Research'}</span>
  </div>

  <div className="investment-card-copy">
   <h2>{item.name}</h2>
   {item.issuer_name&&<p className="investment-card-issuer">{item.issuer_name}</p>}
   <p>{item.profile_summary||item.description||'Research profile available.'}</p>
  </div>

  {metrics.length>0&&<div className="investment-card-metrics">
   {metrics.map(metric=><div key={metric.key}>
    <span>{metric.label}</span>
    <strong>{metric.value}</strong>
   </div>)}
  </div>}

  <div className="investment-card-footer">
   <span>{canMatch?'DNA Match available':'Structural research'}</span>
   <Link aria-label="Open research" href={'/investment/'+item.id}>Open research →</Link>
  </div>
 </article>;
}

function CatalogError({error,onRetry}:{error:string;onRetry:()=>void}){
 return <div className="notice" role="alert">
  <p>Could not load the investment catalog: {error}</p>
  <button className="btn" onClick={onRetry}>Try again</button>
 </div>;
}

function EmptyCategory({query}:{query:string}){
 return <div className="card explore-empty-v2">
  <h2>{query.trim()?'No investments match that search':'No research examples in this category yet'}</h2>
  <p className="muted">{query.trim()
   ? 'Try a symbol, issuer, asset type or a broader search.'
   : 'We only show instruments after their source and freshness requirements are met.'}</p>
 </div>;
}

function metricValue(item:Instrument,key:string,suffix='',digits=2):string|null{
 const raw=(item as unknown as Record<string,unknown>)[key];
 if(raw===null||raw===undefined||raw==='')return null;
 if(typeof raw==='number')return formatMetric(raw,suffix,digits);
 return pretty(raw);
}

function pretty(value:unknown){
 if(typeof value==='string'){
  return value.replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
 }
 return String(value);
}