import Link from "next/link";

/** Public Investor DNA landing page. */
export default function Home(){
 return <>
  <section className="hero">
   <div className="container">
    <div className="eyebrow">Investor DNA</div>
    <h1>Know yourself.<br/>Understand your investments.</h1>
    <p>Build your Investing DNA, then research how different investment structures fit the purpose and time horizon of your money.</p>
    <div className="actions">
     <Link className="btn primary" href="/dna/assessment">Discover My Investing DNA</Link>
     <Link className="btn" href="/explore">Explore Investments</Link>
     <Link className="btn" href="/profile?mode=signup">Create a free account</Link>
    </div>
   </div>
  </section>

  <section className="section">
   <div className="container">
    <div className="grid3">
     <ValueCard
      title="01 · Investing DNA"
      copy="Map your risk tolerance, financial capacity and behavioral fingerprint."
     />
     <ValueCard
      title="02 · Investment DNA"
      copy="Research ETFs and representative Canadian fixed-income, deposit and money-market structures using a common language."
     />
     <ValueCard
      title="03 · DNA Match"
      copy="Use personalized ETF compatibility today while non-ETF assets remain research-only until their Match models are separately validated."
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
