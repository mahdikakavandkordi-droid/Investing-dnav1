"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {rpc} from '@/lib/supabase';
import {Fund,formatMetric} from '@/lib/investments';
type Match={symbol:string;name:string;match_score:number;recommendation_tier:string};
export default function Matches(){
 const {user,loading:authLoading}=useAccount();const [rows,setRows]=useState<(Match&{id?:string})[]>([]),[hasDna,setHasDna]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;setRows([]);setError('');if(!user){setLoading(false);return;}setLoading(true);
 Promise.all([rpc<{dna:unknown;matches?:{top_matches:Match[];alternatives:Match[]}}>('get_current_investor_app_state'),rpc<Fund[]>('app_search_investments',{p_limit:200})]).then(([state,funds])=>{if(!active)return;setHasDna(!!state.dna);const bySymbol=new Map(funds.map(f=>[f.symbol,f.id]));setRows([...(state.matches?.top_matches||[]),...(state.matches?.alternatives||[])].map(m=>({...m,id:bySymbol.get(m.symbol)})))}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false};},[user?.id]);
 return <section className="section"><div className="container"><h1>My DNA matches</h1><p className="muted">Compatibility with your saved DNA and the available fund data.</p>{authLoading||loading?<p>Loading matches…</p>:error?<div role="alert" className="notice"><p>{error}</p><button className="btn" onClick={()=>location.reload()}>Try again</button></div>:!user?<div className="card"><p>Sign in to see matches connected to your saved DNA.</p><Link className="btn primary" href="/profile">Sign in / create account</Link></div>:!hasDna?<div className="card"><p>Complete and save your DNA to see personal compatibility.</p><Link className="btn primary" href="/dna/assessment">Discover my DNA</Link></div>:!rows.length?<p>No matches are available yet. You can still browse and save funds.</p>:<div className="grid3">{rows.map(m=><div className="card" key={m.symbol}><span className="pill">{m.symbol}</span><h2>{m.name}</h2><p>{formatMetric(m.match_score,' / 100',0)} compatibility</p><p>{m.recommendation_tier.replaceAll('_',' ')}</p>{m.id?<Link className="btn primary" href={'/investment/'+m.id}>View fund and DNA fit</Link>:<Link href="/explore">Find fund in Explore</Link>}</div>)}</div>}<p className="fine muted">Compatibility is not a recommendation to buy. Missing or incomplete data can limit results.</p></div></section>;
}
