import type {OfficialFundFacts} from "@/lib/investments";
import {formatMetric} from "@/lib/investments";

function label(key:string){
 if(key==='equity')return 'Equity';
 if(key==='fixed_income')return 'Fixed income';
 if(key==='us_equity')return 'U.S. equity';
 if(key==='canadian_equity')return 'Canadian equity';
 if(key==='emerging_markets_equity')return 'Emerging markets equity';
 if(key==='international_developed_equity')return 'International developed equity';
 if(key==='canadian_fixed_income')return 'Canadian fixed income';
 if(key==='non_canadian_fixed_income')return 'Non-Canadian fixed income';
 return key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function niceDate(value?:string){
 if(!value)return '';
 const d=new Date(value+'T00:00:00');
 return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);
}
function finiteMix(facts:OfficialFundFacts){
 return Object.entries(facts.asset_mix||{})
  .map(([key,value])=>[key,Number(value)] as const)
  .filter(([,value])=>Number.isFinite(value)&&value>=0);
}

export function OfficialFundFactsCard({facts,assetType}:{facts:OfficialFundFacts;assetType?:string|null}){
 void assetType;
 const mix=finiteMix(facts);
 const overall=mix.filter(([key])=>key==='equity'||key==='fixed_income'||key==='cash'||key==='other');
 const equity=mix.filter(([key])=>key!=='equity'&&key.includes('equity'));
 const fixedIncome=mix.filter(([key])=>key!=='fixed_income'&&key.includes('fixed_income'));
 const used=new Set([...overall,...equity,...fixedIncome].map(([key])=>key));
 const other=mix.filter(([key])=>!used.has(key));
 const keyFacts=[
  facts.management_fee_pct==null?null:{label:'Management fee',value:formatMetric(facts.management_fee_pct,'%'),note:'Annual manager fee'},
  facts.mer_pct==null?null:{label:'MER',value:formatMetric(facts.mer_pct,'%'),note:'Fee + operating expenses'},
  facts.distribution_policy?{label:'Distributions',value:facts.distribution_policy,note:''}:null,
  facts.management_style?{label:'Management style',value:facts.management_style,note:''}:null
 ].filter((row):row is {label:string;value:string;note:string}=>!!row);

 return <section className="official-facts-card official-facts-v2">
  <div className="official-facts-intro">
   <div className="eyebrow">Fund at a glance</div>
   <h2>How this fund is allocated</h2>
   <p className="official-summary">{facts.summary||facts.objective||'A plain-English summary is not available yet.'}</p>
  </div>

  {overall.length>0&&<section className="allocation-overall-card">
   <div className="allocation-head">
    <div><span>Overall allocation</span><small>Shares of the full portfolio</small></div>
    <strong>{Math.round(overall.reduce((sum,[,value])=>sum+value,0))}% shown</strong>
   </div>
   <div className="allocation-bar" aria-label="Overall portfolio allocation">
    {overall.map(([key,value],index)=><span className={`allocation-segment allocation-segment-${index}`} key={key} style={{width:`${Math.max(0,Math.min(100,value))}%`}} title={`${label(key)} ${value}%`}/>) }
   </div>
   <div className="allocation-legend">
    {overall.map(([key,value],index)=><div key={key}><span><i className={`allocation-dot allocation-dot-${index}`}/>{label(key)}</span><strong>{formatMetric(value,'%')}</strong></div>)}
   </div>
  </section>}

  {(equity.length>0||fixedIncome.length>0||other.length>0)&&<div className="allocation-breakdown-grid">
   {equity.length>0&&<AllocationBreakdown title="Equity breakdown" parent="Part of the equity allocation" rows={equity}/>} 
   {fixedIncome.length>0&&<AllocationBreakdown title="Fixed-income breakdown" parent="Part of the fixed-income allocation" rows={fixedIncome}/>} 
   {other.length>0&&<AllocationBreakdown title="Other allocation" parent="Additional portfolio exposures" rows={other}/>} 
  </div>}

  {(equity.length>0||fixedIncome.length>0)&&<p className="fine muted allocation-note">Breakdown percentages are also shown as shares of the full portfolio, so they add up to their parent allocation rather than creating extra exposure.</p>}

  {keyFacts.length>0&&<div className="official-cost-grid official-cost-grid-v2">
   {keyFacts.map(row=><div key={row.label}><span>{row.label}</span><strong className={row.label==='Distributions'||row.label==='Management style'?'official-text-value':''}>{row.value}</strong>{row.note&&<small>{row.note}</small>}</div>)}
  </div>}

  {facts.fee_source_note&&<p className="fine muted official-fee-note">{facts.fee_source_note}</p>}
 </section>;
}

function AllocationBreakdown({title,parent,rows}:{title:string;parent:string;rows:(readonly [string,number])[]}){
 return <section className="allocation-breakdown-card">
  <div><h3>{title}</h3><p>{parent}</p></div>
  <div className="allocation-breakdown-list">
   {rows.map(([key,value])=><div key={key}><span>{label(key)}</span><strong>{formatMetric(value,'%')}</strong></div>)}
  </div>
 </section>;
}

export function OfficialFundDocumentCard({facts,assetType}:{facts:OfficialFundFacts;assetType?:string|null}){
 const isMutualFund=assetType==='MUTUAL_FUND';
 const documentLabel=isMutualFund?'Fund Facts':'ETF Facts';
 return <section className="official-document-card">
  <div><div className="eyebrow">Official document</div><h2>{documentLabel}</h2><p>The issuer's legal summary covers the fund's objective, holdings, risk, past performance and costs.</p><p className="official-source-line">Source: {facts.source_name}{facts.etf_facts_date?` · ${niceDate(facts.etf_facts_date)}`:''}</p></div>
  <a className="btn primary" href={facts.etf_facts_url} target="_blank" rel="noreferrer">Open {documentLabel} ↗</a>
 </section>;
}
