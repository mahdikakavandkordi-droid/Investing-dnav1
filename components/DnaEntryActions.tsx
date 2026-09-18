"use client";

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {readDraft} from '@/lib/dna';
import type {AppState} from '@/lib/dna';
import {rpc} from '@/lib/supabase';
import {useAccount} from '@/lib/use-account';

type DnaAvailability='checking'|'current'|'saved'|'none';

/**
 * Keep the neutral /dna overview useful for both new and returning visitors.
 * Completed guest DNA remains session-memory only; this component merely makes
 * that existing result discoverable without persisting it or changing privacy.
 */
export function DnaEntryActions(){
 const {user,loading:authLoading}=useAccount();
 const [availability,setAvailability]=useState<DnaAvailability>('checking');

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
   <span className="muted">Checking your Investor DNA…</span>
  </div>;
 }

 if(availability==='current'){
  return <div className="actions">
   <Link className="btn primary" href="/dna/result">View my current DNA</Link>
   <Link className="btn" href="/dna/assessment">Start a new assessment</Link>
  </div>;
 }

 if(availability==='saved'){
  return <div className="actions">
   <Link className="btn primary" href="/dna/result">View my saved DNA</Link>
   <Link className="btn" href="/dna/assessment">Retake assessment</Link>
  </div>;
 }

 return <div className="actions">
  <Link className="btn primary" href="/dna/assessment">Start as guest</Link>
  <Link className="btn" href="/profile">I already have an account</Link>
 </div>;
}
