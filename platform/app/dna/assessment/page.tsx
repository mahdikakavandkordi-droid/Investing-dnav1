"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase,pilot} from "@/lib/supabase";
import {Question,Draft,Submission,answerRows,optionsFor,readDraft,writeDraft,clearDraft} from "@/lib/dna";
export default function Assessment() {
  const router=useRouter();
  const [draft,setDraft]=useState<Draft|null>(null),[questions,setQuestions]=useState<Question[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[warning,setWarning]=useState("");
  const lock=useRef(false);
  useEffect(()=>{let active=true;
    (async()=>{if(!supabase) throw new Error("The assessment service is not configured yet.");
      const {data:{session}}=await supabase.auth.getSession();
      const saved=readDraft(session?.user.id || null);
      if(!active)return;
      if(saved?.result){router.replace('/dna/result');return;}
      if(saved){setDraft(saved);const data=await pilot<{questions:Question[]}>('questionnaire',saved.session);if(active){setQuestions(data.questions);if(!data.questions?.length)throw new Error('No questions are available.');}}
    })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false;};
  },[router]);
  function persist(next:Draft){setDraft(next);if(!writeDraft(next))setWarning("This browser cannot keep your progress after closing the page. Keep this page open until you finish.");}
  async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try {if(!supabase)throw new Error('The assessment service is not configured yet.');
      const {data:{session}}=await supabase.auth.getSession();
      const s=await pilot<Draft['session']>('start',{cohort_code:'PILOT_V1_3',language_code:'en',consent_version:'pilot-en'});
      const next:Draft={version:1,createdAt:Date.now(),ownerId:session?.user.id||null,session:s,answers:{},index:0};persist(next);
      const data=await pilot<{questions:Question[]}>('questionnaire',s);
      if(!data.questions?.length)throw new Error('No questions are available. Please try again later.');setQuestions(data.questions);
    }catch(e){setError(e instanceof Error?e.message:'Unable to start.');}finally{lock.current=false;setBusy(false);}}
  async function finish(){if(!draft || lock.current)return;lock.current=true;setBusy(true);setError('');
    try {if(!questions.every(q=>draft.answers[q.question_id]!==undefined))throw new Error('Please answer every question before submitting.');
      await pilot('save_answers',{...draft.session,answers:answerRows(draft.answers)});
      const result=await pilot<Submission>('submit',draft.session);
      if(!result.result)throw new Error('The result is not available yet.');
      persist({...draft,result});router.push('/dna/result');
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit.');}finally{lock.current=false;setBusy(false);}}
  const q=questions[draft?.index||0]; const chosen=q&&draft?.answers[q.question_id];
  return <section className="section"><div className="container narrow"><div className="card question">
    {loading?<h1>Restoring your progress…</h1>:!draft?<><div className="eyebrow">Investing DNA</div><h1>Get to know your investor self.</h1><p>Answer questions about how you respond to uncertainty and your financial circumstances.</p><p className="muted">You can take part without an account. Your responses are sent to Investing DNA for assessment. Progress is kept on this browser for up to 24 hours, and you choose whether to link your result to an account.</p><button className="btn primary" disabled={busy} onClick={start}>{busy?'Starting…':'Agree and start assessment'}</button></>:q?<>
      <div className="eyebrow">Investor DNA assessment</div><p className="muted">Question {draft.index+1} of {questions.length}</p><progress aria-label="Assessment progress" max={questions.length} value={draft.index+1}/>
      <h1 className="question-title">{q.prompt}</h1><div className={q.question_type==='scale'?'scale-options':''} role="group" aria-label="Answer choices">{optionsFor(q).map(o=><button aria-pressed={chosen===o.value} className={'option '+(chosen===o.value?'active':'')} key={o.value} disabled={busy} onClick={()=>persist({...draft,answers:{...draft.answers,[q.question_id]:o.value}})}>{o.label}</button>)}</div>
      <div className="actions"><button className="btn" disabled={busy||draft.index===0} onClick={()=>persist({...draft,index:draft.index-1})}>Back</button>{draft.index<questions.length-1?<button className="btn primary" disabled={busy||chosen===undefined} onClick={()=>persist({...draft,index:draft.index+1})}>Next</button>:<button className="btn primary" disabled={busy||chosen===undefined} onClick={finish}>{busy?'Calculating…':'See my DNA'}</button>}</div>
      <p className="muted fine">You can leave and resume on this browser within 24 hours.</p>
    </>:<><h1>Unable to load your assessment</h1><button className="btn" onClick={()=>location.reload()}>Retry loading</button><button className="btn" onClick={()=>{clearDraft();setDraft(null);setError('')}}>Discard this draft</button></>}
    {error&&<p role="alert" className="notice">{error}</p>}{warning&&<p role="status" className="notice">{warning}</p>}<div className="actions"><Link href="/profile">My profile</Link></div>
  </div></div></section>;
}
