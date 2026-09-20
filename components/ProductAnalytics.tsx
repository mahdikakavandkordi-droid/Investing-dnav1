"use client";

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {trackProductEvent,trackSessionStart} from '@/lib/analytics';
import type {ProductEvent} from '@/lib/analytics';

const START_KEY='investing-dna:session-start:v1';

type RouteEvent={event:ProductEvent;investment_id?:string};

/**
 * Route-level pilot telemetry orchestration.
 *
 * This component emits only the allowlisted privacy-minimized events defined in
 * `lib/analytics.ts`. The historical event name `fund_viewed` is retained for
 * the generic investment detail route to preserve pilot funnel continuity.
 */
export function ProductAnalytics(){
 const pathname=usePathname();

 useEffect(()=>{
  if(sessionStorage.getItem(START_KEY))return;
  sessionStorage.setItem(START_KEY,'1');
  void trackSessionStart();
 },[]);

 useEffect(()=>{
  const routeEvent=eventFor(pathname);
  if(routeEvent){
   void trackProductEvent(routeEvent.event,{
    route:pathname,
    investment_id:routeEvent.investment_id
   });
  }

  if(pathname==='/signup'){
   void trackProductEvent('signup_requested',{
    route:'/signup',
    metadata:{source:'signup_route'}
   });
  }
 },[pathname]);

 return null;
}

function eventFor(path:string):RouteEvent|null{
 if(path==='/explore')return {event:'explore_viewed'};
 if(path==='/dna/result')return {event:'dna_result_viewed'};
 if(path==='/match')return {event:'match_viewed'};
 if(path==='/screener')return {event:'screener_viewed'};
 if(path==='/compare')return {event:'compare_viewed'};
 if(path==='/watchlist')return {event:'watchlist_viewed'};
 if(path==='/profile')return {event:'profile_viewed'};

 const investmentMatch=path.match(/^\/investment\/([0-9a-f-]{36})$/i);
 if(investmentMatch){
  return {event:'fund_viewed',investment_id:investmentMatch[1]};
 }
 return null;
}
