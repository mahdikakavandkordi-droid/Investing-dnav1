"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Instrument,searchInstruments} from '@/lib/instruments';
import {EXPLORE_TABS,ExploreTab,assetLabel,heroMetrics,inExploreTab,researchMatchNote} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';

function pretty(value:unknown){return typeof value==='string'?value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()):String(value??'Not available');}
function metricValue(item:Instrument,key:string,suffix='',digits=2){const raw=(item as unknown as Record<string,unknown>)[key];if(raw===null||raw===undefined||raw==='')return 'Not available';if(typeof raw==='number')return formatMetric(raw,suffix,digits);return pretty(raw);}

export default function Explore(){
 const [items,setItems]=useState<Instrument[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0),[tab,setTab]=useState<ExploreTab>('all');
 useEffect(()=>{let active=true;setLoading(true);setError('');searchInstruments({limit:100}).then(d=>{if(active)setItems(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false};},[retry]);
 const visible=useMemo(()=>items.filter(x=>inExploreTab(x.asset_type,tab)),[items,tab]);
 return <section className="section"><div className="container"><div className="eyebrow">Investment universe</div><h1>Explore investments</h1><p className="muted">Compare ETFs with representative Canadian GIC, T-Bill, bond and money-market structures using a shared Investment DNA language. Personalized DNA Match remains ETF-only while the newer asset models are research-stage.</p>
 <div className="actions" role="tablist" aria-label="Investment categories">{EXPLORE_TABS.map(x=><button key={x.key} role="tab" aria-selected={tab===x.key} className={'btn '+(tab===x.key?'primary':'')} onClick={()=>setTab(x.key)}>{x.label}</button>)}</div>
 {loading?<p>Loading investments…</p>:error?<div className="notice" role="alert"><p>Could not load the investment catalog: {error}</p><button className="btn" onClick={()=>setRetry(n=>n+1)}>Try again</button></div>:!visible.length?<div className="card"><h2>No research examples in this category yet</h2><p className="muted">The architecture is ready, but we only show instruments after their source and freshness requirements are met.</p></div>:<div className="grid3">{visible.map(x=>{const metrics=heroMetrics(x.asset_type).slice(0,3);return <article className="card" key={x.id}><div className="actions compact"><span className="pill">{assetLabel(x.asset_type)}</span>{x.symbol&&<span className="pill">{x.symbol}</span>}</div><h2>{x.name}</h2><p className="muted">{x.profile_summary||x.description||'Research profile available.'}</p>{metrics.map(m=><p key={m.key}><strong>{m.label}:</strong> {metricValue(x,m.key,m.suffix,m.digits)}</p>)}<p className="fine muted">{researchMatchNote(x.asset_type)}</p><Link className="btn primary" href={'/investment/'+x.id}>View research</Link></article>})}</div>}</div></section>;
}
