import type {ReactNode} from 'react';
import type {Instrument} from '@/lib/instruments';
import {assetTypeOf} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';

/** Asset-specific research facts kept separate from shared Investment DNA traits. */
export function InstrumentTermsCard({instrument}:{instrument:Instrument}){
 const type=assetTypeOf(instrument);

 if(type==='GIC')return <DepositTerms instrument={instrument}/>;
 if(type==='BOND'||type==='T_BILL'||type==='COMMERCIAL_PAPER'||type==='ABCP'){
  return <FixedIncomeTerms instrument={instrument} type={type}/>;
 }
 return null;
}

function DepositTerms({instrument}:{instrument:Instrument}){
 return <section className="card">
  <div className="eyebrow">Deposit terms</div>
  <h2>Rate, access and protection</h2>

  <Row label="Annual rate" value={formatMetric(instrument.deposit_rate_pct,'%')}/>
  <Row label="Term" value={instrument.term_months==null?'Not available':`${instrument.term_months} months`}/>
  <Row label="Redeemability" value={pretty(instrument.redeemability)}/>
  <Row
   label="Minimum deposit"
   value={instrument.minimum_deposit==null
    ? 'Not available'
    : new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(instrument.minimum_deposit)}
  />
  <Row label="Interest payment" value={pretty(instrument.interest_payment_frequency)}/>
  <Row
   label="Registered accounts"
   value={instrument.registered_account_eligibility?.length
    ? instrument.registered_account_eligibility.join(' · ')
    : 'Not available'}
  />
  <Row label="Deposit insurance" value={depositInsuranceLabel(instrument)}/>

  {instrument.lockup_note&&<p className="fine muted">{instrument.lockup_note}</p>}
  <SourceLine
   url={instrument.deposit_source_url}
   name={instrument.deposit_source_name||'Official issuer'}
   asOf={instrument.deposit_as_of_date}
  />
 </section>;
}

function FixedIncomeTerms({instrument,type}:{instrument:Instrument;type:string}){
 return <section className="card">
  <div className="eyebrow">Fixed-income terms</div>
  <h2>Yield, maturity and credit structure</h2>

  <Row label="Instrument" value={pretty(instrument.instrument_subtype||type)}/>
  <Row label="Yield to maturity" value={formatMetric(instrument.yield_to_maturity_pct,'%')}/>
  <Row
   label="Coupon"
   value={instrument.discount_instrument
    ? 'Discount instrument / no coupon'
    : formatMetric(instrument.coupon_pct,'%')}
  />
  <Row label="Maturity" value={formatDate(instrument.maturity_date)}/>
  <Row
   label="Remaining term"
   value={instrument.remaining_term_months==null?'Not available':`${instrument.remaining_term_months} months`}
  />
  <Row
   label="Duration"
   value={instrument.duration_years==null?'Not available':formatMetric(instrument.duration_years,' years')}
  />
  <Row label="Credit rating" value={creditRatingLabel(instrument)}/>

  {instrument.market_access_note&&<p className="fine muted">{instrument.market_access_note}</p>}
  <SourceLine
   url={instrument.fixed_income_source_url}
   name={instrument.fixed_income_source_name||'Official source'}
   asOf={instrument.fixed_income_as_of_date}
  />
 </section>;
}

function Row({label,value}:{label:string;value:ReactNode}){
 return <div className="compare-metric">
  <span>{label}</span>
  <strong>{value}</strong>
 </div>;
}

function SourceLine({url,name,asOf}:{url?:string|null;name:string;asOf?:string|null}){
 if(!url)return null;
 return <p className="fine">
  Source: <a href={url} target="_blank" rel="noreferrer">{name} ↗</a>
  {asOf?` · ${formatDate(asOf)}`:''}
 </p>;
}

function depositInsuranceLabel(instrument:Instrument){
 if(instrument.deposit_insurance_eligible===true){
  return `${instrument.deposit_insurance_scheme||'Eligible scheme'} — eligible`;
 }
 if(instrument.deposit_insurance_eligible===false)return 'Not marked eligible';
 return 'Verify with issuer';
}

function creditRatingLabel(instrument:Instrument){
 if(!instrument.credit_rating)return 'Not available';
 return `${instrument.credit_rating}${instrument.credit_rating_agency?` · ${instrument.credit_rating_agency}`:''}`;
}

function pretty(value:unknown){
 if(value===null||value===undefined||value==='')return 'Not available';
 return String(value).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}

function formatDate(value?:string|null){
 if(!value)return 'Not available';
 const parsed=new Date(`${value}T00:00:00`);
 return Number.isNaN(parsed.valueOf())
  ? value
  : new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(parsed);
}
