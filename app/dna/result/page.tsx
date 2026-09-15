"use client";

import {useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {trackProductEvent} from "@/lib/analytics";
import {readDraft} from "@/lib/dna";
import type {AppState,DNA,MatchItem,MatchPayload} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";

/**
 * One-time guest or persisted-account Investor DNA result surface.
 *
 * Guest completed reports are intentionally ephemeral; the browser may retain
 * only the limited claim ticket needed for optional account attachment.
 */
export default function Result(){
 const [dna,setDna]=useState<DNA|null>(null);
 const [report,setReport]=useState<DNA|null>(null);
 const [matches,setMatches]=useState<MatchPayload|null>(null);
 const [pending,setPending]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [email,setEmail]=useState('');
 const [sendingEmail,setSendingEmail]=useState(false);
 const [emailMessage,setEmailMessage]=useState('');

 useEffect(()=>{
  let active=true;

  (async()=>{
   const session=supabase?(await supabase.auth.getSession()).data.session:null;
   const local=readDraft(session?.user.id||null);

   if(local?.result){
    if(active){
     setDna(local.result.result);
     setReport(local.result.report?.report||null);
     setMatches(local.result.match||null);
     setPending(!local.result.account_linked);
    }
    return;
   }

   if(session){
    const state=await rpc<AppState>('get_current_investor_app_state');
    if(active){
     setDna(state.dna);
     setReport(state.report);
     setMatches(state.matches||null);
     setPending(false);
    }
   }
  })()
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[]);

 const topMatches=useMemo(()=>normalizeMatches(matches).slice(0,3),[matches]);
 const hasContext=!!report?.investment_context;

 async function emailSaveLink(event:FormEvent){
  event.preventDefault();
  if(!supabase||sendingEmail||!pending)return;

  setSendingEmail(true);
  setEmailMessage('');
  setError('');

  try{
   const redirect=new URL('/profile',location.origin);
   redirect.searchParams.set('save','dna');

   const {error:authError}=await supabase.auth.signInWithOtp({
    email:email.trim(),
    options:{shouldCreateUser:true,emailRedirectTo:redirect.toString()}
   });
   if(authError)throw authError;

   void trackProductEvent('secure_link_requested',{metadata:{source:'dna_result'}});
   setEmailMessage('Check your email. Open the secure link in this browser to save your Investor DNA.');
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to send the secure email link.');
  }finally{
   setSendingEmail(false);
  }
 }

 if(loading)return <LoadingResult/>;
 if(!dna)return <MissingResult error={error}/>;

 return <main className="result-page">
  <div className="container result-container">
   <DnaSummary dna={dna} report={report}/>
   <ContextCallout hasContext={hasContext}/>
   {topMatches.length>0&&<MatchPreview matches={topMatches} hasContext={hasContext}/>} 

   {pending
    ? <GuestSaveCard
       email={email}
       sending={sendingEmail}
       message={emailMessage}
       onEmail={setEmail}
       onSubmit={emailSaveLink}
      />
    : <SavedResultCard/>}

   <PilotFeedbackCard/>
   {error&&<p className="notice" role="alert">{error}</p>}
  </div>
 </main>;
}

function LoadingResult(){
 return <main className="result-page">
  <div className="container result-container">
   <div className="result-loading-card">
    <h1>Building your Investor DNA report…</h1>
    <p className="muted">Turning your answers into a profile you can actually use.</p>
   </div>
  </div>
 </main>;
}

function MissingResult({error}:{error:string}){
 return <main className="result-page">
  <div className="container result-container">
   <div className="result-loading-card">
    <h1>{error?'Could not load your DNA':'Your guest report has expired'}</h1>
    {error
     ? <p role="alert">{error}</p>
     : <p>Guest reports are one-time previews and are not kept in this browser after a refresh. Create or sign in to an account to keep your Investor DNA.</p>}
    <div className="actions">
     <Link className="btn primary" href="/dna/assessment">Take the assessment</Link>
     <Link className="btn" href="/profile?mode=signup">Create free account</Link>
     <Link className="btn" href="/profile">Sign in</Link>
     {error&&<button className="btn" onClick={()=>location.reload()}>Retry</button>}
    </div>
   </div>
  </div>
 </main>;
}

function ContextCallout({hasContext}:{hasContext:boolean}){
 return <section className="result-next-card result-context-cta">
  <div>
   <div className="eyebrow">From DNA to a real decision</div>
   <h2>{hasContext?'This money now has context.':'Tell us what this money is for.'}</h2>
   <p>{hasContext
    ? 'Your goal, time horizon and liquidity needs are kept separate from your DNA and used only to make compatibility more specific.'
    : 'Your DNA describes you. Add the goal, time horizon and access needs for this particular pool of money before looking at investments.'}</p>
  </div>
  <Link className="btn primary" href="/dna/context">{hasContext?'Edit investment context':'Add investment context'}</Link>
 </section>;
}

function MatchPreview({matches,hasContext}:{matches:MatchItem[];hasContext:boolean}){
 return <section className="report-section matches-section">
  <div className="eyebrow">05 · From DNA to discovery</div>
  <h2>Investments worth exploring</h2>
  <p className="report-lede">These are compatibility signals based on your DNA{hasContext?' and the context you added':''}. They are not buy recommendations.</p>

  <div className="match-preview-grid">
   {matches.map(match=><MatchPreviewCard key={match.investment_id||match.symbol} match={match}/>) }
  </div>
  <div className="matches-more">
   <Link className="btn primary" href="/match">See all DNA matches</Link>
  </div>
 </section>;
}

function MatchPreviewCard({match}:{match:MatchItem}){
 const why=
  match.explanation?.strengths?.[0] ||
  match.explanation?.why_it_fits?.[0] ||
  match.explanation?.watchouts?.[0];

 return <article className="match-preview-card">
  <div className="match-preview-top">
   <span className="pill">{match.symbol}</span>
   <strong>{Math.round(match.match_score||0)}<small>/100</small></strong>
  </div>
  <h3>{match.name||match.symbol}</h3>
  <p className="match-fit-label">{match.fit_label||match.recommendation_tier?.replaceAll('_',' ')||'Compatibility signal'}</p>
  {why&&<p className="muted">{why}</p>}
  {match.investment_id
   ? <Link className="btn" href={`/investment/${match.investment_id}`}>See why it fits</Link>
   : <Link className="btn" href="/match">See my matches</Link>}
 </article>;
}

function GuestSaveCard({
 email,sending,message,onEmail,onSubmit
}:{
 email:string;
 sending:boolean;
 message:string;
 onEmail:(value:string)=>void;
 onSubmit:(event:FormEvent)=>void;
}){
 return <section className="result-save-card guest-save-card">
  <div className="guest-save-copy">
   <div className="eyebrow">Keep this report</div>
   <strong>Don’t lose your Investor DNA</strong>
   <p>Your guest report is not stored after refresh. Choose either option below if you want to come back to it.</p>
   <div className="result-actions">
    <Link className="btn primary" href="/profile?mode=signup">Create free account</Link>
    <Link className="btn" href="/profile">Already have an account? Sign in</Link>
   </div>
  </div>

  <form className="guest-email-form" onSubmit={onSubmit}>
   <label htmlFor="save-email">Or send me a secure save link</label>
   <div className="guest-email-row">
    <input
     id="save-email"
     className="field"
     type="email"
     autoComplete="email"
     required
     value={email}
     onChange={event=>onEmail(event.target.value)}
     placeholder="you@example.com"
    />
    <button className="btn" disabled={sending||!supabase}>{sending?'Sending…':'Email me the link'}</button>
   </div>
   <p className="fine muted">Opening the link creates a free passwordless account and attaches this assessment to it. We are not emailing a PDF yet.</p>
   {message&&<p className="notice" role="status">{message}</p>}
  </form>
 </section>;
}

function SavedResultCard(){
 return <section className="result-save-card">
  <div>
   <strong>Your Investor DNA is saved.</strong>
   <p>You can return to it from your profile and use it across Match, Explore and your watchlist.</p>
  </div>
  <div className="result-actions">
   <Link className="btn primary" href="/profile">My profile</Link>
   <Link className="btn" href="/explore">Explore investments</Link>
  </div>
 </section>;
}

function PilotFeedbackCard(){
 return <section className="result-next-card">
  <div>
   <div className="eyebrow">Pilot feedback</div>
   <h2>Did the result actually make sense?</h2>
   <p>Give us one minute of feedback. It helps us validate clarity and usefulness before launch.</p>
  </div>
  <Link className="btn" href="/feedback">Give pilot feedback</Link>
 </section>;
}

function normalizeMatches(payload?:MatchPayload|null):MatchItem[]{
 if(!payload)return [];
 const rows=Array.isArray(payload.results)
  ? [...payload.results]
  : [...(payload.top_matches||[]),...(payload.alternatives||[])];
 return rows.sort((a,b)=>(b.match_score||0)-(a.match_score||0));
}
