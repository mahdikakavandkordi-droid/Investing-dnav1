"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase,pilot} from "@/lib/supabase";
import {Question,Draft,Submission,answerRows,optionsFor,readDraft,writeDraft,clearDraft,sectionLabel} from "@/lib/dna";

export default function Assessment() {
  const router=useRouter();
  const [draft,setDraft]=useState<Draft|null>(null),[questions,setQuestions]=useState<Question[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[warning,setWarning]=useState("");
  const lock=useRef(false);

  useEffect(()=>{let active=true;
    (async()=>{
      if(!supabase) throw new Error("The assessment service is not configured yet.");
      const {data:{session}}=await supabase.auth.getSession();
      const saved=readDraft(session?.user.id || null);
      if(!active)return;
      if(saved?.result){router.replace('/dna/result');return;}
      if(saved){
        setDraft(saved);
        const data=await pilot<{questions:Question[]}>('questionnaire',saved.session);
        if(active){setQuestions(data.questions);if(!data.questions?.length)throw new Error('No questions are available.');}
      }
    })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false;};
  },[router]);

  function persist(next:Draft){
    setDraft(next);
    if(!writeDraft(next))setWarning("This browser cannot keep your progress after closing the page. Keep this page open until you finish.");
  }

  async function start(){
    if(lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {
      if(!supabase)throw new Error('The assessment service is not configured yet.');
      const {data:{session}}=await supabase.auth.getSession();
      const s=await pilot<Draft['session']>('start',{
        cohort_code:'DEV_V1_9',
        language_code:'en',
        consent_version:'prepilot-v1.9-en'
      });
      const next:Draft={version:1,createdAt:Date.now(),ownerId:session?.user.id||null,session:s,answers:{},index:0};
      persist(next);
      const data=await pilot<{questions:Question[]}>('questionnaire',s);
      if(!data.questions?.length)throw new Error('No questions are available. Please try again later.');
      setQuestions(data.questions);
    }catch(e){setError(e instanceof Error?e.message:'Unable to start.');}
    finally{lock.current=false;setBusy(false);}
  }

  async function finish(){
    if(!draft || lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {
      if(!questions.every(q=>draft.answers[q.question_id]!==undefined))throw new Error('Please answer every question before submitting.');
      await pilot('save_answers',{...draft.session,answers:answerRows(draft.answers)});
      const result=await pilot<Submission>('submit',draft.session);
      if(!result.result)throw new Error('The result is not available yet.');
      persist({...draft,result});
      router.push('/dna/result');
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit.');}
    finally{lock.current=false;setBusy(false);}
  }

  const q=questions[draft?.index||0];
  const chosen=q&&draft?.answers[q.question_id];
  const options=q?optionsFor(q):[];
  const current=(draft?.index||0)+1;

  return <main className="assessment-page"><div className="container assessment-container">
    {loading?<div className="assessment-card assessment-loading"><h1>Restoring your progress…</h1></div>:!draft?<div className="assessment-card assessment-intro">
      <div className="eyebrow">Investing DNA assessment</div>
      <h1>Understand how you invest.</h1>
      <p className="assessment-lede">A short, research-stage assessment of your risk tolerance, decision patterns, financial capacity and investing experience.</p>
      <div className="assessment-meta" aria-label="Assessment details">
        <span>28 questions</span><span>No account required</span><span>Save later if you want</span>
      </div>
      <div className="assessment-note">
        <strong>No “good investor” answers.</strong>
        <span>Choose what is closest to how you would really feel or act today.</span>
      </div>
      <button className="btn primary assessment-start" disabled={busy} onClick={start}>{busy?'Starting…':'Start assessment'}</button>
      <p className="muted fine assessment-consent">Research candidate only — not a diagnostic or investment recommendation. Your progress stays in this browser for up to 24 hours unless you choose to save it to an account.</p>
      {error&&<p role="alert" className="notice">{error}</p>}
    </div>:q?<div className="assessment-card question-shell">
      <div className="question-header"><div><div className="eyebrow">{sectionLabel(q.section)}</div><div className="question-count">Question {current} of {questions.length}</div></div><div className="question-percent">{Math.round((current/questions.length)*100)}%</div></div>
      <progress aria-label="Assessment progress" max={questions.length} value={current}/>
      <h1 className="question-title">{q.prompt}</h1>
      <div className="question-options" role="group" aria-label="Answer choices">
        {options.map(o=><button aria-pressed={chosen===o.value} className={'option '+(chosen===o.value?'active':'')} key={o.value} disabled={busy} onClick={()=>persist({...draft,answers:{...draft.answers,[q.question_id]:o.value}})}><span>{o.label}</span></button>)}
      </div>
      <div className="question-actions">
        <button className="btn" disabled={busy||draft.index===0} onClick={()=>persist({...draft,index:draft.index-1})}>Back</button>
        {draft.index<questions.length-1?<button className="btn primary" disabled={busy||chosen===undefined} onClick={()=>persist({...draft,index:draft.index+1})}>Next</button>:<button className="btn primary" disabled={busy||chosen===undefined} onClick={finish}>{busy?'Calculating…':'See my DNA'}</button>}
      </div>
      <p className="muted fine question-hint">Pick the closest answer. You can go back and change it.</p>
      {error&&<p role="alert" className="notice">{error}</p>}
      {warning&&<p role="status" className="notice">{warning}</p>}
    </div>:<div className="assessment-card"><h1>Unable to load your assessment</h1><p className="muted">Your saved draft could not be restored.</p><div className="question-actions"><button className="btn" onClick={()=>location.reload()}>Try again</button><button className="btn" onClick={()=>{clearDraft();setDraft(null);setError('')}}>Start fresh</button></div>{error&&<p role="alert" className="notice">{error}</p>}</div>}
  </div></main>;
}
