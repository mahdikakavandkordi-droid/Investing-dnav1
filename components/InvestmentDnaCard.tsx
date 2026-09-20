"use client";

import type {InvestmentDna} from "@/lib/investments";
import {useLocale} from "@/lib/locale";

type SignalKey='growth_score'|'income_score'|'stability_score'|'diversification_score';
const AXES:[SignalKey,string,string][]=[
  ['growth_score','Growth orientation','How strongly the fund’s strategic asset mix leans toward long-term growth.'],
  ['income_score','Income orientation','How strongly income is part of the fund’s intended role.'],
  ['stability_score','Stability orientation','How strongly the structure leans toward a steadier, more defensive mix.'],
  ['diversification_score','Exposure breadth','Breadth across asset classes and meaningful geographic regions — not the number of individual holdings.'],
];
function n(value:unknown){const x=Number(value);return Number.isFinite(x)?Math.max(0,Math.min(100,x)):null;}
function band(key:SignalKey,value:unknown,locale:"en"|"fr"="en"){
  const x=n(value);if(x===null)return locale==='fr'?'Non disponible':'Not available';
  if(key==='growth_score') return x<40?(locale==='fr'?'Faible':'Lower'):x<75?(locale==='fr'?'Modéré':'Moderate'):(locale==='fr'?'Élevé':'Higher');
  if(key==='income_score') return x<20?(locale==='fr'?'Faible':'Lower'):x<60?(locale==='fr'?'Modéré':'Moderate'):(locale==='fr'?'Élevé':'Higher');
  if(key==='stability_score') return x<35?(locale==='fr'?'Faible':'Lower'):x<70?(locale==='fr'?'Modéré':'Moderate'):(locale==='fr'?'Élevé':'Higher');
  return x<45?(locale==='fr'?'Faible':'Lower'):x<75?(locale==='fr'?'Modéré':'Moderate'):(locale==='fr'?'Élevé':'Higher');
}
function dateLabel(value?:string,locale:"en"|"fr"="en"){if(!value)return null;const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat(locale==='fr'?'fr-CA':'en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);}

export function InvestmentDnaCard({dna}:{dna:InvestmentDna}){
  const {locale,pick}=useLocale();
  const official=dna.official_risk_rating||dna.risk_band;
  const sourceDate=dateLabel(dna.official_risk_source_date,locale);
  const equity=n(dna.equity_pct);
  const fixed=n(dna.fixed_income_pct);
  const explanation=(dna.explanation&&typeof dna.explanation==='object'?dna.explanation:null) as null|{signal_inputs?:{meaningful_geographic_regions?:number}};
  const regions=Number(explanation?.signal_inputs?.meaningful_geographic_regions);
  const inputs=[
    equity!==null?`${Math.round(equity)}% ${pick('equity','actions')}`:null,
    fixed!==null?`${Math.round(fixed)}% ${pick('fixed income','revenu fixe')}`:null,
    Number.isFinite(regions)&&regions>0?(locale==='fr'?`${regions} région${regions===1?'':'s'} géographique${regions===1?'':'s'} significative${regions===1?'':'s'}`:`${regions} meaningful geographic region${regions===1?'':'s'}`):null,
    official?`${pick('Official risk','Risque officiel')}: ${official}`:null,
  ].filter(Boolean).join(' · ');

  return <section className="investment-dna-card">
    <div className="investment-dna-head">
      <div><div className="eyebrow">Investment DNA</div><h2>{pick("What this investment is built to do","Ce que ce placement est conçu pour faire")}</h2><p>{pick("Start with the fund manager’s official Canadian risk rating. Then use a small set of transparent profile signals to understand the fund’s role and trade-offs.","Commencez par la cote de risque canadienne officielle du gestionnaire. Utilisez ensuite quelques signaux transparents pour comprendre le rôle du fonds et ses compromis.")}</p></div>
    </div>

    <div className="official-risk-card">
      <div className="official-risk-copy">
        <span className="official-risk-kicker">{pick("Official risk rating","Cote de risque officielle")}</span>
        <strong>{official||pick('Not available','Non disponible')}</strong>
        <p>{dna.official_risk_issuer?`${dna.official_risk_issuer} reports this rating in its official disclosure.`:pick('Official issuer risk data is not available for this investment yet.','Les données officielles de risque de l’émetteur ne sont pas encore disponibles pour ce placement.')}</p>
      </div>
      {dna.official_risk_source_url&&<div className="official-risk-source">
        <span>Source: {dna.official_risk_issuer||dna.official_risk_source_type||pick('Official issuer','Émetteur officiel')}{sourceDate?` · ${sourceDate}`:''}</span>
        <a href={dna.official_risk_source_url} target="_blank" rel="noreferrer">{pick("View official source ↗","Voir la source officielle ↗")}</a>
      </div>}
    </div>
    <p className="official-risk-method">{pick("This is the issuer-disclosed Canadian risk classification. It is not an Investing DNA score and it does not predict future losses or returns.","Il s’agit de la classification canadienne du risque communiquée par l’émetteur. Ce n’est pas un score Investing DNA et elle ne prédit ni les pertes ni les rendements futurs.")}</p>

    <div className="investment-dna-subhead"><h3>{pick("Investment DNA signals","Signaux Investment DNA")}</h3><p>{pick("These are broad research labels, not regulatory ratings or precise 0–100 measurements. Each label is generated from a fixed rule set using fund-structure data.","Ce sont des libellés de recherche généraux, pas des cotes réglementaires ni des mesures précises de 0 à 100. Chaque libellé est produit par un ensemble fixe de règles fondées sur la structure du fonds.")}</p></div>
    <div className="investment-dna-grid">
      {AXES.map(([key,label,help])=>{const value=n(dna[key]);return <div className="investment-dna-axis" key={key}>
        <div className="investment-dna-axis-top"><span>{label}</span><strong>{value===null?'—':band(key,value,locale)}</strong></div>
        <p>{help}</p>
      </div>})}
    </div>

    {inputs&&<p className="investment-dna-inputs"><strong>{pick("Inputs used for this fund:","Données utilisées pour ce fonds :")}</strong> {inputs}</p>}

    <details className="investment-dna-methodology">
      <summary>{pick("How we derive these signals","Comment ces signaux sont calculés")}</summary>
      <div>
        <p><strong>{pick("Growth orientation:","Orientation croissance :")}</strong> {pick("the strategic equity allocation. A larger equity share produces a stronger growth orientation.","la répartition stratégique en actions. Une part plus élevée d’actions renforce l’orientation croissance.")}</p>
        <p><strong>{pick("Income orientation:","Orientation revenu :")}</strong> {pick("80% comes from the fixed-income share and 20% from whether the fund’s stated objective explicitly includes income. Distribution frequency by itself does not raise this signal.","80 % provient de la part de revenu fixe et 20 % du fait que l’objectif déclaré du fonds mentionne explicitement le revenu. La fréquence des distributions, à elle seule, n’augmente pas ce signal.")}</p>
        <p><strong>{pick("Stability orientation:","Orientation stabilité :")}</strong> {pick("60% comes from fixed-income allocation and 40% from the inverse of the issuer’s official risk category.","60 % provient de la répartition en revenu fixe et 40 % de l’inverse de la catégorie de risque officielle de l’émetteur.")}</p>
        <p><strong>{pick("Exposure breadth:","Étendue de l’exposition :")}</strong> {pick("70% reflects the number of meaningful geographic regions and 30% reflects whether the strategic allocation spans both equities and fixed income.","70 % reflète le nombre de régions géographiques significatives et 30 % indique si la répartition stratégique couvre à la fois les actions et le revenu fixe.")}</p>
        <p>{pick("The Lower / Moderate / Higher labels use fixed cut points specific to each axis; they are not market percentiles. We do not use current holdings count because holdings coverage is not yet complete enough across every ETF.","Les libellés Faible / Modéré / Élevé utilisent des seuils fixes propres à chaque axe; ce ne sont pas des percentiles du marché. Nous n’utilisons pas le nombre actuel de positions, car la couverture des placements détenus n’est pas encore assez complète pour tous les FNB.")}</p>
        <p>{pick("These labels support discovery and compatibility. They do not replace the issuer’s official risk rating and are not a recommendation to buy or sell.","Ces libellés servent à la découverte et à la compatibilité. Ils ne remplacent pas la cote de risque officielle de l’émetteur et ne constituent pas une recommandation d’achat ou de vente.")}</p>
      </div>
    </details>
  </section>;
}
