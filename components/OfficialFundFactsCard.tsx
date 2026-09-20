"use client";

import type {OfficialFundFacts} from "@/lib/investments";
import {formatMetric} from "@/lib/investments";
import {useLocale} from "@/lib/locale";

function label(key:string,locale:"en"|"fr"="en"){
 if(key==='equity')return locale==='fr'?'Actions':'Equity';
 if(key==='fixed_income')return locale==='fr'?'Revenu fixe':'Fixed income';
 if(key==='us_equity')return locale==='fr'?'Actions américaines':'U.S. equity';
 if(key==='canadian_equity')return locale==='fr'?'Actions canadiennes':'Canadian equity';
 if(key==='emerging_markets_equity')return locale==='fr'?'Actions des marchés émergents':'Emerging markets equity';
 if(key==='international_developed_equity')return locale==='fr'?'Actions internationales développées':'International developed equity';
 if(key==='canadian_fixed_income')return locale==='fr'?'Revenu fixe canadien':'Canadian fixed income';
 if(key==='non_canadian_fixed_income')return locale==='fr'?'Revenu fixe non canadien':'Non-Canadian fixed income';
 return key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function niceDate(value?:string,locale:"en"|"fr"="en"){
 if(!value)return '';
 const d=new Date(value+'T00:00:00');
 return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat(locale==='fr'?'fr-CA':'en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);
}
function finiteMix(facts:OfficialFundFacts){
 return Object.entries(facts.asset_mix||{})
  .map(([key,value])=>[key,Number(value)] as const)
  .filter(([,value])=>Number.isFinite(value)&&value>=0);
}

export function OfficialFundFactsCard({facts}:{facts:OfficialFundFacts}){
 const {locale,pick}=useLocale();
 const mix=finiteMix(facts);
 const overall=mix.filter(([key])=>key==='equity'||key==='fixed_income'||key==='cash'||key==='other');
 const equity=mix.filter(([key])=>key!=='equity'&&key.includes('equity'));
 const fixedIncome=mix.filter(([key])=>key!=='fixed_income'&&key.includes('fixed_income'));
 const used=new Set([...overall,...equity,...fixedIncome].map(([key])=>key));
 const other=mix.filter(([key])=>!used.has(key));
 const keyFacts=[
  facts.management_fee_pct==null?null:{label:pick('Management fee','Frais de gestion'),value:formatMetric(facts.management_fee_pct,'%'),note:pick('Annual manager fee','Frais annuels du gestionnaire')},
  facts.mer_pct==null?null:{label:pick('MER','RFG'),value:formatMetric(facts.mer_pct,'%'),note:pick('Fee + operating expenses','Frais + dépenses d’exploitation')},
  facts.distribution_policy?{label:pick('Distributions','Distributions'),value:facts.distribution_policy,note:''}:null,
  facts.management_style?{label:pick('Management style','Style de gestion'),value:facts.management_style,note:''}:null
 ].filter((row):row is {label:string;value:string;note:string}=>!!row);

 return <section className="official-facts-card official-facts-v2">
  <div className="official-facts-intro">
   <div className="eyebrow">{pick("Fund at a glance","Aperçu du fonds")}</div>
   <h2>{pick("How this ETF is allocated","Répartition de ce FNB")}</h2>
   <p className="official-summary">{facts.summary||facts.objective||pick('A plain-English summary is not available yet.','Un résumé en langage clair n’est pas encore disponible.')}</p>
  </div>

  {overall.length>0&&<section className="allocation-overall-card">
   <div className="allocation-head">
    <div><span>{pick("Overall allocation","Répartition globale")}</span><small>{pick("Shares of the full portfolio","Part du portefeuille total")}</small></div>
    <strong>{Math.round(overall.reduce((sum,[,value])=>sum+value,0))}% {pick("shown","affiché")}</strong>
   </div>
   <div className="allocation-bar" aria-label={pick("Overall portfolio allocation","Répartition globale du portefeuille")}>
    {overall.map(([key,value],index)=><span className={`allocation-segment allocation-segment-${index}`} key={key} style={{width:`${Math.max(0,Math.min(100,value))}%`}} title={`${label(key,locale)} ${value}%`}/>) }
   </div>
   <div className="allocation-legend">
    {overall.map(([key,value],index)=><div key={key}><span><i className={`allocation-dot allocation-dot-${index}`}/>{label(key,locale)}</span><strong>{formatMetric(value,'%')}</strong></div>)}
   </div>
  </section>}

  {(equity.length>0||fixedIncome.length>0||other.length>0)&&<div className="allocation-breakdown-grid">
   {equity.length>0&&<AllocationBreakdown title={pick("Equity breakdown","Détail des actions")} parent={pick("Part of the equity allocation","Part de la répartition en actions")} rows={equity}/>} 
   {fixedIncome.length>0&&<AllocationBreakdown title={pick("Fixed-income breakdown","Détail du revenu fixe")} parent={pick("Part of the fixed-income allocation","Part de la répartition en revenu fixe")} rows={fixedIncome}/>} 
   {other.length>0&&<AllocationBreakdown title={pick("Other allocation","Autres répartitions")} parent={pick("Additional portfolio exposures","Expositions supplémentaires du portefeuille")} rows={other}/>} 
  </div>}

  {(equity.length>0||fixedIncome.length>0)&&<p className="fine muted allocation-note">{pick("Breakdown percentages are also shown as shares of the full portfolio, so they add up to their parent allocation rather than creating extra exposure.","Les pourcentages détaillés sont aussi présentés comme parts du portefeuille total; ils s’additionnent donc à leur catégorie principale sans créer d’exposition supplémentaire.")}</p>}

  {keyFacts.length>0&&<div className="official-cost-grid official-cost-grid-v2">
   {keyFacts.map(row=><div key={row.label}><span>{row.label}</span><strong className={row.label===pick('Distributions','Distributions')||row.label===pick('Management style','Style de gestion')?'official-text-value':''}>{row.value}</strong>{row.note&&<small>{row.note}</small>}</div>)}
  </div>}

  {facts.fee_source_note&&<p className="fine muted official-fee-note">{facts.fee_source_note}</p>}
 </section>;
}

function AllocationBreakdown({title,parent,rows}:{title:string;parent:string;rows:(readonly [string,number])[]}){
 const {locale}=useLocale();
 return <section className="allocation-breakdown-card">
  <div><h3>{title}</h3><p>{parent}</p></div>
  <div className="allocation-breakdown-list">
   {rows.map(([key,value])=><div key={key}><span>{label(key,locale)}</span><strong>{formatMetric(value,'%')}</strong></div>)}
  </div>
 </section>;
}

export function OfficialFundDocumentCard({facts}:{facts:OfficialFundFacts}){
 const {locale,pick}=useLocale();
 return <section className="official-document-card">
  <div><div className="eyebrow">{pick("Official document","Document officiel")}</div><h2>{pick("ETF Facts","Aperçu du FNB")}</h2><p>{pick("The issuer’s legal summary covers the fund’s objective, holdings, risk, past performance and costs.","Le résumé juridique de l’émetteur couvre l’objectif du fonds, ses placements, son risque, son rendement passé et ses coûts.")}</p><p className="official-source-line">{pick("Source","Source")}: {facts.source_name}{facts.etf_facts_date?` · ${niceDate(facts.etf_facts_date,locale)}`:''}</p></div>
  <a className="btn primary" href={facts.etf_facts_url} target="_blank" rel="noreferrer">{pick("Open ETF Facts ↗","Ouvrir l’aperçu du FNB ↗")}</a>
 </section>;
}
