import Link from "next/link";

/** Public Investor DNA landing page. */
export default function Home(){
 return <>
  <section className="home-hero-v3">
   <div className="container home-hero-grid">
    <div className="home-hero-copy">
     <div className="eyebrow">Investor DNA</div>
     <h1>Know your investing self. Then explore what fits — and why.</h1>
     <p className="home-hero-lede">Discover how you respond to risk, add the real purpose of your money, and research investments through one clear DNA language.</p>
     <div className="actions home-hero-actions">
      <Link className="btn primary" href="/dna/assessment">Start your DNA</Link>
      <Link className="btn home-explore-cta" href="/explore">Explore investments</Link>
     </div>
     <p className="fine muted home-account-copy">No account required to start. Create one later only if you want to save your DNA and watchlist.</p>
    </div>

    <div className="home-preview" aria-label="Sample Investor DNA preview">
     <div className="home-preview-landscape" aria-hidden="true">
      <svg viewBox="0 0 520 250" role="presentation">
       <path d="M0 210 L78 132 L126 174 L207 72 L268 143 L333 95 L410 167 L468 118 L520 177 L520 250 L0 250 Z" className="mountain-back"/>
       <path d="M0 228 L92 168 L147 204 L232 118 L292 187 L370 142 L438 202 L520 154 L520 250 L0 250 Z" className="mountain-front"/>
       <g className="pine-row">
        <path d="M44 224 l18-44 18 44 h-12 l16 26 H40 l16-26z"/>
        <path d="M421 225 l14-34 14 34 h-9 l12 20 h-34 l12-20z"/>
        <path d="M472 226 l18-43 18 43 h-11 l14 24 h-42 l15-24z"/>
       </g>
       <path d="M402 30 C474 69 474 114 403 154 C350 184 351 217 411 244" className="home-dna-strand"/>
       <path d="M462 30 C390 69 390 114 461 154 C514 184 513 217 453 244" className="home-dna-strand"/>
       {[48,76,105,134,163,192,220].map((y,index)=><line key={y} x1={index%2?406:418} y1={y} x2={index%2?457:445} y2={y} className="home-dna-rung"/>)}
      </svg>
     </div>

     <div className="home-preview-card">
      <div className="home-preview-label">Sample preview</div>
      <div className="home-preview-main">
       <div>
        <span>Your Investor DNA</span>
        <strong>Balanced Explorer</strong>
       </div>
       <div className="home-dna-orbit" aria-hidden="true"><span/><span/><span/></div>
      </div>
      <div className="home-preview-stats">
       <div><span>Risk comfort</span><strong>Moderate</strong></div>
       <div><span>Risk capacity</span><strong>Moderate</strong></div>
       <div><span>Decision style</span><strong>Measured</strong></div>
      </div>
      <div className="home-match-strip">
       <div><span>DNA Match</span><strong>See why an ETF fits your profile + money context</strong></div>
       <span aria-hidden>→</span>
      </div>
     </div>
    </div>
   </div>
  </section>

  <section className="home-pillars">
   <div className="container home-pillar-grid">
    <article className="home-pillar home-pillar-dna">
     <div className="eyebrow">01 · Discover</div>
     <h2>Your Investor DNA</h2>
     <p>Understand your risk comfort, financial capacity, decision patterns and investing experience.</p>
     <Link href="/dna/assessment">Start the assessment →</Link>
    </article>
    <article className="home-pillar home-pillar-explore">
     <div className="eyebrow">02 · Research</div>
     <h2>Explore investments</h2>
     <p>Browse ETFs, GICs, T-Bills and bonds through consistent structural facts instead of product jargon.</p>
     <div className="home-asset-chips"><span>ETFs</span><span>GICs</span><span>T-Bills</span><span>Bonds</span></div>
     <Link href="/explore">Open Explore →</Link>
    </article>
    <article className="home-pillar home-pillar-match">
     <div className="eyebrow">03 · Connect</div>
     <h2>Understand the fit</h2>
     <p>Add the goal, horizon and access needs for this money. DNA Match explains compatibility without turning it into a buy recommendation.</p>
     <Link href="/match">See how Match works →</Link>
    </article>
   </div>
  </section>
 </>;
}
