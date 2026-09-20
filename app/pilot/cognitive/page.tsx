"use client";

import {useState} from 'react';
import type {FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {clearDraft} from '@/lib/dna';
import {useLocale} from '@/lib/locale';

const ACCESS_KEY='investing-dna:cognitive-access:v1';

/** Moderator-gated entry that isolates cognitive sessions from dev traffic. */
export default function CognitivePilotEntry(){
 const router=useRouter();
 const [code,setCode]=useState('');
 const [error,setError]=useState('');
 const {pick}=useLocale();

 function begin(event:FormEvent){
  event.preventDefault();
  const value=code.trim();
  if(!value){
   setError(pick('Enter the moderator research invite code.','Entrez le code d’invitation de recherche fourni par le modérateur.'));
   return;
  }

  try{
   // The raw code is session-only and deliberately absent from URLs/analytics.
   sessionStorage.setItem(ACCESS_KEY,value);
   clearDraft();
   router.replace('/dna/assessment?cohort=COGNITIVE_V1_10');
  }catch{
   setError(pick('This browser cannot start a controlled research session.','Ce navigateur ne peut pas démarrer une session de recherche contrôlée.'));
  }
 }

 return <section className="section">
  <div className="container narrow">
   <div className="card">
    <div className="eyebrow">{pick("Cognitive research session","Session de recherche cognitive")}</div>
    <h1>{pick("Start a clean v1.10 research assessment","Démarrer une nouvelle évaluation de recherche v1.10")}</h1>
    <p>{pick("This route is reserved for moderated cognitive testing. The invite code keeps development traffic out of the 12-person research cohort.","Cette route est réservée aux tests cognitifs modérés. Le code d’invitation empêche le trafic de développement d’être mélangé à la cohorte de recherche de 12 personnes.")}</p>

    <form className="auth-form" onSubmit={begin}>
     <label>
      {pick("Research invite code","Code d’invitation de recherche")}
      <input
       className="field"
       type="password"
       autoComplete="off"
       value={code}
       onChange={event=>setCode(event.target.value)}
       placeholder={pick("Moderator code","Code du modérateur")}
      />
     </label>
     <button className="btn primary">{pick("Continue to research assessment","Continuer vers l’évaluation de recherche")}</button>
     {error&&<p className="notice" role="alert">{error}</p>}
    </form>

    <p className="fine muted">{pick("The code is kept only in this browser session long enough to start the research assessment. It is not included in the URL or analytics.","Le code est conservé uniquement dans cette session du navigateur, juste assez longtemps pour démarrer l’évaluation de recherche. Il n’est inclus ni dans l’URL ni dans les données analytiques.")}</p>
   </div>
  </div>
 </section>;
}
