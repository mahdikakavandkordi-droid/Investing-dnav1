"use client";

import type {Instrument} from '@/lib/instruments';
import {researchMatchNote} from '@/lib/instrument-model';
import {useLocale} from '@/lib/locale';

const DIMENSIONS:[keyof Instrument,string,string][]=[
 ['capital_protection','Capital protection','How much the structure protects principal by contract or design.'],
 ['liquidity_level','Liquidity','How easily money can usually be accessed or sold.'],
 ['price_volatility','Price volatility','How much market value can fluctuate before maturity or sale.'],
 ['income_predictability','Income predictability','How predictable cash income is from the structure.'],
 ['growth_participation','Growth participation','How much the structure participates in market growth.'],
 ['interest_rate_sensitivity','Interest-rate sensitivity','How sensitive value or opportunity cost is to changing rates.'],
 ['diversification_level','Diversification','Whether exposure is concentrated in one issuer or spread more broadly.'],
 ['complexity_level','Complexity','How much product structure a user needs to understand.']
];

/** Shared Investment DNA card for non-fund and cross-asset structural research. */
export function InstrumentStructureCard({instrument}:{instrument:Instrument}){
 const {locale,pick}=useLocale();
 const available=DIMENSIONS.filter(([key])=>present(instrument[key]));
 return <section className="investment-dna-card instrument-structure-v2">
  <div className="investment-dna-head">
   <div>
    <div className="eyebrow">Investment DNA</div>
    <h2>{pick("What this investment is structurally built to do","Ce que la structure de ce placement est conçue pour faire")}</h2>
    <p>{pick("One common research language for comparing different investment structures.","Un langage de recherche commun pour comparer différentes structures de placement.")}</p>
   </div>
  </div>

  {available.length>0&&<div className="investment-dna-grid investment-dna-grid-v2">
   {available.map(([key,title,help])=><div className="investment-dna-axis" key={String(key)}>
    <div className="investment-dna-axis-top">
     <span>{structureLabel(title,locale)}</span>
     <strong>{displayLabel(instrument[key])}</strong>
    </div>
    <p>{structureHelp(help,locale)}</p>
   </div>)}
  </div>}

  <div className="structure-extra-list">
   {instrument.credit_exposure&&<p><span>{pick("Credit exposure","Exposition au crédit")}</span><strong>{displayLabel(instrument.credit_exposure)}</strong></p>}
   {instrument.time_structure&&<p><span>{pick("Time structure","Structure temporelle")}</span><strong>{displayLabel(instrument.time_structure)}</strong></p>}
   {instrument.principal_protection_basis&&<p><span>{pick("Protection basis","Base de protection")}</span><strong>{instrument.principal_protection_basis}</strong></p>}
  </div>

  {available.length<DIMENSIONS.length&&<p className="fine muted structure-coverage-note">{pick("Structural coverage","Couverture structurelle")}: {available.length} {pick("of","sur")} {DIMENSIONS.length} {pick("optional traits available. Missing traits are hidden rather than shown as repeated placeholders.","caractéristiques facultatives disponibles. Les caractéristiques manquantes sont masquées plutôt qu’affichées comme valeurs répétitives.")}</p>}
  <p className="fine muted">
   {locale==="fr"?pick("Structural research only; personalized DNA Match is not enabled for this asset type in this phase.","Recherche structurelle seulement; DNA Match personnalisé n’est pas activé pour ce type d’actif à cette étape."):researchMatchNote(instrument.asset_type)}
   {instrument.structure_as_of_date?locale==='fr'?` · Profil structurel en date du ${instrument.structure_as_of_date}.`:` · Structure profile as of ${instrument.structure_as_of_date}.`:''}
  </p>
 </section>;
}

function present(value:unknown){
 return value!==null&&value!==undefined&&value!=='';
}
function displayLabel(value:unknown){
 return String(value).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}


function structureLabel(value:string,locale:"en"|"fr"){
 if(locale==="en")return value;
 const map:Record<string,string>={
  "Capital protection":"Protection du capital",
  "Liquidity":"Liquidité",
  "Price volatility":"Volatilité du prix",
  "Income predictability":"Prévisibilité du revenu",
  "Growth participation":"Participation à la croissance",
  "Interest-rate sensitivity":"Sensibilité aux taux d’intérêt",
  "Diversification":"Diversification",
  "Complexity":"Complexité"
 };
 return map[value]||value;
}
function structureHelp(value:string,locale:"en"|"fr"){
 if(locale==="en")return value;
 const map:Record<string,string>={
  "How much the structure protects principal by contract or design.":"Dans quelle mesure la structure protège le capital par contrat ou par conception.",
  "How easily money can usually be accessed or sold.":"À quel point l’argent peut généralement être accessible ou vendu facilement.",
  "How much market value can fluctuate before maturity or sale.":"Dans quelle mesure la valeur de marché peut fluctuer avant l’échéance ou la vente.",
  "How predictable cash income is from the structure.":"À quel point le revenu en espèces de la structure est prévisible.",
  "How much the structure participates in market growth.":"Dans quelle mesure la structure participe à la croissance du marché.",
  "How sensitive value or opportunity cost is to changing rates.":"À quel point la valeur ou le coût d’opportunité réagit aux variations de taux.",
  "Whether exposure is concentrated in one issuer or spread more broadly.":"Si l’exposition est concentrée auprès d’un émetteur ou répartie plus largement.",
  "How much product structure a user needs to understand.":"Le niveau de structure du produit qu’un utilisateur doit comprendre."
 };
 return map[value]||value;
}
