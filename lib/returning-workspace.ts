import {rpc} from '@/lib/supabase';

const CACHE_PREFIX='investing-dna:returning-workspace:v1:';

export type ReturningWorkspaceItem={
 investment_id:string;
 symbol:string;
 name:string;
 price_date:string|null;
 latest_price:number|null;
 daily_change_pct:number|null;
 currency:string|null;
};

export type ReturningWorkspaceSummary={
 has_profile:boolean;
 returning:boolean;
 previous_seen_at:string|null;
 previous_market_date?:string|null;
 current_market_date?:string|null;
 watchlist_count:number;
 watchlist_changed?:boolean;
 new_market_data_count:number;
 updated_saved_items:ReturningWorkspaceItem[];
 match_updated:boolean;
 assessment_changed?:boolean;
};

function keyFor(userId:string){return CACHE_PREFIX+userId;}

export function readReturningWorkspaceCache(userId:string):ReturningWorkspaceSummary|null{
 if(typeof window==='undefined')return null;
 try{
  const raw=sessionStorage.getItem(keyFor(userId));
  if(!raw)return null;
  const value=JSON.parse(raw) as ReturningWorkspaceSummary;
  return value&&typeof value==='object'?value:null;
 }catch{return null}
}

export async function openReturningWorkspace(userId:string):Promise<ReturningWorkspaceSummary>{
 const cached=readReturningWorkspaceCache(userId);
 if(cached)return cached;
 const data=await rpc<ReturningWorkspaceSummary>('app_open_returning_workspace');
 try{sessionStorage.setItem(keyFor(userId),JSON.stringify(data));}catch{}
 return data;
}

export function clearReturningWorkspaceCache(userId?:string){
 if(typeof window==='undefined')return;
 try{
  if(userId){sessionStorage.removeItem(keyFor(userId));return;}
  for(let index=sessionStorage.length-1;index>=0;index-=1){
   const key=sessionStorage.key(index);
   if(key?.startsWith(CACHE_PREFIX))sessionStorage.removeItem(key);
  }
 }catch{}
}
