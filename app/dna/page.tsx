import Link from "next/link";

const ARCHETYPES:[string,string][]=[
 ["VAULT","The Capital Protector"],
 ["ANCHOR","The Steady Builder"],
 ["COOLHAND","The Calm Conservative"],
 ["SCOUT","The Cautious Explorer"],
 ["MAVERICK","The Independent"],
 ["STRIKER","The Calculated Aggressor"],
 ["HOTSHOT","The High-Risk Aspirant"],
 ["HIGHROLLER","The Capital Leader"],
 ["JACKPOT","The Visionary"]
];

/** Investing DNA assessment overview. */
export default function DNA(){
 return <section className="section">
  <div className="container">
   <div className="eyebrow">Investing DNA</div>
   <h1>Discover the investor behind the decision.</h1>
   <p className="muted" style={{maxWidth:720,fontSize:18}}>
    Your Investor DNA combines risk tolerance, risk capacity and behavioral traits into a personal investment identity.
   </p>
   <div className="actions">
    <Link className="btn primary" href="/dna/assessment">Start Assessment</Link>
   </div>

   <div className="grid3" style={{marginTop:38}}>
    {ARCHETYPES.map(([code,title])=><div className="card" key={code}>
     <span className="pill">{code}</span>
     <h3>{title}</h3>
     <p className="muted">A distinct investor character generated from the DNA model.</p>
    </div>)}
   </div>
  </div>
 </section>;
}
