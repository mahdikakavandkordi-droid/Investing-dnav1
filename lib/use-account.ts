"use client";
import {useEffect,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase';
export function useAccount(){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase){setLoading(false);return;}
 const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setLoading(false);});
 return ()=>subscription.unsubscribe();},[]);
 return {user,loading};
}
