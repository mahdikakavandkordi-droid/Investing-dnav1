import {DnaEntryActions} from "@/components/DnaEntryActions";

const PILLARS:[string,string][]=[
 ["Risk comfort","How much uncertainty and market movement you are emotionally comfortable accepting."],
 ["Financial capacity","How much risk your finances can realistically absorb without disrupting important needs."],
 ["Decision patterns","How you tend to react to evidence, pressure, other people and changing markets."],
 ["Investing experience","The experience you already have making decisions and living through market moves."]
];

/** Investing DNA assessment overview. Keep this page neutral so it does not prime assessment answers. */
export default function DNA(){
 return <section className="section">
  <div className="container">
   <div className="eyebrow">Investing DNA</div>
   <h1>See how you handle risk before choosing what to invest in.</h1>
   <p className="muted" style={{maxWidth:760,fontSize:18}}>
    The assessment looks at four different parts of your investing profile. There is no “best” result and no score you should try to maximize.
   </p>
   <div className="assessment-meta" style={{marginTop:20}}>
    <span>28 questions</span>
    <span>No account required</span>
    <span>Save your result only if you want</span>
   </div>
   <DnaEntryActions/>

   <div className="grid2" style={{marginTop:38}}>
    {PILLARS.map(([title,copy])=><div className="card" key={title}>
     <h3>{title}</h3>
     <p className="muted">{copy}</p>
    </div>)}
   </div>

   <div className="home-belief">
    <div className="home-belief-mark">✦</div>
    <div>
     <strong>Your archetype is a summary, not a verdict.</strong>
     <p>Your result is meant to help you understand trade-offs and ask better questions. Your goal, time horizon and liquidity needs are added separately after the assessment.</p>
    </div>
   </div>
  </div>
 </section>;
}
