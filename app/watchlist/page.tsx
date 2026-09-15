"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {instrumentWatchlist,removeInstrument} from '@/lib/instruments';
import type {SavedInstrument} from '@/lib/instruments';

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
  setItems([]);
  setError('');

  if(!user){
   setLoading(false);
   return;
  }

  setLoading(true);
  instrumentWatchlist()
   .then(data=>{if(active)setItems(data.items)})
   .catch(e=>{if(active)setError(e.message)})
   .finally(()=>{if(active)setLoading(false)});

  return ()=>{active=false};
 },[user?.id,retry]);

 async function remove(id:string){
  if(busyId)return;
  setBusyId(id);
  setError('');

  try{
   await removeInstrument(id);
   setItems(current=>current.filter(item=>item.investment_id!==id));
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to remove investment.');
  }finally{
   setBusyId('');
  }
 }

 return <section className="section">
  <div className="container">
   <div className="eyebrow">Your saved research</div>
   <h1>My watchlist</h1>
   <p className="muted">Keep investments here and return to their research profile. ETF items can also show your DNA compatibility.</p>

   {authLoading||loading
    ? <p>Loading your watchlist…</p>
    : !user
      ? <SignedOutWatchlist/>
      : <SavedList items={items} error={error} busyId={busyId} onRemove={id=>void remove(id)}/>} 

   {error&&<div role="alert" className="notice">
    <p>{error}</p>
    <button className="btn" onClick={()=>setRetry(value=>value+1)}>Retry</button>
   </div>}
  </div>
 </section>;
}

function SignedOutWatchlist(){
 return <div className="card">
  <h2>A place to come back to</h2>
  <p>Create a free account to save investment research across visits and devices.</p>
  <div className="actions">
   <Link className="btn primary" href="/profile?mode=signup">Create a free account</Link>
   <Link className="btn" href="/profile">Sign in</Link>
   <Link className="btn" href="/explore">Browse investments</Link>
  </div>
 </div>;
}

function SavedList({
 items,error,busyId,onRemove
}:{
 items:SavedInstrument[];
 error:string;
 busyId:string;
 onRemove:(id:string)=>void;
}){
 return <>
  {items.length===0&&!error
   ? <div className="card">
      <h2>Your watchlist is empty</h2>
      <p>Open an investment and choose “Save to my watchlist” to keep it here.</p>
      <Link className="btn primary" href="/explore">Explore investments</Link>
     </div>
   : <div className="grid3">
      {items.map(item=><SavedInvestmentCard
       key={item.investment_id}
       item={item}
       busy={busyId===item.investment_id}
       disabled={!!busyId}
       onRemove={()=>onRemove(item.investment_id)}
      />)}
     </div>}

  <div className="actions">
   <Link href="/profile">My profile</Link>
   <Link href="/explore">Explore more investments</Link>
  </div>
 </>;
}

function SavedInvestmentCard({
 item,busy,disabled,onRemove
}:{
 item:SavedInstrument;
 busy:boolean;
 disabled:boolean;
 onRemove:()=>void;
}){
 return <div className="card">
  {item.symbol&&<span className="pill">{item.symbol}</span>}
  <h2>{item.name}</h2>
  <div className="actions">
   <Link className="btn primary" href={'/investment/'+item.investment_id}>View research</Link>
   <button className="btn" disabled={disabled} onClick={onRemove}>{busy?'Removing…':'Remove'}</button>
  </div>
 </div>;
}
