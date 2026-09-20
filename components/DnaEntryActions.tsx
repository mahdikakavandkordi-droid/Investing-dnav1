"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {readDraft} from '@/lib/dna';
import type {AppState} from '@/lib/dna';
import {rpc} from '@/lib/supabase';
import {useAccount} from '@/lib/use-account';
import {useLocale} from '@/lib/locale';

type DnaAvailability='checking'|'current'|'saved'|'none';

/**
 * Keep the neutral /dna overview useful for both new and returning visitors.
 * Completed guest DNA remains browser-session only; this component merely makes
 * that existing result discoverable without turning it into an account record.
 */
export function DnaEntryActions(){
 const {user,loading:authLoading}=useAccount();
 const [availability,setAvailability]=useState<DnaAvailability>('checking');
 const {pick}=useLocale();

 useEffect(()=>{
  let active=true;
  if(authLoading)return ()=>{active=false};

  const local=readDraft(user?.id||null);
  if(local?.result){
   setAvailability('current');
   return ()=>{active=false};
  }

  if(!user){
   setAvailability('none');
   return ()=>{active=false};
  }

  rpc<AppState>('get_current_investor_app_state')
   .then(state=>{if(active)setAvailability(state.dna?'saved':'none')})
   .catch(()=>{if(active)setAvailability('none')});

  return ()=>{active=false};
 },[authLoading,user?.id]);

 if(authLoading||availability==='checking'){
  return <div className="actions" aria-live="polite">
   <span className="muted">{pick("Checking your Investor DNA…","Vérification de votre Investor DNA…")}</span>
  </div>;
 }

 if(availability==='current'){
  return <div className="actions">
   <Link className="btn primary" href="/dna/result">{pick("View my current DNA","Voir mon DNA actuel")}</Link>
   <Link className="btn" href="/dna/assessment?fresh=1">{pick("Start a new assessment","Commencer une nouvelle évaluation")}</Link>
  </div>;
 }

 if(availability==='saved'){
  return <div className="actions">
   <Link className="btn primary" href="/dna/result">{pick("View my saved DNA","Voir mon DNA enregistré")}</Link>
   <Link className="btn" href="/dna/assessment?fresh=1">{pick("Retake assessment","Refaire l’évaluation")}</Link>
  </div>;
 }

 return <div className="actions">
  <Link className="btn primary" href="/dna/assessment">{pick("Start as guest","Commencer sans compte")}</Link>
  <Link className="btn" href="/profile">{pick("I already have an account","J’ai déjà un compte")}</Link>
 </div>;
}
