import Image from "next/image";
import {score} from "@/lib/dna";
import type {DNA} from "@/lib/dna";
import {
 ARCHETYPES,
 BEHAVIOR,
 RISK_MATRIX,
 behaviorBand,
 formatInvestmentContext,
 pressureInsight,
 riskBand,
 riskRelationship,
 standoutDecision
} from "@/lib/dna-presentation";

/**
 * Pure presentation of an already-computed Investor DNA result/report.
 *
 * No canonical scoring happens here. Numeric values and narratives are supplied
 * by the server result; this component only organizes them for the report UI.
 */
export function DnaSummary({dna,report}:{dna:DNA;report?:DNA|null}){
 const behavioral=report?.behavioral_profile||dna.behavioral_profile||{};
 const quality=report?.quality_profile||dna.quality_profile;
 const narrative=report?.narrative||dna.narrative||{};
 const context=report?.investment_context||dna.investment_context;
 const archetype=(dna.archetype||report?.archetype||'MAVERICK').toUpperCase();
 const meta=ARCHETYPES[archetype]||{
  title:narrative.character||'Your Investor DNA',
  tagline:narrative.summary||'Your profile combines risk tolerance, financial capacity and decision patterns.'
 };
 const tolerance=dna.risk_tolerance??report?.risk_tolerance;
 const capacity=dna.risk_capacity??report?.risk_capacity;
 const name=context?.first_name?.trim();
 const decision=standoutDecision(behavioral);
 const pressure=pressureInsight(behavioral.emotional_decision_control);

 return <div className="dna-report">
  <ReportHero
   archetype={archetype}
   character={narrative.character||meta.title}
   tagline={meta.tagline}
   firstName={name}
   clarificationRecommended={!!quality?.clarification_recommended}
  />

  <QuickReadSection
   summary={narrative.summary||meta.tagline}
   strength={narrative.strength}
   blindSpot={narrative.blind_spot}
  />

  <SnapshotSection
   tolerance={tolerance}
   capacity={capacity}
   decision={decision}
   pressure={pressure}
  />

  <details className="result-deep-dive">
   <summary>
    <span><small>Full breakdown</small>Explore how your DNA was built</span>
    <b aria-hidden="true">+</b>
   </summary>
   <div className="result-deep-dive-body">
    <RiskProfileSection archetype={archetype} tolerance={tolerance} capacity={capacity}/>
    <DecisionProfileSection
     behavioral={behavioral}
     strength={narrative.strength}
     blindSpot={narrative.blind_spot}
     decision={decision}
     pressure={pressure}
    />
   </div>
  </details>

  {context&&<ContextSummary context={context}/>} 

  <p className="muted fine result-disclaimer">
   Educational self-assessment only. This research candidate is not investment advice.
  </p>
 </div>;
}

function ReportHero({
 archetype,character,tagline,firstName,clarificationRecommended
}:{
 archetype:string;
 character:string;
 tagline:string;
 firstName?:string;
 clarificationRecommended:boolean;
}){
 return <section className={'dna-hero dna-'+archetype.toLowerCase()}>
  <div className="dna-hero-copy">
   <div className="eyebrow">Your Investor DNA</div>
   <p className="dna-greeting">
    {firstName?`${firstName}, meet the investor behind your decisions.`:'Meet the investor behind your decisions.'}
   </p>
   <h1>{archetype}</h1>
   <h2>{character}</h2>
   <p className="dna-tagline">{tagline}</p>
   {clarificationRecommended&&<span className="consistency-pill">A few answers point in different directions</span>}
  </div>
  <div className="dna-character" aria-hidden="true">
   <Image src={`/characters/${archetype.toLowerCase()}.png`} alt="" width={230} height={230} priority/>
  </div>
 </section>;
}

function QuickReadSection({summary,strength,blindSpot}:{summary:string;strength?:string;blindSpot?:string}){
 return <section className="report-section report-quick-read">
  <div className="eyebrow">Your DNA at a glance</div>
  <h2>Start with the part that matters most.</h2>
  <p className="quick-read-summary">{summary}</p>
  <div className="quick-read-insights">
   <div className="quick-read-insight quick-read-strength">
    <span aria-hidden="true">✓</span>
    <div><small>What may work in your favour</small><p>{strength||'No single behavioral strength stands out strongly enough yet.'}</p></div>
   </div>
   <div className="quick-read-insight quick-read-watch">
    <span aria-hidden="true">!</span>
    <div><small>Worth watching</small><p>{blindSpot||'No single behavioral watchpoint stands out strongly enough yet.'}</p></div>
   </div>
  </div>
 </section>;
}

function SnapshotSection({
 tolerance,capacity,decision,pressure
}:{
 tolerance:unknown;
 capacity:unknown;
 decision:{label:string;text:string};
 pressure:{label:string;text:string};
}){
 return <section className="report-section report-snapshot">
  <div className="report-snapshot-head">
   <div><div className="eyebrow">Key signals</div><h2>Your profile, without the noise.</h2></div>
   <span className="snapshot-note">Tap the full breakdown below for details</span>
  </div>
  <div className="snapshot-grid">
   <SnapshotMetric label="Risk tolerance" value={score(tolerance)} suffix="/100" note={riskBand(tolerance)}/>
   <SnapshotMetric label="Financial capacity" value={score(capacity)} suffix="/100" note={riskBand(capacity)}/>
   <SnapshotMetric label="Decision tendency" value={decision.label} note="Your clearest pattern"/>
   <SnapshotMetric label="Under pressure" value={pressure.label} note="When markets get stressful"/>
  </div>
 </section>;
}

function SnapshotMetric({label,value,suffix,note}:{label:string;value:string|number;suffix?:string;note:string}){
 return <div className="snapshot-metric">
  <span>{label}</span>
  <strong>{value}{suffix&&<small>{suffix}</small>}</strong>
  <em>{note}</em>
 </div>;
}

function RiskProfileSection({archetype,tolerance,capacity}:{archetype:string;tolerance:unknown;capacity:unknown}){
 return <section className="report-section">
  <div className="eyebrow">01 · Your risk profile</div>
  <h2>Willingness and capacity are different.</h2>
  <p className="report-lede">{riskRelationship(tolerance,capacity)}</p>

  <div className="risk-layout">
   <div className="risk-matrix-wrap">
    <div className="matrix-axis matrix-axis-y">Higher financial capacity ↑</div>
    <div className="risk-matrix" aria-label="Investor DNA risk matrix">
     {RISK_MATRIX.flat().map(key=><div key={key} className={'matrix-cell '+(key===archetype?'active':'')}>
      <span>{key}</span>
      {key===archetype&&<b aria-hidden="true">●</b>}
     </div>)}
    </div>
    <div className="matrix-axis matrix-axis-x">Lower risk tolerance ← &nbsp; → Higher risk tolerance</div>
   </div>

   <div className="risk-cards">
    <RiskMetric
     label="Risk tolerance"
     value={tolerance}
     description="How comfortable you are living with uncertainty, market swings and temporary losses."
    />
    <RiskMetric
     label="Financial capacity"
     value={capacity}
     description="How much financial room you currently have to absorb investment losses without disrupting important needs."
    />
   </div>
  </div>
 </section>;
}

function RiskMetric({label,value,description}:{label:string;value:unknown;description:string}){
 return <div className="plain-metric">
  <div>
   <span>{label}</span>
   <strong>{score(value)}<small>/100</small></strong>
  </div>
  <em>{riskBand(value)}</em>
  <p>{description}</p>
 </div>;
}

function DecisionProfileSection({
 behavioral,strength,blindSpot,decision,pressure
}:{
 behavioral:Record<string,number>;
 strength?:string;
 blindSpot?:string;
 decision:{label:string;text:string};
 pressure:{label:string;text:string};
}){
 return <section className="report-section">
  <div className="eyebrow">02 · How you decide</div>
  <h2>Your decision fingerprint</h2>
  <p className="report-lede">These are tendencies, not grades. They describe what may pull your decisions in different directions.</p>

  <div className="behavior-grid">
   {Object.entries(BEHAVIOR).map(([key,meta])=><BehaviorCard
    key={key}
    label={meta.label}
    help={meta.help}
    band={behaviorBand(key,behavioral[key])}
    value={behavioral[key]}
   />)}
  </div>

  <div className="decision-cards">
   <DecisionCard icon="↗" kicker="Your clearest decision tendency" label={decision.label} text={decision.text}/>
   <DecisionCard icon="≈" kicker="When markets get stressful" label={pressure.label} text={pressure.text}/>
  </div>

  <div className="strength-watch-grid">
   <InsightCard
    className="strength-card"
    icon="✓"
    kicker="Your strongest signal"
    title="What may work in your favour"
    text={strength||'No single behavioral dimension stands out strongly enough yet to call it a clear strength.'}
   />
   <InsightCard
    className="watch-card"
    icon="!"
    kicker="Worth watching"
    title="What may trip you up"
    text={blindSpot||'No single behavioral watchpoint stands out strongly enough yet.'}
   />
  </div>
 </section>;
}

function BehaviorCard({label,help,band,value}:{label:string;help:string;band:string;value:unknown}){
 const numeric=typeof value==='number'?value:0;
 const width=Math.max(0,Math.min(100,numeric));

 return <div className="behavior-card">
  <div className="behavior-card-top"><span>{label}</span><strong>{band}</strong></div>
  <div className="scorebar"><div style={{width:`${width}%`}}/></div>
  <p>{help}</p>
 </div>;
}

function DecisionCard({icon,kicker,label,text}:{icon:string;kicker:string;label:string;text:string}){
 return <div className="decision-card">
  <span className="decision-icon">{icon}</span>
  <div><small>{kicker}</small><h3>{label}</h3><p>{text}</p></div>
 </div>;
}

function InsightCard({
 className,icon,kicker,title,text
}:{
 className:string;
 icon:string;
 kicker:string;
 title:string;
 text:string;
}){
 return <div className={'insight-card '+className}>
  <span className="insight-icon">{icon}</span>
  <div><small>{kicker}</small><h3>{title}</h3><p>{text}</p></div>
 </div>;
}

function ContextSummary({context}:{context:NonNullable<DNA['investment_context']>}){
 return <section className="report-section context-summary">
  <div className="eyebrow">04 · This investment decision</div>
  <h2>Your DNA is about you. This context is about this money.</h2>
  <div className="context-summary-grid">
   <ContextValue label="Goal" value={formatInvestmentContext('goal',context.goal)}/>
   <ContextValue label="Time horizon" value={formatInvestmentContext('time_horizon',context.time_horizon)}/>
   <ContextValue label="Access to the money" value={formatInvestmentContext('liquidity_need',context.liquidity_need)}/>
   {context.amount_to_invest!=null&&<ContextValue
    label="Amount considered"
    value={new Intl.NumberFormat('en-CA',{
     style:'currency',
     currency:context.amount_currency||'CAD',
     maximumFractionDigits:0
    }).format(context.amount_to_invest)}
   />}
  </div>
 </section>;
}

function ContextValue({label,value}:{label:string;value:string}){
 return <div><span>{label}</span><strong>{value}</strong></div>;
}
