"use client";

import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase,pilot} from "@/lib/supabase";
import {
 answerRows,
 optionsFor,
 readDraft,
 writeDraft,
 writeEphemeralResult,
 clearDraft
} from "@/lib/dna";
import type {Draft,Question,Submission} from "@/lib/dna";
import {ASSESSMENT_COPY} from "@/lib/assessment-copy";
import type {AssessmentCohort,AssessmentLocale} from "@/lib/assessment-copy";

const COGNITIVE_ACCESS_KEY='investing-dna:cognitive-access:v1';
const LANGUAGE_KEY='investing-dna:language';

/**
 * Investing DNA assessment flow.
 *
 * The browser manages session recovery/navigation only. Questionnaire content,
 * answer validation and canonical scoring remain server-authoritative.
 */
export default function Assessment(){
 const router=useRouter();
 const [draft,setDraft]=useState<Draft|null>(null);
 const [questions,setQuestions]=useState<Question[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [warning,setWarning]=useState("");
 const [locale,setLocale]=useState<AssessmentLocale>('en');
 const [cohort,setCohort]=useState<AssessmentCohort>('DEV_V1_10');
 const lock=useRef(false);
 const copy=ASSESSMENT_COPY[locale];

 useEffect(()=>{
  try{
   const saved=localStorage.getItem(LANGUAGE_KEY);
   if(saved==='fr'||saved==='fa'||saved==='en')setLocale(saved);

   const requested=new URL(location.href).searchParams.get('cohort');
   if(requested==='COGNITIVE_V1_10')setCohort('COGNITIVE_V1_10');
  }catch{}
 },[]);

 // Resume only a valid draft belonging to the current account/guest context.
 // Completed guest reports redirect to the one-time result instead of reopening
 // the questionnaire.
 useEffect(()=>{
  let active=true;

  (async()=>{
   if(!supabase)throw new Error("The assessment service is not configured yet.");

   const {data:{session}}=await supabase.auth.getSession();
   const saved=readDraft(session?.user.id||null);
   if(!active)return;

   if(saved?.result){
    router.replace('/dna/result');
    return;
   }
   if(!saved)return;

   const sessionLanguage=saved.session.language_code;
   if(sessionLanguage)setLocale(sessionLanguage);
   setDraft(saved);

   const data=await pilot<{questions:Question[]}>('questionnaire',saved.session);
   if(!active)return;
   if(!data.questions?.length)throw new Error('No questions are available.');
   setQuestions(data.questions);
  })()
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[router]);

 function changeLocale(value:AssessmentLocale){
  setLocale(value);
  try{localStorage.setItem(LANGUAGE_KEY,value)}catch{}
 }

 function persist(next:Draft){
  setDraft(next);
  if(!writeDraft(next)){
   setWarning("This browser cannot keep your progress after closing the page. Keep this page open until you finish.");
  }
 }

 async function start(){
  if(lock.current)return;
  lock.current=true;
  setBusy(true);
  setError('');

  try{
   if(!supabase)throw new Error('The assessment service is not configured yet.');
   const {data:{session}}=await supabase.auth.getSession();

   let cohortAccessCode:string|undefined;
   if(cohort==='COGNITIVE_V1_10'){
    cohortAccessCode=sessionStorage.getItem(COGNITIVE_ACCESS_KEY)?.trim()||undefined;
    if(!cohortAccessCode){
     throw new Error('This research session requires a moderator invite code. Start from the cognitive research entry page.');
    }
   }

   const assessmentSession=await pilot<Draft['session']>('start',{
    cohort_code:cohort,
    language_code:locale,
    consent_version:`${cohort==='COGNITIVE_V1_10'?'cognitive':'prepilot'}-v1.10-${locale}`,
    ...(cohortAccessCode?{cohort_access_code:cohortAccessCode}:{})
   });

   // The raw moderator invite code is one-time browser state, not long-lived
   // application state.
   if(cohort==='COGNITIVE_V1_10')sessionStorage.removeItem(COGNITIVE_ACCESS_KEY);

   const next:Draft={
    version:1,
    createdAt:Date.now(),
    ownerId:session?.user.id||null,
    session:assessmentSession,
    answers:{},
    index:0
   };
   persist(next);

   const data=await pilot<{questions:Question[]}>('questionnaire',assessmentSession);
   if(!data.questions?.length){
    throw new Error('No questions are available. Please try again later.');
   }
   setQuestions(data.questions);
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to start.');
  }finally{
   lock.current=false;
   setBusy(false);
  }
 }

 async function finish(){
  if(!draft||lock.current)return;
  lock.current=true;
  setBusy(true);
  setError('');

  try{
   const complete=questions.every(question=>draft.answers[question.question_id]!==undefined);
   if(!complete)throw new Error('Please answer every question before submitting.');

   await pilot('save_answers',{
    ...draft.session,
    answers:answerRows(draft.answers)
   });

   const result=await pilot<Submission>('submit',draft.session);
   if(!result.result)throw new Error('The result is not available yet.');

   const completed={...draft,result};
   setDraft(completed);
   writeEphemeralResult(completed);
   router.push('/dna/result');
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to submit.');
  }finally{
   lock.current=false;
   setBusy(false);
  }
 }

 if(loading){
  return <AssessmentShell>
   <div className="assessment-card assessment-loading"><h1>{copy.restore}</h1></div>
  </AssessmentShell>;
 }

 if(!draft){
  return <AssessmentShell>
   <AssessmentIntro
    locale={locale}
    cohort={cohort}
    busy={busy}
    error={error}
    onLocale={changeLocale}
    onStart={()=>void start()}
   />
  </AssessmentShell>;
 }

 const question=questions[draft.index];
 if(!question){
  return <AssessmentShell>
   <RecoveryError locale={locale}/>
  </AssessmentShell>;
 }

 return <AssessmentShell>
  <QuestionStep
   locale={locale}
   draft={draft}
   questions={questions}
   question={question}
   busy={busy}
   warning={warning}
   error={error}
   onPersist={persist}
   onFinish={()=>void finish()}
  />
 </AssessmentShell>;
}

function AssessmentShell({children}:{children:React.ReactNode}){
 return <main className="assessment-page">
  <div className="container assessment-container">{children}</div>
 </main>;
}

function AssessmentIntro({
 locale,cohort,busy,error,onLocale,onStart
}:{
 locale:AssessmentLocale;
 cohort:AssessmentCohort;
 busy:boolean;
 error:string;
 onLocale:(value:AssessmentLocale)=>void;
 onStart:()=>void;
}){
 const copy=ASSESSMENT_COPY[locale];
 const direction=locale==='fa'?'rtl':'ltr';
 const cognitive=cohort==='COGNITIVE_V1_10';

 return <div className="assessment-card assessment-intro" dir={direction} lang={locale}>
  <div className="assessment-intro-top">
   <div>
    <div className="eyebrow">{copy.eyebrow}</div>
    {cognitive&&<div className="pill">Cognitive research session · v1.10</div>}
   </div>
   <label className="language-picker">
    <span>{copy.language}</span>
    <select value={locale} onChange={event=>onLocale(event.target.value as AssessmentLocale)} aria-label={copy.language}>
     <option value="en">English</option>
     <option value="fr">Français</option>
     <option value="fa">فارسی</option>
    </select>
   </label>
  </div>

  <h1>{copy.title}</h1>
  <p className="assessment-lede">{copy.lede}</p>
  <div className="assessment-meta" aria-label="Assessment details">
   <span>{copy.questions}</span><span>{copy.guest}</span><span>{copy.save}</span>
  </div>

  <div className="assessment-principle">
   <span className="principle-mark">✦</span>
   <div><p className="principle-title">{copy.principle}</p><p>{copy.principleBody}</p></div>
  </div>

  <button className="btn primary assessment-start" disabled={busy} onClick={onStart}>
   {busy?copy.starting:copy.start}
  </button>

  <div className="assessment-account-card">
   <div><p className="account-card-title">{copy.accountTitle}</p><p>{copy.accountBody}</p></div>
   <div className="account-card-actions">
    <Link className="btn account-create" href="/profile?mode=signup">{copy.accountCta}</Link>
    <Link className="account-signin" href="/profile">{copy.signin}</Link>
   </div>
  </div>

  <p className="muted fine assessment-consent">{copy.consent}</p>
  {cognitive&&<p className="notice">Research session: your moderator may ask what you thought each question meant after you finish. Please answer naturally without trying to optimize the result.</p>}
  {error&&<p role="alert" className="notice">{error}</p>}
 </div>;
}

function QuestionStep({
 locale,draft,questions,question,busy,warning,error,onPersist,onFinish
}:{
 locale:AssessmentLocale;
 draft:Draft;
 questions:Question[];
 question:Question;
 busy:boolean;
 warning:string;
 error:string;
 onPersist:(draft:Draft)=>void;
 onFinish:()=>void;
}){
 const copy=ASSESSMENT_COPY[locale];
 const direction=locale==='fa'?'rtl':'ltr';
 const chosen=draft.answers[question.question_id];
 const options=optionsFor(question);
 const current=draft.index+1;
 const section=(question.section&&copy.sections[question.section as keyof typeof copy.sections])||'Investor DNA';
 const last=draft.index===questions.length-1;

 return <div className="assessment-card question-shell" dir={direction} lang={locale}>
  <div className="question-header">
   <div>
    <div className="eyebrow">{section}</div>
    <div className="question-count">{copy.question} {current} / {questions.length}</div>
   </div>
   <div className="question-percent">{Math.round((current/questions.length)*100)}%</div>
  </div>

  <progress aria-label="Assessment progress" max={questions.length} value={current}/>
  <h1 className="question-title">{question.prompt}</h1>

  <div className="question-options" role="group" aria-label="Answer choices">
   {options.map(option=><button
    aria-pressed={chosen===option.value}
    className={'option '+(chosen===option.value?'active':'')}
    key={option.value}
    disabled={busy}
    onClick={()=>onPersist({
     ...draft,
     answers:{...draft.answers,[question.question_id]:option.value}
    })}
   >
    <span>{option.label}</span>
   </button>)}
  </div>

  <div className="question-actions">
   <button
    className="btn"
    disabled={busy||draft.index===0}
    onClick={()=>onPersist({...draft,index:draft.index-1})}
   >{copy.back}</button>

   {last
    ? <button className="btn primary" disabled={busy||chosen===undefined} onClick={onFinish}>
       {busy?copy.calculating:copy.result}
      </button>
    : <button
       className="btn primary"
       disabled={busy||chosen===undefined}
       onClick={()=>onPersist({...draft,index:draft.index+1})}
      >{copy.next}</button>}
  </div>

  <p className="question-hint">{copy.hint}</p>
  {warning&&<p className="muted fine">{warning}</p>}
  {error&&<p role="alert" className="notice">{error}</p>}
 </div>;
}

function RecoveryError({locale}:{locale:AssessmentLocale}){
 const copy=ASSESSMENT_COPY[locale];
 return <div className="assessment-card">
  <div className="eyebrow">{copy.retryTitle}</div>
  <h1>{copy.retryBody}</h1>
  <div className="actions">
   <button className="btn primary" onClick={()=>location.reload()}>{copy.retry}</button>
   <button className="btn" onClick={()=>{clearDraft();location.reload()}}>{copy.fresh}</button>
  </div>
 </div>;
}
