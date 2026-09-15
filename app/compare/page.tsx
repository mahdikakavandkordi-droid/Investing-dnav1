"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Instrument,searchInstruments,compareInstruments} from '@/lib/instruments';
import {assetLabel,matchEligible,heroMetrics} from '@/lib/instrument-model';
import {formatMetric,validId} from '@/lib/investments';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import type {AppState,MatchItem} from '@/lib/dna';

function fitLabel(m?:MatchItem){return m?.explanation?.fit_label||m?.fit_label||m?.recommendation_tier?.replaceAll('_',' ')||'Not matched'}
function pretty(value:unknown){if(value===null||value===undefined||value==='')return 'Not available';return String(value).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
function value(item:Instrument,key:string,suffix='',digits=2){const raw=(item as unknown as Record<string,unknown>)[key];if(raw===null||raw===undefined||raw==='')return 'Not available';if(typeof raw==='number')return formatMetric(raw,suffix,digits);return pretty(raw);}
const SHARED:[keyof Instrument,string][]=[['capital_protection','Capital protection'],['liquidity_level','Liquidity'],['price_volatility','Price volatility'],['income_predictability','Income predictability'],['growth_participation','Growth participation'],['interest_rate_sensitivity','Interest-rate sensitivity'],['diversification_level','Diversification'],['complexity_level','Complexity']];

export default function Compare(){
 const {user}=useAccount();const [items,setItems]=useState<Instrument[]>([]),[selected,setSelected]=useState<string[]>(['','','']),[rows,setRows]=useState<Instrument[]>([]),[state,setState]=useState<AppState|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;setLoading(true);const ids=new URLSearchParams(location.search).get('ids')?.split(',').filter(validId).slice(0,3)||[];if(ids.length)setSelected([ids[0]||'',ids[1]||'',ids[2]||'']);
 Promise.all([searchInstruments({limit:100}),user?rpc<AppState>('get_current_investor_app_state').catch(()=>null):Promise.resolve(null)]).then(([catalog,s])=>{if(active){setItems(catalog);setState(s);if(ids.length>=2)void run(ids)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[user?.id]);
 const matches=useMemo(()=>new Map((state?.matches?.results||[]).map(m=>[m.symbol,m])),[state]);
 async function run(override?:string[]){const arr=(override||selected).filter(validId);if(arr.length<2){setError('Choose at least two investments to compare.');return;}setBusy(true);setError('');try{const data=await compareInstruments(arr);setRows(data);history.replaceState(null,'',`/compare?ids=${arr.join(',')}`)}catch(e){setError(e instanceof Error?e.message:'Could not compare these investments.')}finally{setBusy(false)}}
 function setSlot(index:number,id:string){setSelected(current=>current.map((x,i)=>i===index?id:x));}
 return <section className="section"><div className="container"><div className="eyebrow">Compare</div><h1>Compare Investment DNA side by side</h1><p className="muted">Compare two or three investment structures. Shared structural traits come first; asset-specific facts stay separate. Personalized DNA Match is shown only for ETFs.</p>
 {loading?<p>Loading comparison tools…</p>:<><div className="compare-picker">{selected.map((id,i)=><label key={i}>Investment {i+1}<select className="field" value={id} onChange={e=>setSlot(i,e.target.value)}><option value="">{i<2?'Choose an investment':'Optional third investment'}</option>{items.filter(x=>!selected.includes(x.id)||x.id===id).map(x=><option key={x.id} value={x.id}>{assetLabel(x.asset_type)} · {x.symbol?`${x.symbol} — `:''}{x.name}</option>)}</select></label>)}</div><div className="actions"><button className="btn primary" disabled={busy} onClick={()=>void run()}>{busy?'Comparing…':'Compare investments'}</button><Link className="btn" href="/explore">Back to Explore</Link></div></>}
 {error&&<p className="notice" role="alert">{error}</p>}
 {rows.length>=2&&<><div className="compare-grid">{rows.map(x=>{const canMatch=matchEligible(x.asset_type),m=canMatch?matches.get(x.symbol):undefined;const metrics=heroMetrics(x.asset_type);return <article className="compare-card" key={x.id}><div className="actions compact"><span className="pill">{assetLabel(x.asset_type)}</span>{x.symbol&&<span className="pill">{x.symbol}</span>}</div><h2>{x.name}</h2>{canMatch?(m?<div><div className="compare-score">{m.match_score==null?'Review':`${Math.round(m.match_score)}/100`}</div><strong>{fitLabel(m)}</strong><p className="fine muted">Personal ETF compatibility layer</p></div>:<div className="notice"><span>{user?'No ranked ETF fit available':'Sign in with saved DNA to add ETF fit'}</span></div>):<div className="notice"><span>Research profile · personalized Match not enabled for this asset type yet</span></div>}
 <h3>Shared Investment DNA</h3>{SHARED.map(([key,label])=><div className="compare-metric" key={String(key)}><span>{label}</span><strong>{pretty(x[key])}</strong></div>)}
 <h3>{assetLabel(x.asset_type)} facts</h3>{metrics.map(met=><div className="compare-metric" key={met.key}><span>{met.label}</span><strong>{value(x,met.key,met.suffix,met.digits)}</strong></div>)}
 {x.credit_exposure&&<div className="compare-metric"><span>Credit exposure</span><strong>{pretty(x.credit_exposure)}</strong></div>}{x.time_structure&&<div className="compare-metric"><span>Time structure</span><strong>{pretty(x.time_structure)}</strong></div>}
 {m?.explanation?.strengths?.length?<><strong>Why this ETF may fit</strong><ul className="compare-fit-list">{m.explanation.strengths.slice(0,2).map(t=><li key={t}>{t}</li>)}</ul></>:null}{m?.explanation?.watchouts?.length?<><strong>What conflicts</strong><ul className="compare-fit-list">{m.explanation.watchouts.slice(0,2).map(t=><li key={t}>{t}</li>)}</ul></>:null}<Link className="btn" href={`/investment/${x.id}`}>Open research</Link></article>})}</div><p className="fine muted">Historical returns and quoted rates/yields are not forecasts. Cross-asset Investment DNA labels are research descriptors. ETF DNA Match is a compatibility signal, not a recommendation to buy.</p></>}
 </div></section>;
}
