import {DNA,humanize,score} from "@/lib/dna";

function Items({value}:{value:unknown}) {
  if(typeof value==='string') return <p>{value}</p>;
  if(Array.isArray(value)) return <ul className="result-list">{value.filter(x=>typeof x==='string').map((x,i)=><li key={i}>{humanize(String(x))}</li>)}</ul>;
  return null;
}

function ScoreBar({value}:{value:unknown}){
  const n=typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
  return <div className="scorebar" aria-hidden="true"><div style={{width:`${n}%`}}/></div>;
}

const BEHAVIOR_LABELS:Record<string,string>={
  decision_independence:'Decision independence',
  long_term_orientation:'Long-term orientation',
  reference_flexibility:'Reference flexibility',
  evidence_discipline:'Evidence discipline',
  emotional_decision_control:'Emotional decision control',
};
const EXPERIENCE_LABELS:Record<string,string>={
  decision_experience:'Decision experience',
  product_exposure:'Product exposure',
  downturn_experience:'Downturn experience',
};

export function DnaSummary({dna,report}:{dna:DNA;report?:DNA|null}) {
  const behavioral=report?.behavioral_profile || dna.behavioral_profile || {};
  const experience=report?.experience_profile || dna.experience_profile;
  const quality=report?.quality_profile || dna.quality_profile;
  const decisionStyle=report?.decision_style || dna.decision_style;
  const pressureStyle=report?.pressure_style || dna.pressure_style;
  const methodology=report?.methodology_note || dna.methodology_note;

  return <div className="dna-dashboard">
    <div className="result-hero">
      <div className="eyebrow">Your Investor DNA</div>
      <h1>{dna.archetype || "Assessment complete"}</h1>
      <p>Your result combines willingness to take investment risk, financial capacity and the decision patterns that can show up under uncertainty.</p>
    </div>

    <div className="result-score-grid">
      <div className="result-score-card"><div className="result-score-top"><span>Risk tolerance</span><strong>{score(dna.risk_tolerance)}<small> / 100</small></strong></div><ScoreBar value={dna.risk_tolerance}/><p>Your willingness to live with investment uncertainty and temporary loss.</p></div>
      <div className="result-score-card"><div className="result-score-top"><span>Financial capacity</span><strong>{score(dna.risk_capacity)}<small> / 100</small></strong></div><ScoreBar value={dna.risk_capacity}/><p>Your current financial room to absorb investment losses.</p></div>
    </div>

    {Object.keys(behavioral).length>0&&<section className="result-panel">
      <div className="result-panel-head"><div><div className="eyebrow">Decision patterns</div><h2>Behavioral DNA</h2></div><p>Higher scores mean the pattern is less likely to pull you away from a deliberate process.</p></div>
      <div className="behavior-list">{Object.entries(behavioral).map(([key,value])=><div className="behavior-row" key={key}><div className="behavior-row-top"><span>{BEHAVIOR_LABELS[key]||humanize(key)}</span><strong>{score(value)}</strong></div><ScoreBar value={value}/></div>)}</div>
    </section>}

    {(decisionStyle||pressureStyle)&&<div className="result-mini-grid">
      {decisionStyle&&<div className="result-mini-card"><span>Decision style</span><strong>{decisionStyle}</strong></div>}
      {pressureStyle&&<div className="result-mini-card"><span>Under pressure</span><strong>{pressureStyle}</strong></div>}
    </div>}

    {experience&&<section className="result-panel">
      <div className="result-panel-head"><div><div className="eyebrow">Context, not risk</div><h2>Investment experience</h2></div>{typeof experience.overall_score==='number'&&<strong className="result-context-score">{score(experience.overall_score)} / 100</strong>}</div>
      {experience.dimensions&&<div className="experience-grid">{Object.entries(experience.dimensions).map(([key,value])=><div className="experience-item" key={key}><span>{EXPERIENCE_LABELS[key]||humanize(key)}</span><strong>{Number(value).toFixed(0)} / 3</strong></div>)}</div>}
      <p className="muted fine result-footnote">Experience helps tailor explanations. It does not increase or decrease your risk-tolerance score.</p>
    </section>}

    {quality?.supported&&<section className="result-panel compact-panel">
      <div className="result-panel-head"><div><div className="eyebrow">Answer quality</div><h2>Response consistency</h2></div><strong className="consistency-pill">{humanize(quality.consistency_label||'not available')}</strong></div>
      {quality.clarification_recommended&&<p className="notice">Some answers point in different directions. This lowers confidence in interpretation; it does not change your risk score.</p>}
    </section>}

    {(report?.strengths || dna.strengths || report?.watchouts || dna.watchouts)&&<div className="result-mini-grid">
      {(report?.strengths || dna.strengths)&&<section className="result-panel compact-panel"><h2>Relative strengths</h2><Items value={report?.strengths || dna.strengths}/></section>}
      {(report?.watchouts || dna.watchouts)&&<section className="result-panel compact-panel"><h2>Watchpoints</h2><Items value={report?.watchouts || dna.watchouts}/></section>}
    </div>}

    {methodology&&<p className="notice">{methodology}</p>}
    <p className="muted fine result-disclaimer">Educational self-assessment only. This research candidate is not investment advice, and its cut points and consistency rules are not yet validated.</p>
  </div>;
}
