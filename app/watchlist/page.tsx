"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {instrumentWatchlist,removeInstrument} from '@/lib/instruments';
import type {SavedInstrument} from '@/lib/instruments';
import {trackProductEvent} from '@/lib/analytics';
import {useLocale} from '@/lib/locale';

/** Account-scoped, asset-neutral saved research list. */
export default function Watchlist(){
 const {user,loading:authLoading}=useAccount();
 const [items,setItems]=useState<SavedInstrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busyId,setBusyId]=useState('');
 const [retry,setRetry]=useState(0);
 const {locale,pick}=useLocale();

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
  }catch(e){setError(e instanceof Error?e.message:pick('Unable to remove investment.','Impossible de retirer ce placement.'));}
  finally{setBusyId('');}
 }

 return <main className="watchlist-page-v2">
  <div className="container watchlist-container-v2">
   <header className="watchlist-hero-v2">
    <div><div className="eyebrow">{pick("Saved research","Recherche enregistrée")}</div><div className="watchlist-title-row"><h1>{pick("Your watchlist","Votre liste de suivi")}</h1>{user&&!authLoading&&!loading&&<span className="mobile-watch-count">{locale==="fr"?`${items.length} enregistré${items.length===1?"":"s"}`:`${items.length} saved`}</span>}</div><p>{pick("Keep the investments you want to revisit in one quiet research workspace.","Gardez les placements que vous souhaitez revoir dans un espace de recherche simple et organisé.")}</p></div>
    <Link className="btn primary" href="/explore">{pick("Explore investments","Explorer les placements")}</Link>
   </header>

   {authLoading||loading
    ? <div className="watchlist-loading-v2">{pick("Loading your watchlist…","Chargement de votre liste de suivi…")}</div>
    : !user
      ? <SignedOutWatchlist locale={locale}/>
      : <SavedList items={items} error={error} busyId={busyId} onRemove={id=>void remove(id)} locale={locale}/>} 

   {error&&<div role="alert" className="notice"><p>{error}</p><button className="btn" onClick={()=>setRetry(value=>value+1)}>{pick("Retry","Réessayer")}</button></div>}
  </div>
 </main>;
}

function SignedOutWatchlist({locale}:{locale:"en"|"fr"}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 return <section className="watchlist-empty-v2">
  <div className="watchlist-empty-mark" aria-hidden="true">☆</div>
  <h2>{pick("A place to come back to","Un espace où revenir")}</h2>
  <p>{pick("Create an account only when you want to keep investment research across visits and devices.","Créez un compte seulement si vous souhaitez conserver votre recherche entre vos visites et vos appareils.")}</p>
  <div className="actions">
   <Link className="btn primary" href="/profile?mode=signup">{pick("Create account","Créer un compte")}</Link>
   <Link className="btn" href="/profile">{pick("Sign in","Connexion")}</Link>
  </div>
 </section>;
}

function SavedList({items,error,busyId,onRemove,locale}:{items:SavedInstrument[];error:string;busyId:string;onRemove:(id:string)=>void;locale:"en"|"fr";}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 return <>
  {items.length===0&&!error
   ? <section className="watchlist-empty-v2"><div className="watchlist-empty-mark" aria-hidden="true">☆</div><h2>{pick("Your watchlist is empty","Votre liste de suivi est vide")}</h2><p>{pick("Open an investment and save it when you want a quick way back.","Ouvrez un placement et enregistrez-le pour pouvoir y revenir rapidement.")}</p><Link className="btn primary" href="/explore">{pick("Explore investments","Explorer les placements")}</Link></section>
   : <div className="watchlist-grid-v2">{items.map(item=><SavedInvestmentCard key={item.investment_id} item={item} busy={busyId===item.investment_id} disabled={!!busyId} onRemove={()=>onRemove(item.investment_id)} locale={locale}/>)}</div>}
 </>;
}

function SavedInvestmentCard({item,busy,disabled,onRemove,locale}:{item:SavedInstrument;busy:boolean;disabled:boolean;onRemove:()=>void;locale:"en"|"fr";}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 return <article className="watchlist-card-v2">
  <div>{item.symbol&&<span className="symbol-tag">{item.symbol}</span>}<h2>{item.name}</h2><p>{pick("Saved investment research","Recherche de placement enregistrée")}</p></div>
  <div className="watchlist-card-actions-v2"><Link href={'/investment/'+item.investment_id}>{pick("View details →","Voir les détails →")}</Link><button disabled={disabled} onClick={onRemove}>{busy?pick('Removing…','Suppression…'):pick('Remove','Retirer')}</button></div>
 </article>;
}
