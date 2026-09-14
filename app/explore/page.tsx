"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {rpc} from '@/lib/supabase';
import {Fund,formatMetric} from '@/lib/investments';
export default function Explore(){const [items,setItems]=useState<Fund[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');rpc<Fund[]>('app_search_investments',{p_limit:50}).then(d=>{if(active)setItems(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false};},[retry]);
 return <section className="section"><div className="container"><div className="eyebrow">Investment universe</div><h1>Explore funds</h1><p className="muted">Open a fund to see its objective, risks and allocation. Save it to your account when you want to return.</p>{loading?<p>Loading funds…</p>:error?<div className="notice" role="alert"><p>Could not load the fund catalog: {error}</p><button className="btn" onClick={()=>setRetry(n=>n+1)}>Try again</button></div>:!items.length?<p>No funds are available yet.</p>:<div className="grid3">{items.map(x=><div className="card" key={x.id}><span className="pill">{x.symbol}</span><h2>{x.name}</h2><p className="muted">{x.profile_summary||x.description}</p><p>1-year return: {formatMetric(x.return_1y_pct,'%')}</p><p>MER: {formatMetric(x.mer_pct,'%')}</p><Link className="btn primary" href={'/investment/'+x.id}>View fund</Link></div>)}</div>}</div></section>;
}
