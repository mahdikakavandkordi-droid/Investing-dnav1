"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {instrumentWatchlist,removeInstrument} from '@/lib/instruments';
import type {SavedInstrument} from '@/lib/instruments';
import {trackProductEvent} from '@/lib/analytics';

/** Account-scoped, asset-neutral saved research list. */
export default function Watchlist(){
 const {user,loading:authLoading}=useAccount();
 const [items,setItems]=useState<SavedInstrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busyId,setBusyId]=useState('');
 const [retry,setRetry]=useState(0);

 useEffect(()=>{
  let active=true;
  setItems([]);setError('');
  if(!user){setLoading(false);return;}
  setLoading(true);
  instrumentWatchlist()
   .then(data=>{if(active)setItems(data.items)})
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[user?.id,retry]);

 async function remove(id:string){
  if(busyId)return;
  setBusyId(id);setError('');
  try{
   await removeInstrument(id);
   setItems(current=>current.filter(item=>item.investment_id!==id));
   void trackProductEvent('watchlist_removed',{investment_id:id});
  }catch(e){setError(e instanceof Error?e.message:'Unable to remove investment.');}
  finally{setBusyId('');}
 }

 return <main className="watchlist-page-v2">
  <div className="container watchlist-container-v2">
   <header className="watchlist-hero-v2">
    <div><div className="eyebrow">Saved research</div><div className="watchlist-title-row"><h1>Your watchlist</h1>{user&&!authLoading&&!loading&&<span className="mobile-watch-count">{items.length} saved</span>}</div><p>Keep the investments you want to revisit in one quiet research workspace.</p></div>
    <Link className="btn primary" href="/explore">Explore investments</Link>
   </header>

   {authLoading||loading
    ? <div className="watchlist-loading-v2">Loading your watchlist…</div>
    : !user
      ? <SignedOutWatchlist/>
      : <SavedList items={items} error={error} busyId={busyId} onRemove={id=>void remove(id)}/>} 

   {error&&<div role="alert" className="notice"><p>{error}</p><button className="btn" onClick={()=>setRetry(value=>value+1)}>Retry</button></div>}
  </div>
 </main>;
}

function SignedOutWatchlist(){
 return <section className="watchlist-empty-v2">
  <div className="watchlist-empty-mark" aria-hidden="true">☆</div>
  <h2>A place to come back to</h2>
  <p>Create an account only when you want to keep investment research across visits and devices.</p>
  <div className="actions">
   <Link className="btn primary" href="/profile?mode=signup">Create account</Link>
   <Link className="btn" href="/profile">Sign in</Link>
  </div>
 </section>;
}

function SavedList({items,error,busyId,onRemove}:{items:SavedInstrument[];error:string;busyId:string;onRemove:(id:string)=>void;}){
 return <>
  {items.length===0&&!error
   ? <section className="watchlist-empty-v2"><div className="watchlist-empty-mark" aria-hidden="true">☆</div><h2>Your watchlist is empty</h2><p>Open an investment and save it when you want a quick way back.</p><Link className="btn primary" href="/explore">Explore investments</Link></section>
   : <div className="watchlist-grid-v2">{items.map(item=><SavedInvestmentCard key={item.investment_id} item={item} busy={busyId===item.investment_id} disabled={!!busyId} onRemove={()=>onRemove(item.investment_id)}/>)}</div>}
 </>;
}

function SavedInvestmentCard({item,busy,disabled,onRemove}:{item:SavedInstrument;busy:boolean;disabled:boolean;onRemove:()=>void;}){
 return <article className="watchlist-card-v2">
  <div>{item.symbol&&<span className="symbol-tag">{item.symbol}</span>}<h2>{item.name}</h2><p>Saved investment research</p></div>
  <div className="watchlist-card-actions-v2"><Link href={'/investment/'+item.investment_id}>View details →</Link><button disabled={disabled} onClick={onRemove}>{busy?'Removing…':'Remove'}</button></div>
 </article>;
}
