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

 if(loading)return <main className="result-page"><div className="container result-container"><div className="assessment-card assessment-loading"><h1>Building your Investor DNA…</h1></div></div></main>;
 if(!dna)return <main className="result-page"><div className="container result-container"><div className="assessment-card"><h1>{error?'Could not load your DNA':'Your DNA starts here'}</h1>{error?<p role="alert" className="notice">{error}</p>:<p className="muted">No completed assessment is available on this browser. Sign in to view a saved result.</p>}<div className="question-actions"><Link className="btn primary" href="/dna/assessment">Start assessment</Link><Link className="btn" href="/profile">Sign in</Link></div></div></div></main>;

 return <main className="result-page"><div className="container result-container">
   <DnaSummary dna={dna} report={report}/>
   <section className="result-next-card"><div><div className="eyebrow">Next step</div><h2>Make your matches more specific.</h2><p>Add the goal, time horizon and liquidity needs for this pool of money. Your DNA stays the same; the investment context changes what may fit.</p></div><Link className="btn primary" href="/dna/context">Add investment context</Link></section>
   <section className="result-save-card"><div><strong>{pending?'Keep this result':'Your DNA is saved'}</strong><p>{pending?'Create a free account or sign in if you want this profile available on another device.':'This result is linked to your account.'}</p></div><div className="result-actions"><Link className="btn primary" href="/profile">{pending?'Save my DNA':'My profile'}</Link><Link className="btn" href="/explore">Explore investments</Link></div></section>
 </div></main>;
}
