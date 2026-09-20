"use client";

import Link from 'next/link';
import type {ResearchContext} from '@/lib/investments';
import {formatMetric} from '@/lib/investments';
import {useLocale} from '@/lib/locale';

function dateLabel(value?:string|null,locale:'en'|'fr'='en'){if(!value)return locale==='fr'?'date non indiquée':'date not reported';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat(locale==='fr'?'fr-CA':'en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d)}
function sourceLabel(value?:string|null,locale:'en'|'fr'='en'){if(value==='issuer_verified')return locale==='fr'?'Vérifié par l’émetteur':'Issuer verified';if(value==='issuer_linked')return locale==='fr'?'Lié à l’émetteur':'Issuer linked';return locale==='fr'?'Source enregistrée':'Source recorded'}
function yes(value?:boolean,locale:'en'|'fr'='en'){return value?(locale==='fr'?'Disponible':'Available'):(locale==='fr'?'Partiel / non disponible':'Partial / not available')}

export function ResearchContextCard({context}:{context:ResearchContext}){
 const {locale,pick}=useLocale();
 const c=context.coverage||{};const p=context.performance||{};const h=context.holdings;const ch=context.characteristics||{};
 const holdingTitle=h?.mode==='fund_of_funds_structure'?pick('Fund-of-funds structure','Structure de fonds de fonds'):h?.mode==='full_holdings'?pick('Holdings coverage','Couverture des placements'):pick('Top holdings available','Principaux placements disponibles');
 const coverage=Number(h?.weight_coverage_pct);const known=Number(h?.known_underlying_weight_pct);
 const characteristicRows=[
  [pick('Underlying holdings','Placements sous-jacents'),ch.number_of_underlying_holdings??ch.number_of_holdings],
  [pick('Stocks represented','Actions représentées'),ch.number_of_stocks],[pick('Bonds represented','Obligations représentées'),ch.number_of_bonds],['P/E',ch.pe_ratio],[pick('Yield to maturity','Rendement à l’échéance'),ch.yield_to_maturity_pct==null?null:`${formatMetric(ch.yield_to_maturity_pct,'%')}`],[pick('Avg. duration','Durée moyenne'),ch.average_duration_years==null?null:`${formatMetric(ch.average_duration_years,' yrs',1)}`],[pick('Credit quality','Qualité du crédit'),ch.average_credit_quality]
 ].filter(([,v])=>v!==null&&v!==undefined&&v!=='');
 return <section className="research-card">
  <div className="research-head"><div><div className="eyebrow">{pick("Research coverage","Couverture de recherche")}</div><h2>{pick("What we actually know about this fund","Ce que nous savons réellement sur ce fonds")}</h2><p>{pick("Investing DNA separates verified facts from partial coverage. Missing data stays missing — it is never shown as zero.","Investing DNA distingue les faits vérifiés de la couverture partielle. Les données manquantes restent manquantes — elles ne sont jamais affichées comme zéro.")}</p></div><span className="coverage-badge">{c.data_status?.replaceAll('_',' ')||pick('coverage tracked','couverture suivie')}</span></div>
  <div className="coverage-grid">
   <div><span>{pick("Official fund facts","Données officielles du fonds")}</span><strong>{yes(c.has_official_facts,locale)}</strong></div><div><span>{pick("Official risk","Risque officiel")}</span><strong>{yes(c.has_official_risk,locale)}</strong></div><div><span>{pick("Performance history","Historique de rendement")}</span><strong>{c.has_return_1y&&c.has_return_3y&&c.has_return_5y?pick('1Y · 3Y · 5Y','1 an · 3 ans · 5 ans'):pick('Partial','Partiel')}</strong></div><div><span>{pick("Holdings coverage","Couverture des placements")}</span><strong>{Number.isFinite(coverage)&&coverage>0?`${formatMetric(coverage,'%',1)}`:pick('Not available','Non disponible')}</strong></div>
  </div>
  <div className="research-columns">
   <div className="research-panel"><h3>{pick("Verified performance history","Historique de rendement vérifié")}</h3><div className="research-performance">
    <div><span>{pick("1 year","1 an")}</span><strong>{formatMetric(p.return_1y_pct,'%')}</strong><small>{sourceLabel(p.return_1y_verification_status,locale)} · {dateLabel(p.return_1y_as_of_date,locale)}</small></div>
    <div><span>{pick("3 year annualized","3 ans annualisé")}</span><strong>{formatMetric(p.return_3y_annualized_pct,'%')}</strong><small>{sourceLabel(p.return_3y_verification_status,locale)} · {dateLabel(p.return_3y_as_of_date,locale)}</small></div>
    <div><span>{pick("5 year annualized","5 ans annualisé")}</span><strong>{formatMetric(p.return_5y_annualized_pct,'%')}</strong><small>{sourceLabel(p.return_5y_verification_status,locale)} · {dateLabel(p.return_5y_as_of_date,locale)}</small></div>
   </div><p className="fine muted">{pick("Past performance is descriptive history, not a forecast or a reason to buy.","Le rendement passé est un historique descriptif, pas une prévision ni une raison d’acheter.")}</p></div>
   <div className="research-panel"><h3>{holdingTitle}</h3>{h?.mode==='fund_of_funds_structure'?<p>{pick("This fund mainly owns other funds. We show the latest underlying fund weights and link the ones already covered by Investing DNA.","Ce fonds détient principalement d’autres fonds. Nous affichons les pondérations sous-jacentes les plus récentes et relions ceux déjà couverts par Investing DNA.")}</p>:h?.mode==='full_holdings'?<p>{pick("The stored holdings cover approximately the full portfolio weight for the reported date.","Les placements enregistrés couvrent approximativement la totalité du portefeuille à la date indiquée.")}</p>:h?.mode==='top_holdings_sample'?<p>{pick("Only part of the portfolio is represented in the stored holdings. Treat this as a sample, not a complete look-through.","Seule une partie du portefeuille est représentée. Considérez cela comme un échantillon, pas comme une vue complète.")}</p>:<p>{pick("Detailed holdings are not available yet.","Les détails des placements détenus ne sont pas encore disponibles.")}</p>}
    {h&&Number.isFinite(known)&&known>0&&<p className="fine muted">{formatMetric(known,'%',1)} {pick("of portfolio weight links to underlying funds already in our research universe.","du poids du portefeuille est lié à des fonds sous-jacents déjà présents dans notre univers de recherche.")}</p>}
   </div>
  </div>
  {h?.items?.length?<div className="holding-list"><div className="holding-list-head"><h3>{h.mode==='fund_of_funds_structure'?pick('Underlying funds','Fonds sous-jacents'):pick('Holdings shown','Placements affichés')}</h3><span>{pick("As of","En date du")} {dateLabel(h.as_of_date,locale)}</span></div>{h.items.slice(0,8).map((x,i)=><div className="holding-row" key={`${x.holding_symbol||x.holding_name}-${i}`}><div><strong>{x.holding_symbol||'—'}</strong><span>{x.holding_name||pick('Unnamed holding','Placement sans nom')}</span>{x.sector&&<small>{x.sector}</small>}</div><div className="holding-weight">{formatMetric(x.weight_pct,'%')}</div>{x.known_investment_id?<Link href={`/investment/${x.known_investment_id}`}>{pick("Open DNA →","Ouvrir DNA →")}</Link>:<span className="muted fine">{pick("Research link unavailable","Lien de recherche indisponible")}</span>}</div>)}</div>:null}
  {characteristicRows.length?<div className="research-characteristics"><h3>{pick("Portfolio characteristics","Caractéristiques du portefeuille")}</h3><div>{characteristicRows.map(([label,value])=><p key={String(label)}><span>{label}</span><strong>{String(value)}</strong></p>)}</div></div>:null}
 </section>;
}
