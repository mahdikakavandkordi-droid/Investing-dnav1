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
 * A context-required row is a DNA-only comparison, not a failed/reviewed Match.
 * A review-required row is intentionally paused by a safety/data gate.
 */
export function matchScorePresentation(match:MatchDisplayLike):MatchScorePresentation{
  if(typeof match.match_score==='number'&&Number.isFinite(match.match_score)){
    const value=Math.round(match.match_score);
    return {kind:'numeric',text:`${value}/100`,numericValue:value};
  }

  if(match.eligibility==='context_required'||match.recommendation_tier==='consider'){
    return {kind:'context_only',text:'DNA-only',numericValue:null};
  }

  if(match.eligibility==='review_required'){
    return {kind:'review',text:'Review',numericValue:null};
  }

  return {kind:'unavailable',text:'—',numericValue:null};
}

export function matchFitLabel(match:MatchDisplayLike):string{
  return match.explanation?.fit_label ||
    match.fit_label ||
    ({
      top_match:'Closer fit',
      alternative:'Possible fit',
      consider:'DNA-only comparison',
      mismatch:'Outside current fit limits'
    }[match.recommendation_tier||'']||'Compatibility');
}

export function isContextOnlyMatch(match:MatchDisplayLike):boolean{
  return match.eligibility==='context_required'||match.recommendation_tier==='consider';
}
