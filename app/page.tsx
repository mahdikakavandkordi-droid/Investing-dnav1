import Link from "next/link";

/** Public Investor DNA landing page. */
export default function Home(){
 return <>
  <section className="hero">
   <div className="container">
    <div className="eyebrow">Investor DNA</div>
    <h1>Know yourself.<br/>Then understand what fits.</h1>
    <p>Start with how you handle risk. Add what this money is for. Then explore investments through a shared DNA language — from ETFs to GICs, T-Bills and bonds.</p>
    <div className="actions">
     <Link className="btn primary" href="/dna/assessment">Discover My Investing DNA</Link>
     <Link className="btn" href="/explore">Explore Investments</Link>
    </div>
    <p className="fine muted home-account-copy">
     No account required to start. <Link href="/profile?mode=signup">Create one later if you want to save your DNA and watchlist →</Link>
    </p>

    <div className="home-belief">
     <div className="home-belief-mark">✦</div>
     <div>
      <strong>Your risk profile and your money context are not the same thing.</strong>
      <p>You can be comfortable with risk and still need a more stable structure for money you may need soon. Investor DNA keeps those decisions separate.</p>
     </div>
    </div>
   </div>
  </section>

  <section className="section">
   <div className="container">
    <div className="grid3">
     <ValueCard
      title="01 · Know yourself"
      copy="Understand your risk comfort, financial capacity, decision patterns and investing experience."
     />
     <ValueCard
      title="02 · Add money context"
      copy="Tell us the goal, time horizon, access needs and whether protecting principal matters for this pool of money."
     />
     <ValueCard
      title="03 · Research what fits"
      copy="Compare Investment DNA across different structures. Personalized DNA Match is currently available for ETFs."
     />
    </div>
   </div>
  </section>
 </>;
}

function ValueCard({title,copy}:{title:string;copy:string}){
 return <div className="card">
  <h3>{title}</h3>
  <p className="muted">{copy}</p>
 </div>;
}
