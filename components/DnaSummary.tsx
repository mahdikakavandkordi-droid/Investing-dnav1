import Image from "next/image";
import {hasCompleteInvestmentContext,score} from "@/lib/dna";
import type {DNA,PersonalizationProfile} from "@/lib/dna";
import {
 ARCHETYPES,BEHAVIOR,RISK_MATRIX,behaviorBand,displayArchetype,formatInvestmentContext,pressureInsight,riskBand,riskRelationship,standoutDecision
} from "@/lib/dna-presentation";

export function DnaSummary({dna,report,personal}:{dna:DNA;report?:DNA|null;personal?:PersonalizationProfile|null}){
 const behavioral=report?.behavioral_profile||dna.behavioral_profile||{};
 const quality=report?.quality_profile||dna.quality_profile;
 const narrative=report?.narrative||dna.narrative||{};
 const context=report?.investment_context||dna.investment_context;
 const archetype=(dna.archetype||report?.archetype||'MAVERICK').toUpperCase();
 const displayName=displayArchetype(archetype);
 const meta=ARCHETYPES[archetype]||{title:narrative.character||'Your Investor DNA',tagline:narrative.summary||'Your profile combines risk tolerance, financial capacity and decision patterns.'};
 const tolerance=dna.risk_tolerance??report?.risk_tolerance;
 const capacity=dna.risk_capacity??report?.risk_capacity;
 const firstName=personal?.first_name||context?.first_name?.trim()||undefined;
 const age=personal?.age??context?.age??undefined;
 const decision=standoutDecision(behavioral);
 const pressure=pressureInsight(behavioral.emotional_decision_control);
 const relationship=riskRelationship(tolerance,capacity);
 const summary=narrative.summary||meta.tagline;
 const meaning=[relationship,decision.text,pressure.text,narrative.strength||''].filter((text,index,all)=>!!text&&all.indexOf(text)===index).slice(0,4);
 return <div className="dna-report dna-report-v2">
  <ReportHero canonicalArchetype={archetype} displayName={displayName} character={narrative.character||meta.title} tagline={summary} firstName={firstName} clarificationRecommended={!!quality?.clarification_recommended}/>
  <ProfileSnapshot context={context} personal={{first_name:firstName||'',age:age||0}} tolerance={tolerance} capacity={capacity}/>
  <ReportOverview archetype={archetype} tolerance={tolerance} capacity={capacity} meaning={meaning}/>
  <DecisionProfileSection behavioral={behavioral} strength={narrative.strength} blindSpot={narrative.blind_spot} decision={decision} pressure={pressure}/>
  <BiasSignalsSection behavioral={behavioral}/>
  <PlainEnglishSection summary={summary} decisionText={decision.text} pressureText={pressure.text}/>
  {hasCompleteInvestmentContext(context)&&<AppliedDnaSection context={context!} firstName={firstName} displayName={displayName}/>} 
  <p className="muted fine result-disclaimer">Educational self-assessment only. Investor DNA describes research-oriented tendencies and is not investment advice or a recommendation to buy or sell any investment.</p>
 </div>;
}

function ReportHero({canonicalArchetype,displayName,character,tagline,firstName,clarificationRecommended}:{canonicalArchetype:string;displayName:string;character:string;tagline:string;firstName?:string;clarificationRecommended:boolean;}){
 return <section className={'dna-hero dna-hero-v2 dna-'+canonicalArchetype.toLowerCase()}><div className="dna-hero-scenery" aria-hidden="true"><span className="dna-hero-sun"/><span className="dna-hero-mountain mountain-a"/><span className="dna-hero-mountain mountain-b"/><span className="dna-hero-path"/></div><div className="dna-hero-copy"><div className="eyebrow">Your Investor DNA</div><p className="dna-greeting">{firstName?`${firstName}, this is your current profile.`:'This is your current profile.'}</p><h1>{displayName}</h1><h2>{character}</h2><p className="dna-tagline">{tagline}</p>{clarificationRecommended&&<span className="consistency-pill">A few answers point in different directions</span>}</div><div className="dna-character" aria-hidden="true"><Image src={`/characters/${canonicalArchetype.toLowerCase()}.png`} alt="" width={320} height={320} priority/></div></section>;
}

function ProfileSnapshot({context,personal,tolerance,capacity}:{context?:DNA['investment_context'];personal:PersonalizationProfile;tolerance:unknown;capacity:unknown;}){
 const rows=[
  {label:'Name',value:personal.first_name||'—'},
  {label:'Age',value:personal.age?String(personal.age):'—'},
  {label:'Risk tolerance',value:riskBand(tolerance)},
  {label:'Financial capacity',value:riskBand(capacity)},
  ...(context?.time_horizon?[{label:'Investment horizon',value:formatInvestmentContext('time_horizon',context.time_horizon)}]:[]),
  ...(context?.amount_to_invest!=null?[{label:'Amount considered',value:new Intl.NumberFormat('en-CA',{style:'currency',currency:context.amount_currency||'CAD',maximumFractionDigits:0}).format(context.amount_to_invest)}]:[])
 ];
 return <section className="report-snapshot" aria-label="Investor DNA summary">{rows.map(row=><div className="report-snapshot-item" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</section>;
}

function ReportOverview({archetype,tolerance,capacity,meaning}:{archetype:string;tolerance:unknown;capacity:unknown;meaning:string[];}){
 return <section className="report-overview-grid"><div className="report-overview-card dna-map-card"><div className="eyebrow">Your position</div><h2>Investor DNA map</h2><p className="report-card-intro">Your profile combines willingness to take risk with your current financial capacity to absorb it.</p><div className="risk-matrix-wrap risk-matrix-wrap-v2"><div className="matrix-axis matrix-axis-y">Higher financial capacity ↑</div><div className="risk-matrix" aria-label="Investor DNA risk matrix">{RISK_MATRIX.flat().map(key=><div key={key} className={'matrix-cell '+(key===archetype?'active':'')}><span>{displayArchetype(key)}</span></div>)}</div><div className="matrix-axis matrix-axis-x">Lower risk tolerance ← &nbsp; → Higher risk tolerance</div></div><div className="overview-risk-metrics"><RiskMetric label="Risk tolerance" value={tolerance}/><RiskMetric label="Financial capacity" value={capacity}/></div></div><div className="report-overview-card meaning-card"><div className="eyebrow">What this means</div><h2>Your profile at a glance</h2><p className="report-card-intro">A short read before the deeper decision-profile section below.</p><div className="meaning-list">{meaning.map((text,index)=><div className="meaning-item" key={text}><span>{index+1}</span><p>{text}</p></div>)}</div></div></section>;
}
function RiskMetric({label,value}:{label:string;value:unknown}){const available=typeof value==='number'&&Number.isFinite(value);return <div className="overview-risk-metric"><span>{label}</span><strong>{riskBand(value)}</strong><small>{available?`${score(value)}/100`:'Not scored'}</small></div>}

function DecisionProfileSection({behavioral,strength,blindSpot,decision,pressure}:{behavioral:Record<string,number>;strength?:string;blindSpot?:string;decision:{label:string;text:string};pressure:{label:string;text:string};}){
 return <section className="report-section report-section-v2"><div className="eyebrow">How you decide</div><h2>Your decision fingerprint</h2><p className="report-lede">These are tendencies, not grades. They describe what may pull your decisions in different directions.</p><div className="behavior-grid">{Object.entries(BEHAVIOR).map(([key,meta])=><BehaviorCard key={key} label={meta.label} help={meta.help} band={behaviorBand(key,behavioral[key])} value={behavioral[key]}/>)}</div><div className="decision-cards"><DecisionCard icon="↗" kicker="Your clearest decision tendency" label={decision.label} text={decision.text}/><DecisionCard icon="≈" kicker="When markets get stressful" label={pressure.label} text={pressure.text}/></div><div className="strength-watch-grid"><InsightCard className="strength-card" icon="✓" kicker="Your strengths" title="What may work in your favour" text={strength||'No single behavioral dimension stands out strongly enough yet to call it a clear strength.'}/><InsightCard className="watch-card" icon="!" kicker="Worth watching" title="Where your process may need support" text={blindSpot||'No single behavioral watchpoint stands out strongly enough yet.'}/></div></section>;
}
function BehaviorCard({label,help,band,value}:{label:string;help:string;band:string;value:unknown}){const available=typeof value==='number'&&Number.isFinite(value);const width=available?Math.max(0,Math.min(100,value)):0;return <div className="behavior-card"><div className="behavior-card-top"><span>{label}</span><strong>{band}</strong></div><div className="scorebar">{available&&<div style={{width:`${width}%`}}/>}</div><p>{available?help:'Not enough data is available to describe this tendency yet.'}</p></div>}
function DecisionCard({icon,kicker,label,text}:{icon:string;kicker:string;label:string;text:string}){return <div className="decision-card"><span className="decision-icon">{icon}</span><div><small>{kicker}</small><h3>{label}</h3><p>{text}</p></div></div>}
function InsightCard({className,icon,kicker,title,text}:{className:string;icon:string;kicker:string;title:string;text:string;}){return <div className={'insight-card '+className}><span className="insight-icon">{icon}</span><div><small>{kicker}</small><h3>{title}</h3><p>{text}</p></div></div>}

function BiasSignalsSection({behavioral}:{behavioral:Record<string,number>}){
 const items=[
  {key:'decision_independence',icon:'↔',category:'Cognitive',title:'Social influence',body:'How easily other people’s excitement or fear can enter your own investment decision.'},
  {key:'long_term_orientation',icon:'◷',category:'Cognitive',title:'Recency sensitivity',body:'How strongly recent winners, losers or market headlines may change what feels attractive.'},
  {key:'reference_flexibility',icon:'⌖',category:'Cognitive',title:'Anchoring tendency',body:'How much the price you paid may remain a reference point when you reassess an investment.'},
  {key:'evidence_discipline',icon:'◇',category:'Cognitive',title:'Confirmation tendency',body:'How easy it is to keep testing a preferred idea against evidence that disagrees with it.'},
  {key:'emotional_decision_control',icon:'≈',category:'Emotional',title:'Loss & regret response',body:'How strongly sharp losses or regret may create pressure to change course.'}
 ];
 return <section className="report-section report-section-v2"><div className="eyebrow">Decision traps</div><h2>Your cognitive & emotional bias signals</h2><p className="report-lede">These are possible tendencies inferred from your answer pattern — not diagnoses and not permanent labels.</p><div className="bias-signal-grid">{items.map(item=>{const value=behavioral[item.key];const status=signalStatus(value);return <article className="bias-signal-card" key={item.key}><header><span className="bias-icon">{item.icon}</span><em>{item.category}</em></header><h3>{item.title}</h3><p>{item.body}</p><span className={'bias-status '+status.className}>{status.label}</span></article>})}</div><p className="bias-explainer">A lower score on the underlying behavior dimension can make the related decision trap more worth watching. Context and real behavior still matter.</p></section>;
}
function signalStatus(value:unknown){if(typeof value!=='number'||!Number.isFinite(value))return {label:'Not enough data',className:'unavailable'};if(value<40)return {label:'Worth watching',className:'watch'};if(value<60)return {label:'Possible signal',className:'possible'};return {label:'Lower signal',className:''}}

function PlainEnglishSection({summary,decisionText,pressureText}:{summary:string;decisionText:string;pressureText:string}){return <section className="report-section report-story report-story-v2"><div className="eyebrow">Your profile in plain English</div><h2>The longer read</h2><p>{summary}</p><p>{decisionText}</p><p>{pressureText}</p></section>}

function AppliedDnaSection({context,firstName,displayName}:{context:NonNullable<DNA['investment_context']>;firstName?:string;displayName:string}){
 const amount=context.amount_to_invest==null?'Not specified':new Intl.NumberFormat('en-CA',{style:'currency',currency:context.amount_currency||'CAD',maximumFractionDigits:0}).format(context.amount_to_invest);
 const values=[['Goal',formatInvestmentContext('goal',context.goal)],['Time horizon',formatInvestmentContext('time_horizon',context.time_horizon)],['Amount',amount],['Liquidity need',formatInvestmentContext('liquidity_need',context.liquidity_need)],['Principal protection',formatInvestmentContext('principal_required',context.principal_required)]];
 return <section className="report-section applied-dna-section"><div className="applied-dna-heading"><div><div className="eyebrow">Part 2 · Your DNA in action</div><h2>{firstName?`${firstName}, see what your DNA means for this money.`:'See what your DNA means for this money.'}</h2><p>Your personal Investor DNA remains the foundation. These goal details are a separate layer used to evaluate this specific investment decision.</p></div><span className="identity-chip">{displayName} · same DNA</span></div><div className="applied-context-grid">{values.map(([label,value])=><div className="applied-context-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="applied-principle"><b>↗</b><p><strong>Your DNA does not change when your goal changes.</strong> A shorter horizon, different liquidity need or different amount can change what fits this money — not who you are as an investor.</p></div></section>;
}