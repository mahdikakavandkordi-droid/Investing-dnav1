"use client";

import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase,pilot} from "@/lib/supabase";
import {
 answerRows,
 normalizePersonalization,
 optionsFor,
 readDraft,
 writeDraft,
 writeEphemeralResult,
 clearDraft
} from "@/lib/dna";
import type {Draft,Question,Submission} from "@/lib/dna";
import {ASSESSMENT_COPY} from "@/lib/assessment-copy";
import type {AssessmentCohort,AssessmentLocale} from "@/lib/assessment-copy";
import {DnaJourneyVisual} from "@/components/DnaJourneyVisual";

const COGNITIVE_ACCESS_KEY='investing-dna:cognitive-access:v1';
const LANGUAGE_KEY='investing-dna:language';

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

 useEffect(()=>{
  let active=true;
  (async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   try{
    const url=new URL(location.href);
    if(url.searchParams.get('fresh')==='1'){
     clearDraft();
     url.searchParams.delete('fresh');
     history.replaceState(history.state,'',url.pathname+(url.searchParams.size?`?${url.searchParams.toString()}`:''));
    }
   }catch{}
   const saved=readDraft(session?.user.id||null);
   if(!active)return;
   if(saved?.result){router.replace('/dna/result');return;}
   if(!saved)return;
   if(saved.session.language_code)setLocale(saved.session.language_code);
   const data=await pilot<{questions:Question[]}>('questionnaire',saved.session);
   if(!active)return;
   if(!data.questions?.length)throw new Error('No questions are available.');
   const restored={...saved,answers:normalizeAnswers(saved.answers,data.questions)};
   setQuestions(data.questions);
   persist(restored);
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
  if(!writeDraft(next))setWarning("This browser cannot keep your progress after closing the page. Keep this page open until you finish.");
 }

 async function start(){
  if(lock.current)return;
  lock.current=true;setBusy(true);setError('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   let cohortAccessCode:string|undefined;
   if(cohort==='COGNITIVE_V1_10'){
    cohortAccessCode=sessionStorage.getItem(COGNITIVE_ACCESS_KEY)?.trim()||undefined;
    if(!cohortAccessCode)throw new Error('This research session requires a moderator invite code. Start from the cognitive research entry page.');
   }
   const assessmentSession=await pilot<Draft['session']>('start',{
    cohort_code:cohort,
    language_code:locale,
    consent_version:`${cohort==='COGNITIVE_V1_10'?'cognitive':'prepilot'}-v1.10-${locale}`,
    ...(cohortAccessCode?{cohort_access_code:cohortAccessCode}:{})
   });
   if(cohort==='COGNITIVE_V1_10')sessionStorage.removeItem(COGNITIVE_ACCESS_KEY);
   const next:Draft={version:1,createdAt:Date.now(),ownerId:session?.user.id||null,session:assessmentSession,answers:{},index:0};
   persist(next);
   const data=await pilot<{questions:Question[]}>('questionnaire',assessmentSession);
   if(!data.questions?.length)throw new Error('No questions are available. Please try again later.');
   setQuestions(data.questions);
  }catch(e){setError(e instanceof Error?e.message:'Unable to start.');}
  finally{lock.current=false;setBusy(false);}
 }

 async function finish(){
  if(!draft||lock.current)return;
  const personalization=normalizePersonalization(draft.personalization);
  if(!personalization){setError('Add your first name and age to personalize your report.');return;}
  lock.current=true;setBusy(true);setError('');
  try{
   const complete=questions.every(question=>hasAnswer(question,draft.answers[question.question_id]));
   if(!complete)throw new Error('Please answer every question before submitting.');
   const normalized={...draft,personalization,answers:normalizeAnswers(draft.answers,questions)};
   persist(normalized);
   await pilot('save_answers',{...normalized.session,answers:answerRows(normalized.answers)});
   const result=await pilot<Submission>('submit',normalized.session);
   if(!result.result)throw new Error('The result is not available yet.');
   const completed={...normalized,result};
   setDraft(completed);
   writeEphemeralResult(completed);
   router.push('/dna/result');
  }catch(e){setError(e instanceof Error?e.message:'Unable to submit.');}
  finally{lock.current=false;setBusy(false);}
 }

 if(loading)return <AssessmentShell><div className="assessment-card assessment-loading"><h1>{copy.restore}</h1></div></AssessmentShell>;
 if(!draft)return <AssessmentShell><AssessmentIntro locale={locale} cohort={cohort} busy={busy} error={error} onLocale={changeLocale} onStart={()=>void start()}/></AssessmentShell>;

 if(questions.length&&draft.index===questions.length){
  return <AssessmentShell>
   <PersonalizationStep
    draft={draft}
    total={questions.length}
    busy={busy}
    error={error}
    onPersist={persist}
    onBack={()=>persist({...draft,index:Math.max(0,questions.length-1)})}
    onFinish={()=>void finish()}
   />
  </AssessmentShell>;
 }

 const question=questions[draft.index];
 if(!question)return <AssessmentShell><RecoveryError locale={locale}/></AssessmentShell>;
 return <AssessmentShell>
  <QuestionStep locale={locale} cohort={cohort} draft={draft} questions={questions} question={question} busy={busy} warning={warning} error={error} onPersist={persist}/>
 </AssessmentShell>;
}

function AssessmentShell({children}:{children:React.ReactNode}){
 return <main className="assessment-page assessment-page-v2"><div className="container assessment-container">{children}</div></main>;
}

function AssessmentIntro({locale,cohort,busy,error,onLocale,onStart}:{locale:AssessmentLocale;cohort:AssessmentCohort;busy:boolean;error:string;onLocale:(value:AssessmentLocale)=>void;onStart:()=>void;}){
 const copy=ASSESSMENT_COPY[locale];
 const direction=locale==='fa'?'rtl':'ltr';
 const cognitive=cohort==='COGNITIVE_V1_10';
 return <div className="assessment-card assessment-intro assessment-intro-v2" dir={direction} lang={locale}>
  <div className="assessment-intro-top"><div><div className="eyebrow">{copy.eyebrow}</div>{cognitive&&<div className="pill">Cognitive research session · v1.10</div>}</div>
   <label className="language-picker"><span>{copy.language}</span><select value={locale} onChange={event=>onLocale(event.target.value as AssessmentLocale)} aria-label={copy.language}><option value="en">English</option><option value="fr">Français</option><option value="fa">فارسی</option></select></label>
  </div>
  <h1>{copy.title}</h1><p className="assessment-lede">{copy.lede}</p>
  <div className="assessment-meta" aria-label="Assessment details"><span>{copy.questions}</span><span>{copy.guest}</span><span>{copy.save}</span></div>
  <AssessmentDimensionsVisual copy={copy}/>
  <div className="assessment-principle"><span className="principle-mark">✦</span><div><p className="principle-title">{copy.principle}</p><p>{copy.principleBody}</p></div></div>
  <div className="assessment-intro-actions">
   <button className="btn primary assessment-start" disabled={busy} onClick={onStart}>{busy?copy.starting:copy.start}</button>
   <Link className="btn assessment-methodology-link" href="/research/investor-dna">{copy.methodology}</Link>
  </div>
  <p className="muted fine assessment-account-note">No account is needed. If the result is useful, you can choose to save it after you see it.</p>
  <p className="muted fine assessment-consent">{copy.consent}</p>
  {cognitive&&<p className="notice">Research session: answer naturally. Your moderator may ask what you thought a question meant after you finish.</p>}
  {error&&<p role="alert" className="notice">{error}</p>}
 </div>;
}

function AssessmentDimensionsVisual({copy}:{copy:(typeof ASSESSMENT_COPY)[AssessmentLocale]}){
 const dimensions=[
  {key:'risk_tolerance',count:10,mark:'↕'},
  {key:'behavioral_dna',count:10,mark:'◇'},
  {key:'risk_capacity',count:5,mark:'▥'},
  {key:'investment_experience',count:3,mark:'○'}
 ] as const;
 return <section className="assessment-dimensions-preview" aria-label={copy.measureTitle}>
  <div className="assessment-dimensions-head">
   <div><span>{copy.measureTitle}</span><p>{copy.measureNote}</p></div>
   <div className="assessment-dna-core" aria-hidden="true"><b>DNA</b><small>28</small></div>
  </div>
  <div className="assessment-dimension-map">
   {dimensions.map(item=><div className={'assessment-dimension-node dimension-'+item.key} key={item.key}>
    <span className="dimension-mark" aria-hidden="true">{item.mark}</span>
    <div><strong>{copy.sections[item.key]}</strong><small>{item.count} questions</small></div>
   </div>)}
  </div>
 </section>;
}

function QuestionStep({locale,cohort,draft,questions,question,busy,warning,error,onPersist}:{locale:AssessmentLocale;cohort:AssessmentCohort;draft:Draft;questions:Question[];question:Question;busy:boolean;warning:string;error:string;onPersist:(draft:Draft)=>void;}){
 const copy=ASSESSMENT_COPY[locale];
 const direction=locale==='fa'?'rtl':'ltr';
 const chosen=draft.answers[question.question_id];
 const options=optionsFor(question);
 const current=draft.index+1;
 const last=draft.index===questions.length-1;
 const researchCode=cohort==='COGNITIVE_V1_10'?draft.session.anonymous_code:null;
 const multi=question.question_type==='multi_choice';
 const chosenValues=multi?(Array.isArray(chosen)?chosen:typeof chosen==='string'&&chosen?[chosen]:[]):[];
 const answered=hasAnswer(question,chosen);
 function choose(value:string){
  if(!multi){onPersist({...draft,answers:{...draft.answers,[question.question_id]:value}});return;}
  let next:string[];
  if(value==='none')next=['none'];
  else{const withoutNone=chosenValues.filter(item=>item!=='none');next=withoutNone.includes(value)?withoutNone.filter(item=>item!==value):[...withoutNone,value];}
  const answers={...draft.answers};if(next.length)answers[question.question_id]=next;else delete answers[question.question_id];onPersist({...draft,answers});
 }
 return <div className="assessment-question-layout" dir={direction} lang={locale}>
  <div className="assessment-card question-shell question-shell-v2">
   <div className="question-header question-header-v2"><div><div className="question-count">{copy.question} {current} of {questions.length}</div>{researchCode&&<div className="fine muted question-research-code">Research code: <strong>{researchCode}</strong></div>}</div><div className="question-percent">{Math.round((current/questions.length)*100)}%</div></div>
   <progress aria-label="Assessment progress" max={questions.length} value={current}/><h1 className="question-title">{question.prompt}</h1>{multi&&<p className="question-hint question-hint-top">Select all that apply.</p>}
   <div className="question-options" role="group" aria-label="Answer choices">{options.map(option=>{const selected=multi?chosenValues.includes(option.value):chosen===option.value;return <button aria-pressed={selected} className={'option '+(selected?'active':'')} key={option.value} disabled={busy} onClick={()=>choose(option.value)}><span className="option-indicator" aria-hidden="true"/><span>{option.label}</span></button>})}</div>
   <div className="question-actions"><button className="btn" disabled={busy||draft.index===0} onClick={()=>onPersist({...draft,index:draft.index-1})}>{copy.back}</button><button className="btn primary" disabled={busy||!answered} onClick={()=>onPersist({...draft,index:draft.index+1})}>{last?'Continue':copy.next} <span aria-hidden="true">→</span></button></div>
   {warning&&<p className="muted fine">{warning}</p>}{error&&<p role="alert" className="notice">{error}</p>}
  </div><DnaJourneyVisual current={current} total={questions.length}/>
 </div>;
}

function PersonalizationStep({draft,total,busy,error,onPersist,onBack,onFinish}:{draft:Draft;total:number;busy:boolean;error:string;onPersist:(draft:Draft)=>void;onBack:()=>void;onFinish:()=>void;}){
 const personal=draft.personalization;
 const firstName=personal?.first_name||'';
 const age=personal?.age?String(personal.age):'';
 const ageNumber=Number(age);
 const ready=!!firstName.trim()&&Number.isInteger(ageNumber)&&ageNumber>=18&&ageNumber<=100;
 function updateFirstName(value:string){
  const currentAge=personal?.age||0;
  onPersist({...draft,personalization:{first_name:value,age:currentAge,last_name:personal?.last_name,phone:personal?.phone}});
 }
 function updateAge(value:string){
  const numeric=Number(value);
  onPersist({...draft,personalization:{first_name:firstName,age:Number.isFinite(numeric)?numeric:0,last_name:personal?.last_name,phone:personal?.phone}});
 }
 return <div className="personalization-stage">
  <section className="assessment-card personalization-card">
   <div className="personalization-progress" aria-label="Assessment complete"><span>1</span><i/><strong>{total}</strong><i className="complete"/><b>✓</b></div>
   <div className="eyebrow">Assessment complete</div>
   <h1>Almost there.</h1>
   <p className="assessment-lede">Add your first name and age so your Investor DNA report feels like yours. These details do not change your assessment score.</p>
   <div className="personalization-fields">
    <label><span>First name</span><input autoComplete="given-name" maxLength={60} value={firstName} onChange={event=>updateFirstName(event.target.value)} placeholder="Your first name"/></label>
    <label><span>Age</span><input type="number" inputMode="numeric" min="18" max="100" value={age==='0'?'':age} onChange={event=>updateAge(event.target.value)} placeholder="Age"/></label>
   </div>
   <div className="personalization-note"><span aria-hidden="true">⌁</span><p>Your name and age personalize the report. Creating an account remains optional after you see your result.</p></div>
   <div className="question-actions"><button className="btn" disabled={busy} onClick={onBack}>Back</button><button className="btn primary" disabled={busy||!ready} onClick={onFinish}>{busy?'Building your DNA…':'See my Investor DNA'} <span aria-hidden="true">→</span></button></div>
   {error&&<p role="alert" className="notice">{error}</p>}
  </section>
  <aside className="personalization-scenery approved-illustration-panel" aria-hidden="true"><img src="/illustrations/personalized-investor-dna-report.webp" alt="" className="approved-side-illustration"/></aside>
 </div>;
}

function hasAnswer(question:Question,value:Draft['answers'][string]){
 if(question.question_type==='multi_choice')return Array.isArray(value)?value.length>0:typeof value==='string'&&value.length>0;
 return typeof value==='string'&&value.length>0;
}
function normalizeAnswers(answers:Draft['answers'],questions:Question[]):Draft['answers']{const next={...answers};for(const question of questions){if(question.question_type!=='multi_choice')continue;const value=next[question.question_id];if(typeof value==='string'&&value)next[question.question_id]=[value];}return next;}
function RecoveryError({locale}:{locale:AssessmentLocale}){const copy=ASSESSMENT_COPY[locale];return <div className="assessment-card assessment-recovery"><div className="eyebrow">{copy.retryTitle}</div><h1>{copy.retryBody}</h1><div className="actions"><button className="btn primary" onClick={()=>location.reload()}>{copy.retry}</button><button className="btn" onClick={()=>{clearDraft();location.reload()}}>{copy.fresh}</button></div></div>}
