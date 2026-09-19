import Link from 'next/link';
import type {ResearchContext} from '@/lib/investments';
import {formatMetric} from '@/lib/investments';

function dateLabel(value?:string|null){if(!value)return 'date not reported';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d)}
function sourceLabel(value?:string|null){if(value==='issuer_verified')return 'Issuer verified';if(value==='issuer_linked')return 'Issuer linked';return 'Source recorded'}
function yes(value?:boolean){return value?'Available':'Partial / not available'}

export function ResearchContextCard({context}:{context:ResearchContext}){
 const c=context.coverage||{};const p=context.performance||{};const h=context.holdings;const ch=context.characteristics||{};
 const holdingTitle=h?.mode==='fund_of_funds_structure'?'Fund-of-funds structure':h?.mode==='full_holdings'?'Holdings coverage':'Top holdings available';
 const coverage=Number(h?.weight_coverage_pct);const known=Number(h?.known_underlying_weight_pct);
 const characteristicRows=[
  ['Underlying holdings',ch.number_of_underlying_holdings??ch.number_of_holdings],
  ['Stocks represented',ch.number_of_stocks],['Bonds represented',ch.number_of_bonds],['P/E',ch.pe_ratio],['Yield to maturity',ch.yield_to_maturity_pct==null?null:`${formatMetric(ch.yield_to_maturity_pct,'%')}`],['Avg. duration',ch.average_duration_years==null?null:`${formatMetric(ch.average_duration_years,' yrs',1)}`],['Credit quality',ch.average_credit_quality]
 ].filter(([,v])=>v!==null&&v!==undefined&&v!=='');
 return <section className="research-card">
  <div className="research-head"><div><div className="eyebrow">Research coverage</div><h2>What we actually know about this fund</h2><p>Investing DNA separates verified facts from partial coverage. Missing data stays missing — it is never shown as zero.</p></div><span className="coverage-badge">{c.data_status?.replaceAll('_',' ')||'coverage tracked'}</span></div>
  <div className="coverage-grid">
   <div><span>Official fund facts</span><strong>{yes(c.has_official_facts)}</strong></div><div><span>Official risk</span><strong>{yes(c.has_official_risk)}</strong></div><div><span>Performance history</span><strong>{c.has_return_1y&&c.has_return_3y&&c.has_return_5y?'1Y · 3Y · 5Y':'Partial'}</strong></div><div><span>Holdings coverage</span><strong>{Number.isFinite(coverage)&&coverage>0?`${formatMetric(coverage,'%',1)}`:'Not available'}</strong></div>
  </div>
  <div className="research-columns">
   <div className="research-panel"><h3>Verified performance history</h3><div className="research-performance">
    <div><span>1 year</span><strong>{formatMetric(p.return_1y_pct,'%')}</strong><small>{sourceLabel(p.return_1y_verification_status)} · {dateLabel(p.return_1y_as_of_date)}</small></div>
    <div><span>3 year annualized</span><strong>{formatMetric(p.return_3y_annualized_pct,'%')}</strong><small>{sourceLabel(p.return_3y_verification_status)} · {dateLabel(p.return_3y_as_of_date)}</small></div>
    <div><span>5 year annualized</span><strong>{formatMetric(p.return_5y_annualized_pct,'%')}</strong><small>{sourceLabel(p.return_5y_verification_status)} · {dateLabel(p.return_5y_as_of_date)}</small></div>
   </div><p className="fine muted">Past performance is descriptive history, not a forecast or a reason to buy.</p></div>
   <div className="research-panel"><h3>{holdingTitle}</h3>{h?.mode==='fund_of_funds_structure'?<p>This fund mainly owns other funds. We show the latest underlying fund weights and link the ones already covered by Investing DNA.</p>:h?.mode==='full_holdings'?<p>The stored holdings cover approximately the full portfolio weight for the reported date.</p>:h?.mode==='top_holdings_sample'?<p>Only part of the portfolio is represented in the stored holdings. Treat this as a sample, not a complete look-through.</p>:<p>Detailed holdings are not available yet.</p>}
    {h&&Number.isFinite(known)&&known>0&&<p className="fine muted">{formatMetric(known,'%',1)} of portfolio weight links to underlying funds already in our research universe.</p>}
   </div>
  </div>
  {h?.items?.length?<div className="holding-list"><div className="holding-list-head"><h3>{h.mode==='fund_of_funds_structure'?'Underlying funds':'Holdings shown'}</h3><span>As of {dateLabel(h.as_of_date)}</span></div>{h.items.slice(0,8).map((x,i)=><div className="holding-row" key={`${x.holding_symbol||x.holding_name}-${i}`}><div><strong>{x.holding_symbol||'—'}</strong><span>{x.holding_name||'Unnamed holding'}</span>{x.sector&&<small>{x.sector}</small>}</div><div className="holding-weight">{formatMetric(x.weight_pct,'%')}</div>{x.known_investment_id?<Link href={`/investment/${x.known_investment_id}`}>Open DNA →</Link>:<span className="muted fine">Research link unavailable</span>}</div>)}</div>:null}
  {characteristicRows.length?<div className="research-characteristics"><h3>Portfolio characteristics</h3><div>{characteristicRows.map(([label,value])=><p key={String(label)}><span>{label}</span><strong>{String(value)}</strong></p>)}</div></div>:null}
 </section>;
}
