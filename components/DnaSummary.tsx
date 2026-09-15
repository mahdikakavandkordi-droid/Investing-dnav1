import {DNA,humanize,score} from "@/lib/dna";

function Items({value}:{value:unknown}) {
  if(typeof value==='string') return <p>{value}</p>;
  if(Array.isArray(value)) return <ul>{value.filter(x=>typeof x==='string').map((x,i)=><li key={i}>{humanize(String(x))}</li>)}</ul>;
  return null;
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

  return <>
    <div className="eyebrow">Your Investor DNA</div>
    <h1>{dna.archetype || "Assessment complete"}</h1>

    <div className="grid2">
      <div className="metric"><span>Risk tolerance</span><div className="kpi">{score(dna.risk_tolerance)}<small> / 100</small></div><p className="muted">Your willingness to live with investment uncertainty and loss.</p></div>
      <div className="metric"><span>Financial capacity</span><div className="kpi">{score(dna.risk_capacity)}<small> / 100</small></div><p className="muted">Your current financial room to absorb investment losses.</p></div>
    </div>

    {Object.keys(behavioral).length>0&&<div className="section compact">
      <h2>Behavioral DNA</h2>
      <p className="muted">Higher scores mean the decision pattern is less likely to pull you away from a deliberate process.</p>
      {Object.entries(behavioral).map(([key,value])=><div className="fingerprint" key={key}><span>{BEHAVIOR_LABELS[key]||humanize(key)}</span><strong>{score(value)}</strong></div>)}
    </div>}

    {(decisionStyle||pressureStyle)&&<div className="grid2">
      {decisionStyle&&<div className="metric"><span>Decision style</span><strong>{decisionStyle}</strong></div>}
      {pressureStyle&&<div className="metric"><span>Under pressure</span><strong>{pressureStyle}</strong></div>}
    </div>}

    {experience&&<div className="section compact">
      <h2>Investment experience</h2>
      {typeof experience.overall_score==='number'&&<p><strong>{score(experience.overall_score)} / 100</strong> <span className="muted">experience context</span></p>}
      {experience.dimensions&&Object.entries(experience.dimensions).map(([key,value])=><div className="fingerprint" key={key}><span>{EXPERIENCE_LABELS[key]||humanize(key)}</span><strong>{Number(value).toFixed(0)} / 3</strong></div>)}
      <p className="muted fine">Experience does not increase or decrease your risk-tolerance score.</p>
    </div>}

    {quality?.supported&&<div className="section compact">
      <h2>Response consistency</h2>
      <div className="fingerprint"><span>Consistency</span><strong>{humanize(quality.consistency_label||'not available')}</strong></div>
      {typeof quality.consistency_score==='number'&&<div className="fingerprint"><span>Research consistency signal</span><strong>{score(quality.consistency_score)} / 100</strong></div>}
      {quality.clarification_recommended&&<p className="notice">Some answers point in different directions. This lowers confidence in interpretation; it does not change your risk score.</p>}
    </div>}

    {(report?.strengths || dna.strengths) && <div><h2>Relative strengths</h2><Items value={report?.strengths || dna.strengths}/></div>}
    {(report?.watchouts || dna.watchouts) && <div><h2>Watchpoints</h2><Items value={report?.watchouts || dna.watchouts}/></div>}

    {methodology&&<p className="notice">{methodology}</p>}
    <p className="muted fine">Educational self-assessment only. This research candidate is not investment advice, and its cut points and consistency rules are not yet validated.</p>
  </>;
}
