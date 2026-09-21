"use client";

import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {gicRateRange,gicTermRange,getInstrument,hasFriendlyDisplayName,instrumentDisplayName} from '@/lib/instruments';
import type {Instrument} from '@/lib/instruments';
import {
 investmentDna,
 officialFundFacts,
 researchContext,
 validId
} from '@/lib/investments';
import type {InvestmentDna,OfficialFundFacts,ResearchContext} from '@/lib/investments';
import {assetLabel,heroMetrics,usesFundResearch} from '@/lib/instrument-model';
import {formatMetric} from '@/lib/investments';
import {InstrumentConnection} from '@/components/InstrumentConnection';
import {InstrumentStructureCard} from '@/components/InstrumentStructureCard';
import {InstrumentTermsCard} from '@/components/InstrumentTermsCard';
import {InvestmentDnaCard} from '@/components/InvestmentDnaCard';
import {OfficialFundFactsCard,OfficialFundDocumentCard} from '@/components/OfficialFundFactsCard';
import {ResearchContextCard} from '@/components/ResearchContextCard';
import {ProductRiskCard} from '@/components/ProductRiskCard';

/** Generic detail shell for the focused V1 product universe. */
export default function Detail(){
 const {id}=useParams<{id:string}>();
 const [item,setItem]=useState<Instrument|null>(null);
 const [dna,setDna]=useState<InvestmentDna|null>(null);
 const [facts,setFacts]=useState<OfficialFundFacts|null>(null);
 const [research,setResearch]=useState<ResearchContext|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);

 useEffect(()=>{
  let active=true;
  setItem(null);setDna(null);setFacts(null);setResearch(null);setLoading(true);setError('');

  if(!validId(id)){
   setLoading(false);
   setError('This investment link is invalid.');
   return;
  }

  getInstrument(id)
   .then(async instrument=>{
    if(!active)return;
    if(!instrument){setItem(null);return;}
    setItem(instrument);

    if(usesFundResearch(instrument.asset_type)){
     const [dnaData,factsData,researchData]=await Promise.all([
      investmentDna(id).catch(()=>null),
      officialFundFacts(id).catch(()=>null),
      researchContext(id).catch(()=>null)
     ]);
     if(active){setDna(dnaData);setFacts(factsData);setResearch(researchData);}
    }
   })
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[id,retry]);

 if(loading){
  return <PageShell><div className="detail-state-card"><h1>Loading investment research…</h1></div></PageShell>;
 }
 if(error){
  return <PageShell><div className="detail-state-card" role="alert"><h1>Could not load this investment</h1><p>{error}</p><button className="btn" onClick={()=>setRetry(value=>value+1)}>Try again</button></div></PageShell>;
 }
 if(!item){
  return <PageShell><div className="detail-state-card"><h1>Investment not found</h1><p>This investment is not available in the research catalog.</p><Link href="/explore">Browse available investments</Link></div></PageShell>;
 }
 return <InvestmentDetail item={item} dna={dna} facts={facts} research={research}/>;
}

function PageShell({children}:{children:React.ReactNode}){
 return <main className="investment-detail-page-v2">
  <div className="container investment-detail-container-v2">
   <Link className="detail-back-link" href="/explore">← Explore investments</Link>
   {children}
  </div>
 </main>;
}

function InvestmentDetail({item,dna,facts,research}:{item:Instrument;dna:InvestmentDna|null;facts:OfficialFundFacts|null;research:ResearchContext|null}){
 const metrics=item.asset_type==='GIC'
  ? gicDetailMetrics(item)
  : heroMetrics(item.asset_type)
    .map(metric=>({...metric,value:metricValue(item,metric.key,metric.suffix,metric.digits)}))
    .filter(metric=>metric.value!==null)
    .slice(0,4);
 const isFund=usesFundResearch(item.asset_type);
 const freshness=item.fixed_income_as_of_date||item.deposit_as_of_date||item.metrics_as_of_date||item.structure_as_of_date;

 const typeClass='asset-detail-'+String(item.asset_type||'unknown').toLowerCase();
 return <div className={'investment-detail-identity '+typeClass}>
  <section className="detail-hero-v2">
   <div className="detail-hero-copy-v2">
    <div className="detail-tags-v2">
     <span className="asset-tag">{assetLabel(item.asset_type)}</span>
     {item.symbol&&<span className="symbol-tag">{item.symbol}</span>}
    </div>
    <h1>{instrumentDisplayName(item)}</h1>
    {hasFriendlyDisplayName(item)&&<p className="fine muted">Official name: {item.name}</p>}
    {item.issuer_name&&<p className="detail-issuer-v2">{item.issuer_name}</p>}
    <p className="detail-summary-v2">{facts?.summary||item.profile_summary||item.description||'A research description is not available yet.'}</p>
   </div>
   <div className="detail-hero-actions-v2">
    <Link className="btn" href={`/compare?ids=${item.id}`}>Compare</Link>
   </div>
  </section>

  {metrics.length>0&&<section className="detail-key-facts-v2">
   {metrics.map(metric=><div className="detail-stat-v2" key={metric.key}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
  </section>}

  <ResearchFreshness item={item} freshness={freshness}/>

  <div className="mobile-detail-actions" aria-label="Investment actions"><Link className="btn" href={`/compare?ids=${item.id}`}>Compare</Link><Link className="btn primary" href={`/profile?mode=signup&investment=${item.id}`}>Save</Link></div>

  <div className="detail-flow-v2">
   {isFund
    ? <>
      <ResearchDisclosure title="Fund profile & fees">
       {facts&&<OfficialFundFactsCard facts={facts} assetType={item.asset_type}/>}
       {item.asset_type==='MUTUAL_FUND'&&<InstrumentTermsCard instrument={item}/>}
       {dna&&<InvestmentDnaCard dna={dna}/>}
      </ResearchDisclosure>
      <ResearchDisclosure title="Risk">

       <ProductRiskCard investmentId={item.id}/>
      </ResearchDisclosure>
      <ResearchDisclosure title="Performance & holdings">
       {research&&<ResearchContextCard context={research}/>}
      </ResearchDisclosure>
      <ResearchDisclosure title={`About this ${assetLabel(item.asset_type)}`}>
       <FundResearchDetails item={item} facts={facts}/>
      </ResearchDisclosure>
      <ResearchDisclosure title="Save & official documents">
       <InstrumentConnection id={item.id} assetType={item.asset_type}/>
       {facts&&<OfficialFundDocumentCard facts={facts} assetType={item.asset_type}/>}
      </ResearchDisclosure>
     </>
    : <>
      <ResearchDisclosure title="Rate & access">
       <InstrumentTermsCard instrument={item}/>
       <details className="investment-dna-methodology"><summary>Investment structure explained</summary><InstrumentStructureCard instrument={item}/></details>
      </ResearchDisclosure>
      <ResearchDisclosure title="Risk & protection">
       {item.asset_type==='GIC'&&<GicRiskSummary item={item}/>}
       <ProductRiskCard investmentId={item.id}/>
      </ResearchDisclosure>
      <ResearchDisclosure title="Save for later">
       <InstrumentConnection id={item.id} assetType={item.asset_type}/>
      </ResearchDisclosure>
     </>}
  </div>
 </div>;
}

function GicRiskSummary({item}:{item:Instrument}){
 const insured=item.deposit_insurance_eligible===true
  ? `${item.deposit_insurance_scheme||'Deposit-insurance'} eligible, subject to applicable coverage limits and conditions.`
  : 'Deposit-insurance eligibility should be verified with the issuer.';
 const access=item.redeemability==='non_redeemable'
  ? 'Funds are generally locked until maturity under the standard terms.'
  : 'Earlier access depends on the product redemption rules and can change the interest received.';
 return <div className="notice">
  <strong>Capital-preservation research</strong>
  <p>{insured} {access} This is a single-issuer deposit, so term, access and coverage rules matter more than market-price volatility.</p>
 </div>;
}

function ResearchDisclosure({title,children}:{title:string;children:React.ReactNode}){
 const [open,setOpen]=useState(false);
 return <section className={open?"mobile-research-disclosure open":"mobile-research-disclosure"}>
  <button type="button" className="mobile-research-summary" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
   <span>{title}</span><span className="mobile-disclosure-icon" aria-hidden="true">+</span>
  </button>
  <div className="mobile-research-disclosure-body">{children}</div>
 </section>;
}

function ResearchFreshness({item,freshness}:{item:Instrument;freshness?:string|null}){
 const marketDate=item.market_price_date;
 const clearlyDelayed=marketDate?marketDataClearlyDelayed(marketDate):false;
 const sourceLabel=item.market_price_source_key==='yahoo_free'
  ? 'Temporary market feed'
  : item.market_price_source_name||item.market_price_source_key||null;
 const researchCopy=item.data_status==='identity_only'
  ? 'Identity and structure profile only; unverified market figures are intentionally omitted.'
  : freshness?`Other research inputs are reported as of ${formatResearchDate(freshness)}.`:'A source date is not reported for every optional research field.';

 return <div className="detail-freshness-panel">
  {marketDate&&<span className={clearlyDelayed?"detail-freshness-chip delayed":"detail-freshness-chip"}>
   {clearlyDelayed?(item.asset_type==='MUTUAL_FUND'?'NAV may be delayed':'Market data may be delayed'):(item.asset_type==='MUTUAL_FUND'?'Latest NAV':'Market data after close')} · {formatResearchDate(marketDate)}{sourceLabel?' · '+sourceLabel:''}
  </span>}
  {!marketDate&&(item.asset_type==='ETF'||item.asset_type==='MUTUAL_FUND')&&<span className="detail-freshness-chip delayed">Latest {item.asset_type==='MUTUAL_FUND'?'NAV':'market-price'} date is not available</span>}
  <p className="muted fine detail-freshness-note">{researchCopy} Missing figures are never shown as zero.</p>
 </div>;
}

function formatResearchDate(value:string){
 const parsed=new Date(value+'T12:00:00Z');
 if(Number.isNaN(parsed.getTime()))return value;
 return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(parsed);
}

function marketDataClearlyDelayed(value:string){
 const parsed=new Date(value+'T23:59:59Z');
 if(Number.isNaN(parsed.getTime()))return false;
 return Date.now()-parsed.getTime()>4*24*60*60*1000;
}

function FundResearchDetails({item,facts}:{item:Instrument;facts:OfficialFundFacts|null}){
 const hasObjective=!!(item.profile_objective||facts?.objective);
 const hasBenchmark=!!item.profile_benchmark;
 const hasRisks=!!item.profile_key_risks?.length;
 if(!hasObjective&&!hasBenchmark&&!hasRisks)return null;

 return <section className="fund-research-details-v2">
  <div className="eyebrow">About this {assetLabel(item.asset_type)}</div>
  <div className="fund-research-grid-v2">
   <div>
    {hasObjective&&<><h2>Objective</h2><p>{item.profile_objective||facts?.objective}</p></>}
    {hasBenchmark&&<><h3>Benchmark</h3><p>{item.profile_benchmark}</p></>}
   </div>
   {hasRisks&&<div><h2>Key risks</h2><ul>{item.profile_key_risks!.map(risk=><li key={risk}>{risk}</li>)}</ul></div>}
  </div>
 </section>;
}

function gicDetailMetrics(item:Instrument):{key:string;label:string;value:string}[]{
 const minimum=item.minimum_deposit==null?null:new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(item.minimum_deposit);
 return [
  {key:'gic-rate-range',label:'Rates',value:gicRateRange(item)||'Check issuer'},
  {key:'gic-term-range',label:'Terms',value:gicTermRange(item)},
  {key:'gic-access',label:'Access',value:item.redeemability?pretty(item.redeemability):null},
  {key:'gic-minimum',label:'Minimum',value:minimum}
 ].filter((metric):metric is {key:string;label:string;value:string}=>metric.value!==null).slice(0,4);
}

function metricValue(item:Instrument,key:string,suffix='',digits=2):string|null{
 const raw=(item as unknown as Record<string,unknown>)[key];
 if(raw===null||raw===undefined||raw==='')return null;
 if(typeof raw==='number')return formatMetric(raw,suffix,digits);
 return pretty(raw);
}
function pretty(value:unknown){
 if(typeof value==='string')return value.replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
 return String(value);
}
