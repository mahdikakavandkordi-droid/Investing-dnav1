"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {readDraft,AppState,DNA,MatchItem,MatchPayload} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";

function normalizeMatches(payload?:MatchPayload|null):MatchItem[]{
  if(!payload)return [];
  if(Array.isArray(payload.results))return [...payload.results].sort((a,b)=>(b.match_score||0)-(a.match_score||0));
  return [...(payload.top_matches||[]),...(payload.alternatives||[])].sort((a,b)=>(b.match_score||0)-(a.match_score||0));
}

export default function Result(){
 const [dna,setDna]=useState<DNA|null>(null),[report,setReport]=useState<DNA|null>(null),[matches,setMatches]=useState<MatchPayload|null>(null),[pending,setPending]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [email,setEmail]=useState(''),[sendingEmail,setSendingEmail]=useState(false),[emailMessage,setEmailMessage]=useState('');
 useEffect(()=>{let active=true;(async()=>{
  const session=supabase?(await supabase.auth.getSession()).data.session:null;
  const local=readDraft(session?.user.id||null);
  if(local?.result){if(active){setDna(local.result.result);setReport(local.result.report?.report||null);setMatches(local.result.match||null);setPending(!local.result.account_linked);}return;}
  if(session){const state=await rpc<AppState>('get_current_investor_app_state');if(active){setDna(state.dna);setReport(state.report);setMatches(state.matches||null);setPending(false);}}
 })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[]);
 const topMatches=useMemo(()=>normalizeMatches(matches).slice(0,3),[matches]);
 const hasContext=!!report?.investment_context;

 async function emailSaveLink(e:React.FormEvent){
   e.preventDefault();if(!supabase||sendingEmail||!pending)return;
   setSendingEmail(true);setEmailMessage('');setError('');
   try{
     const redirect=new URL('/profile',location.origin);redirect.searchParams.set('save','dna');
     const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true,emailRedirectTo:redirect.toString()}});
     if(error)throw error;
     setEmailMessage('Check your email. Open the secure link in this browser to save your Investor DNA.');
   }catch(e){setError(e instanceof Error?e.message:'Unable to send the secure email link.');}
   finally{setSendingEmail(false);}
 }

 if(loading)return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>Building your Investor DNA report…</h1><p className="muted">Turning your answers into a profile you can actually use.</p></div></div></main>;
 if(!dna)return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>{error?'Could not load your DNA':'Your guest report has expired'}</h1>{error?<p role="alert">{error}</p>:<p>Guest reports are one-time previews and are not kept in this browser after a refresh. Create or sign in to an account to keep your Investor DNA.</p>}<div className="actions"><Link className="btn primary" href="/dna/assessment">Take the assessment</Link><Link className="btn" href="/profile?mode=signup">Create free account</Link><Link className="btn" href="/profile">Sign in</Link>{error&&<button className="btn" onClick={()=>location.reload()}>Retry</button>}</div></div></div></main>;

 return <main className="result-page"><div className="container result-container">
   {pending&&<section className="notice guest-report-warning"><strong>One-time guest report</strong><p>This report disappears if you refresh, close, or leave this page. Save it with an account or email link if you want to keep it.</p></section>}
   <DnaSummary dna={dna} report={report}/>

   <section className="result-next-card result-context-cta">
     <div><div className="eyebrow">From DNA to a real decision</div><h2>{hasContext?'This money now has context.':'Tell us what this money is for.'}</h2><p>{hasContext?'Your goal, time horizon and liquidity needs are kept separate from your DNA and used only to make compatibility more specific.':'Your DNA describes you. Add the goal, time horizon and access needs for this particular pool of money before looking at investments.'}</p></div>
     <Link className="btn primary" href="/dna/context">{hasContext?'Edit investment context':'Add investment context'}</Link>
   </section>

   {topMatches.length>0&&<section className="report-section matches-section">
     <div className="eyebrow">05 · From DNA to discovery</div>
     <h2>Investments worth exploring</h2>
     <p className="report-lede">These are compatibility signals based on your DNA{hasContext?' and the context you added':''}. They are not buy recommendations.</p>
     <div className="match-preview-grid">{topMatches.map(m=>{
       const why=m.explanation?.strengths?.[0]||m.explanation?.why_it_fits?.[0]||m.explanation?.watchouts?.[0];
       return <article className="match-preview-card" key={m.investment_id||m.symbol}><div className="match-preview-top"><span className="pill">{m.symbol}</span><strong>{Math.round(m.match_score||0)}<small>/100</small></strong></div><h3>{m.name||m.symbol}</h3><p className="match-fit-label">{m.fit_label||m.recommendation_tier?.replaceAll('_',' ')||'Compatibility signal'}</p>{why&&<p className="muted">{why}</p>}{m.investment_id?<Link className="btn" href={`/investment/${m.investment_id}`}>See why it fits</Link>:<Link className="btn" href="/match">See my matches</Link>}</article>;
     })}</div>
     <div className="matches-more"><Link className="btn primary" href="/match">See all DNA matches</Link></div>
   </section>}

   {pending?<section className="result-save-card guest-save-card"><div className="guest-save-copy"><div className="eyebrow">Keep this report</div><strong>Don’t lose your Investor DNA</strong><p>Your guest report is not stored after refresh. Choose either option below if you want to come back to it.</p><div className="result-actions"><Link className="btn primary" href="/profile?mode=signup">Create free account</Link><Link className="btn" href="/profile">Already have an account? Sign in</Link></div></div><form className="guest-email-form" onSubmit={emailSaveLink}><label htmlFor="save-email">Or send me a secure save link</label><div className="guest-email-row"><input id="save-email" className="field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><button className="btn" disabled={sendingEmail||!supabase}>{sendingEmail?'Sending…':'Email me the link'}</button></div><p className="fine muted">Opening the link creates a free passwordless account and attaches this assessment to it. We are not emailing a PDF yet.</p>{emailMessage&&<p className="notice" role="status">{emailMessage}</p>}</form></section>:<section className="result-save-card"><div><strong>Your Investor DNA is saved.</strong><p>You can return to it from your profile and use it across Match, Explore and your watchlist.</p></div><div className="result-actions"><Link className="btn primary" href="/profile">My profile</Link><Link className="btn" href="/explore">Explore investments</Link></div></section>}
   {error&&<p className="notice" role="alert">{error}</p>}
 </div></main>;
}
