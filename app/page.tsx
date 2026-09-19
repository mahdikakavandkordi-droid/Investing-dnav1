import Link from "next/link";
import {HomeAssetRail} from "@/components/HomeAssetRail";
import {HomeWorkspaceReturn} from "@/components/HomeWorkspaceReturn";

const CAPABILITIES=[
 {icon:"◉",title:"Behavioral profile",body:"Understand the decision patterns that shape how you invest."},
 {icon:"▥",title:"Risk capacity",body:"Separate how much risk you can take from how much risk you want."},
 {icon:"◎",title:"Explainable match",body:"See why an investment is more or less compatible with your DNA and goal."},
 {icon:"⇄",title:"Explore & compare",body:"Research Canadian investments side by side with asset-specific data."},
 {icon:"♡",title:"Save your watchlist",body:"Keep the investments you want to revisit without interrupting your research."}
];

export default function Home(){
 return <div className="platform-home">
  <section className="platform-hero">
   <div className="platform-hero-scenery" aria-hidden="true">
    <span className="hero-mountain hero-mountain-far"/>
    <span className="hero-mountain hero-mountain-mid"/>
    <span className="hero-mountain hero-mountain-near"/>
    <span className="hero-mist hero-mist-one"/>
    <span className="hero-mist hero-mist-two"/>
    <span className="hero-lake"/>
    <span className="hero-pine hero-pine-left-one"/>
    <span className="hero-pine hero-pine-left-two"/>
    <span className="hero-pine hero-pine-right-one"/>
    <span className="hero-pine hero-pine-right-two"/>
   </div>
   <div className="container platform-hero-grid">
    <div className="platform-hero-copy">
     <div className="eyebrow">Invest with clarity</div>
     <h1><span>Know your investor DNA.</span><br/>Find investments that fit — and understand why.</h1>
     <p>Discover your risk profile, add the context for this money, then explore and compare Canadian investments with clearer explanations.</p>
     <div className="platform-hero-actions">
      <Link className="btn primary" href="/dna/assessment">Start your DNA <span aria-hidden>→</span></Link>
      <Link className="btn platform-btn-secondary" href="/explore">Explore investments</Link>
     </div>
     <div className="platform-hero-trust">
      <span>◒ Built for Canadian investors</span>
      <span>◆ Clear, explainable research</span>
      <span>▮ Educational, not advice</span>
     </div>
    </div>

    <div className="platform-product-preview" aria-label="Your Investor DNA (preview)">
     <div className="platform-preview-label">Your Investor DNA (preview)</div>
     <div className="platform-preview-grid">
      <article className="preview-card preview-dna">
       <div className="preview-card-head"><span className="preview-icon">◉</span><span>Investor profile</span></div>
       <strong>The Balanced Builder</strong>
       <p>Seeks steady growth, values stability, and prefers a measured approach.</p>
       <div className="preview-chips"><span>Long-term minded</span><span>Moderate risk</span><span>Diversified growth</span></div>
      </article>

      <article className="preview-card preview-risk">
       <div className="preview-card-head"><span className="preview-icon">▥</span><span>Risk profile</span></div>
       <strong>Moderate</strong>
       <div className="preview-risk-bar"><i/><b/></div>
       <div className="preview-risk-scale"><span>Lower risk</span><span>Higher risk</span></div>
      </article>

      <article className="preview-card preview-context">
       <div className="preview-card-head"><span className="preview-icon">◎</span><span>Investment context</span></div>
       <dl><div><dt>Goal</dt><dd>Retirement</dd></div><div><dt>Horizon</dt><dd>10+ years</dd></div><div><dt>Liquidity</dt><dd>Low</dd></div></dl>
      </article>

      <article className="preview-card preview-match">
       <div className="preview-card-head"><span className="preview-icon">↗</span><span>Sample compatibility</span></div>
       <div className="preview-match-row"><div><strong>VBAL</strong><span>Balanced ETF</span></div><b>84%</b></div>
       <ul><li>Balanced structure</li><li>Long-term context</li><li>Broad diversification</li></ul>
       <small>Illustrative example — not a recommendation.</small>
      </article>
     </div>
     <div className="platform-dna-watermark" aria-hidden="true"><span/><span/><span/><span/></div>
    </div>
   </div>
  </section>

  <HomeWorkspaceReturn/>

  <section className="platform-how" id="how-it-works">
   <div className="container">
    <div className="platform-section-heading compact">
     <div><div className="eyebrow">A simple path to smarter research</div><h2>How it works</h2></div>
     <p>From self-knowledge to better investment research in three clear steps.</p>
    </div>
    <div className="platform-steps">
     <article><span className="step-number">1</span><span className="step-icon">◉</span><div><h3>Discover your DNA</h3><p>Answer the assessment to understand risk tolerance, capacity and decision style.</p></div></article>
     <span className="step-arrow" aria-hidden>→</span>
     <article><span className="step-number">2</span><span className="step-icon">▤</span><div><h3>Add investment context</h3><p>Tell us what this money is for, when you may need it and how much flexibility you have.</p></div></article>
     <span className="step-arrow" aria-hidden>→</span>
     <article><span className="step-number">3</span><span className="step-icon">▥</span><div><h3>Explore matches & compare</h3><p>Research compatible investments and compare the details that matter for each asset type.</p></div></article>
    </div>
   </div>
  </section>

  <section className="platform-capabilities">
   <div className="container platform-capabilities-grid">
    <div className="platform-section-heading vertical">
     <div className="eyebrow">More than a screening tool</div>
     <h2>Built for a smarter investing experience</h2>
     <p>Investor DNA is one layer of the platform. Research, comparison, Product Risk and watchlists continue the journey.</p>
    </div>
    <div className="platform-capability-cards">
     {CAPABILITIES.map(item=><article key={item.title}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}
    </div>
   </div>
  </section>

  <section className="platform-assets">
   <div className="container">
    <div className="platform-section-heading">
     <div><div className="eyebrow">Explore opportunities</div><h2>Different assets. Different information.</h2></div>
     <div className="platform-heading-action"><p>Each card uses the metrics that actually matter for that investment type.</p><Link href="/explore">Explore all investments →</Link></div>
    </div>
    <HomeAssetRail/>
   </div>
  </section>

  <section className="platform-intelligence">
   <div className="container platform-intelligence-grid">
    <article className="platform-intro-copy">
     <div className="eyebrow">Your DNA in action</div>
     <h2>A compatibility layer, not a guess.</h2>
     <p>DNA Match combines your personal profile with the goal for this money. Product Risk separately describes how an investment behaves under risk.</p>
     <div className="platform-inline-actions"><Link href="/match">Open DNA Match →</Link><Link href="/research/product-risk">How Product Risk works →</Link></div>
    </article>

    <article className="platform-match-panel">
     <div className="platform-panel-kicker">Illustrative DNA Match</div>
     <div className="platform-match-top"><div><strong>Vanguard Growth ETF Portfolio</strong><span>VGRO · Asset allocation ETF</span></div><b>Sample fit</b></div>
     <div className="platform-match-points"><span>✓ Broad diversification</span><span>✓ Long-horizon structure</span><span>✓ High liquidity</span></div>
     <small>Actual compatibility is calculated from your completed DNA and investment context.</small>
    </article>

    <article className="platform-risk-panel">
     <div className="platform-panel-kicker">Published Product Risk DNA</div>
     <div className="platform-risk-title"><div><strong>BMO Long Federal Bond Index ETF</strong><span>ZFL</span></div><b>Low to Medium</b></div>
     <div className="platform-risk-dimensions"><div><span>Loss potential</span><strong>Low</strong></div><div><span>Price movement</span><strong>Medium</strong></div><div><span>Access to money</span><strong>High</strong></div><div><span>Diversification</span><strong>Medium</strong></div></div>
     <Link href="/investment/b35b6625-4a59-4d5f-8a3e-eda0ea82a2a2">View published risk profile →</Link>
    </article>
   </div>
  </section>

  <section className="platform-trust">
   <div className="container platform-trust-grid">
    <article><span>▰</span><div><strong>Educational, not investment advice</strong><p>Research tools and explanations to help you make more informed decisions.</p></div></article>
    <article><span>◆</span><div><strong>Transparent methodology</strong><p>Compatibility and Product Risk are separate, explainable layers.</p></div></article>
    <article><span>✦</span><div><strong>Built for Canadian investors</strong><p>Canadian assets, Canadian context and source-backed research.</p></div></article>
   </div>
  </section>
 </div>;
}
