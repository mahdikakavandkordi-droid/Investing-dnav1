"use client";

import {DnaEntryActions} from "@/components/DnaEntryActions";
import {useLocale} from "@/lib/locale";

const PILLARS=(pick:(en:string,fr:string)=>string):[string,string][][]=>[
 [pick("Risk tolerance","Tolérance au risque"),pick("How much uncertainty and market movement you are emotionally comfortable accepting.","Le niveau d’incertitude et de mouvement des marchés que vous êtes à l’aise d’accepter.")],
 [pick("Financial capacity","Capacité financière"),pick("How much risk your finances can realistically absorb without disrupting important needs.","Le niveau de risque que vos finances peuvent réellement absorber sans compromettre vos besoins importants.")],
 [pick("Decision patterns","Habitudes de décision"),pick("How you tend to react to evidence, pressure, other people and changing markets.","Votre façon habituelle de réagir aux informations, à la pression, aux autres et aux marchés en changement.")],
 [pick("Investing experience","Expérience en placement"),pick("The experience you already have making decisions and living through market moves.","L’expérience que vous avez déjà acquise en prenant des décisions et en traversant des mouvements de marché.")]
];

/** Investing DNA assessment overview. Keep this page neutral so it does not prime assessment answers. */
export default function DNA(){
 const {pick}=useLocale();
 return <section className="section dna-entry-page">
  <div className="container dna-entry-shell">
   <div className="dna-entry-hero"><div className="eyebrow">Investing DNA</div>
   <h1>{pick("See how you handle risk before choosing what to invest in.","Comprenez votre rapport au risque avant de choisir où investir.")}</h1>
   <p className="muted" style={{maxWidth:760,fontSize:18}}>
    {pick("The assessment looks at four different parts of your investing profile. There is no “best” result and no score you should try to maximize.","L’évaluation examine quatre dimensions de votre profil d’investisseur. Il n’y a pas de « meilleur » résultat ni de score à maximiser.")}
   </p>
   <div className="assessment-meta" style={{marginTop:20}}>
    <span>{pick("28 questions","28 questions")}</span>
    <span>{pick("No account required","Aucun compte requis")}</span>
    <span>{pick("Save your result only if you want","Enregistrez votre résultat seulement si vous le souhaitez")}</span>
   </div>
   <DnaEntryActions/></div>

   <div className="grid2 dna-pillar-grid" style={{marginTop:38}}>
    {PILLARS(pick).map(([title,copy])=><div className="card dna-pillar-card" key={title}>
     <h3>{title}</h3>
     <p className="muted">{copy}</p>
    </div>)}
   </div>

   <div className="home-belief dna-entry-belief">
    <div className="home-belief-mark">✦</div>
    <div>
     <strong>{pick("Your archetype is a summary, not a verdict.","Votre archétype est un résumé, pas un verdict.")}</strong>
     <p>{pick("Your result is meant to help you understand trade-offs and ask better questions. Your goal, time horizon, liquidity need and principal-protection requirement are added separately after the assessment.","Votre résultat vise à vous aider à comprendre les compromis et à poser de meilleures questions. Votre objectif, votre horizon, vos besoins de liquidité et votre exigence de protection du capital sont ajoutés séparément après l’évaluation.")}</p>
    </div>
   </div>
  </div>
 </section>;
}
