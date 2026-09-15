import Image from "next/image";
import {DNA,humanize,score} from "@/lib/dna";

const ARCHETYPES:Record<string,{title:string;tagline:string}>={
  VAULT:{title:'The Capital Protector',tagline:'You prefer protection, and your finances also call for caution.'},
  ANCHOR:{title:'The Steady Builder',tagline:'You prefer a steadier path, with some room to take measured risk.'},
  COOLHAND:{title:'The Calm Conservative',tagline:'You can take more risk financially than you naturally prefer.'},
  SCOUT:{title:'The Cautious Explorer',tagline:'You are open to some risk, but your finances call for restraint.'},
  MAVERICK:{title:'The Balanced Risk Taker',tagline:'Your comfort with risk and financial capacity are broadly balanced.'},
  STRIKER:{title:'The Calculated Aggressor',tagline:'You are comfortable with some risk and have room to absorb it.'},
  HOTSHOT:{title:'The High-Risk Aspirant',tagline:'Your appetite for risk runs ahead of your financial capacity.'},
  HIGHROLLER:{title:'The High-Conviction Investor',tagline:'You are comfortable taking significant risk, with moderate financial room.'},
  JACKPOT:{title:'The Adaptive Risk Taker',tagline:'Both your willingness and capacity for investment risk are relatively high.'},
};

const BEHAVIOR:Record<string,{label:string;help:string;high:string;mid:string;low:string}>={
  decision_independence:{label:'Decision independence',help:'How much you separate other people’s excitement from your own decision.',high:'Independent',mid:'Mixed',low:'More socially influenced'},
  long_term_orientation:{label:'Long-term orientation',help:'How well you keep recent performance in perspective.',high:'Long-term focused',mid:'Mixed',low:'More performance-sensitive'},
  reference_flexibility:{label:'Reference flexibility',help:'How easily you look past the price you paid and reassess from today.',high:'Flexible',mid:'Mixed',low:'More anchored to past prices'},
  evidence_discipline:{label:'Evidence discipline',help:'How willing you are to test your view against new evidence.',high:'Evidence-led',mid:'Mixed',low:'More conviction-led'},
  emotional_decision_control:{label:'Emotional decision control',help:'How well you keep stress and regret from taking over the decision.',high:'Composed',mid:'Mixed',low:'More emotion-sensitive'},
};

const EXPERIENCE_LABELS:Record<string,string>={
  decision_experience:'Years making investment decisions',
  product_exposure:'Range of investments used',
  downturn_experience:'Experience through market declines',
};

const MATRIX=[
  ['COOLHAND','STRIKER','JACKPOT'],
  ['ANCHOR','MAVERICK','HIGHROLLER'],
  ['VAULT','SCOUT','HOTSHOT'],
];

function band(value:unknown){
  const n=typeof value==='number'?value:NaN;
  if(!Number.isFinite(n))return 'Not available';
  if(n<34)return 'Lower';
  if(n<67)return 'Moderate';
  return 'Higher';
}
function behaviorBand(key:string,value:unknown){
  const n=typeof value==='number'?value:NaN;const meta=BEHAVIOR[key];
  if(!meta||!Number.isFinite(n))return 'Not available';
  if(n>=70)return meta.high;if(n>=45)return meta.mid;return meta.low;
}
function experienceBand(value:unknown){
  const n=typeof value==='number'?value:NaN;
  if(!Number.isFinite(n))return 'Experience not available';
  if(n<34)return 'Newer investor';if(n<67)return 'Some hands-on experience';return 'Experienced investor';
}
function relation(rt:unknown,rc:unknown){
  const a=typeof rt==='number'?rt:NaN,b=typeof rc==='number'?rc:NaN;
  if(!Number.isFinite(a)||!Number.isFinite(b))return '';
  const d=b-a;
  if(d>=15)return 'Your finances can absorb more risk than you naturally feel comfortable taking.';
  if(d<=-15)return 'Your willingness to take risk is running ahead of the financial room you currently have to absorb losses.';
  return 'Your comfort with risk and your financial capacity are reasonably close to one another.';
}
function formatContext(key:string,value:unknown){
  if(value===null||value===undefined||value==='')return 'Not provided';
  const maps:Record<string,Record<string,string>>={
    goal:{growth:'Long-term growth',retirement:'Retirement',house_purchase:'Home purchase',education:'Education',income:'Regular investment income',preservation:'Preserve capital'},
    time_horizon:{under_2:'Under 2 years','1_3y':'1–3 years','3_5y':'3–5 years','5_10y':'5–10 years','gt_10y':'More than 10 years'},
    liquidity_need:{high:'High — easy access matters',medium:'Medium — some access matters',low:'Low — can stay invested'},
  };
  return maps[key]?.[String(value)]||humanize(String(value));
}

export function DnaSummary({dna,report}:{dna:DNA;report?:DNA|null}) {
  const behavioral=report?.behavioral_profile || dna.behavioral_profile || {};
  const experience=report?.experience_profile || dna.experience_profile;
  const quality=report?.quality_profile || dna.quality_profile;
  const narrative=report?.narrative || dna.narrative || {};
  const context=report?.investment_context || dna.investment_context;
  const archetype=(dna.archetype||report?.archetype||'MAVERICK').toUpperCase();
  const meta=ARCHETYPES[archetype]||{title:narrative.character||'Your Investor DNA',tagline:narrative.summary||'Your profile combines risk tolerance, financial capacity and decision patterns.'};
  const rt=dna.risk_tolerance??report?.risk_tolerance;
  const rc=dna.risk_capacity??report?.risk_capacity;
  const name=context?.first_name?.trim();
  const consistency=quality?.consistency_label && quality.consistency_label!=='not_available' ? humanize(quality.consistency_label) : null;

  return <div className="dna-report">
    <section className={'dna-hero dna-'+archetype.toLowerCase()}>
      <div className="dna-hero-copy">
        <div className="eyebrow">Your Investor DNA</div>
        <p className="dna-greeting">{name?`${name}, meet the investor behind your decisions.`:'Meet the investor behind your decisions.'}</p>
        <h1>{archetype}</h1>
        <h2>{narrative.character||meta.title}</h2>
        <p className="dna-tagline">{meta.tagline}</p>
        {consistency&&<span className="consistency-pill">Profile confidence: {consistency}</span>}
      </div>
      <div className="dna-character" aria-hidden="true"><Image src={`/characters/${archetype.toLowerCase()}.png`} alt="" width={230} height={230} priority/></div>
    </section>

    <section className="report-section">
      <div className="eyebrow">01 · Your risk profile</div>
      <h2>Willingness and capacity are different.</h2>
      <p className="report-lede">{relation(rt,rc)}</p>
      <div className="risk-layout">
        <div className="risk-matrix-wrap">
          <div className="matrix-axis matrix-axis-y">Higher financial capacity ↑</div>
          <div className="risk-matrix" aria-label="Investor DNA risk matrix">
            {MATRIX.flat().map(key=><div key={key} className={'matrix-cell '+(key===archetype?'active':'')}><span>{key}</span>{key===archetype&&<b aria-hidden="true">●</b>}</div>)}
          </div>
          <div className="matrix-axis matrix-axis-x">Lower risk tolerance ← &nbsp; → Higher risk tolerance</div>
        </div>
        <div className="risk-cards">
          <div className="plain-metric"><div><span>Risk tolerance</span><strong>{score(rt)}<small>/100</small></strong></div><em>{band(rt)}</em><p>How comfortable you are living with uncertainty, market swings and temporary losses.</p></div>
          <div className="plain-metric"><div><span>Financial capacity</span><strong>{score(rc)}<small>/100</small></strong></div><em>{band(rc)}</em><p>How much financial room you currently have to absorb investment losses without disrupting important needs.</p></div>
        </div>
      </div>
    </section>

    <section className="report-section">
      <div className="eyebrow">02 · How you decide</div>
      <h2>Your decision fingerprint</h2>
      <p className="report-lede">These are tendencies, not grades. They describe what may pull your decisions in different directions.</p>
      <div className="behavior-grid">
        {Object.entries(BEHAVIOR).map(([key,meta])=>{
          const value=behavioral[key];
          return <div className="behavior-card" key={key}><div className="behavior-card-top"><span>{meta.label}</span><strong>{behaviorBand(key,value)}</strong></div><div className="scorebar"><div style={{width:`${Math.max(0,Math.min(100,typeof value==='number'?value:0))}%`}}/></div><p>{meta.help}</p></div>;
        })}
      </div>

      <div className="decision-cards">
        <div className="decision-card"><span className="decision-icon">↗</span><div><small>How you tend to decide</small><h3>{report?.decision_style||dna.decision_style||'Balanced'}</h3><p>{narrative.how_you_think||'You tend to combine your own criteria, evidence and experience rather than relying on one signal.'}</p></div></div>
        <div className="decision-card"><span className="decision-icon">≈</span><div><small>When markets get stressful</small><h3>{report?.pressure_style||dna.pressure_style||'Measured'}</h3><p>{narrative.pressure_style||'Your response to market pressure appears mixed rather than strongly reactive or strongly composed.'}</p></div></div>
      </div>

      <div className="strength-watch-grid">
        <div className="insight-card strength-card"><span className="insight-icon">✓</span><div><small>Your strongest signal</small><h3>What may work in your favour</h3><p>{narrative.strength||'No single behavioral dimension stands out strongly enough yet to call it a clear strength.'}</p></div></div>
        <div className="insight-card watch-card"><span className="insight-icon">!</span><div><small>Worth watching</small><h3>What may trip you up</h3><p>{narrative.blind_spot||'No single behavioral watchpoint stands out strongly enough yet.'}</p></div></div>
      </div>
    </section>

    <section className="report-section report-story">
      <div className="eyebrow">03 · What this means</div>
      <h2>Your profile in plain English</h2>
      <p>{narrative.summary||meta.tagline}</p>
      <p>{narrative.how_you_think}</p>
      <p>{narrative.pressure_style}</p>
    </section>

    {context&&<section className="report-section context-summary">
      <div className="eyebrow">04 · This investment decision</div>
      <h2>Your DNA is about you. This context is about this money.</h2>
      <div className="context-summary-grid">
        <div><span>Goal</span><strong>{formatContext('goal',context.goal)}</strong></div>
        <div><span>Time horizon</span><strong>{formatContext('time_horizon',context.time_horizon)}</strong></div>
        <div><span>Access to the money</span><strong>{formatContext('liquidity_need',context.liquidity_need)}</strong></div>
        {context.amount_to_invest!=null&&<div><span>Amount considered</span><strong>{new Intl.NumberFormat('en-CA',{style:'currency',currency:context.amount_currency||'CAD',maximumFractionDigits:0}).format(context.amount_to_invest)}</strong></div>}
      </div>
    </section>}

    <details className="result-details">
      <summary>See the assessment details</summary>
      <div className="details-body">
        {experience&&<div className="detail-block"><h3>Investment experience</h3><p><strong>{experienceBand(experience.overall_score)}</strong></p><p className="muted fine">Experience helps us explain complexity. It does not raise or lower your risk-tolerance score.</p>{experience.dimensions&&Object.entries(experience.dimensions).map(([key,value])=><div className="fingerprint" key={key}><span>{EXPERIENCE_LABELS[key]||humanize(key)}</span><strong>{Number(value).toFixed(0)} / 3</strong></div>)}</div>}
        {quality?.supported&&<div className="detail-block"><h3>Answer consistency</h3><p>{quality.clarification_recommended?'Some answers pointed in different directions. That lowers confidence in interpretation, but it does not change your risk score.':'Your paired answers were broadly consistent with one another.'}</p>{typeof quality.consistency_score==='number'&&<div className="fingerprint"><span>Research consistency signal</span><strong>{score(quality.consistency_score)} / 100</strong></div>}</div>}
        <div className="detail-block"><h3>Behavior scores</h3>{Object.entries(behavioral).map(([key,value])=><div className="fingerprint" key={key}><span>{BEHAVIOR[key]?.label||humanize(key)}</span><strong>{score(value)} / 100</strong></div>)}</div>
        <p className="notice">{narrative.methodology_note||report?.methodology_note||dna.methodology_note||'This assessment is a research-stage educational tool, not investment advice.'}</p>
      </div>
    </details>

    <p className="muted fine result-disclaimer">Educational self-assessment only. This research candidate is not investment advice, and its cut points remain provisional until validation is complete.</p>
  </div>;
}
