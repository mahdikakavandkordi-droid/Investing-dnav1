import type {Instrument} from '@/lib/instruments';
import {assetTypeOf} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';

function pretty(value:unknown){if(value===null||value===undefined||value==='')return 'Not available';return String(value).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
function date(value?:string|null){if(!value)return 'Not available';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);}
function Row({label,value}:{label:string;value:React.ReactNode}){return <div className="compare-metric"><span>{label}</span><strong>{value}</strong></div>}

export function InstrumentTermsCard({instrument}:{instrument:Instrument}){
 const type=assetTypeOf(instrument);
 if(type==='GIC')return <section className="card"><div className="eyebrow">Deposit terms</div><h2>Rate, access and protection</h2>
  <Row label="Annual rate" value={formatMetric(instrument.deposit_rate_pct,'%')}/>
  <Row label="Term" value={instrument.term_months==null?'Not available':`${instrument.term_months} months`}/>
  <Row label="Redeemability" value={pretty(instrument.redeemability)}/>
  <Row label="Minimum deposit" value={instrument.minimum_deposit==null?'Not available':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(instrument.minimum_deposit)}/>
  <Row label="Interest payment" value={pretty(instrument.interest_payment_frequency)}/>
  <Row label="Registered accounts" value={instrument.registered_account_eligibility?.length?instrument.registered_account_eligibility.join(' · '):'Not available'}/>
  <Row label="Deposit insurance" value={instrument.deposit_insurance_eligible===true?`${instrument.deposit_insurance_scheme||'Eligible scheme'} — eligible`:instrument.deposit_insurance_eligible===false?'Not marked eligible':'Verify with issuer'}/>
  {instrument.lockup_note&&<p className="fine muted">{instrument.lockup_note}</p>}
  {instrument.deposit_source_url?<p className="fine">Source: <a href={instrument.deposit_source_url} target="_blank" rel="noreferrer">{instrument.deposit_source_name||'Official issuer'} ↗</a>{instrument.deposit_as_of_date?` · ${date(instrument.deposit_as_of_date)}`:''}</p>:null}
 </section>;

 if(type==='BOND'||type==='T_BILL'||type==='COMMERCIAL_PAPER'||type==='ABCP')return <section className="card"><div className="eyebrow">Fixed-income terms</div><h2>Yield, maturity and credit structure</h2>
  <Row label="Instrument" value={pretty(instrument.instrument_subtype||type)}/>
  <Row label="Yield to maturity" value={formatMetric(instrument.yield_to_maturity_pct,'%')}/>
  <Row label="Coupon" value={instrument.discount_instrument?'Discount instrument / no coupon':formatMetric(instrument.coupon_pct,'%')}/>
  <Row label="Maturity" value={date(instrument.maturity_date)}/>
  <Row label="Remaining term" value={instrument.remaining_term_months==null?'Not available':`${instrument.remaining_term_months} months`}/>
  <Row label="Duration" value={instrument.duration_years==null?'Not available':`${formatMetric(instrument.duration_years,' years')} `}/>
  <Row label="Credit rating" value={instrument.credit_rating?`${instrument.credit_rating}${instrument.credit_rating_agency?` · ${instrument.credit_rating_agency}`:''}`:'Not available'}/>
  {instrument.market_access_note&&<p className="fine muted">{instrument.market_access_note}</p>}
  {instrument.fixed_income_source_url?<p className="fine">Source: <a href={instrument.fixed_income_source_url} target="_blank" rel="noreferrer">{instrument.fixed_income_source_name||'Official source'} ↗</a>{instrument.fixed_income_as_of_date?` · ${date(instrument.fixed_income_as_of_date)}`:''}</p>:null}
 </section>;

 return null;
}
