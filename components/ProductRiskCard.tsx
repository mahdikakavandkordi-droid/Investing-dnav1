"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {getProductRisk} from '@/lib/product-risk/api';
import {productRiskDimensionDefinition} from '@/lib/product-risk/dimensions';
import type {ProductRiskAvailable,ProductRiskDimension} from '@/lib/product-risk/types';

/**
 * Published-only consumer Product Risk surface.
 * Draft/calibration profiles are intentionally invisible because the RPC
 * itself returns not_available until explicit publication.
 */
export function ProductRiskCard({investmentId}:{investmentId:string}){
 const [risk,setRisk]=useState<ProductRiskAvailable|null>(null);
 const [selected,setSelected]=useState<ProductRiskDimension|null>(null);

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
    <h2>How this investment behaves under risk</h2>
    <p>{risk.summary||'A source-backed product risk profile is available for this investment.'}</p>
   </div>
   <div className="product-risk-overall-v1" aria-label={`Overall Risk: ${risk.overall_risk.band||'Unknown'}`}>
    <span>Overall Risk</span>
    <strong>{risk.overall_risk.band||'Unknown'}</strong>
    <small>Confidence: {risk.overall_risk.confidence}</small>
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
     <p className="product-risk-direction-v1">{directionCopy(dimension)}</p>
     <small>Evidence confidence: {dimension.confidence}</small>
     <button
      type="button"
      className="product-risk-help-button-v1"
      aria-label={`What does ${label} mean?`}
      onClick={()=>setSelected(dimension)}
     >What does this mean?</button>
    </article>;
   })}
  </div>

  {notes.length>0&&<div className="product-risk-notes-v1">
   <h3>Key things to know</h3>
   <ul>{notes.slice(0,4).map(note=><li key={note}>{note}</li>)}</ul>
  </div>}

  <div className="product-risk-footer-v1">
   <p><strong>Product Risk describes the investment, not your personal fit.</strong> DNA Match is a separate compatibility layer that also uses your Investor DNA and money context.</p>
   <div>
    {risk.as_of_date&&<span>Risk inputs as of {risk.as_of_date}</span>}
    <Link href="/research/product-risk">How Product Risk DNA works →</Link>
   </div>
  </div>

  {selected&&<ProductRiskDialog dimension={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}

function directionCopy(dimension:ProductRiskDimension){
 if(dimension.direction==='higher_is_better')return 'Higher = more of this beneficial property';
 if(dimension.direction==='higher_is_worse')return 'Higher = more risk pressure';
 return 'A descriptive product characteristic';
}

function ProductRiskDialog({dimension,onClose}:{dimension:ProductRiskDimension;onClose:()=>void}){
 const definition=productRiskDimensionDefinition(dimension.code);
 const label=definition?.label||dimension.code;
 return <div className="product-risk-modal-backdrop-v1" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="product-risk-modal-v1" role="dialog" aria-modal="true" aria-label={label}>
   <button type="button" className="product-risk-modal-close-v1" aria-label="Close Product Risk explanation" onClick={onClose}>×</button>
   <div className="eyebrow">Product Risk dimension</div>
   <h2>{label}</h2>
   <div className="product-risk-modal-level-v1"><span>Current level</span><strong>{dimension.level}</strong></div>
   <p>{dimension.explanation||definition?.shortDefinition||'This dimension describes one part of the investment’s risk profile.'}</p>
   <h3>Why it matters</h3>
   <p>{dimension.why_it_matters||definition?.whyItMatters}</p>
   <p className="muted fine">{directionCopy(dimension)}. Evidence confidence: {dimension.confidence}.</p>
  </div>
 </div>;
}
