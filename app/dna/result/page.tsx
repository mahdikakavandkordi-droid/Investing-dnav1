"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {readDraft,AppState,DNA} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";

export default function Result(){
 const [dna,setDna]=useState<DNA|null>(null),[report,setReport]=useState<DNA|null>(null),[pending,setPending]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{
  const session=supabase?(await supabase.auth.getSession()).data.session:null;
  const local=readDraft(session?.user.id||null);
  if(local?.result){if(active){setDna(local.result.result);setReport(local.result.report?.report||null);setPending(!local.result.account_linked);}return;}
  if(session){const state=await rpc<AppState>('get_current_investor_app_state');if(active){setDna(state.dna);setReport(state.report);}}
 })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[]);
 return <section className="section"><div className="container narrow"><div className="card">{loading?<h1>Loading your DNA…</h1>:dna?<>
  <DnaSummary dna={dna} report={report}/>
  <div className="section compact"><h2>Make the match more specific</h2><p className="muted">Your DNA describes you. Add the goal, time horizon and liquidity needs for this particular pool of money to make fund compatibility more context-aware.</p><Link className="btn primary" href="/dna/context">Add investment context</Link></div>
  <p className="notice">{pending?'Your result is ready. Create a free account or sign in to keep it beyond this browser session.':'Your DNA is linked to your account.'}</p>
  <div className="actions"><Link className="btn primary" href="/profile">{pending?'Save my DNA':'My profile'}</Link><Link className="btn" href="/explore">Explore investments</Link></div>
 </>:<><h1>{error?'Could not load your DNA':'Your DNA starts here'}</h1>{error?<p role="alert">{error}</p>:<p>No completed assessment is available on this browser. Sign in to view a saved result.</p>}<div className="actions"><Link className="btn primary" href="/dna/assessment">Start / resume assessment</Link><Link className="btn" href="/profile">Sign in</Link>{error&&<button className="btn" onClick={()=>location.reload()}>Retry</button>}</div></>}</div></div></section>;
}
