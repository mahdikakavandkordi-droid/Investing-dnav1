"use client";
import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {Instrument,getInstrument} from '@/lib/instruments';
import {InvestmentDna,OfficialFundFacts,ResearchContext,investmentDna,officialFundFacts,researchContext,formatMetric,validId} from '@/lib/investments';
import {assetLabel,heroMetrics,usesFundResearch} from '@/lib/instrument-model';
import {InstrumentConnection} from '@/components/InstrumentConnection';
import {InstrumentStructureCard} from '@/components/InstrumentStructureCard';
import {InstrumentTermsCard} from '@/components/InstrumentTermsCard';
import {InvestmentDnaCard} from '@/components/InvestmentDnaCard';
import {OfficialFundFactsCard,OfficialFundDocumentCard} from '@/components/OfficialFundFactsCard';
import {ResearchContextCard} from '@/components/ResearchContextCard';

function pretty(value:unknown){return typeof value==='string'?value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()):String(value??'Not available');}
function metricValue(item:Instrument,key:string,suffix='',digits=2){const raw=(item as unknown as Record<string,unknown>)[key];if(raw===null||raw===undefined||raw==='')return 'Not available';if(typeof raw==='number')return formatMetric(raw,suffix,digits);return pretty(raw);}

export default function Detail(){
 const {id}=useParams<{id:string}>();
 const [item,setItem]=useState<Instrument|null>(null),[dna,setDna]=useState<InvestmentDna|null>(null),[facts,setFacts]=useState<OfficialFundFacts|null>(null),[research,setResearch]=useState<ResearchContext|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setItem(null);setDna(null);setFacts(null);setResearch(null);setLoading(true);setError('');
 if(!validId(id)){setLoading(false);setError('This investment link is invalid.');return;}
 getInstrument(id).then(async instrument=>{if(!active)return;if(!instrument){setItem(null);return;}setItem(instrument);if(usesFundResearch(instrument.asset_type)){
   const [dnaData,factsData,researchData]=await Promise.all([investmentDna(id).catch(()=>null),officialFundFacts(id).catch(()=>null),researchContext(id).catch(()=>null)]);if(active){setDna(dnaData);setFacts(factsData);setResearch(researchData)}
 }}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
 return ()=>{active=false};},[id,retry]);
 const metrics=item?heroMetrics(item.asset_type).slice(0,3):[];const isFund=!!item&&usesFundResearch(item.asset_type);const freshness=item?.fixed_income_as_of_date||item?.deposit_as_of_date||item?.metrics_as_of_date||item?.structure_as_of_date;
 return <section className="section"><div className="container"><Link href="/explore">← Explore investments</Link>{loading?<div className="card"><h1>Loading investment research…</h1></div>:error?<div className="card" role="alert"><h1>Could not load this investment</h1><p>{error}</p><button className="btn" onClick={()=>setRetry(x=>x+1)}>Try again</button></div>:!item?<div className="card"><h1>Investment not found</h1><p>This investment is not available in the research catalog.</p><Link href="/explore">Browse available investments</Link></div>:<>
 <div className="section compact fund-detail-hero"><span className="pill">{assetLabel(item.asset_type)}{item.symbol?` · ${item.symbol}`:''}</span><h1>{item.name}</h1><p className="muted">{item.issuer_name}</p><p>{facts?.summary||item.profile_summary||item.description||'A research description is not available yet.'}</p></div>
 {metrics.length?<div className="grid3">{metrics.map(m=><div className="card" key={m.key}><small>{m.label}</small><div className="metric-value">{metricValue(item,m.key,m.suffix,m.digits)}</div></div>)}</div>:null}
 <p className="muted fine">{item.data_status==='identity_only'?'Identity and structure profile only; unverified market figures are intentionally omitted.':`Latest displayed research input as of ${freshness||'an unreported date'}.`} Missing figures are never shown as zero.</p>
 {isFund&&facts&&<OfficialFundFactsCard facts={facts}/>} 
 {isFund&&dna?<InvestmentDnaCard dna={dna}/>:!isFund?<InstrumentStructureCard instrument={item}/>:null}
 {!isFund&&<InstrumentTermsCard instrument={item}/>} 
 {isFund&&research&&<ResearchContextCard context={research}/>} 
 {isFund&&<div className="grid2 section compact"><div className="card"><h2>Fund objective</h2><p>{item.profile_objective||facts?.objective||'Not available'}</p><h3>Benchmark</h3><p>{item.profile_benchmark||'Not available'}</p><h3>Management style</h3><p>{item.profile_management_style||facts?.management_style||'Not available'}</p><h3>Distributions</h3><p>{item.profile_distribution_policy||facts?.distribution_policy||'Not available'}</p></div><div className="card"><h2>Allocation and key risks</h2>{item.profile_key_risks?.length?<><h3>Key risks disclosed for this fund</h3><ul>{item.profile_key_risks.map(x=><li key={x}>{x}</li>)}</ul></>:<p>Detailed risk information is not available.</p>}{Object.entries(item.profile_target_allocation||facts?.asset_mix||{}).map(([key,value])=><div className="fingerprint" key={key}><span>{key.replaceAll('_',' ')}</span><strong>{formatMetric(value,'%')}</strong></div>)}</div></div>}
 <InstrumentConnection id={item.id} assetType={item.asset_type}/>
 {isFund&&facts&&<OfficialFundDocumentCard facts={facts}/>} 
 </>}</div></section>;
}
