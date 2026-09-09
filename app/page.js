'use client';
import { useEffect, useState } from "react";

const FN = "https://bxjjannguzzzqsamnhem.supabase.co/functions/v1/investing-dna-pilot";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SESSION_KEY = "investing_dna_session_v1";

async function api(action, body={}) {
  const r = await fetch(FN, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      ...(ANON ? {"apikey":ANON,"Authorization":`Bearer ${ANON}`} : {})
    },
    body:JSON.stringify({action,...body})
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

export default function Home(){
  const [screen,setScreen]=useState("landing");
  const [session,setSession]=useState(null);
  const [questions,setQuestions]=useState([]);
  const [answers,setAnswers]=useState({});
  const [idx,setIdx]=useState(0);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  // Keep the session across React re-renders and accidental page refreshes.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.session_token && parsed?.assessment_id) setSession(parsed);
      }
    } catch {}
  }, []);

  function persistSession(data) {
    const normalized = {
      session_token: data?.session_token,
      assessment_id: data?.assessment_id,
      participant_id: data?.participant_id,
      questionnaire_version: data?.questionnaire_version,
      model_version: data?.model_version,
      scoring_version: data?.scoring_version
    };
    if (!normalized.session_token || !normalized.assessment_id) {
      throw new Error("Assessment session could not be created. Please try again.");
    }
    setSession(normalized);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(normalized)); } catch {}
    return normalized;
  }

  function clearSession() {
    setSession(null);
    setQuestions([]);
    setAnswers({});
    setIdx(0);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }

  async function start(){
    setBusy(true); setError("");
    try {
      clearSession();
      const d = await api("start");
      const s = persistSession(d);

      // The questionnaire endpoint requires BOTH identifiers.
      const q = await api("questionnaire", {
        assessment_id: s.assessment_id,
        session_token: s.session_token
      });

      const list = q.questions || q;
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error("Questionnaire could not be loaded. Please try again.");
      }
      setQuestions(list);
      setScreen("quiz");
    } catch(e) {
      clearSession();
      setError(e.message || "Unable to start assessment.");
    } finally {
      setBusy(false);
    }
  }

  async function save(qid,value){
    if(!session?.session_token || !session?.assessment_id) {
      setError("Your assessment session expired. Please restart the assessment.");
      setScreen("consent");
      return;
    }

    setAnswers(a=>({...a,[qid]:value}));
    setError("");

    try {
      await api("save_answers", {
        assessment_id: session.assessment_id,
        session_token: session.session_token,
        answers:[{question_id:qid,answer_value:value}]
      });
    } catch(e) {
      setError(e.message || "Unable to save your answer.");
    }
  }

  async function submit(){
    if(!session?.session_token || !session?.assessment_id) {
      setError("Your assessment session expired. Please restart the assessment.");
      setScreen("consent");
      return;
    }

    setBusy(true); setError("");
    try {
      const d = await api("submit", {
        assessment_id: session.assessment_id,
        session_token: session.session_token
      });
      setResult(d);
      setScreen("result");
    } catch(e) {
      setError(e.message || "Unable to generate your result.");
    } finally {
      setBusy(false);
    }
  }

  if(screen==="landing") return <main className="shell"><section className="hero">
    <div className="eyebrow">INVESTING DNA</div><h1>Know your investor.<br/><span>Before you invest.</span></h1>
    <p className="lead">A deeper look at how you respond to risk, uncertainty, opportunity and pressure.</p>
    <button onClick={()=>setScreen("consent")} className="primary">Discover My Investor DNA <b>→</b></button>
    <div className="mini"><span>36 questions</span><span>~7 minutes</span><span>Personal report</span></div>
    <p className="disclaimer">Educational assessment only. Not investment, financial or psychological advice.</p>
  </section></main>;

  if(screen==="consent") return <main className="shell"><section className="card narrow">
    <div className="eyebrow">BEFORE WE BEGIN</div><h2>Your answers shape your DNA.</h2>
    <p>There are 36 questions. Answer honestly rather than choosing what you think a “good investor” should choose.</p>
    <div className="notice"><strong>Privacy first.</strong><br/>Your assessment is used to generate your Investor DNA report.</div>
    {error&&<div className="error">{error}</div>}
    <button className="primary" disabled={busy} onClick={start}>{busy?"Starting…":"I understand — Start Assessment →"}</button>
    <button className="ghost" onClick={()=>{setError("");setScreen("landing")}}>Back</button>
  </section></main>;

  if(screen==="quiz"){
    const q=questions[idx], pct=Math.round(((idx+1)/questions.length)*100), value=q && answers[q.question_id];
    if(!q) return <main className="shell"><div className="card">Loading questionnaire…</div></main>;
    const opts=Array.isArray(q.options)?q.options:(q.options?.options||[]);
    return <main className="shell"><section className="quiz">
      <header><div className="eyebrow">INVESTOR DNA</div><div className="count">{idx+1} / {questions.length}</div></header>
      <div className="progress"><i style={{width:`${pct}%`}}/></div>
      <div className="qtype">{q.construct_role==="tolerance"?"RISK TOLERANCE":q.construct_role==="capacity"?"RISK CAPACITY":"BEHAVIORAL DNA"}</div>
      <h2>{q.prompt_en || q.prompt || "Question"}</h2>
      <div className="options">{opts.map((o,i)=>{
        const ov=typeof o==="object"?(o.value??o.key??i):o;
        const label=typeof o==="object"?(o.label_en??o.label??o.text_en??String(ov)):o;
        return <button key={i} className={String(value)===String(ov)?"option selected":"option"} onClick={()=>save(q.question_id,ov)}>
          <span className="radio">{String(value)===String(ov)?"✓":""}</span>{label}
        </button>
      })}</div>
      {error&&<div className="error">{error}</div>}
      <footer><button className="ghost" disabled={idx===0} onClick={()=>setIdx(idx-1)}>← Back</button>
      {idx<questions.length-1?<button className="primary small" disabled={value==null} onClick={()=>setIdx(idx+1)}>Next →</button>:
      <button className="primary small" disabled={value==null||busy} onClick={submit}>{busy?"Analyzing…":"Reveal My DNA →"}</button>}</footer>
    </section></main>
  }

  const r=result?.result||result||{}, f=result?.fingerprint||{}, n=result?.narrative||{};
  return <main className="shell"><section className="result">
    <div className="eyebrow">YOUR INVESTOR DNA</div><div className="dna-code">{f.fingerprint_code||"DNA"}</div>
    <h1>{r.archetype||"Investor"}</h1>
    <p className="tagline">{f.decision_style||"Your investment style, decoded."}</p>
    <div className="metrics"><div><b>{Math.round(r.risk_tolerance||0)}</b><small>Risk Tolerance</small></div><div><b>{Math.round(r.risk_capacity||0)}</b><small>Risk Capacity</small></div></div>
    <div className="grid"><article><small>DECISION STYLE</small><h3>{f.decision_style||"—"}</h3></article><article><small>UNDER PRESSURE</small><h3>{f.pressure_style||"—"}</h3></article></div>
    <article className="story"><small>YOUR INVESTOR CHARACTER</small><p>{n.character||n.summary||"Your Investor DNA report is ready."}</p></article>
    <article className="story"><small>WHAT TO WATCH</small><p>{(f.watchouts||[]).join(" • ")||n.blind_spot||"Stay aware of your decision patterns."}</p></article>
    <p className="disclaimer">This assessment is educational and is not investment, financial or psychological advice.</p>
    <button className="primary" onClick={()=>window.print()}>Save / Print Report ↗</button>
  </section></main>
}
