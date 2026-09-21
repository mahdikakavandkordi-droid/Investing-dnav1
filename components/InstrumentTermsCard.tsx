import type {DepositTermOption,Instrument} from '@/lib/instruments';
import {assetTypeOf} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';

/** Asset-specific research facts kept separate from shared Investment DNA traits. */
export function InstrumentTermsCard({instrument}:{instrument:Instrument}){
 const type=assetTypeOf(instrument);

 if(type==='GIC')return <DepositTerms instrument={instrument}/>;
 if(type==='MUTUAL_FUND')return <MutualFundTerms instrument={instrument}/>;
 if(type==='BOND'||type==='T_BILL'||type==='COMMERCIAL_PAPER'||type==='ABCP'){
  return <FixedIncomeTerms instrument={instrument} type={type}/>;
 }
 return null;
}

function MutualFundTerms({instrument}:{instrument:Instrument}){
 const rows=[
  present(instrument.series_name)?{label:'Series',value:String(instrument.series_name)}:null,
  present(instrument.fund_code)?{label:'Fund code',value:String(instrument.fund_code)}:null,
  present(instrument.cifsc_category)?{label:'Category',value:String(instrument.cifsc_category)}:null,
  present(instrument.load_structure)?{label:'Load structure',value:String(instrument.load_structure)}:null,
  present(instrument.sales_status)?{label:'Sales status',value:String(instrument.sales_status)}:null,
  instrument.minimum_initial_investment==null?null:{label:'Minimum initial',value:new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(instrument.minimum_initial_investment)},
  instrument.minimum_additional_investment==null?null:{label:'Minimum additional',value:new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(instrument.minimum_additional_investment)},
  present(instrument.mf_income_distribution_frequency)?{label:'Income distributions',value:String(instrument.mf_income_distribution_frequency)}:null,
  present(instrument.capital_gains_distribution_frequency)?{label:'Capital gains',value:String(instrument.capital_gains_distribution_frequency)}:null
 ].filter((row):row is {label:string;value:string}=>!!row);

 return <section className="card instrument-terms-v2">
  <div className="eyebrow">Mutual fund terms</div>
  <h2>Series, access and dealing details</h2>
  <div className="terms-grid-v2">{rows.map(row=><Row key={row.label} {...row}/>)}</div>
  <SourceLine url={instrument.mutual_fund_source_url} name={instrument.mutual_fund_source_name||'Official issuer'} asOf={instrument.mutual_fund_as_of_date}/>
 </section>;
}

function DepositTerms({instrument}:{instrument:Instrument}){
 const rows=[
  instrument.deposit_rate_pct==null?null:{label:'Annual rate',value:formatMetric(instrument.deposit_rate_pct,'%')},
  instrument.term_months==null?null:{label:'Term',value:`${instrument.term_months} months`},
  present(instrument.redeemability)?{label:'Redeemability',value:pretty(instrument.redeemability)}:null,
  instrument.minimum_deposit==null?null:{label:'Minimum deposit',value:new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(instrument.minimum_deposit)},
  present(instrument.interest_payment_frequency)?{label:'Interest payment',value:pretty(instrument.interest_payment_frequency)}:null,
  instrument.registered_account_eligibility?.length?{label:'Registered accounts',value:instrument.registered_account_eligibility.join(' · ')}:null,
  instrument.deposit_insurance_eligible!==null&&instrument.deposit_insurance_eligible!==undefined?{label:'Deposit insurance',value:depositInsuranceLabel(instrument)}:null
 ].filter((row):row is {label:string;value:string}=>!!row);

 const options=Array.isArray(instrument.deposit_term_options)?instrument.deposit_term_options:[];
 return <section className="card instrument-terms-v2">
  <div className="eyebrow">Deposit terms</div>
  <h2>Rate, access and protection</h2>
  <div className="terms-grid-v2">{rows.map(row=><Row key={row.label} {...row}/>)}</div>
  {options.length>0&&<GicTermCurve options={options}/>}
  {rows.length<4&&options.length===0&&<p className="fine muted">Limited term coverage is available for this research profile. Missing optional fields are hidden.</p>}
  {instrument.lockup_note&&<p className="terms-note-v2">{instrument.lockup_note}</p>}
  <SourceLine url={instrument.deposit_source_url} name={instrument.deposit_source_name||'Official issuer'} asOf={instrument.deposit_as_of_date}/>
 </section>;
}

function GicTermCurve({options}:{options:DepositTermOption[]}){
 const sorted=[...options].sort((a,b)=>a.term_months-b.term_months);
 return <div className="gic-term-curve-v2">
  <div className="gic-term-curve-head"><strong>Available terms</strong><span>Source-dated issuer rates</span></div>
  <div className="gic-term-curve-grid" role="table" aria-label="GIC term options">
   {sorted.map(option=><div className="gic-term-option" role="row" key={option.option_key}>
    <span role="cell">{formatTermMonths(option.term_months)}</span>
    <strong role="cell">{option.annual_rate_pct==null?'Check issuer':formatMetric(option.annual_rate_pct,'%')}</strong>
    <span role="cell">{pretty(option.redeemability)}</span>
    {option.minimum_deposit!=null&&<span role="cell">{new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(option.minimum_deposit)} min</span>}
   </div>)}
  </div>
  {sorted.some(option=>option.special_terms)&&<p className="fine muted gic-term-note">{sorted.find(option=>option.is_featured&&option.special_terms)?.special_terms||sorted.find(option=>option.special_terms)?.special_terms}</p>}
 </div>;
}

function FixedIncomeTerms({instrument,type}:{instrument:Instrument;type:string}){
 const rows=[
  present(instrument.instrument_subtype||type)?{label:'Instrument',value:pretty(instrument.instrument_subtype||type)}:null,
  instrument.yield_to_maturity_pct==null?null:{label:'Yield to maturity',value:formatMetric(instrument.yield_to_maturity_pct,'%')},
  instrument.discount_instrument?{label:'Coupon',value:'Discount instrument / no coupon'}:instrument.coupon_pct==null?null:{label:'Coupon',value:formatMetric(instrument.coupon_pct,'%')},
  present(instrument.maturity_date)?{label:'Maturity',value:formatDate(instrument.maturity_date)}:null,
  instrument.remaining_term_months==null?null:{label:'Remaining term',value:`${instrument.remaining_term_months} months`},
  instrument.duration_years==null?null:{label:'Duration',value:formatMetric(instrument.duration_years,' years')},
  present(instrument.credit_rating)?{label:'Credit rating',value:creditRatingLabel(instrument)}:null
 ].filter((row):row is {label:string;value:string}=>!!row);

 return <section className="card instrument-terms-v2">
  <div className="eyebrow">Fixed-income terms</div>
  <h2>Yield, maturity and credit structure</h2>
  <div className="terms-grid-v2">{rows.map(row=><Row key={row.label} {...row}/>)}</div>
  {rows.length<4&&<p className="fine muted">Limited term coverage is available for this research profile. Missing optional fields are hidden.</p>}
  {instrument.market_access_note&&<p className="terms-note-v2">{instrument.market_access_note}</p>}
  <SourceLine url={instrument.fixed_income_source_url} name={instrument.fixed_income_source_name||'Official source'} asOf={instrument.fixed_income_as_of_date}/>
 </section>;
}

function Row({label,value}:{label:string;value:string}){
 return <div className="term-stat-v2"><span>{label}</span><strong>{value}</strong></div>;
}
function SourceLine({url,name,asOf}:{url?:string|null;name:string;asOf?:string|null}){
 if(!url)return null;
 return <p className="fine terms-source-v2">Source: <a href={url} target="_blank" rel="noreferrer">{name} ↗</a>{asOf?` · ${formatDate(asOf)}`:''}</p>;
}
function depositInsuranceLabel(instrument:Instrument){
 if(instrument.deposit_insurance_eligible===true)return `${instrument.deposit_insurance_scheme||'Eligible scheme'} — eligible`;
 if(instrument.deposit_insurance_eligible===false)return 'Not marked eligible';
 return 'Verify with issuer';
}
function creditRatingLabel(instrument:Instrument){
 return `${instrument.credit_rating}${instrument.credit_rating_agency?` · ${instrument.credit_rating_agency}`:''}`;
}
function pretty(value:unknown){
 return String(value).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}
function formatTermMonths(months:number){
 if(months%12===0)return `${months/12} ${months===12?'year':'years'}`;
 return months<12?`${months} months`:`${months/12} years`;
}
function formatDate(value?:string|null){
 if(!value)return '';
 const parsed=new Date(`${value}T00:00:00`);
 return Number.isNaN(parsed.valueOf())?value:new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(parsed);
}
function present(value:unknown){return value!==null&&value!==undefined&&value!=='';}
