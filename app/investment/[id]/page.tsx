"use client";
import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {Fund,InvestmentDna,fund,investmentDna,formatMetric,validId} from '@/lib/investments';
import {FundConnection} from '@/components/FundConnection';
import {InvestmentDnaCard} from '@/components/InvestmentDnaCard';
export default function Detail(){
 const {id}=useParams<{id:string}>();const [item,setItem]=useState<Fund|null>(null),[dna,setDna]=useState<InvestmentDna|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setItem(null);setDna(null);setLoading(true);setError('');
 if(!validId(id)){setLoading(false);setError('This fund link is invalid.');return;}
 Promise.all([fund(id),investmentDna(id).catch(()=>null)]).then(([fundData,dnaData])=>{if(active){setItem(fundData);setDna(dnaData)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
 return ()=>{active=false};},[id,retry]);
 return <section className="section"><div className="container"><Link href="/explore">← Explore funds</Link>{loading?<div className="card"><h1>Loading fund details…</h1></div>:error?<div className="card" role="alert"><h1>Could not load this fund</h1><p>{error}</p><button className="btn" onClick={()=>setRetry(x=>x+1)}>Try again</button></div>:!item?<div className="card"><h1>Fund not found</h1><p>This fund is not available in the catalog.</p><Link href="/explore">Browse available funds</Link></div>:<>
 <div className="section compact"><span className="pill">{item.symbol} · {item.asset_type||'Fund'}</span><h1>{item.name}</h1><p className="muted">{item.issuer_name}</p><p>{item.profile_summary||item.description||'A description is not available yet.'}</p></div>
 <div className="grid3"><div className="card"><small>Price {item.currency?`(${item.currency})`:''}</small><div className="metric-value">{formatMetric(item.price)}</div></div><div className="card"><small>1-year return</small><div className="metric-value">{formatMetric(item.return_1y_pct,'%')}</div></div><div className="card"><small>Management expense ratio</small><div className="metric-value">{formatMetric(item.mer_pct,'%')}</div></div></div>
 <p className="muted fine">{item.data_status==='identity_only'?'Fund profile available; live price and performance data are not available.':`Metrics as of ${item.metrics_as_of_date||'an unreported date'}.`} Missing figures are not shown as zero.</p>
 {dna&&<InvestmentDnaCard dna={dna}/>} 
 <div className="grid2 section compact"><div className="card"><h2>Fund objective</h2><p>{item.profile_objective||'Not available'}</p><h3>Benchmark</h3><p>{item.profile_benchmark||'Not available'}</p><h3>Management style</h3><p>{item.profile_management_style||'Not available'}</p><h3>Distributions</h3><p>{item.profile_distribution_policy||'Not available'}</p></div><div className="card"><h2>Risk and allocation</h2><p>Reported risk level: {item.risk_level||'Not available'}</p>{item.profile_key_risks?.length?<ul>{item.profile_key_risks.map(x=><li key={x}>{x}</li>)}</ul>:<p>Detailed risk information is not available.</p>}{Object.entries(item.profile_target_allocation||{}).map(([key,value])=><div className="fingerprint" key={key}><span>{key.replaceAll('_',' ')}</span><strong>{formatMetric(value,'%')}</strong></div>)}</div></div>
 <FundConnection id={item.id}/>
 </>}</div></section>;
}
