"use client";

import {useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {trackProductEvent} from "@/lib/analytics";
import {readDraft} from "@/lib/dna";
import {matchFitLabel,matchScorePresentation} from "@/lib/match-presentation";
import type {AppState,DNA,MatchItem,MatchPayload} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";

/**
 * One-time guest or persisted-account Investor DNA result surface.
 * Guest reports stay available for the current browser session only; persistence
 * is optional and happens through the account/save flow.
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
 const reviewRequired=matches?.status==='review_required';

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
   {reviewRequired
    ? <MatchReviewCallout matches={matches}/>
    : topMatches.length>0&&<MatchPreview matches={topMatches} hasContext={hasContext}/>} 

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
    <h1>{error?'Could not load your DNA':'Your guest report is no longer available'}</h1>
    {error
     ? <p role="alert">{error}</p>
     : <p>Guest reports are kept only for the current browser session. Take the assessment again, or sign in if you previously saved your Investor DNA.</p>}
    <div className="actions">
     <Link className="btn primary" href="/dna/assessment">Take the assessment</Link>
     <Link className="btn" href="/profile">Sign in to saved DNA</Link>
     {error&&<button className="btn" onClick={()=>location.reload()}>Retry</button>}
    </div>
   </div>
  </div>
 </main>;
}

function ContextCallout({hasContext}:{hasContext:boolean}){
 return <section className="result-next-card result-context-cta">
  <div>
   <div className="eyebrow">Next · apply your DNA to this money</div>
   <h2>{hasContext?'Your money context is ready.':'Tell us what this money is for.'}</h2>
   <p>{hasContext
    ? 'Your goal, time horizon, access needs and principal-protection need are now separate inputs for Match. Your underlying Investor DNA has not changed.'
    : 'Your DNA describes you. Add the goal, time horizon, access needs and whether the full amount must be protected for this particular pool of money before using a context-aware Match.'}</p>
  </div>
  {hasContext
   ? <div className="actions compact">
      <Link className="btn primary" href="/match">See my context-aware Match</Link>
      <Link className="btn" href="/dna/context?returnTo=/match">Edit this context</Link>
     </div>
   : <Link className="btn primary" href="/dna/context?returnTo=/match">Add investment context</Link>}
 </section>;
}

function MatchReviewCallout({matches}:{matches:MatchPayload}){
 const reasons=(matches.constraints?.reasons as string[]|undefined)||[];
 return <section className="result-next-card result-match-review">
  <div>
   <div className="eyebrow">DNA Match paused</div>
   <h2>This money needs review before ranking ETFs.</h2>
   <p>The current context triggered a safety or product-data gate, so Investor DNA is not turning it into a ranked ETF list.</p>
   {reasons.length>0&&<ul className="result-list">{reasons.slice(0,3).map(reason=><li key={reason}>{reason}</li>)}</ul>}
  </div>
  <Link className="btn primary" href="/match">Review Match status</Link>
 </section>;
}

function MatchPreview({matches,hasContext}:{matches:MatchItem[];hasContext:boolean}){
 return <section className="report-section matches-section">
  <div className="eyebrow">From DNA to research</div>
  <h2>{hasContext?'Context-aware ETF comparisons':'DNA-only ETF comparisons'}</h2>
  <p className="report-lede">{hasContext
   ? 'These are compatibility signals based on your DNA and the context you added. They are not buy recommendations.'
   : 'These comparisons use your DNA only. Add the purpose, horizon and access needs for this money before treating any ETF as a context-aware Match.'}</p>

  <div className="match-preview-grid">
   {matches.map(match=><MatchPreviewCard key={match.investment_id||match.symbol} match={match}/>) }
  </div>
  <div className="matches-more">
   <Link className="btn primary" href="/match">Open DNA Match</Link>
  </div>
 </section>;
}

function MatchPreviewCard({match}:{match:MatchItem}){
 const why=
  match.explanation?.strengths?.[0] ||
  match.explanation?.why_it_fits?.[0] ||
  match.explanation?.watchouts?.[0];
 const score=matchScorePresentation(match);

 return <article className="match-preview-card">
  <div className="match-preview-top">
   <span className="pill">{match.symbol}</span>
   <strong>{score.numericValue==null
    ? score.text
    : <>{score.numericValue}<small>/100</small></>}</strong>
  </div>
  <h3>{match.name||match.symbol}</h3>
  <p className="match-fit-label">{matchFitLabel(match)}</p>
  {why&&<p className="muted">{why}</p>}
  {match.investment_id
   ? <Link className="btn" href={`/investment/${match.investment_id}`}>Open ETF research</Link>
   : <Link className="btn" href="/match">Open DNA Match</Link>}
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
   <div className="eyebrow">Optional</div>
   <strong>Save your Investor DNA if you want to come back</strong>
   <p>You can keep using this result and Match as a guest right now. Saving creates a free passwordless account so your DNA can follow you across visits and devices.</p>
   <Link className="account-signin" href="/profile">Already have an account? Sign in →</Link>
  </div>

  <form className="guest-email-form" onSubmit={onSubmit}>
   <label htmlFor="save-email">Email address</label>
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
    <button className="btn primary" disabled={sending||!supabase}>{sending?'Sending…':'Save my DNA'}</button>
   </div>
   <p className="fine muted">We send a secure sign-in link; there is no password and no PDF attachment.</p>
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
 return rows.sort((a,b)=>(b.match_score??-1)-(a.match_score??-1));
}
