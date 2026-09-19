import type {Instrument} from '@/lib/instruments';
import {assetLabel,researchMatchNote} from '@/lib/instrument-model';

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
 const available=DIMENSIONS.filter(([key])=>present(instrument[key]));
 return <section className="investment-dna-card instrument-structure-v2">
  <div className="investment-dna-head">
   <div>
    <div className="eyebrow">Investment DNA</div>
    <h2>What this {assetLabel(instrument.asset_type).toLowerCase()} is structurally built to do</h2>
    <p>One common research language for comparing different investment structures.</p>
   </div>
  </div>

  {available.length>0&&<div className="investment-dna-grid investment-dna-grid-v2">
   {available.map(([key,title,help])=><div className="investment-dna-axis" key={String(key)}>
    <div className="investment-dna-axis-top">
     <span>{title}</span>
     <strong>{displayLabel(instrument[key])}</strong>
    </div>
    <p>{help}</p>
   </div>)}
  </div>}

  <div className="structure-extra-list">
   {instrument.credit_exposure&&<p><span>Credit exposure</span><strong>{displayLabel(instrument.credit_exposure)}</strong></p>}
   {instrument.time_structure&&<p><span>Time structure</span><strong>{displayLabel(instrument.time_structure)}</strong></p>}
   {instrument.principal_protection_basis&&<p><span>Protection basis</span><strong>{instrument.principal_protection_basis}</strong></p>}
  </div>

  {available.length<DIMENSIONS.length&&<p className="fine muted structure-coverage-note">Structural coverage: {available.length} of {DIMENSIONS.length} optional traits available. Missing traits are hidden rather than shown as repeated placeholders.</p>}
  <p className="fine muted">
   {researchMatchNote(instrument.asset_type)}
   {instrument.structure_as_of_date?` · Structure profile as of ${instrument.structure_as_of_date}.`:''}
  </p>
 </section>;
}

function present(value:unknown){
 return value!==null&&value!==undefined&&value!=='';
}
function displayLabel(value:unknown){
 return String(value).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}
