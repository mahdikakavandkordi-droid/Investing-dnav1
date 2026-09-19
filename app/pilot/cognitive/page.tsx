"use client";

import {useState} from 'react';
import type {FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {clearDraft} from '@/lib/dna';

const ACCESS_KEY='investing-dna:cognitive-access:v1';

/** Moderator-gated entry that isolates cognitive sessions from dev traffic. */
export default function CognitivePilotEntry(){
 const router=useRouter();
 const [code,setCode]=useState('');
 const [error,setError]=useState('');

 function begin(event:FormEvent){
  event.preventDefault();
  const value=code.trim();
  if(!value){
   setError('Enter the moderator research invite code.');
   return;
  }

  try{
   // The raw code is session-only and deliberately absent from URLs/analytics.
   sessionStorage.setItem(ACCESS_KEY,value);
   clearDraft();
   router.replace('/dna/assessment?cohort=COGNITIVE_V1_10');
  }catch{
   setError('This browser cannot start a controlled research session.');
  }
 }

 return <section className="section">
  <div className="container narrow">
   <div className="card">
    <div className="eyebrow">Cognitive research session</div>
    <h1>Start a clean v1.10 research assessment</h1>
    <p>This route is reserved for moderated cognitive testing. The invite code keeps development traffic out of the 12-person research cohort.</p>

    <form className="auth-form" onSubmit={begin}>
     <label>
      Research invite code
      <input
       className="field"
       type="password"
       autoComplete="off"
       value={code}
       onChange={event=>setCode(event.target.value)}
       placeholder="Moderator code"
      />
     </label>
     <button className="btn primary">Continue to research assessment</button>
     {error&&<p className="notice" role="alert">{error}</p>}
    </form>

    <p className="fine muted">The code is kept only in this browser session long enough to start the research assessment. It is not included in the URL or analytics.</p>
   </div>
  </div>
 </section>;
}
