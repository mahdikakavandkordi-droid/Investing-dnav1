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
  <header className="report-part-header"><div><span>Part 1 · Your Investor DNA</span><strong>Personal Profile</strong></div><p>Understand who you are as an investor before applying that DNA to a specific goal.</p></header>
  <ReportHero canonicalArchetype={archetype} displayName={displayName} character={narrative.character||meta.title} tagline={summary} firstName={firstName} tolerance={tolerance} capacity={capacity} decisionLabel={decision.label} pressureLabel={pressure.label} clarificationRecommended={!!quality?.clarification_recommended}/>
  <ProfileSnapshot context={context} personal={{first_name:firstName||'',age:age||0}} tolerance={tolerance} capacity={capacity}/>
  <ReportOverview archetype={archetype} tolerance={tolerance} capacity={capacity} meaning={meaning}/>
  <DecisionProfileSection behavioral={behavioral} strength={narrative.strength} blindSpot={narrative.blind_spot} decision={decision} pressure={pressure}/>
  <BiasSignalsSection behavioral={behavioral}/>
  <PlainEnglishSection summary={summary} decisionText={decision.text} pressureText={pressure.text}/>
  {hasCompleteInvestmentContext(context)&&<AppliedDnaSection context={context!} firstName={firstName} displayName={displayName} tolerance={tolerance} capacity={capacity}/>} 
  <p className="muted fine result-disclaimer">Educational self-assessment only. Investor DNA describes research-oriented tendencies and is not investment advice or a recommendation to buy or sell any investment.</p>
 </div>;
}

function ReportHero({canonicalArchetype,displayName,character,tagline,firstName,tolerance,capacity,decisionLabel,pressureLabel,clarificationRecommended}:{canonicalArchetype:string;displayName:string;character:string;tagline:string;firstName?:string;tolerance:unknown;capacity:unknown;decisionLabel:string;pressureLabel:string;clarificationRecommended:boolean;}){
 return <section className={'dna-hero dna-hero-v2 dna-'+canonicalArchetype.toLowerCase()}>
  <div className="dna-hero-scenery" aria-hidden="true"><span className="dna-hero-sun"/><span className="dna-hero-mountain mountain-a"/><span className="dna-hero-mountain mountain-b"/><span className="dna-hero-path"/></div>
  <div className="dna-hero-copy">
   <div className="eyebrow">Your Investor DNA</div>
   <p className="dna-greeting">{firstName?`${firstName}, this is your current profile.`:'This is your current profile.'}</p>
   <h1>{displayName}</h1>
   <h2>{character}</h2>
   <p className="dna-tagline">{tagline}</p>
   <div className="dna-hero-signals" aria-label="Profile highlights">
    <span><small>Risk tolerance</small><strong>{riskBand(tolerance)}</strong></span>
    <span><small>Financial capacity</small><strong>{riskBand(capacity)}</strong></span>
    <span><small>Decision style</small><strong>{decisionLabel}</strong></span>
    <span><small>Under pressure</small><strong>{pressureLabel}</strong></span>
   </div>
   {clarificationRecommended&&<span className="consistency-pill">A few answers point in different directions</span>}
  </div>
  <div className="dna-character" aria-hidden="true"><Image src={`/characters/${canonicalArchetype.toLowerCase()}.png`} alt="" width={520} height={420} priority/></div>
 </section>;
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
 return <section className="report-overview-grid"><div className="report-overview-card dna-map-card"><div className="eyebrow">Your position</div><h2>Investor DNA map</h2><p className="report-card-intro">Your profile combines willingness to take risk with your current financial capacity to absorb it.</p><div className="risk-matrix-wrap risk-matrix-wrap-v2"><div className="matrix-axis matrix-axis-y">Higher financial capacity ↑</div><div className="risk-matrix" aria-label="Investor DNA risk matrix">{RISK_MATRIX.flat().map(key=><div key={key} className={'matrix-cell '+(key===archetype?'active':'')} aria-label={key===archetype?`Your zone: ${displayArchetype(key)}`:'Other Investor DNA zone'}>{key===archetype?<strong>{displayArchetype(key)}</strong>:<span className="matrix-dot" aria-hidden="true"/>}</div>)}</div><div className="matrix-axis matrix-axis-x">Lower risk tolerance ← &nbsp; → Higher risk tolerance</div></div><div className="overview-risk-metrics"><RiskMetric label="Risk tolerance" value={tolerance}/><RiskMetric label="Financial capacity" value={capacity}/></div></div><div className="report-overview-card meaning-card"><div className="eyebrow">What this means</div><h2>Your profile at a glance</h2><p className="report-card-intro">A short read before the deeper decision-profile section below.</p><div className="meaning-list">{meaning.map((text,index)=><div className="meaning-item" key={text}><span>{index+1}</span><p>{text}</p></div>)}</div></div></section>;
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

function AppliedDnaSection({context,firstName,displayName,tolerance,capacity}:{context:NonNullable<DNA['investment_context']>;firstName?:string;displayName:string;tolerance:unknown;capacity:unknown}){
 const amount=context.amount_to_invest==null?'Not specified':new Intl.NumberFormat('en-CA',{style:'currency',currency:context.amount_currency||'CAD',maximumFractionDigits:0}).format(context.amount_to_invest);
 const goal=formatInvestmentContext('goal',context.goal);
 const horizon=formatInvestmentContext('time_horizon',context.time_horizon);
 const liquidity=formatInvestmentContext('liquidity_need',context.liquidity_need);
 const principal=formatInvestmentContext('principal_required',context.principal_required);
 const values=[['Goal',goal],['Time horizon',horizon],['Amount',amount],['Liquidity need',liquidity]];
 const alignment=[
  {label:'Risk comfort',value:riskBand(tolerance),kind:'Personal DNA',body:'Your willingness to live with market movement stays part of your personal profile.'},
  {label:'Financial capacity',value:riskBand(capacity),kind:'Personal DNA',body:'Your ability to absorb investment loss stays separate from the purpose of this money.'},
  {label:'Time horizon',value:horizon,kind:'Goal context',body:appliedHorizonNote(context.time_horizon)},
  {label:'Liquidity need',value:liquidity,kind:'Goal context',body:appliedLiquidityNote(context.liquidity_need)}
 ];
 const considerations=[
  appliedPrincipalNote(context.principal_required),
  appliedHorizonNote(context.time_horizon),
  appliedLiquidityNote(context.liquidity_need),
  `Keep “${goal}” as the purpose of this money when you compare investment structures and compatibility signals.`
 ];
 return <section className="report-section applied-dna-section">
  <div className="applied-dna-hero">
   <div className="applied-dna-heading"><div><div className="eyebrow">Part 2 · Applied DNA</div><h2>{firstName?`${firstName}, a clearer path for this goal.`:'A clearer path for this goal.'}</h2><p>Same investor. New context. Your personal Investor DNA stays the foundation while this goal adds horizon, access and protection constraints.</p></div><span className="identity-chip">{displayName} · same DNA</span></div>
   <div className="applied-dna-scenery" aria-hidden="true"><span className="applied-sun"/><span className="applied-ridge back"/><span className="applied-ridge front"/><span className="applied-path"/></div>
  </div>
  <div className="applied-context-grid">{values.map(([label,value])=><div className="applied-context-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  <div className="applied-insight-grid">
   <div className="applied-alignment-panel"><div className="eyebrow">Your DNA vs this goal</div><h3>What stays personal, and what comes from the goal</h3><div className="applied-alignment-list">{alignment.map(item=><div className="applied-alignment-row" key={item.label}><span className="applied-alignment-icon">✓</span><div><small>{item.kind}</small><strong>{item.label} · {item.value}</strong><p>{item.body}</p></div></div>)}</div></div>
   <aside className="applied-considerations"><div className="eyebrow">Key considerations</div><h3>Keep these constraints visible</h3><ul>{considerations.map(item=><li key={item}>{item}</li>)}</ul><div className="applied-protection"><span>Principal protection</span><strong>{principal}</strong></div></aside>
  </div>
  <div className="applied-principle"><b>↗</b><p><strong>Your DNA does not change when your goal changes.</strong> What can change is which investment structures are compatible with this specific money. Compatibility is research context, not a recommendation.</p></div>
 </section>;
}

function appliedHorizonNote(value:string|null|undefined){
 if(value==='lt_1y')return 'A very short horizon makes near-term loss and access more important in the research process.';
 if(value==='1_3y')return 'A shorter horizon leaves less time for a market decline to recover before the money may be needed.';
 if(value==='3_5y')return 'A medium horizon still makes timing and drawdown risk relevant when comparing structures.';
 if(value==='5_10y')return 'A longer horizon gives market cycles more time to play out, while the goal still sets the boundary.';
 if(value==='gt_10y')return 'A long horizon gives more time for market cycles, but it does not remove the possibility of loss.';
 return 'The time horizon is one of the main constraints applied after your personal DNA.';
}
function appliedLiquidityNote(value:string|null|undefined){
 if(value==='high')return 'High access needs make liquidity an important constraint when comparing investment structures.';
 if(value==='medium')return 'Some access may be needed, so flexibility remains part of the comparison.';
 if(value==='low')return 'Low near-term access needs give this money more flexibility to stay invested.';
 return 'Liquidity describes how quickly this specific money may need to become available.';
}
function appliedPrincipalNote(value:string|null|undefined){
 if(value==='yes')return 'You said the full amount must be protected when needed, so capital-loss risk is a primary compatibility constraint.';
 if(value==='no')return 'You said full principal protection is not required, but market loss is still possible and should stay visible.';
 return 'Your principal-protection preference needs to stay explicit when comparing investment structures.';
}