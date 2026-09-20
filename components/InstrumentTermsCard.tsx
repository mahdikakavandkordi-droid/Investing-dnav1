"use client";

import type {Instrument} from '@/lib/instruments';
import {assetTypeOf} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';
import {useLocale} from '@/lib/locale';

/** Asset-specific research facts kept separate from shared Investment DNA traits. */
export function InstrumentTermsCard({instrument}:{instrument:Instrument}){
 const {locale}=useLocale();
 const type=assetTypeOf(instrument);

 if(type==='GIC')return <DepositTerms instrument={instrument} locale={locale}/>;
 if(type==='BOND'||type==='T_BILL'||type==='COMMERCIAL_PAPER'||type==='ABCP'){
  return <FixedIncomeTerms instrument={instrument} type={type} locale={locale}/>;
 }
 return null;
}

function DepositTerms({instrument,locale}:{instrument:Instrument;locale:"en"|"fr"}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 const rows=[
  instrument.deposit_rate_pct==null?null:{label:pick('Annual rate','Taux annuel'),value:formatMetric(instrument.deposit_rate_pct,'%')},
  instrument.term_months==null?null:{label:pick('Term','Durée'),value:locale==='fr'?`${instrument.term_months} mois`:`${instrument.term_months} months`},
  present(instrument.redeemability)?{label:pick('Redeemability','Rachetable'),value:pretty(instrument.redeemability)}:null,
  instrument.minimum_deposit==null?null:{label:pick('Minimum deposit','Dépôt minimum'),value:new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(instrument.minimum_deposit)},
  present(instrument.interest_payment_frequency)?{label:pick('Interest payment','Versement des intérêts'),value:pretty(instrument.interest_payment_frequency)}:null,
  instrument.registered_account_eligibility?.length?{label:pick('Registered accounts','Comptes enregistrés'),value:instrument.registered_account_eligibility.join(' · ')}:null,
  instrument.deposit_insurance_eligible!==null&&instrument.deposit_insurance_eligible!==undefined?{label:pick('Deposit insurance','Assurance-dépôts'),value:depositInsuranceLabel(instrument,locale)}:null
 ].filter((row):row is {label:string;value:string}=>!!row);

 return <section className="card instrument-terms-v2">
  <div className="eyebrow">{pick("Deposit terms","Modalités du dépôt")}</div>
  <h2>{pick("Rate, access and protection","Taux, accès et protection")}</h2>
  <div className="terms-grid-v2">{rows.map(row=><Row key={row.label} {...row}/>)}</div>
  {rows.length<4&&<p className="fine muted">{pick("Limited term coverage is available for this research profile. Missing optional fields are hidden.","La couverture des modalités est limitée pour ce profil de recherche. Les champs facultatifs manquants sont masqués.")}</p>}
  {instrument.lockup_note&&<p className="terms-note-v2">{instrument.lockup_note}</p>}
  <SourceLine url={instrument.deposit_source_url} name={instrument.deposit_source_name||pick('Official issuer','Émetteur officiel')} asOf={instrument.deposit_as_of_date} locale={locale}/>
 </section>;
}

function FixedIncomeTerms({instrument,type,locale}:{instrument:Instrument;type:string;locale:"en"|"fr"}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 const rows=[
  present(instrument.instrument_subtype||type)?{label:pick('Instrument','Instrument'),value:pretty(instrument.instrument_subtype||type)}:null,
  instrument.yield_to_maturity_pct==null?null:{label:pick('Yield to maturity','Rendement à l’échéance'),value:formatMetric(instrument.yield_to_maturity_pct,'%')},
  instrument.discount_instrument?{label:pick('Coupon','Coupon'),value:pick('Discount instrument / no coupon','Instrument à escompte / sans coupon')}:instrument.coupon_pct==null?null:{label:pick('Coupon','Coupon'),value:formatMetric(instrument.coupon_pct,'%')},
  present(instrument.maturity_date)?{label:pick('Maturity','Échéance'),value:formatDate(instrument.maturity_date)}:null,
  instrument.remaining_term_months==null?null:{label:pick('Remaining term','Durée restante'),value:locale==='fr'?`${instrument.remaining_term_months} mois`:`${instrument.remaining_term_months} months`},
  instrument.duration_years==null?null:{label:pick('Duration','Duration'),value:formatMetric(instrument.duration_years,' years')},
  present(instrument.credit_rating)?{label:pick('Credit rating','Cote de crédit'),value:creditRatingLabel(instrument)}:null
 ].filter((row):row is {label:string;value:string}=>!!row);

 return <section className="card instrument-terms-v2">
  <div className="eyebrow">{pick("Fixed-income terms","Modalités de revenu fixe")}</div>
  <h2>{pick("Yield, maturity and credit structure","Rendement, échéance et structure de crédit")}</h2>
  <div className="terms-grid-v2">{rows.map(row=><Row key={row.label} {...row}/>)}</div>
  {rows.length<4&&<p className="fine muted">Limited term coverage is available for this research profile. Missing optional fields are hidden.</p>}
  {instrument.market_access_note&&<p className="terms-note-v2">{instrument.market_access_note}</p>}
  <SourceLine url={instrument.fixed_income_source_url} name={instrument.fixed_income_source_name||pick('Official source','Source officielle')} asOf={instrument.fixed_income_as_of_date} locale={locale}/>
 </section>;
}

function Row({label,value}:{label:string;value:string}){
 return <div className="term-stat-v2"><span>{label}</span><strong>{value}</strong></div>;
}
function SourceLine({url,name,asOf,locale}:{url?:string|null;name:string;asOf?:string|null;locale:"en"|"fr"}){
 if(!url)return null;
 return <p className="fine terms-source-v2">{locale==="fr"?"Source":"Source"}: <a href={url} target="_blank" rel="noreferrer">{name} ↗</a>{asOf?` · ${formatDate(asOf,locale)}`:''}</p>;
}
function depositInsuranceLabel(instrument:Instrument,locale:"en"|"fr"="en"){
 if(instrument.deposit_insurance_eligible===true)return `${instrument.deposit_insurance_scheme||(locale==='fr'?'Régime admissible':'Eligible scheme')} — ${locale==='fr'?'admissible':'eligible'}`;
 if(instrument.deposit_insurance_eligible===false)return locale==='fr'?'Non indiqué comme admissible':'Not marked eligible';
 return locale==='fr'?'Vérifier auprès de l’émetteur':'Verify with issuer';
}
function creditRatingLabel(instrument:Instrument){
 return `${instrument.credit_rating}${instrument.credit_rating_agency?` · ${instrument.credit_rating_agency}`:''}`;
}
function pretty(value:unknown){
 return String(value).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}
function formatDate(value?:string|null,locale:"en"|"fr"="en"){
 if(!value)return '';
 const parsed=new Date(`${value}T00:00:00`);
 return Number.isNaN(parsed.valueOf())?value:new Intl.DateTimeFormat(locale==='fr'?'fr-CA':'en-CA',{year:'numeric',month:'short',day:'numeric'}).format(parsed);
}
function present(value:unknown){return value!==null&&value!==undefined&&value!=='';}
