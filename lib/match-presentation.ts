import type {MatchItem} from '@/lib/dna';

/**
 * Presentation-only semantics for DNA Match outputs.
 *
 * Canonical scoring stays in Postgres. This module only decides how an already
 * computed Match state should be described in the browser so missing/context-
 * limited scores are never mistaken for personalized numeric compatibility.
 */
export type MatchDisplayLike = Pick<
  MatchItem,
  'match_score'|'eligibility'|'recommendation_tier'|'fit_label'|'explanation'
>;

export type MatchScorePresentation = {
  kind:'numeric'|'context_only'|'review'|'unavailable';
  text:string;
  numericValue:number|null;
};

/**
 * Payload status is allowed to override row-level data. This keeps every UI
 * surface safe even if a stale/backend-regression row accidentally carries a
 * numeric score while the overall Match run is context-required or paused.
 */
export function matchScorePresentation(match:MatchDisplayLike,payloadStatus?:string|null):MatchScorePresentation{
  if(payloadStatus==='context_required'){
    return {kind:'context_only',text:'DNA-only',numericValue:null};
  }

  if(payloadStatus==='review_required'){
    return {kind:'review',text:'Review',numericValue:null};
  }

  if(match.eligibility==='context_required'||match.recommendation_tier==='consider'){
    return {kind:'context_only',text:'DNA-only',numericValue:null};
  }

  if(match.eligibility==='review_required'){
    return {kind:'review',text:'Review',numericValue:null};
  }

  if(typeof match.match_score==='number'&&Number.isFinite(match.match_score)){
    const value=Math.round(match.match_score);
    return {kind:'numeric',text:`${value}/100`,numericValue:value};
  }

  return {kind:'unavailable',text:'—',numericValue:null};
}

export function matchFitLabel(match:MatchDisplayLike,payloadStatus?:string|null):string{
  if(payloadStatus==='context_required')return 'DNA-only comparison';
  if(payloadStatus==='review_required')return 'Review required';

  return match.explanation?.fit_label ||
    match.fit_label ||
    ({
      top_match:'Closer fit',
      alternative:'Possible fit',
      consider:'DNA-only comparison',
      mismatch:'Outside current fit limits'
    }[match.recommendation_tier||'']||'Compatibility');
}

export function isContextOnlyMatch(match:MatchDisplayLike,payloadStatus?:string|null):boolean{
  return payloadStatus==='context_required'||match.eligibility==='context_required'||match.recommendation_tier==='consider';
}
