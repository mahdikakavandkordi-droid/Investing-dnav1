"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {getProductRisk} from '@/lib/product-risk/api';
import {productRiskDimensionDefinition} from '@/lib/product-risk/dimensions';
import type {ProductRiskAvailable,ProductRiskDimension} from '@/lib/product-risk/types';
import {useLocale} from '@/lib/locale';

/**
 * Published-only consumer Product Risk surface.
 * Draft/calibration profiles are intentionally invisible because the RPC
 * itself returns not_available until explicit publication.
 */
export function ProductRiskCard({investmentId}:{investmentId:string}){
 const [risk,setRisk]=useState<ProductRiskAvailable|null>(null);
 const [selected,setSelected]=useState<ProductRiskDimension|null>(null);
 const {locale,pick}=useLocale();

 useEffect(()=>{
  let active=true;
  setRisk(null);
  setSelected(null);
  getProductRisk(investmentId)
   .then(result=>{if(active)setRisk(result.status==='available'?result:null);})
   .catch(()=>{if(active)setRisk(null);});
  return ()=>{active=false};
 },[investmentId]);

 useEffect(()=>{
  if(!selected)return;
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelected(null);};
  window.addEventListener('keydown',onKeyDown);
  return ()=>window.removeEventListener('keydown',onKeyDown);
 },[selected]);

 if(!risk)return null;

 const notes=Array.from(new Set([
  ...(risk.dominant_risks||[]),
  ...(risk.key_flags||[]).map(flag=>flag.label)
 ].filter(Boolean)));

 return <section className="product-risk-card-v1" data-product-risk>
  <div className="product-risk-head-v1">
   <div>
    <div className="eyebrow">Product Risk DNA</div>
    <h2>{pick("How this investment behaves under risk","Comment ce placement se comporte face au risque")}</h2>
    <p>{risk.summary||pick('A source-backed product risk profile is available for this investment.','Un profil de risque produit appuyé par des sources est disponible pour ce placement.')}</p>
   </div>
   <div className="product-risk-overall-v1" aria-label={`${pick('Overall Risk','Risque global')}: ${risk.overall_risk.band||pick('Unknown','Inconnu')}`}>
    <span>{pick("Overall Risk","Risque global")}</span>
    <strong>{risk.overall_risk.band||pick('Unknown','Inconnu')}</strong>
    <small>{pick("Confidence","Confiance")}: {risk.overall_risk.confidence}</small>
   </div>
  </div>

  <div className="product-risk-grid-v1">
   {risk.dimensions.map(dimension=>{
    const definition=productRiskDimensionDefinition(dimension.code);
    const label=definition?.label||dimension.code;
    return <article className="product-risk-dimension-v1" key={dimension.code} data-direction={dimension.direction}>
     <div className="product-risk-dimension-top-v1">
      <span>{label}</span>
      <strong>{dimension.level}</strong>
     </div>
     <p className="product-risk-direction-v1">{directionCopy(dimension,locale)}</p>
     <small>{pick("Evidence confidence","Confiance des preuves")}: {dimension.confidence}</small>
     <button
      type="button"
      className="product-risk-help-button-v1"
      aria-label={locale==="fr"?`Que signifie ${label}?`:`What does ${label} mean?`}
      onClick={()=>setSelected(dimension)}
     >{pick("What does this mean?","Qu’est-ce que cela signifie?")}</button>
    </article>;
   })}
  </div>

  {notes.length>0&&<div className="product-risk-notes-v1">
   <h3>{pick("Key things to know","Points clés à connaître")}</h3>
   <ul>{notes.slice(0,4).map(note=><li key={note}>{note}</li>)}</ul>
  </div>}

  <div className="product-risk-footer-v1">
   <p><strong>{pick("Product Risk describes the investment, not your personal fit.","Product Risk décrit le placement, pas votre compatibilité personnelle.")}</strong> {pick("DNA Match is a separate compatibility layer that also uses your Investor DNA and money context.","DNA Match est une couche de compatibilité distincte qui utilise aussi votre Investor DNA et votre contexte financier.")}</p>
   <div>
    {risk.as_of_date&&<span>{pick("Risk inputs as of","Données de risque en date du")} {risk.as_of_date}</span>}
    <Link href="/research/product-risk">{pick("How Product Risk DNA works →","Comment fonctionne Product Risk DNA →")}</Link>
   </div>
  </div>

  {selected&&<ProductRiskDialog dimension={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}

function directionCopy(dimension:ProductRiskDimension,locale:"en"|"fr"="en"){
 if(dimension.direction==='higher_is_better')return locale==='fr'?'Plus élevé = davantage de cette caractéristique favorable':'Higher = more of this beneficial property';
 if(dimension.direction==='higher_is_worse')return locale==='fr'?'Plus élevé = davantage de pression de risque':'Higher = more risk pressure';
 return locale==='fr'?'Une caractéristique descriptive du produit':'A descriptive product characteristic';
}

function ProductRiskDialog({dimension,onClose}:{dimension:ProductRiskDimension;onClose:()=>void}){
 const {locale,pick}=useLocale();
 const definition=productRiskDimensionDefinition(dimension.code);
 const label=definition?.label||dimension.code;
 return <div className="product-risk-modal-backdrop-v1" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="product-risk-modal-v1" role="dialog" aria-modal="true" aria-label={label}>
   <button type="button" className="product-risk-modal-close-v1" aria-label={pick("Close Product Risk explanation","Fermer l’explication Product Risk")} onClick={onClose}>×</button>
   <div className="eyebrow">{pick("Product Risk dimension","Dimension Product Risk")}</div>
   <h2>{label}</h2>
   <div className="product-risk-modal-level-v1"><span>{pick("Current level","Niveau actuel")}</span><strong>{dimension.level}</strong></div>
   <p>{dimension.explanation||definition?.shortDefinition||pick('This dimension describes one part of the investment’s risk profile.','Cette dimension décrit une partie du profil de risque du placement.')}</p>
   <h3>{pick("Why it matters","Pourquoi c’est important")}</h3>
   <p>{dimension.why_it_matters||definition?.whyItMatters}</p>
   <p className="muted fine">{directionCopy(dimension,locale)}. {pick("Evidence confidence","Confiance des preuves")}: {dimension.confidence}.</p>
  </div>
 </div>;
}
