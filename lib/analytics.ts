import {pilot} from '@/lib/supabase';
import {getBrowserSessionId,getVisitorId,isReturningVisitor,markVisitorSeen} from '@/lib/browser-session';

/**
 * Browser-side pilot analytics client.
 *
 * Events are sent through the privileged Edge Function rather than written to
 * analytics tables directly. Keep this event union and metadata shape aligned
 * with the server allowlist in `supabase/functions/investing-dna-pilot/index.ts`.
 * Never send questionnaire answer text, email or other arbitrary personal data
 * through this metadata channel.
 */
export type ProductEvent=
 'app_session_started'|'explore_viewed'|'assessment_started'|'assessment_completed'|
 'dna_result_viewed'|'secure_link_requested'|'signup_requested'|'dna_claimed'|
 'investment_context_saved'|'match_viewed'|'fund_viewed'|'screener_viewed'|
 'compare_viewed'|'watchlist_saved'|'watchlist_removed'|'watchlist_viewed'|
 'profile_viewed'|'feedback_submitted';

type EventOptions={
 route?:string;
 investment_id?:string|null;
 assessment_id?:string|null;
 metadata?:Record<string,string|number|boolean|null>;
};

/** Best-effort telemetry: product behavior must not fail because analytics failed. */
export async function trackProductEvent(event_name:ProductEvent,options:EventOptions={}){
 if(typeof window==='undefined')return false;
 const browser_session_id=getBrowserSessionId(),visitor_id=getVisitorId();
 if(!browser_session_id||!visitor_id)return false;
 try{
  const result=await pilot<{tracked:boolean}>('track_event',{
   event_name,
   browser_session_id,
   visitor_id,
   route:options.route||location.pathname,
   investment_id:options.investment_id||null,
   assessment_id:options.assessment_id||null,
   metadata:options.metadata||{}
  });
  return !!result.tracked;
 }catch{return false}
}

export async function trackSessionStart(){
 if(typeof window==='undefined')return;
 const returning=isReturningVisitor();
 await trackProductEvent('app_session_started',{metadata:{returning}});
 markVisitorSeen();
}
