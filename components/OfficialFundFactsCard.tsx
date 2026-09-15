import type {OfficialFundFacts} from "@/lib/investments";
import {formatMetric} from "@/lib/investments";

function label(key:string){
  if(key==='equity') return 'Equity';
  if(key==='fixed_income') return 'Fixed income';
  return key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function niceDate(value?:string){
  if(!value) return '';
  const d=new Date(value+'T00:00:00');
  return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);
}

export function OfficialFundFactsCard({facts}:{facts:OfficialFundFacts}){
  const mix=Object.entries(facts.asset_mix||{}).filter(([,v])=>Number.isFinite(Number(v)));
  return <section className="official-facts-card">
    <div className="official-facts-head">
      <div>
        <div className="eyebrow">Fund at a glance</div>
        <h2>What this ETF actually is</h2>
        <p>{facts.summary||facts.objective||'A plain-English summary is not available yet.'}</p>
      </div>
    </div>

    {mix.length>0&&<div className="official-mix">
      <div className="official-mix-bar" aria-label="Asset mix">
        {mix.map(([k,v])=><span key={k} style={{width:`${Math.max(0,Math.min(100,Number(v)))}%`}} title={`${label(k)} ${v}%`}/>) }
      </div>
      <div className="official-mix-legend">{mix.map(([k,v])=><div key={k}><span>{label(k)}</span><strong>{formatMetric(v,'%')}</strong></div>)}</div>
    </div>}

    <div className="official-cost-grid">
      <div><span>Management fee</span><strong>{formatMetric(facts.management_fee_pct,'%')}</strong><small>Current annual management fee</small></div>
      <div><span>MER</span><strong>{formatMetric(facts.mer_pct,'%')}</strong><small>Management fee + operating expenses</small></div>
      {facts.distribution_policy&&<div><span>Distributions</span><strong className="official-text-value">{facts.distribution_policy}</strong></div>}
      {facts.management_style&&<div><span>Management style</span><strong className="official-text-value">{facts.management_style}</strong></div>}
    </div>

    {facts.fee_source_note&&<p className="fine muted official-fee-note">{facts.fee_source_note}</p>}
    <p className="official-source-line">Source: <a href={facts.product_url||facts.etf_facts_url} target="_blank" rel="noreferrer">{facts.source_name}</a>{facts.etf_facts_date?` · ETF Facts ${niceDate(facts.etf_facts_date)}`:''}</p>

    <div className="official-document-card">
      <div><div className="eyebrow">Official disclosure</div><h3>ETF Facts</h3><p>Read the issuer's legal summary for the fund's objective, holdings, risk, performance and costs.</p></div>
      <a className="btn primary" href={facts.etf_facts_url} target="_blank" rel="noreferrer">Open / download ETF Facts ↗</a>
    </div>
  </section>;
}
