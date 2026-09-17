"use client";

import {useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {trackProductEvent} from "@/lib/analytics";
import {
 normalizePersonalization,
 readDraft,
 writeClaimPersonalization
} from "@/lib/dna";
import {matchFitLabel,matchScorePresentation} from "@/lib/match-presentation";
import type {AppState,DNA,MatchItem,MatchPayload,PersonalizationProfile} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";

export default function Result(){
 const [dna,setDna]=useState<DNA|null>(null);
 const [report,setReport]=useState<DNA|null>(null);
 const [personal,setPersonal]=useState<PersonalizationProfile|null>(null);
 const [matches,setMatches]=useState<MatchPayload|null>(null);
 const [pending,setPending]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
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
     setPersonal(local.personalization||personalFromContext(local.result.report?.report?.investment_context||local.result.result.investment_context));
    }
    return;
   }
   if(session){
    const state=await rpc<AppState>('get_current_investor_app_state');
    if(active){
     setDna(state.dna);setReport(state.report);setMatches(state.matches||null);setPending(false);
     setPersonal(normalizePersonalization(session.user.user_metadata)||personalFromContext(state.report?.investment_context||state.dna?.investment_context));
    }
   }
  })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[]);

 const topMatches=useMemo(()=>normalizeMatches(matches).slice(0,3),[matches]);
 const hasContext=!!report?.investment_context?.goal&&!!report?.investment_context?.time_horizon;
 const reviewRequired=matches?.status==='review_required';

 async function emailSaveLink(email:string,profile:PersonalizationProfile){
  if(!supabase||sendingEmail||!pending)return;
  setSendingEmail(true);setEmailMessage('');setError('');
  try{
   if(!writeClaimPersonalization(profile))throw new Error('This browser could not preserve the report details needed to finish saving. Please keep this tab open and try again.');
   const redirect=new URL('/profile',location.origin);redirect.searchParams.set('save','dna');
   const {error:authError}=await supabase.auth.signInWithOtp({
    email:email.trim(),
    options:{shouldCreateUser:true,emailRedirectTo:redirect.toString(),data:profile}
   });
   if(authError)throw authError;
   void trackProductEvent('secure_link_requested',{metadata:{source:'dna_result'}});
   setEmailMessage('Check your email. The secure link will save this Investor DNA to your account and let you reopen the report.');
  }catch(e){setError(e instanceof Error?e.message:'Unable to send the secure email link.');}
  finally{setSendingEmail(false);}
 }

 if(loading)return <LoadingResult/>;
 if(!dna)return <MissingResult error={error}/>;
 return <main className="result-page"><div className="container result-container">
  <DnaSummary dna={dna} report={report} personal={personal}/>
  {pending
   ? <GuestSaveCard personal={personal} sending={sendingEmail} message={emailMessage} onSubmit={emailSaveLink}/>
   : <SavedResultCard/>}
  <ContextCallout hasContext={hasContext}/>
  {reviewRequired?<MatchReviewCallout matches={matches!}/>:topMatches.length>0&&<MatchPreview matches={topMatches} hasContext={hasContext}/>} 
  <PilotFeedbackCard/>
  {error&&<p className="notice" role="alert">{error}</p>}
 </div></main>;
}

function LoadingResult(){return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>Building your Investor DNA report…</h1><p className="muted">Turning your answers into a profile you can actually use.</p></div></div></main>}
function MissingResult({error}:{error:string}){return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>{error?'Could not load your DNA':'Your guest report is no longer available'}</h1>{error?<p role="alert">{error}</p>:<p>Guest reports are kept only for the current browser session. Take the assessment again, or sign in if you previously saved your Investor DNA.</p>}<div className="actions"><Link className="btn primary" href="/dna/assessment">Take the assessment</Link><Link className="btn" href="/profile">Sign in to saved DNA</Link>{error&&<button className="btn" onClick={()=>location.reload()}>Retry</button>}</div></div></div></main>}

function ContextCallout({hasContext}:{hasContext:boolean}){
 return <section className="result-next-card result-context-cta"><div><div className="eyebrow">Next · put your DNA into action</div><h2>{hasContext?'This goal is connected to your DNA.':'Tell us what this money is for.'}</h2><p>{hasContext?'Your personal Investor DNA stays intact. Goal, horizon, access needs and principal protection now form a separate layer for this specific money.':'Your personal report is complete. Add a goal, time horizon, access needs and principal-protection requirement when you want context-aware DNA Match research.'}</p></div>{hasContext?<div className="actions compact"><Link className="btn primary" href="/match">Open context-aware Match</Link><Link className="btn" href="/dna/context?returnTo=/dna/result">Edit this goal</Link></div>:<Link className="btn primary" href="/dna/context?returnTo=/dna/result">Set an investment goal</Link>}</section>;
}

function GuestSaveCard({personal,sending,message,onSubmit}:{personal:PersonalizationProfile|null;sending:boolean;message:string;onSubmit:(email:string,profile:PersonalizationProfile)=>Promise<void>}){
 const [open,setOpen]=useState(false);
 const [email,setEmail]=useState('');
 const [firstName,setFirstName]=useState(personal?.first_name||'');
 const [lastName,setLastName]=useState(personal?.last_name||'');
 const [phone,setPhone]=useState(personal?.phone||'');
 const age=personal?.age||0;
 function submit(event:FormEvent){event.preventDefault();const profile=normalizePersonalization({first_name:firstName,age,last_name:lastName,phone});if(!profile)return;void onSubmit(email,profile);}
 return <>
  <section className="report-save-launch"><div><div className="eyebrow">Optional account</div><strong>Save your Investor DNA</strong><p>Keep this report in your dashboard and receive a secure email link to reopen it later.</p><div className="report-save-benefits"><span>Dashboard access</span><span>Secure email link</span><span>DNA Match continuity</span></div></div><button className="btn primary" onClick={()=>setOpen(true)}>Save my report</button></section>
  {open&&<div className="save-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}><section className="save-modal" role="dialog" aria-modal="true" aria-labelledby="save-report-title"><div className="save-modal-head"><div><div className="eyebrow">Free · passwordless</div><h2 id="save-report-title">Save your Investor DNA</h2><p>Email is required for secure access. Last name and phone are optional.</p></div><button className="save-modal-close" aria-label="Close" onClick={()=>setOpen(false)}>×</button></div><form onSubmit={submit}><div className="save-modal-fields"><label><span>Email *</span><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label><span>First name *</span><input autoComplete="given-name" required value={firstName} onChange={e=>setFirstName(e.target.value)}/></label><label><span>Last name (optional)</span><input autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)}/></label><label><span>Phone (optional)</span><input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 …"/></label></div><button className="btn primary" disabled={sending||!email.trim()||!firstName.trim()}>{sending?'Sending secure link…':'Save & email my report'}</button><p className="save-modal-fine">The email contains a secure sign-in link, not an attachment. Your age stays part of the saved report profile.</p>{message&&<p className="notice" role="status">{message}</p>}</form></section></div>}
 </>;
}

function MatchReviewCallout({matches}:{matches:MatchPayload}){const reasons=(matches.constraints?.reasons as string[]|undefined)||[];return <section className="result-next-card result-match-review"><div><div className="eyebrow">DNA Match paused</div><h2>This money needs review before ranking ETFs.</h2><p>The current context triggered a safety or product-data gate, so Investor DNA is not turning it into a ranked ETF list.</p>{reasons.length>0&&<ul className="result-list">{reasons.slice(0,3).map(reason=><li key={reason}>{reason}</li>)}</ul>}</div><Link className="btn primary" href="/match">Review Match status</Link></section>}
function MatchPreview({matches,hasContext}:{matches:MatchItem[];hasContext:boolean}){return <section className="report-section matches-section"><div className="eyebrow">From DNA to research</div><h2>{hasContext?'Context-aware ETF comparisons':'DNA-only ETF comparisons'}</h2><p className="report-lede">{hasContext?'These are compatibility signals based on your DNA and the context you added. They are not buy recommendations.':'These comparisons use your DNA only. Add the purpose, horizon and access needs for context-aware Match.'}</p><div className="match-preview-grid">{matches.map(match=><MatchPreviewCard key={match.investment_id||match.symbol} match={match}/>)}</div><div className="matches-more"><Link className="btn primary" href="/match">See all DNA matches</Link></div></section>}
function MatchPreviewCard({match}:{match:MatchItem}){const why=match.explanation?.strengths?.[0]||match.explanation?.why_it_fits?.[0]||match.explanation?.watchouts?.[0];const score=matchScorePresentation(match);return <article className="match-preview-card"><div className="match-preview-top"><span className="pill">{match.symbol}</span><strong>{score.numericValue==null?score.text:<>{score.numericValue}<small>/100</small></>}</strong></div><h3>{match.name||match.symbol}</h3><p className="match-fit-label">{matchFitLabel(match)}</p>{why&&<p className="muted">{why}</p>}{match.investment_id?<Link className="btn" href={`/investment/${match.investment_id}`}>Open ETF research</Link>:<Link className="btn" href="/match">Open DNA Match</Link>}</article>}
function SavedResultCard(){return <section className="result-save-card"><div><strong>Your Investor DNA is saved.</strong><p>You can return to it from your dashboard and use it across Match, Explore and your watchlist.</p></div><div className="result-actions"><Link className="btn primary" href="/profile">My dashboard</Link><Link className="btn" href="/explore">Explore investments</Link></div></section>}
function PilotFeedbackCard(){return <section className="result-next-card"><div><div className="eyebrow">Pilot feedback</div><h2>Did the result actually make sense?</h2><p>Give us one minute of feedback. It helps us validate clarity and usefulness before launch.</p></div><Link className="btn" href="/feedback">Give pilot feedback</Link></section>}
function normalizeMatches(payload?:MatchPayload|null):MatchItem[]{if(!payload)return [];const rows=Array.isArray(payload.results)?[...payload.results]:[...(payload.top_matches||[]),...(payload.alternatives||[])];return rows.sort((a,b)=>(b.match_score??-1)-(a.match_score??-1))}
function personalFromContext(context?:DNA['investment_context']):PersonalizationProfile|null{return normalizePersonalization({first_name:context?.first_name,age:context?.age})}
