import {DNA,score} from "@/lib/dna";
function Items({value}:{value:unknown}) {
  if(typeof value==='string') return <p>{value}</p>;
  if(Array.isArray(value)) return <ul>{value.filter(x=>typeof x==='string').map((x,i)=><li key={i}>{x}</li>)}</ul>;
  return null;
}
export function DnaSummary({dna,report}:{dna:DNA;report?:DNA|null}) {
  return <><div className="eyebrow">Your Investor DNA</div><h1>{dna.archetype || "Assessment complete"}</h1>
  <div className="grid2"><div className="metric"><span>Risk tolerance</span><div className="kpi">{score(dna.risk_tolerance)}<small> / 100</small></div><p className="muted">Your comfort with investment uncertainty.</p></div><div className="metric"><span>Risk capacity</span><div className="kpi">{score(dna.risk_capacity)}<small> / 100</small></div><p className="muted">Your financial ability to absorb losses.</p></div></div>
  {dna.behavioral_profile && <div className="section compact"><h2>Behavioral fingerprint</h2>{Object.entries(dna.behavioral_profile).map(([key,value])=><div className="fingerprint" key={key}><span>{key.replaceAll('_',' ')}</span><strong>{score(value)}</strong></div>)}</div>}
  {(report?.strengths || dna.strengths) && <div><h2>Strengths</h2><Items value={report?.strengths || dna.strengths}/></div>}
  {(report?.watchouts || dna.watchouts) && <div><h2>Watchouts</h2><Items value={report?.watchouts || dna.watchouts}/></div>}
  <p className="muted fine">A self-assessment for reflection. Your circumstances and responses can change over time.</p></>;
}
