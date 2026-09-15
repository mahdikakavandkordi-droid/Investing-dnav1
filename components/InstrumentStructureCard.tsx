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
 ['complexity_level','Complexity','How much product structure a user needs to understand.'],
];

function label(value:unknown){if(value===null||value===undefined||value==='')return 'Not available';return String(value).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}

export function InstrumentStructureCard({instrument}:{instrument:Instrument}){
 return <section className="investment-dna-card">
  <div className="investment-dna-head"><div><div className="eyebrow">Investment DNA</div><h2>What this {assetLabel(instrument.asset_type).toLowerCase()} is structurally built to do</h2><p>These labels put different investment structures into one common research language. They are descriptive research labels, not regulatory ratings or a recommendation.</p></div></div>
  <div className="investment-dna-grid">{DIMENSIONS.map(([key,title,help])=><div className="investment-dna-axis" key={String(key)}><div className="investment-dna-axis-top"><span>{title}</span><strong>{label(instrument[key])}</strong></div><p>{help}</p></div>)}</div>
  {instrument.credit_exposure&&<p className="investment-dna-inputs"><strong>Credit exposure:</strong> {label(instrument.credit_exposure)}</p>}
  {instrument.time_structure&&<p className="investment-dna-inputs"><strong>Time structure:</strong> {label(instrument.time_structure)}</p>}
  {instrument.principal_protection_basis&&<p className="investment-dna-inputs"><strong>Protection basis:</strong> {instrument.principal_protection_basis}</p>}
  <p className="fine muted">{researchMatchNote(instrument.asset_type)}{instrument.structure_as_of_date?` · Structure profile as of ${instrument.structure_as_of_date}.`:''}</p>
 </section>;
}
