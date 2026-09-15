"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {trackProductEvent,trackSessionStart,type ProductEvent} from '@/lib/analytics';

const START_KEY='investing-dna:session-start:v1';
function eventFor(path:string):{event:ProductEvent;investment_id?:string}|null{
 if(path==='/explore')return {event:'explore_viewed'};
 if(path==='/dna/result')return {event:'dna_result_viewed'};
 if(path==='/match')return {event:'match_viewed'};
 if(path==='/screener')return {event:'screener_viewed'};
 if(path==='/compare')return {event:'compare_viewed'};
 if(path==='/watchlist')return {event:'watchlist_viewed'};
 if(path==='/profile')return {event:'profile_viewed'};
 const match=path.match(/^\/investment\/([0-9a-f-]{36})$/i);if(match)return {event:'fund_viewed',investment_id:match[1]};
 return null;
}
export function ProductAnalytics(){const pathname=usePathname();
 useEffect(()=>{if(!sessionStorage.getItem(START_KEY)){sessionStorage.setItem(START_KEY,'1');void trackSessionStart()}},[]);
 useEffect(()=>{const item=eventFor(pathname);if(item)void trackProductEvent(item.event,{route:pathname,investment_id:item.investment_id})},[pathname]);
 return null;
}
