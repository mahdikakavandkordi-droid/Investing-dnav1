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

 return <section className="section">
  <div className="container">
   <div className="eyebrow">Explore</div>
   <h1>Compare what different investments are built to do</h1>
   <p className="muted" style={{maxWidth:820}}>
    Start with the job your money needs to do — protect capital, stay accessible, produce income, or participate in growth — then compare structures using the same Investment DNA language.
   </p>
   <p className="fine muted">DNA Match is currently available for ETFs. GICs, T-Bills, bonds and money-market examples are research profiles for structural comparison.</p>

   <div className="toolbar">
    <label>
     <span className="fine muted">Search investments</span><br/>
     <input
      className="field"
      value={query}
      onChange={event=>setQuery(event.target.value)}
      placeholder="Name, symbol, issuer or asset type"
      aria-label="Search investments"
     />
    </label>
   </div>

   <ExploreTabs selected={tab} onSelect={setTab}/>

   {!loading&&!error&&<p className="fine muted">{visible.length} investment{visible.length===1?'':'s'} shown</p>}

   {loading
    ? <p>Loading investments…</p>
    : error
      ? <CatalogError error={error} onRetry={()=>setRetry(value=>value+1)}/>
      : visible.length===0
        ? <EmptyCategory query={query}/>
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
 const canMatch=matchEligible(item.asset_type);

 return <article className="card">
  <div className="actions compact">
   <span className="pill">{assetLabel(item.asset_type)}</span>
   {item.symbol&&<span className="pill">{item.symbol}</span>}
   <span className="pill">{canMatch?'DNA Match available':'Research profile'}</span>
  </div>

  <h2>{item.name}</h2>
  <p className="muted">{item.profile_summary||item.description||'Research profile available.'}</p>

  {metrics.map(metric=><p key={metric.key}>
   <strong>{metric.label}:</strong>{' '}
   {metricValue(item,metric.key,metric.suffix,metric.digits)}
  </p>)}

  <Link className="btn primary" href={'/investment/'+item.id}>Open research</Link>
 </article>;
}

function CatalogError({error,onRetry}:{error:string;onRetry:()=>void}){
 return <div className="notice" role="alert">
  <p>Could not load the investment catalog: {error}</p>
  <button className="btn" onClick={onRetry}>Try again</button>
 </div>;
}

function EmptyCategory({query}:{query:string}){
 return <div className="card">
  <h2>{query.trim()?'No investments match that search':'No research examples in this category yet'}</h2>
  <p className="muted">{query.trim()
   ? 'Try a symbol, issuer, asset type or a broader search.'
   : 'We only show instruments after their source and freshness requirements are met.'}</p>
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
