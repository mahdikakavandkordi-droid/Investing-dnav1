'use client';
import { useEffect, useState } from "react";

const FN = "https://bxjjannguzzzqsamnhem.supabase.co/functions/v1/investing-dna-pilot";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SESSION_KEY = "investing_dna_session_v1";

async function api(action, body={}) {
  const r=await fetch(FN,{
    method:"POST",
    headers:{"Content-Type":"application/json",...(ANON?{"apikey":ANON,"Authorization":`Bearer ${ANON}`}:{})},
    body:JSON.stringify({action,...body})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||data.message||"Request failed");
  return data;
}

/* Supabase can return options as an array, {options:[...]}, or a keyed JSON object.
   Normalize all of those shapes so the UI never renders an empty answer area. */
function normalizeOptions(raw){
  if(Array.isArray(raw)) return raw;
  if(raw && Array.isArray(raw.options)) return raw.options;
  if(raw && typeof raw==="object"){
    return Object.entries(raw).map(([key,value])=>{
      if(value && typeof value==="object"){
        return {...value,key:value.key??key,value:value.value??key,
          label_en:value.label_en??value.label??value.text_en??value.text??String(key)};
      }
      return {key,value:key,label_en:String(value)};
    });
  }
  return [];
}

function optionValue(o,i){
  if(o && typeof o==="object") return o.value??o.key??o.id??i;
  return o;
}
function optionLabel(o,i){
  if(o && typeof o==="object")
    return o.label_en??o.label??o.text_en??o.text??o.label_fa??String(optionValue(o,i));
  return String(o);
}

export default function Home(){
  const [screen,setScreen]=useState("landing"),[session,setSession]=useState(null);
  const [questions,setQuestions]=useState([]),[answers,setAnswers]=useState({});
  const [idx,setIdx]=useState(0),[result,setResult]=useState(null),[error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    try{
      const s=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
      if(s?.session_token&&s?.assessment_id) setSession(s);
    }catch{}
  },[]);

  function storeSession(d){
    if(!d?.session_token||!d?.assessment_id)
      throw new Error("Assessment session could not be created. Please try again.");
    const s={...d};
    setSession(s);
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(s))}catch{}
    return s;
  }

  function clearSession(){
    setSession(null);setQuestions([]);setAnswers({});setIdx(0);
    try{localStorage.removeItem(SESSION_KEY)}catch{}
  }

  async function start(){
    setBusy(true);setError("");
    try{
      clearSession();
      const d=await api("start");
      const s=storeSession(d);
      const q=await api("questionnaire",{
        assessment_id:s.assessment_id,
        session_token:s.session_token
      });
      const list=q.questions||q;
      if(!Array.isArray(list)||!list.length) throw new Error("Questionnaire could not be loaded. Please try again.");
      setQuestions(list);
      setScreen("quiz");
    }catch(e){clearSession();setError(e.message||"Unable to start assessment.")}
    finally{setBusy(false)}
  }

  async function save(qid,value){
    if(!session?.assessment_id||!session?.session_token){
      setError("Your assessment session expired. Please restart the assessment.");
      return;
    }
    setAnswers(a=>({...a,[qid]:value}));setError("");
    try{
      await api("save_answers",{
        assessment_id:session.assessment_id,
        session_token:session.session_token,
        answers:[{question_id:qid,answer_value:{value}}]
      });
    }catch(e){setError(e.message||"Unable to save your answer.")}
  }

  async function submit(){
    if(!session?.assessment_id||!session?.session_token){
      setError("Your assessment session expired. Please restart the assessment.");
      return;
    }
    setBusy(true);setError("");
    try{
      const d=await api("submit",{
        assessment_id:session.assessment_id,
        session_token:session.session_token
      });
      setResult(d);setScreen("result");
    }catch(e){setError(e.message||"Unable to generate your result.")}
    finally{setBusy(false)}
  }

  const Brand=({compact=false})=><img className={compact?"brand-logo compact":"brand-logo"} style={{width:compact?"80px":"180px",maxWidth:"180px",height:"auto",display:"block",objectFit:"contain"}} src="/logo.png" alt="Investing DNA"/>;

  if(screen==="landing") return <main className="shell"><section className="hero">
    <Brand/>
    <div className="eyebrow">INVESTING DNA</div><h1>Know your investor.<br/><span>Before you invest.</span></h1>
    <p className="lead">A deeper look at how you respond to risk, uncertainty, opportunity and pressure.</p>
    <button onClick={()=>setScreen("consent")} className="primary">Discover My Investor DNA <b>→</b></button>
    <div className="mini"><span>36 questions</span><span>~7 minutes</span><span>Personal report</span></div>
    <p className="disclaimer">Educational assessment only. Not investment, financial or psychological advice.</p>
  </section></main>;

  if(screen==="consent") return <main className="shell"><section className="card narrow">
    <Brand compact/><div className="eyebrow">BEFORE WE BEGIN</div><h2>Your answers shape your DNA.</h2>
    <p>There are 36 questions. Answer honestly rather than choosing what you think a “good investor” should choose.</p>
    <div className="notice"><strong>Privacy first.</strong><br/>Your assessment is used to generate your Investor DNA report.</div>
    {error&&<div className="error">{error}</div>}
    <button className="primary" disabled={busy} onClick={start}>{busy?"Starting…":"I understand — Start Assessment →"}</button>
    <button className="ghost" onClick={()=>{setError("");setScreen("landing")}}>Back</button>
  </section></main>;

  if(screen==="quiz"){
    const q=questions[idx],pct=Math.round(((idx+1)/questions.length)*100),value=q&&answers[q.question_id];
    if(!q) return <main className="shell"><div className="card">Loading questionnaire…</div></main>;
    const opts=normalizeOptions(q.options);
    return <main className="shell"><section className="quiz">
      <header><div><Brand compact/><div className="eyebrow">INVESTOR DNA</div></div><div className="count">{idx+1} / {questions.length}</div></header>
      <div className="progress"><i style={{width:`${pct}%`}}/></div>
      <div className="qtype">{q.construct_role==="tolerance"?"RISK TOLERANCE":q.construct_role==="capacity"?"RISK CAPACITY":"BEHAVIORAL DNA"}</div>
      <h2>{q.prompt_en||q.prompt||"Question"}</h2>
      {q.question_type==="scale" ? (
        <div className="scale-wrap">
          <div className="scale-value">{value==null ? "—" : value}</div>
          <input
            className="scale-input"
            type="range"
            min={Number(q.scoring?.scale?.min ?? 0)}
            max={Number(q.scoring?.scale?.max ?? 10)}
            step="1"
            value={value==null ? Number(q.scoring?.scale?.min ?? 0) : Number(value)}
            onChange={e=>save(q.question_id,Number(e.target.value))}
          />
          <div className="scale-labels">
            <span>{q.scoring?.scale?.min ?? 0}</span>
            <span>{q.scoring?.scale?.max ?? 10}</span>
          </div>
          <p className="scale-hint">0 = Not at all confident &nbsp; • &nbsp; 10 = Extremely confident</p>
        </div>
      ) : (
        <div className="options">
          {opts.map((o,i)=>{
            const ov=optionValue(o,i),label=optionLabel(o,i);
            return <button key={i} className={String(value)===String(ov)?"option selected":"option"} onClick={()=>save(q.question_id,ov)}>
              <span className="radio">{String(value)===String(ov)?"✓":""}</span>{label}
            </button>
          })}
        </div>
      )}
      {q.question_type!=="scale"&&!opts.length&&<div className="error">No answer options were returned for this question.</div>}
      {error&&<div className="error">{error}</div>}
      <footer><button className="ghost" disabled={idx===0} onClick={()=>setIdx(idx-1)}>← Back</button>
      {idx<questions.length-1?<button className="primary small" disabled={value==null} onClick={()=>setIdx(idx+1)}>Next →</button>:
      <button className="primary small" disabled={value==null||busy} onClick={submit}>{busy?"Analyzing…":"Reveal My DNA →"}</button>}</footer>
    </section></main>
  }

  const r=result?.result||result||{},f=result?.fingerprint||{},n=result?.narrative||{};
  return <main className="shell"><section className="result">
    <Brand compact/><div className="eyebrow">YOUR INVESTOR DNA</div><div className="dna-code">{f.fingerprint_code||"DNA"}</div>
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
