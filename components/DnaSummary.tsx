"use client";

import Image from "next/image";
import {PortfolioBlueprint} from "@/components/PortfolioBlueprint";
import {hasCompleteInvestmentContext,score} from "@/lib/dna";
import type {DNA,PersonalizationProfile} from "@/lib/dna";
import {
 ARCHETYPES,ARCHETYPES_FR,BEHAVIOR,BEHAVIOR_FR,RISK_MATRIX,behaviorBand,displayArchetype,formatInvestmentContext,pressureInsight,riskBand,riskRelationship,standoutDecision
} from "@/lib/dna-presentation";
import {useLocale} from "@/lib/locale";


const RISK_TOLERANCE_META:Record<string,{label:string;help:string}>={
 growth_risk_tradeoff:{label:'Growth–risk trade-off',help:'How much price movement you are willing to accept in pursuit of higher long-term growth.'},
 loss_tolerance:{label:'Loss tolerance',help:'How difficult a meaningful portfolio decline would feel while your plan is unchanged.'},
 uncertainty_volatility:{label:'Uncertainty & volatility',help:'How comfortable you are with short-term uncertainty and changing market values.'},
 risk_emotion:{label:'Emotional comfort with risk',help:'How strongly the possibility of losses affects your comfort before investing.'},
 crash_resilience:{label:'Downturn resilience',help:'How strongly a major market decline would make you want to reduce risk.'}
};

const RISK_CAPACITY_META:Record<string,{label:string;help:string}>={
 financial_buffer:{label:'Financial buffer',help:'How much room your household cash flow has after essential costs and required debt payments.'},
 income_stability:{label:'Income stability',help:'How predictable the income supporting essential living costs is over the next year.'},
 emergency_reserve:{label:'Emergency reserve',help:'How long essential expenses could be covered without borrowing or selling these investments.'},
 financial_responsibility:{label:'Financial commitments',help:'How much required debt and essential obligations constrain the household balance sheet.'},
 loss_impact:{label:'Impact of a loss',help:'Whether a material investment loss could disrupt essential spending or an important commitment.'}
};

const EXPERIENCE_PRODUCT_LABELS:Record<string,string>={
 none:'I have not invested before',
 cash:'Cash, savings, or GICs',
 funds:'Mutual funds or unleveraged ETFs',
 stocks:'Individual stocks',
 bonds:'Individual bonds',
 complex:'Options, leveraged funds, or other complex products'
};



const RISK_TOLERANCE_META_FR:Record<string,{label:string;help:string}>={
 growth_risk_tradeoff:{label:'Compromis croissance–risque',help:'Le niveau de mouvement de prix que vous êtes prêt à accepter pour viser une croissance à long terme plus élevée.'},
 loss_tolerance:{label:'Tolérance aux pertes',help:'À quel point une baisse importante du portefeuille serait difficile à vivre si votre plan n’a pas changé.'},
 uncertainty_volatility:{label:'Incertitude et volatilité',help:'Votre confort face à l’incertitude à court terme et aux variations de valeur du marché.'},
 risk_emotion:{label:'Confort émotionnel face au risque',help:'Dans quelle mesure la possibilité de pertes influence votre confort avant d’investir.'},
 crash_resilience:{label:'Résilience aux baisses',help:'Dans quelle mesure une forte baisse du marché vous pousserait à vouloir réduire le risque.'}
};

const RISK_CAPACITY_META_FR:Record<string,{label:string;help:string}>={
 financial_buffer:{label:'Marge financière',help:'La marge restante dans les flux de trésorerie du ménage après les dépenses essentielles et les paiements de dette obligatoires.'},
 income_stability:{label:'Stabilité du revenu',help:'La prévisibilité du revenu qui soutient les dépenses essentielles au cours de la prochaine année.'},
 emergency_reserve:{label:'Fonds d’urgence',help:'La durée pendant laquelle les dépenses essentielles pourraient être couvertes sans emprunter ni vendre ces placements.'},
 financial_responsibility:{label:'Engagements financiers',help:'Dans quelle mesure les dettes obligatoires et les engagements essentiels limitent le bilan du ménage.'},
 loss_impact:{label:'Impact d’une perte',help:'Si une perte importante de placement pourrait perturber des dépenses essentielles ou un engagement important.'}
};

const EXPERIENCE_PRODUCT_LABELS_FR:Record<string,string>={
 none:'Je n’ai jamais investi',
 cash:'Liquidités, épargne ou CPG',
 funds:'Fonds communs ou FNB sans levier',
 stocks:'Actions individuelles',
 bonds:'Obligations individuelles',
 complex:'Options, fonds à effet de levier ou autres produits complexes'
};

const ARCHETYPE_CHARACTER_FILES:Record<string,string>={
 VAULT:'vault',
 ANCHOR:'anchor',
 COOLHAND:'coolhand',
 SCOUT:'scout',
 MAVERICK:'maverick',
 STRIKER:'striker',
 HOTSHOT:'charger',
 HIGHROLLER:'pathfinder',
 JACKPOT:'vanguard'
};

export function DnaSummary({dna,report,personal}:{dna:DNA;report?:DNA|null;personal?:PersonalizationProfile|null}){
 const {locale,pick}=useLocale();
 const behavioral=report?.behavioral_profile||dna.behavioral_profile||{};
 const experience=report?.experience_profile||dna.experience_profile;
 const assessmentDimensions=report?.assessment_dimensions||dna.assessment_dimensions;
 const quality=report?.quality_profile||dna.quality_profile;
 const narrative=report?.narrative||dna.narrative||{};
 const context=report?.investment_context||dna.investment_context;
 const archetype=(dna.archetype||report?.archetype||'MAVERICK').toUpperCase();
 const displayName=displayArchetype(archetype);
 const meta=(locale==='fr'?ARCHETYPES_FR:ARCHETYPES)[archetype]||{title:pick('Your Investor DNA','Votre Investor DNA'),tagline:pick('Your profile combines risk tolerance, financial capacity and decision patterns.','Votre profil combine tolérance au risque, capacité financière et habitudes de décision.')};
 const tolerance=dna.risk_tolerance??report?.risk_tolerance;
 const capacity=dna.risk_capacity??report?.risk_capacity;
 const firstName=personal?.first_name||context?.first_name?.trim()||undefined;
 const age=personal?.age??context?.age??undefined;
 const decision=standoutDecision(behavioral,locale);
 const pressure=pressureInsight(behavioral.emotional_decision_control,locale);
 const relationship=riskRelationship(tolerance,capacity,locale);
 const summary=locale==='fr'?meta.tagline:(narrative.summary||meta.tagline);
 const meaning=[relationship,decision.text,pressure.text,locale==='fr'?'':narrative.strength||''].filter((text,index,all)=>!!text&&all.indexOf(text)===index).slice(0,4);
 return <div className="dna-report dna-report-v2">
  <header className="report-part-header"><div><span>{pick("Part 1 · Your Investor DNA","Partie 1 · Votre Investor DNA")}</span><strong>{pick("Personal Profile","Profil personnel")}</strong></div><p>{pick("Understand who you are as an investor before applying that DNA to a specific goal.","Comprenez qui vous êtes comme investisseur avant d’appliquer ce DNA à un objectif précis.")}</p></header>
  <ReportHero canonicalArchetype={archetype} displayName={displayName} character={narrative.character||meta.title} tagline={summary} firstName={firstName} clarificationRecommended={!!quality?.clarification_recommended}/>
  <ProfileSnapshot context={context} personal={{first_name:firstName||'',age:age||0}} tolerance={tolerance} capacity={capacity}/>
  <ReportOverview archetype={archetype} tolerance={tolerance} capacity={capacity} meaning={meaning}/>
  <AssessmentAnswersSection profile={assessmentDimensions} behavioral={behavioral} experience={experience} quality={quality} tolerance={tolerance} capacity={capacity}/>
  <DecisionProfileSection behavioral={behavioral} strength={locale==="fr"?undefined:narrative.strength} blindSpot={locale==="fr"?undefined:narrative.blind_spot} decision={decision} pressure={pressure}/>
  <BiasSignalsSection behavioral={behavioral}/>
  <PlainEnglishSection summary={summary} decisionText={decision.text} pressureText={pressure.text}/>
  {hasCompleteInvestmentContext(context)&&<AppliedDnaSection context={context!} firstName={firstName} displayName={displayName} tolerance={tolerance} capacity={capacity}/>} 
  {hasCompleteInvestmentContext(context)&&<PortfolioBlueprint dna={{...dna,...report}} context={context!}/>}
  <p className="muted fine result-disclaimer">{pick("Educational self-assessment only. Investor DNA describes research-oriented tendencies and is not investment advice or a recommendation to buy or sell any investment.","Autoévaluation éducative seulement. Investor DNA décrit des tendances utiles à la recherche et ne constitue ni un conseil en placement ni une recommandation d’achat ou de vente.")}</p>
 </div>;
}

function ReportHero({canonicalArchetype,displayName,character,tagline,firstName,clarificationRecommended}:{canonicalArchetype:string;displayName:string;character:string;tagline:string;firstName?:string;clarificationRecommended:boolean;}){
 const {pick}=useLocale();
 return <section className={'dna-hero dna-hero-v2 dna-'+canonicalArchetype.toLowerCase()}><div className="dna-hero-scenery" aria-hidden="true"><span className="dna-hero-sun"/><span className="dna-hero-mountain mountain-a"/><span className="dna-hero-mountain mountain-b"/><span className="dna-hero-path"/></div><div className="dna-hero-copy"><div className="eyebrow">{pick("Your Investor DNA","Votre Investor DNA")}</div><p className="dna-greeting">{firstName?(pick('','')+`${firstName}, `+pick('this is your current profile.','voici votre profil actuel.')):pick('This is your current profile.','Voici votre profil actuel.')}</p><h1>{displayName}</h1><h2>{character}</h2><p className="dna-tagline">{tagline}</p>{clarificationRecommended&&<span className="consistency-pill">{pick("A few answers point in different directions","Quelques réponses pointent dans des directions différentes")}</span>}</div><div className="dna-character" aria-hidden="true"><Image src={`/archetype-characters/${ARCHETYPE_CHARACTER_FILES[canonicalArchetype]||'maverick'}.webp`} alt="" width={356} height={210} priority/></div></section>;
}

function ProfileSnapshot({context,personal,tolerance,capacity}:{context?:DNA['investment_context'];personal:PersonalizationProfile;tolerance:unknown;capacity:unknown;}){
 const {locale,pick}=useLocale();
 const rows=[
  {label:pick('Name','Nom'),value:personal.first_name||'—'},
  {label:pick('Age','Âge'),value:personal.age?String(personal.age):'—'},
  {label:pick('Risk tolerance','Tolérance au risque'),value:riskBand(tolerance,locale)},
  {label:pick('Financial capacity','Capacité financière'),value:riskBand(capacity,locale)},
  ...(context?.time_horizon?[{label:pick('Investment horizon','Horizon de placement'),value:formatInvestmentContext('time_horizon',context.time_horizon,locale)}]:[]),
  ...(context?.amount_to_invest!=null?[{label:pick('Amount considered','Montant envisagé'),value:new Intl.NumberFormat(locale==='fr'?'fr-CA':'en-CA',{style:'currency',currency:context.amount_currency||'CAD',maximumFractionDigits:0}).format(context.amount_to_invest)}]:[])
 ];
 return <section className="report-snapshot" aria-label={pick("Investor DNA summary","Résumé Investor DNA")}>{rows.map(row=><div className="report-snapshot-item" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</section>;
}

function ReportOverview({archetype,tolerance,capacity,meaning}:{archetype:string;tolerance:unknown;capacity:unknown;meaning:string[];}){
 const {pick}=useLocale();
 return <section className="report-overview-grid"><div className="report-overview-card dna-map-card"><div className="eyebrow">{pick("Your position","Votre position")}</div><h2>{pick("Investor DNA map","Carte Investor DNA")}</h2><p className="report-card-intro">{pick("Your profile combines willingness to take risk with your current financial capacity to absorb it.","Votre profil combine votre volonté de prendre du risque avec votre capacité financière actuelle à l’absorber.")}</p><div className="risk-matrix-wrap risk-matrix-wrap-v2"><div className="matrix-axis matrix-axis-y">{pick("Higher financial capacity ↑","Capacité financière plus élevée ↑")}</div><div className="risk-matrix" aria-label={pick("Investor DNA risk matrix","Matrice de risque Investor DNA")}>{RISK_MATRIX.flat().map(key=><div key={key} className={'matrix-cell '+(key===archetype?'active':'')}><span>{displayArchetype(key)}</span></div>)}</div><div className="matrix-axis matrix-axis-x">{pick("Lower risk tolerance ←","Tolérance au risque plus faible ←")} &nbsp; {pick("→ Higher risk tolerance","→ Tolérance au risque plus élevée")}</div></div><div className="overview-risk-metrics"><RiskMetric label={pick("Risk tolerance","Tolérance au risque")} value={tolerance}/><RiskMetric label={pick("Financial capacity","Capacité financière")} value={capacity}/></div></div><div className="report-overview-card meaning-card"><div className="eyebrow">{pick("What this means","Ce que cela signifie")}</div><h2>{pick("Your profile at a glance","Votre profil en un coup d’œil")}</h2><p className="report-card-intro">{pick("A short read before the deeper decision-profile section below.","Un résumé avant la section plus détaillée sur votre profil décisionnel.")}</p><div className="meaning-list">{meaning.map((text,index)=><div className="meaning-item" key={text}><span>{index+1}</span><p>{text}</p></div>)}</div></div></section>;
}
function RiskMetric({label,value}:{label:string;value:unknown}){const {locale,pick}=useLocale();
 const {locale,pick}=useLocale();const available=typeof value==='number'&&Number.isFinite(value);return <div className="overview-risk-metric"><span>{label}</span><strong>{riskBand(value)}</strong><small>{available?`${score(value)}/100`:pick('Not scored','Non noté')}</small></div>}


function AssessmentAnswersSection({profile,behavioral,experience,quality,tolerance,capacity}:{profile?:DNA['assessment_dimensions'];behavioral:Record<string,number>;experience?:DNA['experience_profile'];quality?:DNA['quality_profile'];tolerance:unknown;capacity:unknown;}){
 const {locale,pick}=useLocale();
 const rt=profile?.risk_tolerance;
 const bd=profile?.behavioral_dna;
 const rc=profile?.risk_capacity;
 const ex=profile?.investment_experience;
 const rtDimensions=rt?.dimensions||{};
 const behaviorDimensions=bd?.dimensions||behavioral||{};
 const rcDimensions=rc?.dimensions||{};
 const fallbackProducts=(experience as (DNA['experience_profile']&{owned_products?:string[]})|undefined)?.owned_products||[];
 const productLabels=locale==='fr'?EXPERIENCE_PRODUCT_LABELS_FR:EXPERIENCE_PRODUCT_LABELS;
 const products=(ex?.owned_products?.length?ex.owned_products:fallbackProducts).map(value=>productLabels[value]||value);
 const decisionExperience=ex?.decision_experience||(experienceLevel(experience?.dimensions?.decision_experience,'decision',locale));
 const downturnExperience=ex?.downturn_experience||(experienceLevel(experience?.dimensions?.downturn_experience,'downturn',locale));
 const count=profile?.question_count||28;
 return <section className="report-section report-section-v2 assessment-breakdown-section">
  <div className="assessment-breakdown-head">
   <div><div className="eyebrow">{pick("How your answers shaped the result","Comment vos réponses ont façonné le résultat")}</div><h2>{pick("Your","Votre")} Investor DNA · {count} {pick("answers","réponses")}</h2><p className="report-lede">{pick("Your archetype is only the headline. The assessment combines four separate layers so you can see what is driving the result instead of getting a black-box label.","Votre archétype n’est que le titre. L’évaluation combine quatre couches distinctes afin que vous puissiez voir ce qui influence le résultat plutôt que de recevoir une étiquette opaque.")}</p></div>
   <div className="assessment-count-ring" aria-label={`${count} ${pick("assessment questions","questions d’évaluation")}`}><strong>{count}</strong><span>{pick("answers","réponses")}</span></div>
  </div>
  <div className="assessment-source-strip" aria-label={pick("Assessment sections","Sections de l’évaluation")}>
   <span><b>{rt?.answer_count??10}</b> {pick("Risk tolerance","Tolérance au risque")}</span>
   <span><b>{bd?.answer_count??10}</b> {pick("Behavioral DNA","DNA comportemental")}</span>
   <span><b>{rc?.answer_count??5}</b> {pick("Financial capacity","Capacité financière")}</span>
   <span><b>{ex?.answer_count??3}</b> {pick("Experience","Expérience")}</span>
  </div>

  <div className="assessment-dimension-layout">
   <DimensionPanel
    tone="tolerance"
    eyebrow={pick("10 answers · willingness","10 réponses · volonté")}
    title={pick("Risk tolerance","Tolérance au risque")}
    overall={rt?.overall_score??(typeof tolerance==='number'?tolerance:undefined)}
    intro={pick("This is about the amount of uncertainty and market movement you can emotionally live with. It is separate from whether your finances can afford the loss.","Il s’agit du niveau d’incertitude et de mouvement des marchés que vous pouvez émotionnellement tolérer. Cela reste distinct de la capacité de vos finances à absorber une perte.")}
    dimensions={rtDimensions}
    meta={locale==="fr"?RISK_TOLERANCE_META_FR:RISK_TOLERANCE_META}
   />
   <DimensionPanel
    tone="capacity"
    eyebrow={pick("5 answers · ability","5 réponses · capacité")}
    title={pick("Financial capacity","Capacité financière")}
    overall={rc?.overall_score??(typeof capacity==='number'?capacity:undefined)}
    intro={pick("This measures your financial ability to absorb losses. A household constraint can cap capacity even when the raw answers would otherwise produce a higher score.","Cela mesure votre capacité financière à absorber des pertes. Une contrainte du ménage peut plafonner cette capacité même si les réponses brutes donneraient autrement un score plus élevé.")}
    dimensions={rcDimensions}
    meta={locale==="fr"?RISK_CAPACITY_META_FR:RISK_CAPACITY_META}
    note={typeof rc?.guard?.reason==='string'?rc.guard.reason:undefined}
   />
  </div>

  <div className="assessment-subsection">
   <div className="assessment-subsection-title"><div><div className="eyebrow">{pick("10 answers · decision behaviour","10 réponses · comportement décisionnel")}</div><h3>{pick("Behavioral DNA","DNA comportemental")}</h3></div><p>{pick("These scores describe decision tendencies — not intelligence, skill or a grade.","Ces scores décrivent des tendances décisionnelles — pas l’intelligence, la compétence ou une note.")}</p></div>
   <div className="answer-dimension-grid behavior-answer-grid">{Object.entries(locale==="fr"?BEHAVIOR_FR:BEHAVIOR).map(([key,meta])=><AnswerDimensionCard key={key} label={meta.label} help={meta.help} value={behaviorDimensions[key]} band={behaviorBand(key,behaviorDimensions[key],locale)}/>)}</div>
  </div>

  <div className="assessment-subsection experience-subsection">
   <div className="assessment-subsection-title"><div><div className="eyebrow">{pick("3 answers · context only","3 réponses · contexte seulement")}</div><h3>{pick("Investment experience","Expérience en placement")}</h3></div><p>{pick("Experience adds context to the report. It does not make your risk tolerance or financial capacity score higher.","L’expérience ajoute du contexte au rapport. Elle n’augmente pas votre score de tolérance au risque ni votre capacité financière.")}</p></div>
   <div className="experience-answer-grid">
    <article><span>{pick("Decision-making experience","Expérience de prise de décision")}</span><strong>{decisionExperience||pick('Not available','Non disponible')}</strong></article>
    <article><span>{pick("Experience through a broad market decline","Expérience d’une baisse générale du marché")}</span><strong>{downturnExperience||pick('Not available','Non disponible')}</strong></article>
    <article className="experience-products"><span>{pick("Products personally owned and followed","Produits détenus et suivis personnellement")}</span><div>{products.length?products.map(product=><em key={product}>{product}</em>):<strong>Not available</strong>}</div></article>
   </div>
  </div>

  <div className="assessment-quality-note">
   <span aria-hidden="true">✓</span>
   <p><strong>{pick("Response-quality check:","Vérification de la qualité des réponses :")}</strong> {quality?.clarification_recommended?pick('A couple of related answers are far enough apart that they are worth reviewing.','Quelques réponses liées sont suffisamment éloignées pour mériter une révision.'):pick('No clarification flag is currently raised.','Aucun signal de clarification n’est actuellement soulevé.')} {pick("These checks are discussion prompts only and do not change your risk scores.","Ces vérifications servent uniquement de points de discussion et ne modifient pas vos scores de risque.")}</p>
  </div>
 </section>;
}

function DimensionPanel({tone,eyebrow,title,overall,intro,dimensions,meta,note}:{tone:string;eyebrow:string;title:string;overall?:number;intro:string;dimensions:Record<string,number>;meta:Record<string,{label:string;help:string}>;note?:string;}){
 const {pick}=useLocale();
 const available=typeof overall==='number'&&Number.isFinite(overall);
 return <div className={'assessment-dimension-panel '+tone}>
  <header><div><div className="eyebrow">{eyebrow}</div><h3>{title}</h3></div><div className="dimension-overall"><span>{pick("Overall","Global")}</span><strong>{available?Math.round(overall!):'—'}</strong><small>{available?'/100':''}</small></div></header>
  <p className="dimension-intro">{intro}</p>
  <div className="answer-dimension-list">{Object.entries(meta).map(([key,item])=><AnswerDimensionRow key={key} label={item.label} help={item.help} value={dimensions[key]}/>)}</div>
  {note&&<div className="capacity-guard-note"><b>{pick("Capacity guard applied","Garde-fou de capacité appliqué")}</b><span>{note}</span></div>}
 </div>;
}
function AnswerDimensionRow({label,help,value}:{label:string;help:string;value:unknown}){
 const {locale,pick}=useLocale();
 const available=typeof value==='number'&&Number.isFinite(value);
 const numeric=available?Math.max(0,Math.min(100,value)):0;
 return <div className="answer-dimension-row"><div className="answer-dimension-copy"><span>{label}</span><small>{help}</small></div><div className="answer-dimension-score"><b>{available?dimensionBand(numeric,locale):pick('Not available','Non disponible')}</b><em>{available?`${Math.round(numeric)}/100`:'—'}</em><div className="answer-scorebar">{available&&<i style={{width:`${numeric}%`}}/>}</div></div></div>;
}
function AnswerDimensionCard({label,help,value,band}:{label:string;help:string;value:unknown;band:string}){
 const {pick}=useLocale();
 const available=typeof value==='number'&&Number.isFinite(value);
 const numeric=available?Math.max(0,Math.min(100,value)):0;
 return <article className="answer-dimension-card"><header><span>{label}</span><strong>{available?band:pick('Not available','Non disponible')}</strong></header><div className="answer-scorebar">{available&&<i style={{width:`${numeric}%`}}/>}</div><div className="answer-card-score">{available?`${Math.round(numeric)}/100`:'—'}</div><p>{help}</p></article>;
}
function dimensionBand(value:number,locale:'en'|'fr'='en'){if(value<40)return locale==='fr'?'Faible':'Lower';if(value<70)return locale==='fr'?'Modéré':'Moderate';return locale==='fr'?'Élevé':'Higher'}
function experienceLevel(value:unknown,kind:'decision'|'downturn',locale:'en'|'fr'='en'){
 if(typeof value!=='number'||!Number.isFinite(value))return '';
 const n=Math.max(0,Math.min(3,Math.round(value)));
 if(kind==='decision')return (locale==='fr'?['Je n’ai jamais investi','Moins de 2 ans','2 à 5 ans','Plus de 5 ans']:['I have not invested before','Less than 2 years','2–5 years','More than 5 years'])[n];
 return (locale==='fr'?['Non','J’en ai vu une, mais j’avais peu d’argent investi','Oui, une fois','Oui, plus d’une fois']:['No','I saw one happen, but had little money invested','Yes, once','Yes, more than once'])[n];
}

function DecisionProfileSection({behavioral,strength,blindSpot,decision,pressure}:{behavioral:Record<string,number>;strength?:string;blindSpot?:string;decision:{label:string;text:string};pressure:{label:string;text:string};}){
 const {locale,pick}=useLocale();
 return <section className="report-section report-section-v2"><div className="eyebrow">{pick("How you decide","Comment vous décidez")}</div><h2>{pick("Your decision fingerprint","Votre empreinte décisionnelle")}</h2><p className="report-lede">{pick("These are tendencies, not grades. They describe what may pull your decisions in different directions.","Ce sont des tendances, pas des notes. Elles décrivent ce qui peut tirer vos décisions dans différentes directions.")}</p><div className="behavior-grid">{Object.entries(locale==="fr"?BEHAVIOR_FR:BEHAVIOR).map(([key,meta])=><BehaviorCard key={key} label={meta.label} help={meta.help} band={behaviorBand(key,behavioral[key],locale)} value={behavioral[key]}/>)}</div><div className="decision-cards"><DecisionCard icon="↗" kicker={pick("Your clearest decision tendency","Votre tendance décisionnelle la plus claire")} label={decision.label} text={decision.text}/><DecisionCard icon="≈" kicker={pick("When markets get stressful","Quand les marchés deviennent stressants")} label={pressure.label} text={pressure.text}/></div><div className="strength-watch-grid"><InsightCard className="strength-card" icon="✓" kicker={pick("Your strengths","Vos forces")} title={pick("What may work in your favour","Ce qui peut jouer en votre faveur")} text={strength||pick('No single behavioral dimension stands out strongly enough yet to call it a clear strength.','Aucune dimension comportementale ne ressort encore assez fortement pour être qualifiée de force claire.')}/><InsightCard className="watch-card" icon="!" kicker={pick("Worth watching","À surveiller")} title={pick("Where your process may need support","Où votre processus peut avoir besoin de soutien")} text={blindSpot||pick('No single behavioral watchpoint stands out strongly enough yet.','Aucun point de vigilance comportemental ne ressort encore suffisamment.')}/></div></section>;
}
function BehaviorCard({label,help,band,value}:{label:string;help:string;band:string;value:unknown}){const {pick}=useLocale();
 const {locale,pick}=useLocale();const available=typeof value==='number'&&Number.isFinite(value);const width=available?Math.max(0,Math.min(100,value)):0;return <div className="behavior-card"><div className="behavior-card-top"><span>{label}</span><strong>{band}</strong></div><div className="scorebar">{available&&<div style={{width:`${width}%`}}/>}</div><p>{available?help:pick('Not enough data is available to describe this tendency yet.','Les données ne sont pas encore suffisantes pour décrire cette tendance.')}</p></div>}
function DecisionCard({icon,kicker,label,text}:{icon:string;kicker:string;label:string;text:string}){return <div className="decision-card"><span className="decision-icon">{icon}</span><div><small>{kicker}</small><h3>{label}</h3><p>{text}</p></div></div>}
function InsightCard({className,icon,kicker,title,text}:{className:string;icon:string;kicker:string;title:string;text:string;}){return <div className={'insight-card '+className}><span className="insight-icon">{icon}</span><div><small>{kicker}</small><h3>{title}</h3><p>{text}</p></div></div>}

function BiasSignalsSection({behavioral}:{behavioral:Record<string,number>}){
 const {locale,pick}=useLocale();
 const items=locale==='fr'?[
  {key:'decision_independence',icon:'↔',category:'Cognitif',title:'Influence sociale',body:'Dans quelle mesure l’enthousiasme ou la peur des autres peut entrer dans votre propre décision de placement.'},
  {key:'long_term_orientation',icon:'◷',category:'Cognitif',title:'Sensibilité à la récence',body:'Dans quelle mesure les gagnants, les perdants ou les manchettes récentes peuvent modifier ce qui vous semble attrayant.'},
  {key:'reference_flexibility',icon:'⌖',category:'Cognitif',title:'Tendance à l’ancrage',body:'Dans quelle mesure le prix payé peut rester un point de référence quand vous réévaluez un placement.'},
  {key:'evidence_discipline',icon:'◇',category:'Cognitif',title:'Tendance à la confirmation',body:'Dans quelle mesure il est facile de continuer à tester une idée préférée face à des preuves qui la contredisent.'},
  {key:'emotional_decision_control',icon:'≈',category:'Émotionnel',title:'Réaction aux pertes et au regret',body:'Dans quelle mesure des pertes brusques ou le regret peuvent créer une pression pour changer de cap.'}
 ]:[
  {key:'decision_independence',icon:'↔',category:'Cognitive',title:'Social influence',body:'How easily other people’s excitement or fear can enter your own investment decision.'},
  {key:'long_term_orientation',icon:'◷',category:'Cognitive',title:'Recency sensitivity',body:'How strongly recent winners, losers or market headlines may change what feels attractive.'},
  {key:'reference_flexibility',icon:'⌖',category:'Cognitive',title:'Anchoring tendency',body:'How much the price you paid may remain a reference point when you reassess an investment.'},
  {key:'evidence_discipline',icon:'◇',category:'Cognitive',title:'Confirmation tendency',body:'How easy it is to keep testing a preferred idea against evidence that disagrees with it.'},
  {key:'emotional_decision_control',icon:'≈',category:'Emotional',title:'Loss & regret response',body:'How strongly sharp losses or regret may create pressure to change course.'}
 ];
 return <section className="report-section report-section-v2"><div className="eyebrow">{pick("Decision traps","Pièges décisionnels")}</div><h2>{pick("Your cognitive & emotional bias signals","Vos signaux de biais cognitifs et émotionnels")}</h2><p className="report-lede">{pick("These are possible tendencies inferred from your answer pattern — not diagnoses and not permanent labels.","Il s’agit de tendances possibles déduites de votre profil de réponses — pas de diagnostics ni d’étiquettes permanentes.")}</p><div className="bias-signal-grid">{items.map(item=>{const value=behavioral[item.key];const status=signalStatus(value,locale);return <article className="bias-signal-card" key={item.key}><header><span className="bias-icon">{item.icon}</span><em>{item.category}</em></header><h3>{item.title}</h3><p>{item.body}</p><span className={'bias-status '+status.className}>{status.label}</span></article>})}</div><p className="bias-explainer">{pick("A lower score on the underlying behavior dimension can make the related decision trap more worth watching. Context and real behavior still matter.","Un score plus faible sur la dimension comportementale sous-jacente peut rendre le piège associé plus important à surveiller. Le contexte et le comportement réel restent essentiels.")}</p></section>;
}
function signalStatus(value:unknown,locale:'en'|'fr'='en'){if(typeof value!=='number'||!Number.isFinite(value))return {label:locale==='fr'?'Données insuffisantes':'Not enough data',className:'unavailable'};if(value<40)return {label:locale==='fr'?'À surveiller':'Worth watching',className:'watch'};if(value<60)return {label:locale==='fr'?'Signal possible':'Possible signal',className:'possible'};return {label:locale==='fr'?'Signal plus faible':'Lower signal',className:''}}

function PlainEnglishSection({summary,decisionText,pressureText}:{summary:string;decisionText:string;pressureText:string}){const {pick}=useLocale();
 const {locale,pick}=useLocale();return <section className="report-section report-story report-story-v2"><div className="eyebrow">{pick("Your profile in plain English","Votre profil en langage clair")}</div><h2>{pick("The longer read","Lecture détaillée")}</h2><p>{summary}</p><p>{decisionText}</p><p>{pressureText}</p></section>}

function AppliedDnaSection({context,firstName,displayName,tolerance,capacity}:{context:NonNullable<DNA['investment_context']>;firstName?:string;displayName:string;tolerance:unknown;capacity:unknown}){
 const {locale,pick}=useLocale();
 const amount=context.amount_to_invest==null?pick('Not specified','Non précisé'):new Intl.NumberFormat(locale==='fr'?'fr-CA':'en-CA',{style:'currency',currency:context.amount_currency||'CAD',maximumFractionDigits:0}).format(context.amount_to_invest);
 const goal=formatInvestmentContext('goal',context.goal,locale);
 const horizon=formatInvestmentContext('time_horizon',context.time_horizon,locale);
 const liquidity=formatInvestmentContext('liquidity_need',context.liquidity_need,locale);
 const principal=formatInvestmentContext('principal_required',context.principal_required,locale);
 const values=[[pick('Goal','Objectif'),goal],[pick('Time horizon','Horizon'),horizon],[pick('Amount','Montant'),amount],[pick('Liquidity need','Besoin de liquidité'),liquidity]];
 const alignment=[
  {label:pick('Risk comfort','Confort face au risque'),value:riskBand(tolerance,locale),kind:pick('Personal DNA','DNA personnel'),body:pick('Your willingness to live with market movement stays part of your personal profile.','Votre volonté de vivre avec les mouvements du marché reste une partie de votre profil personnel.')},
  {label:pick('Financial capacity','Capacité financière'),value:riskBand(capacity,locale),kind:pick('Personal DNA','DNA personnel'),body:pick('Your ability to absorb investment loss stays separate from the purpose of this money.','Votre capacité à absorber une perte de placement reste distincte de l’objectif de cet argent.')},
  {label:pick('Time horizon','Horizon'),value:horizon,kind:pick('Goal context','Contexte de l’objectif'),body:appliedHorizonNote(context.time_horizon,locale)},
  {label:pick('Liquidity need','Besoin de liquidité'),value:liquidity,kind:pick('Goal context','Contexte de l’objectif'),body:appliedLiquidityNote(context.liquidity_need,locale)}
 ];
 const considerations=[
  appliedPrincipalNote(context.principal_required,locale),
  appliedHorizonNote(context.time_horizon,locale),
  appliedLiquidityNote(context.liquidity_need,locale),
  locale==='fr'?`Gardez « ${goal} » comme objectif de cet argent lorsque vous comparez les structures de placement et les signaux de compatibilité.`:`Keep “${goal}” as the purpose of this money when you compare investment structures and compatibility signals.`
 ];
 return <section className="report-section applied-dna-section">
  <div className="applied-dna-hero">
   <div className="applied-dna-heading"><div><div className="eyebrow">{pick("Part 2 · Applied DNA","Partie 2 · DNA appliqué")}</div><h2>{firstName?(locale==='fr'?`${firstName}, un chemin plus clair pour cet objectif.`:`${firstName}, a clearer path for this goal.`):pick('A clearer path for this goal.','Un chemin plus clair pour cet objectif.')}</h2><p>{pick("Same investor. New context. Your personal Investor DNA stays the foundation while this goal adds horizon, access and protection constraints.","Même investisseur. Nouveau contexte. Votre Investor DNA personnel reste la base tandis que cet objectif ajoute des contraintes d’horizon, d’accès et de protection.")}</p></div><span className="identity-chip">{displayName} · {pick("same DNA","même DNA")}</span></div>
   <div className="applied-dna-scenery" aria-hidden="true"><span className="applied-sun"/><span className="applied-ridge back"/><span className="applied-ridge front"/><span className="applied-path"/></div>
  </div>
  <div className="applied-context-grid">{values.map(([label,value])=><div className="applied-context-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  <div className="applied-insight-grid">
   <div className="applied-alignment-panel"><div className="eyebrow">{pick("Your DNA vs this goal","Votre DNA et cet objectif")}</div><h3>{pick("What stays personal, and what comes from the goal","Ce qui reste personnel et ce qui vient de l’objectif")}</h3><div className="applied-alignment-list">{alignment.map(item=><div className="applied-alignment-row" key={item.label}><span className="applied-alignment-icon">✓</span><div><small>{item.kind}</small><strong>{item.label} · {item.value}</strong><p>{item.body}</p></div></div>)}</div></div>
   <aside className="applied-considerations"><div className="eyebrow">{pick("Key considerations","Considérations clés")}</div><h3>{pick("Keep these constraints visible","Gardez ces contraintes visibles")}</h3><ul>{considerations.map(item=><li key={item}>{item}</li>)}</ul><div className="applied-protection"><span>{pick("Principal protection","Protection du capital")}</span><strong>{principal}</strong></div></aside>
  </div>
  <div className="applied-principle"><b>↗</b><p><strong>{pick("Your DNA does not change when your goal changes.","Votre DNA ne change pas lorsque votre objectif change.")}</strong> {pick("What can change is which investment structures are compatible with this specific money. Compatibility is research context, not a recommendation.","Ce qui peut changer, ce sont les structures de placement compatibles avec cet argent précis. La compatibilité est un contexte de recherche, pas une recommandation.")}</p></div>
 </section>;
}

function appliedHorizonNote(value:string|null|undefined,locale:'en'|'fr'='en'){
 if(value==='lt_1y')return locale==='fr'?'Un horizon très court rend les pertes à court terme et l’accès aux fonds plus importants dans le processus de recherche.':'A very short horizon makes near-term loss and access more important in the research process.';
 if(value==='1_3y')return locale==='fr'?'Un horizon plus court laisse moins de temps à une baisse du marché pour se rétablir avant que l’argent puisse être nécessaire.':'A shorter horizon leaves less time for a market decline to recover before the money may be needed.';
 if(value==='3_5y')return locale==='fr'?'Un horizon moyen rend encore pertinents le calendrier et le risque de baisse lors de la comparaison des structures.':'A medium horizon still makes timing and drawdown risk relevant when comparing structures.';
 if(value==='5_10y')return locale==='fr'?'Un horizon plus long donne plus de temps aux cycles de marché, tandis que l’objectif continue de fixer les limites.':'A longer horizon gives market cycles more time to play out, while the goal still sets the boundary.';
 if(value==='gt_10y')return locale==='fr'?'Un horizon long donne plus de temps aux cycles de marché, mais n’élimine pas la possibilité de pertes.':'A long horizon gives more time for market cycles, but it does not remove the possibility of loss.';
 return locale==='fr'?'L’horizon est l’une des principales contraintes appliquées après votre DNA personnel.':'The time horizon is one of the main constraints applied after your personal DNA.';
}
function appliedLiquidityNote(value:string|null|undefined,locale:'en'|'fr'='en'){
 if(value==='high')return locale==='fr'?'Des besoins d’accès élevés font de la liquidité une contrainte importante lors de la comparaison des structures de placement.':'High access needs make liquidity an important constraint when comparing investment structures.';
 if(value==='medium')return locale==='fr'?'Un certain accès peut être nécessaire; la flexibilité reste donc une partie de la comparaison.':'Some access may be needed, so flexibility remains part of the comparison.';
 if(value==='low')return locale==='fr'?'De faibles besoins d’accès à court terme donnent à cet argent plus de flexibilité pour rester investi.':'Low near-term access needs give this money more flexibility to stay invested.';
 return locale==='fr'?'La liquidité décrit à quelle vitesse cet argent précis pourrait devoir devenir disponible.':'Liquidity describes how quickly this specific money may need to become available.';
}
function appliedPrincipalNote(value:string|null|undefined,locale:'en'|'fr'='en'){
 if(value==='yes')return locale==='fr'?'Vous avez indiqué que le montant total doit être protégé au moment voulu; le risque de perte en capital est donc une contrainte principale de compatibilité.':'You said the full amount must be protected when needed, so capital-loss risk is a primary compatibility constraint.';
 if(value==='no')return locale==='fr'?'Vous avez indiqué qu’une protection complète du capital n’est pas requise, mais une perte de marché reste possible et doit demeurer visible.':'You said full principal protection is not required, but market loss is still possible and should stay visible.';
 return locale==='fr'?'Votre préférence de protection du capital doit rester explicite lors de la comparaison des structures de placement.':'Your principal-protection preference needs to stay explicit when comparing investment structures.';
}