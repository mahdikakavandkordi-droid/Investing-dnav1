"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {rpc} from '@/lib/supabase';
import {Fund,formatMetric} from '@/lib/investments';
export default function Screener(){
 const [rows,setRows]=useState<Fund[]>([]),[q,setQ]=useState(''),[risk,setRisk]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 async function run(){setLoading(true);setError('');try{setRows(await rpc<Fund[]>('app_search_investments',{p_search:q||null,p_risk_level:risk||null,p_sort:'return_1y_desc',p_limit:100}))}catch(e){setError(e instanceof Error?e.message:'Could not load funds.')}finally{setLoading(false)}}
 useEffect(()=>{void run()},[]);
 return <section className="section"><div className="container"><div className="eyebrow">Screener</div><h1>Find funds that match your criteria</h1><form className="toolbar" onSubmit={e=>{e.preventDefault();void run()}}><label>Search<input className="field" placeholder="Symbol or name" value={q} onChange={e=>setQ(e.target.value)}/></label><label>Risk level<select className="field" value={risk} onChange={e=>setRisk(e.target.value)}><option value="">All risk levels</option><option>Low</option><option>Medium</option><option>High</option></select></label><button className="btn primary" disabled={loading}>Apply filters</button></form>{error&&<p className="notice" role="alert">{error}</p>}{loading?<p>Loading funds…</p>:!rows.length&&!error?<p>No funds match these filters.</p>:<table className="table"><thead><tr><th>Fund</th><th>Risk</th><th>1-year return</th><th>MER</th><th>Details</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.symbol}</b> · {x.name}</td><td>{x.risk_level||'Not available'}</td><td>{formatMetric(x.return_1y_pct,'%')}</td><td>{formatMetric(x.mer_pct,'%')}</td><td><Link className="btn" href={'/investment/'+x.id}>View fund</Link></td></tr>)}</tbody></table>}</div></section>;
}
