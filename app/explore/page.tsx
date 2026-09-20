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
import {useLocale} from '@/lib/locale';

/** Cross-asset research catalog. Asset rules come from `lib/instrument-model.ts`. */
export default function Explore(){
 const [items,setItems]=useState<Instrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 const [tab,setTab]=useState<ExploreTab>('all');
 const [query,setQuery]=useState('');
 const {locale,pick}=useLocale();

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
    <div className="eyebrow">{pick("Explore investments","Explorer les placements")}</div>
    <div className="explore-hero-row">
     <div>
      <h1><span className="desktop-explore-title">{pick("Research different structures without the jargon.","Comparez différentes structures sans jargon.")}</span><span className="mobile-explore-title">{pick("Explore","Explorer")}</span></h1>
      <p><span className="desktop-explore-copy">{pick("Search ETFs, GICs, T-Bills and bonds, then compare what each investment is built to do using a shared Investment DNA language.","Recherchez des FNB, CPG, bons du Trésor et obligations, puis comparez leur rôle à l’aide d’un langage Investment DNA commun.")}</span><span className="mobile-explore-copy">{pick("Find investments, scan the key facts and view the details that matter to you.","Trouvez des placements, parcourez les données clés et consultez les détails qui comptent pour vous.")}</span></p>
     </div>
     <Link className="btn" href="/compare">{pick("Compare investments","Comparer les placements")}</Link><Link className="mobile-explore-compare" href="/compare">{pick("Compare","Comparer")}</Link>
    </div>

    <label className="explore-search-v2">
     <span className="sr-only">{pick("Search investments","Rechercher des placements")}</span>
     <span className="explore-search-icon" aria-hidden="true">⌕</span>
     <input
      value={query}
      onChange={event=>setQuery(event.target.value)}
      placeholder={pick("Search by name, symbol, issuer or asset type","Rechercher par nom, symbole, émetteur ou catégorie d’actif")}
      aria-label={pick("Search investments","Rechercher des placements")}
     />
    </label>

    <ExploreTabs selected={tab} onSelect={setTab} locale={locale}/>
   </div>
  </section>

  <section className="explore-catalog-v2">
   <div className="container">
    <div className="explore-catalog-head">
     <div>
      <strong>{loading?pick('Loading research…','Chargement de la recherche…'):locale==='fr'?`${visible.length} placement${visible.length===1?'':'s'}`:`${visible.length} investment${visible.length===1?'':'s'}`}</strong>
      <span>{pick("Only sourced research fields are shown. Missing optional facts are hidden instead of filled with placeholders.","Seules les données de recherche sourcées sont affichées. Les données facultatives manquantes sont masquées plutôt que remplacées par des valeurs fictives.")}</span>
     </div>
     <span className="pill">{pick("DNA Match: ETFs","DNA Match : FNB")}</span>
    </div>

    {loading
     ? <div className="explore-loading-grid">{[0,1,2,3,4,5].map(i=><div className="explore-skeleton" key={i}/>)}</div>
     : error
       ? <CatalogError error={error} onRetry={()=>setRetry(value=>value+1)} locale={locale}/>
       : visible.length===0
         ? <EmptyCategory query={query} locale={locale}/>
         : <div className="explore-grid-v2">
            {visible.map(item=><InvestmentCard key={item.id} item={item} locale={locale}/>) }
           </div>}
   </div>
  </section>
 </main>;
}

function ExploreTabs({selected,onSelect,locale}:{selected:ExploreTab;onSelect:(tab:ExploreTab)=>void;locale:"en"|"fr"}){
 return <div className="explore-tabs-v2" role="tablist" aria-label={locale==="fr"?"Catégories de placement":"Investment categories"}>
  {EXPLORE_TABS.map(tab=><button
   key={tab.key}
   role="tab"
   aria-selected={selected===tab.key}
   className={selected===tab.key?'active':''}
   onClick={()=>onSelect(tab.key)}
  >
   {locale==="fr"?tabLabelFr(tab.key,tab.label):tab.label}
  </button>)}
 </div>;
}

function InvestmentCard({item,locale}:{item:Instrument;locale:"en"|"fr"}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
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
   <span className={canMatch?'research-state research-state-match':'research-state'}>{canMatch?'DNA Match':pick('Research','Recherche')}</span>
  </div>

  <div className="investment-card-copy">
   <h2>{item.name}</h2>
   {item.issuer_name&&<p className="investment-card-issuer">{item.issuer_name}</p>}
   <p>{item.profile_summary||item.description||pick('Research profile available.','Profil de recherche disponible.')}</p>
  </div>

  {metrics.length>0&&<div className="investment-card-metrics">
   {metrics.map(metric=><div key={metric.key}>
    <span>{metric.label}</span>
    <strong>{metric.value}</strong>
   </div>)}
  </div>}

  {item.market_price_date&&item.asset_type==='ETF'&&<p className="investment-card-market-date">
   {pick('Price updated after close','Prix mis à jour après la clôture')} · {formatMarketDate(item.market_price_date,locale)}
  </p>}

  <div className="investment-card-footer">
   <span>{canMatch?pick('DNA Match available','DNA Match disponible'):pick('Structural research','Recherche structurelle')}</span>
   <Link aria-label={pick("View details","Voir les détails")} href={'/investment/'+item.id}>{pick("View details →","Voir les détails →")}</Link>
  </div>
 </article>;
}

function CatalogError({error,onRetry,locale}:{error:string;onRetry:()=>void;locale:"en"|"fr"}){
 return <div className="notice" role="alert">
  <p>{locale==="fr"?"Impossible de charger le catalogue de placements : ":"Could not load the investment catalog: "}{error}</p>
  <button className="btn" onClick={onRetry}>{locale==="fr"?"Réessayer":"Try again"}</button>
 </div>;
}

function EmptyCategory({query,locale}:{query:string;locale:"en"|"fr"}){
 return <div className="card explore-empty-v2">
  <h2>{query.trim()?(locale==='fr'?'Aucun placement ne correspond à cette recherche':'No investments match that search'):(locale==='fr'?'Aucun exemple de recherche dans cette catégorie pour le moment':'No research examples in this category yet')}</h2>
  <p className="muted">{query.trim()
   ? (locale==='fr'?'Essayez un symbole, un émetteur, une catégorie d’actif ou une recherche plus large.':'Try a symbol, issuer, asset type or a broader search.')
   : (locale==='fr'?'Nous affichons les instruments seulement lorsque les exigences de source et de fraîcheur des données sont respectées.':'We only show instruments after their source and freshness requirements are met.')}</p>
 </div>;
}

function metricValue(item:Instrument,key:string,suffix='',digits=2):string|null{
 const raw=(item as unknown as Record<string,unknown>)[key];
 if(raw===null||raw===undefined||raw==='')return null;
 if(typeof raw==='number')return formatMetric(raw,suffix,digits);
 return pretty(raw);
}

function formatMarketDate(value:string,locale:"en"|"fr"="en"){
 const parsed=new Date(value+'T12:00:00Z');
 if(Number.isNaN(parsed.getTime()))return value;
 return new Intl.DateTimeFormat(locale==='fr'?'fr-CA':'en-CA',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(parsed);
}

function pretty(value:unknown){
 if(typeof value==='string'){
  return value.replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
 }
 return String(value);
}

function tabLabelFr(key:ExploreTab,fallback:string){
 const labels:Record<string,string>={all:"Tous",etf:"FNB",gic:"CPG",tbill:"Bons du Trésor",bond:"Obligations",cash:"Trésorerie"};
 return labels[key]||fallback;
}
