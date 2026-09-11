 'use client';
import { useEffect, useMemo, useState } from "react";

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

function normalizeOptions(raw){
  if(Array.isArray(raw)) return raw;
  if(raw && Array.isArray(raw.options)) return raw.options;
  if(raw && typeof raw==="object"){
    return Object.entries(raw).map(([key,value])=>{
      if(value && typeof value==="object")
        return {...value,key:value.key??key,value:value.value??key,label_en:value.label_en??value.label??value.text_en??value.text??String(key)};
      return {key,value:key,label_en:String(value)};
    });
  }
  return [];
}
function optionValue(o,i){ return o&&typeof o==="object" ? o.value??o.key??o.id??i : o; }
function optionLabel(o,i){ return o&&typeof o==="object" ? o.label_en??o.label??o.text_en??o.text??o.label_fa??String(optionValue(o,i)) : String(o); }
function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,Number(n)||0)); }

const traitCopy={
  overconfidence:["Overconfidence","Strong conviction can sometimes make uncertainty feel smaller than it really is."],
  recency_bias:["Recency Bias","Recent market moves may have more influence on your judgment than the longer-term picture."],
  social_influence:["Social Influence","Other investors' opinions or outcomes may influence your decisions more than you intend."],
  anchoring:["Anchoring","An early price, opinion or reference point can sometimes stay influential after new evidence appears."],
  confirmation_bias:["Confirmation Bias","You may be more likely to notice evidence that supports an existing investment view."],
  regret_sensitivity:["Regret Sensitivity","The fear of making the wrong decision can sometimes affect how quickly you act."],
  disposition_effect:["Disposition Effect","You may be tempted to treat winning and losing positions differently when deciding what to do next."],
  emotional_reactivity:["Emotional Reactivity","Strong market moves can make it harder to stay aligned with a pre-planned strategy."],
  adaptability:["Adaptability","You are willing to revise your view when meaningful new evidence changes the investment case."],
  self_confidence:["Self-Confidence","You generally trust your ability to make investment decisions."],
  financial_self_efficacy:["Financial Self-Efficacy","You feel capable of understanding and managing important financial decisions."]
};

function prettyTrait(key){
  return traitCopy[key]?.[0] || String(key||"").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());
}
function traitDescription(key){
  return traitCopy[key]?.[1] || "This trait adds context to how you approach investment decisions.";
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
    if(!d?.session_token||!d?.assessment_id) throw new Error("Assessment session could not be created. Please try again.");
    setSession(d);
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(d))}catch{}
    return d;
  }
  function clearSession(){
    setSession(null);setQuestions([]);setAnswers({});setIdx(0);
    try{localStorage.removeItem(SESSION_KEY)}catch{}
  }
  async function start(){
    setBusy(true);setError("");
    try{
      clearSession();
      const d=await api("start"),s=storeSession(d);
      const q=await api("questionnaire",{assessment_id:s.assessment_id,session_token:s.session_token});
      const list=q.questions||q;
      if(!Array.isArray(list)||!list.length) throw new Error("Questionnaire could not be loaded. Please try again.");
      setQuestions(list);setScreen("quiz");
    }catch(e){clearSession();setError(e.message||"Unable to start assessment.")}
    finally{setBusy(false)}
  }
  async function save(qid,value){
    if(!session?.assessment_id||!session?.session_token){setError("Your assessment session expired. Please restart the assessment.");return;}
    setAnswers(a=>({...a,[qid]:value}));setError("");
    try{
      await api("save_answers",{assessment_id:session.assessment_id,session_token:session.session_token,answers:[{question_id:qid,answer_value:{value}}]});
    }catch(e){setError(e.message||"Unable to save your answer.")}
  }
  async function submit(){
    if(!session?.assessment_id||!session?.session_token){setError("Your assessment session expired. Please restart the assessment.");return;}
    setBusy(true);setError("");
    try{
      const d=await api("submit",{assessment_id:session.assessment_id,session_token:session.session_token});
      setResult(d);setScreen("result");
    }catch(e){setError(e.message||"Unable to generate your result.")}
    finally{setBusy(false)}
  }

  const Brand=({compact=false})=><img className={compact?"brand-logo compact":"brand-logo"} width={compact?72:160} height={compact?40:80} src="/logo.png" alt="Investing DNA"/>;

  if(screen==="landing") return <main className="shell"><section className="hero">
    <Brand/><div className="eyebrow">INVESTING DNA · V1.2</div>
    <h1>Know your investor.<br/><span>Before you invest.</span></h1>
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
    const isScale=q.question_type==="scale";
    return <main className="shell"><section className="quiz">
      <header><div><Brand compact/><div className="eyebrow">INVESTOR DNA</div></div><div className="count">{idx+1} / {questions.length}</div></header>
      <div className="progress"><i style={{width:`${pct}%`}}/></div>
      <div className="qtype">{q.section==="risk_tolerance"?"RISK TOLERANCE":q.section==="risk_capacity"?"RISK CAPACITY":"BEHAVIORAL DNA"}</div>
      <h2>{q.prompt_en||q.prompt||"Question"}</h2>
      {isScale ? <div className="scale-wrap">
        <div className="scale-value">{value==null?"—":value}</div>
        <input className="scale-input" type="range" min="0" max="10" step="1" value={value==null?5:value} onChange={e=>save(q.question_id,Number(e.target.value))}/>
        <div className="scale-labels"><span>0</span><span>5</span><span>10</span></div>
        <p className="scale-hint">0 = Not at all &nbsp; • &nbsp; 10 = Extremely</p>
      </div> : <div className="options">
        {opts.map((o,i)=>{const ov=optionValue(o,i),label=optionLabel(o,i);const selected=String(value)===String(ov);
return <button key={i} aria-pressed={selected} className={selected?"option selected":"option"} onClick={()=>save(q.question_id,ov)}>
  <span className="radio">{selected&&<span className="radio-dot" />}</span>
  <span className="option-label">{label}</span>
  {selected&&<span className="selected-badge">Selected</span>}
</button>})}
      </div>}
      {error&&<div className="error">{error}</div>}
      <footer><button className="ghost" disabled={idx===0} onClick={()=>setIdx(idx-1)}>← Back</button>
      {idx<questions.length-1?<button className="primary small" disabled={value==null} onClick={()=>setIdx(idx+1)}>Next →</button>:
      <button className="primary small" disabled={value==null||busy} onClick={submit}>{busy?"Analyzing…":"Reveal My DNA →"}</button>}</footer>
    </section></main>
  }

  const r=result?.result||result||{},f=result?.fingerprint||{},n=result?.narrative||{};
  const tolerance=clamp(r.risk_tolerance),capacity=clamp(r.risk_capacity);
  const archetype=r.archetype||f.archetype||"INVESTOR";
  const archetypeNames={VAULT:"The Capital Protector",ANCHOR:"The Steady Builder",COOLHAND:"The Calm Conservative",SCOUT:"The Cautious Explorer",MAVERICK:"The Balanced Risk Taker",STRIKER:"The Calculated Aggressor",HOTSHOT:"The High-Risk Aspirant",HIGHROLLER:"The High-Conviction Investor",JACKPOT:"The Adaptive Risk Taker"};
  const archetypeTag={VAULT:"Protect first. Participate second.",ANCHOR:"Careful, but not frozen.",COOLHAND:"You can take risk, but you do not need to.",SCOUT:"Curious about risk, careful with consequences.",MAVERICK:"Comfortable taking calculated risk.",STRIKER:"Ready to act when the odds justify it.",HOTSHOT:"Willing to swing hard, but capacity may say no.",HIGHROLLER:"High appetite with meaningful financial room.",JACKPOT:"High appetite. High capacity. Discipline matters."};
  const watchouts=(f.watchouts||[]).slice(0,3);
  const strengths=(f.strengths||[]).slice(0,3);

  return <main className="shell"><section className="result">
    <Brand compact/>
    <div className="result-top"><div><div className="eyebrow">YOUR INVESTOR DNA · V1.2</div><h1>{archetype}</h1><p className="archetype-name">{archetypeNames[archetype]||"Your Investor Profile"}</p><p className="tagline">{archetypeTag[archetype]||"Your investment style, decoded."}</p></div></div>

    <section className="risk-section">
      <div className="section-heading"><div><small>YOUR RISK PROFILE</small><h2>Where you sit on the risk map</h2></div></div>
      <div className="risk-map-wrap">
        <div className="y-axis-label">RISK CAPACITY</div>
        <div className="risk-map">
          <div className="zone z-low-low"><span>LOW</span><b>VAULT</b></div>
          <div className="zone z-low-med"><span>MEDIUM</span><b>ANCHOR</b></div>
          <div className="zone z-low-high"><span>HIGH</span><b>COOLHAND</b></div>
          <div className="zone z-med-low"><span>LOW</span><b>SCOUT</b></div>
          <div className="zone z-med-med"><span>MEDIUM</span><b>MAVERICK</b></div>
          <div className="zone z-med-high"><span>HIGH</span><b>STRIKER</b></div>
          <div className="zone z-high-low"><span>LOW</span><b>HOTSHOT</b></div>
          <div className="zone z-high-med"><span>MEDIUM</span><b>HIGHROLLER</b></div>
          <div className="zone z-high-high"><span>HIGH</span><b>JACKPOT</b></div>
          <div className="crosshair x1"/><div className="crosshair x2"/><div className="crosshair y1"/><div className="crosshair y2"/>
          <div className="you-dot" style={{left:`${tolerance}%`,top:`${100-capacity}%`}}><span></span><strong>YOU</strong></div>
        </div>
        <div className="x-axis-label">RISK TOLERANCE</div>
      </div>
      <div className="risk-values"><div><b>{Math.round(tolerance)}</b><span>Risk Tolerance</span></div><div><b>{Math.round(capacity)}</b><span>Risk Capacity</span></div><div className="zone-read"><b>{archetype}</b><span>Your zone</span></div></div>
      <p className="map-note">Your <strong>tolerance</strong> reflects how comfortable you are with risk. Your <strong>capacity</strong> reflects how much risk your financial situation can absorb.</p>
    </section>

    <section className="behavior-section">
      <div className="section-heading"><div><small>HOW YOU INVEST</small><h2>Your decision fingerprint</h2></div></div>
      <div className="grid"><article><small>DECISION STYLE</small><h3>{f.decision_style||"—"}</h3><p>How you tend to approach investment decisions.</p></article><article><small>UNDER PRESSURE</small><h3>{f.pressure_style||"—"}</h3><p>How your decision-making can change when markets get stressful.</p></article></div>
    </section>

    <section className="insights-section">
      <div className="insight-columns">
        <article className="insight-card"><small>YOUR STRENGTHS</small>{strengths.length?strengths.map((k,i)=><div className="trait" key={k}><div className="trait-title"><b>{prettyTrait(k)}</b><span>Strength</span></div><p>{traitDescription(k)}</p></div>):<p className="empty">Your profile shows a balanced set of strengths.</p>}</article>
        <article className="insight-card watch-card"><small>WHAT TO WATCH</small>{watchouts.length?watchouts.map(k=><div className="trait" key={k}><div className="trait-title"><b>{prettyTrait(k)}</b><span>Watch</span></div><p>{traitDescription(k)}</p></div>):<p className="empty">No major behavioral watchouts were flagged.</p>}</article>
      </div>
    </section>

    <section className="character-card"><small>YOUR INVESTOR CHARACTER</small><h2>{n.character||archetypeNames[archetype]||"The Investor"}</h2><p>{n.summary||"Your profile reflects a distinct combination of risk tolerance, financial capacity and behavioral tendencies."}</p></section>

    <p className="disclaimer">Investing DNA is an educational assessment, not investment, financial or psychological advice. Your result is a snapshot of your responses at the time of assessment.</p>
    <button className="primary" onClick={()=>window.print()}>Save / Print Report ↗</button>
  </section></main>
}
