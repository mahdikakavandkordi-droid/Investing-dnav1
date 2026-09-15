"use client";
import {useEffect,useState} from 'react';
import type {Session,User} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase';

export function useAccount(){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  const apply=(session:Session|null)=>{if(active){setUser(session?.user||null);setLoading(false)}};
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>apply(session));
  supabase.auth.getSession().then(({data,error})=>{
   if(error)throw error;
   apply(data.session);
  }).catch(()=>{if(active){setUser(null);setLoading(false)}});
  return ()=>{active=false;subscription.unsubscribe();};
 },[]);
 return {user,loading};
}
