"use client";

import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import Link from 'next/link';
import {pilot,rpc} from '@/lib/supabase';
import {readClaimTicket} from '@/lib/dna';
import type {AppState} from '@/lib/dna';
import {useAccount} from '@/lib/use-account';
import {useLocale} from '@/lib/locale';

type Score=1|2|3|4|5;

/** Structured pilot feedback; submission is server-boundary data, not scoring input. */
export default function Feedback(){
 const {user}=useAccount();
 const [assessmentId,setAssessmentId]=useState<string|null>(null);
 const [ease,setEase]=useState<Score|null>(null);
 const [trust,setTrust]=useState<Score|null>(null);
 const [useful,setUseful]=useState<Score|null>(null);
 const [understood,setUnderstood]=useState<boolean|null>(null);
 const [matchAsBuy,setMatchAsBuy]=useState<boolean|null>(null);
 const [scoreAsReturn,setScoreAsReturn]=useState<boolean|null>(null);
 const [returnAgain,setReturnAgain]=useState<boolean|null>(null);
 const [text,setText]=useState('');
 const [busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(false);
 const [error,setError]=useState('');
 const {pick}=useLocale();

 useEffect(()=>{
  const claim=readClaimTicket();
  if(claim?.session.assessment_id)setAssessmentId(claim.session.assessment_id);

  if(user){
   rpc<AppState>('get_current_investor_app_state')
    .then(state=>{if(state?.assessment_id)setAssessmentId(state.assessment_id)})
    .catch(()=>{});
  }
 },[user?.id]);

 async function submit(event:FormEvent){
  event.preventDefault();
  if(!ease||!trust||!useful||understood===null||matchAsBuy===null||scoreAsReturn===null||returnAgain===null)return;

  setBusy(true);
  setError('');
  try{
   await pilot('submit_feedback',{
    assessment_id:assessmentId,
    ease_score:ease,
    trust_score:trust,
    usefulness_score:useful,
    understood_match:understood,
    interpreted_match_as_buy_recommendation:matchAsBuy,
    interpreted_match_score_as_return_forecast:scoreAsReturn,
    would_return:returnAgain,
    open_feedback:text
   });
   setSaved(true);
  }catch(e){
   setError(e instanceof Error?e.message:pick('Could not save feedback.','Impossible d’enregistrer les commentaires.'));
  }finally{
   setBusy(false);
  }
 }

 if(saved)return <FeedbackSaved/>;

 return <section className="section">
  <div className="container narrow">
   <div className="eyebrow">{pick("Investing DNA pilot","Pilote Investing DNA")}</div>
   <h1>{pick("Tell us what felt clear — and what did not","Dites-nous ce qui était clair — et ce qui ne l’était pas")}</h1>
   <p className="muted">{pick("This takes about a minute. We use it to improve comprehension and product value, not to change your score.","Cela prend environ une minute. Nous l’utilisons pour améliorer la compréhension et la valeur du produit, pas pour modifier votre score.")}</p>

   <form onSubmit={submit} className="auth-form">
    <Scale legend={pick("How easy was the experience to use?","Dans quelle mesure l’expérience était-elle facile à utiliser?")} value={ease} onChange={setEase}/>
    <Scale legend={pick("How much did you trust the way the result was explained?","Dans quelle mesure avez-vous fait confiance à la façon dont le résultat était expliqué?")} value={trust} onChange={setTrust}/>
    <Scale legend={pick("How useful was the result for understanding investments?","Dans quelle mesure le résultat était-il utile pour comprendre les placements?")} value={useful} onChange={setUseful}/>
    <BooleanQuestion
     legend={pick("Did you understand why a fund did or did not fit your DNA?","Avez-vous compris pourquoi un fonds correspondait ou non à votre DNA?")}
     value={understood}
     yesLabel={pick("Yes","Oui")}
     noLabel={pick("Not really","Pas vraiment")}
     onChange={setUnderstood}
    />
    <BooleanQuestion
     legend={pick("Did DNA Match feel like it was telling you which investment to buy?","DNA Match vous a-t-il semblé indiquer quel placement acheter?")}
     value={matchAsBuy}
     yesLabel={pick("Yes","Oui")}
     noLabel={pick("No","Non")}
     onChange={setMatchAsBuy}
    />
    <BooleanQuestion
     legend={pick("Did you interpret a Match score as an estimate of future return or performance?","Avez-vous interprété un score Match comme une estimation du rendement ou de la performance future?")}
     value={scoreAsReturn}
     yesLabel={pick("Yes","Oui")}
     noLabel={pick("No","Non")}
     onChange={setScoreAsReturn}
    />
    <BooleanQuestion
     legend={pick("Would you come back to Investing DNA to research or compare another investment?","Reviendriez-vous sur Investing DNA pour rechercher ou comparer un autre placement?")}
     value={returnAgain}
     yesLabel={pick("Yes","Oui")}
     noLabel={pick("Probably not","Probablement pas")}
     onChange={setReturnAgain}
    />

    <label>
     {pick("What was confusing or missing?","Qu’est-ce qui était confus ou manquant?")} <span className="fine muted">{pick("Optional","Facultatif")}</span>
     <textarea
      className="field"
      rows={5}
      maxLength={1500}
      value={text}
      onChange={event=>setText(event.target.value)}
      placeholder={pick("Tell us the one thing you would change…","Dites-nous la chose que vous changeriez…")}
     />
    </label>

    <button className="btn primary" disabled={busy||!ease||!trust||!useful||understood===null||matchAsBuy===null||scoreAsReturn===null||returnAgain===null}>
     {busy?pick('Saving…','Enregistrement…'):pick('Send pilot feedback','Envoyer mes commentaires')}
    </button>
    {error&&<p className="notice" role="alert">{error}</p>}
   </form>
  </div>
 </section>;
}

function Scale({legend,value,onChange}:{legend:string;value:Score|null;onChange:(value:Score)=>void}){
 const {pick}=useLocale();
 return <fieldset className="card">
  <legend><strong>{legend}</strong></legend>
  <div className="mode-tabs" role="radiogroup" aria-label={legend}>
   {([1,2,3,4,5] as Score[]).map(score=><button
    key={score}
    type="button"
    className="btn"
    aria-pressed={value===score}
    onClick={()=>onChange(score)}
   >{score}</button>)}
  </div>
  <p className="fine muted">{pick("1 = low · 5 = high","1 = faible · 5 = élevé")}</p>
 </fieldset>;
}

function BooleanQuestion({
 legend,value,yesLabel,noLabel,onChange
}:{
 legend:string;
 value:boolean|null;
 yesLabel:string;
 noLabel:string;
 onChange:(value:boolean)=>void;
}){
 return <fieldset className="card">
  <legend><strong>{legend}</strong></legend>
  <div className="mode-tabs">
   <button type="button" className="btn" aria-pressed={value===true} onClick={()=>onChange(true)}>{yesLabel}</button>
   <button type="button" className="btn" aria-pressed={value===false} onClick={()=>onChange(false)}>{noLabel}</button>
  </div>
 </fieldset>;
}

function FeedbackSaved(){
 const {pick}=useLocale();
 return <section className="section">
  <div className="container narrow">
   <div className="card">
    <div className="eyebrow">{pick("Pilot feedback saved","Commentaires du pilote enregistrés")}</div>
    <h1>{pick("Thank you — this is exactly what we need for the pilot.","Merci — c’est exactement ce dont nous avons besoin pour le pilote.")}</h1>
    <p>{pick("Your response will be analyzed in aggregate with product funnel data. It does not change your DNA or Match result.","Votre réponse sera analysée de façon agrégée avec les données du parcours produit. Elle ne modifie ni votre DNA ni votre résultat Match.")}</p>
    <div className="actions">
     <Link className="btn primary" href="/profile">{pick("Back to my profile","Retour à mon profil")}</Link>
     <Link className="btn" href="/match">{pick("Open my matches","Ouvrir mes correspondances")}</Link>
    </div>
   </div>
  </div>
 </section>;
}
