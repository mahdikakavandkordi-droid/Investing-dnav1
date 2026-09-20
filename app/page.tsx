"use client";

import Link from "next/link";
import {HomeAssetRail} from "@/components/HomeAssetRail";
import {HomeWorkspaceReturn} from "@/components/HomeWorkspaceReturn";
import {useLocale} from "@/lib/locale";

const CAPABILITIES=(pick:(en:string,fr:string)=>string)=>[
 {icon:"◉",title:pick("Behavioral profile","Profil comportemental"),body:pick("Understand the decision patterns that shape how you invest.","Comprenez les habitudes de décision qui influencent votre façon d’investir.")},
 {icon:"▥",title:pick("Risk capacity","Capacité de risque"),body:pick("Separate how much risk you can take from how much risk you want.","Distinguez le risque que vous pouvez assumer de celui que vous souhaitez prendre.")},
 {icon:"◎",title:pick("Explainable match","Compatibilité expliquée"),body:pick("See why an investment is more or less compatible with your DNA and goal.","Voyez pourquoi un placement est plus ou moins compatible avec votre DNA et votre objectif.")},
 {icon:"⇄",title:pick("Explore & compare","Explorer et comparer"),body:pick("Research Canadian investments side by side with asset-specific data.","Comparez des placements canadiens avec les données qui comptent pour chaque catégorie d’actif.")},
 {icon:"♡",title:pick("Save your watchlist","Enregistrer votre liste de suivi"),body:pick("Keep the investments you want to revisit without interrupting your research.","Conservez les placements que vous voulez revoir sans interrompre votre recherche.")}
];


function MobileHomeLanding(){
 const {pick}=useLocale();
 return <section className="mobile-home-landing" aria-label="Investing DNA mobile home">
  <div className="mobile-home-landing-hero">
   <span className="mobile-card-kicker">{pick("Invest with clarity","Investissez avec clarté")}</span>
   <h1>{pick("Know your investor DNA.","Comprenez votre profil d’investisseur.")}</h1>
   <p>{pick("Understand how you invest, add context for this money, then research investments with a clearer reason why.","Comprenez votre façon d’investir, ajoutez le contexte de cet argent, puis recherchez des placements en comprenant mieux pourquoi.")}</p>
   <div className="mobile-home-landing-actions">
    <Link className="btn primary" href="/dna/assessment">{pick("Start your DNA","Découvrir mon DNA")} <span aria-hidden>→</span></Link>
    <Link className="btn" href="/explore">{pick("Explore first","Explorer d’abord")}</Link>
   </div>
  </div>


  <section className="mobile-home-path-card">
   <div className="mobile-home-section-head"><div><span className="mobile-card-kicker">{pick("Your path","Votre parcours")}</span><h2>{pick("Three steps. One connected flow.","Trois étapes. Un parcours connecté.")}</h2></div></div>
   <div className="mobile-home-path-list">
    <Link href="/dna/assessment"><b>01</b><span><strong>{pick("Discover your DNA","Découvrir votre DNA")}</strong><small>{pick("Risk tolerance, capacity and decision style.","Tolérance au risque, capacité et style de décision.")}</small></span><i>›</i></Link>
    <Link href="/dna/context"><b>02</b><span><strong>{pick("Add money context","Ajouter le contexte financier")}</strong><small>{pick("Goal, horizon, access and protection needs.","Objectif, horizon, accès aux fonds et besoin de protection.")}</small></span><i>›</i></Link>
    <Link href="/match"><b>03</b><span><strong>{pick("Research DNA Match","Explorer DNA Match")}</strong><small>{pick("See compatible ETFs and why they line up.","Voyez les FNB compatibles et pourquoi ils correspondent à votre profil.")}</small></span><i>›</i></Link>
   </div>
  </section>

  <section className="mobile-home-value-card">
   <span className="mobile-card-kicker">{pick("What you get","Ce que vous obtenez")}</span>
   <div className="mobile-home-value-grid">
    <div><strong>{pick("Your profile","Votre profil")}</strong><small>{pick("A personal Investor DNA report.","Un rapport Investor DNA personnalisé.")}</small></div>
    <div><strong>{pick("Goal-aware Match","Compatibilité selon votre objectif")}</strong><small>{pick("Compatibility with context, not a buy recommendation.","Une compatibilité contextualisée, pas une recommandation d’achat.")}</small></div>
    <div><strong>{pick("Clear research","Recherche claire")}</strong><small>{pick("ETF, GIC, T-Bill and bond details without fake missing values.","Détails sur les FNB, CPG, bons du Trésor et obligations sans valeurs inventées.")}</small></div>
   </div>
  </section>

  <section className="mobile-home-explore-card">
   <div><span className="mobile-card-kicker">{pick("Research","Recherche")}</span><h2>{pick("Explore Canadian investments","Explorer les placements canadiens")}</h2><p>{pick("Start with the asset type you care about, then compare the facts that actually matter.","Commencez par la catégorie d’actif qui vous intéresse, puis comparez les données qui comptent vraiment.")}</p></div>
   <div className="mobile-home-asset-chips" aria-label="Available research categories"><span>ETFs</span><span>GICs</span><span>T-Bills</span><span>Bonds</span></div>
   <Link className="btn" href="/explore">{pick("Open Explore","Ouvrir Explorer")} <span aria-hidden>→</span></Link>
  </section>

  <p className="mobile-home-disclaimer">{pick("Educational research, not investment advice.","Contenu éducatif et de recherche, pas un conseil en placement.")}</p>
 </section>;
}

export default function Home(){
 const {pick}=useLocale();
 return <div className="platform-home">
  <MobileHomeLanding/>
  <div className="desktop-home-experience">
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
     <div className="eyebrow">{pick("Invest with clarity","Investissez avec clarté")}</div>
     <h1><span>{pick("Know your investor DNA.","Comprenez votre profil d’investisseur.")}</span><br/>{pick("Find investments that fit — and understand why.","Trouvez des placements compatibles — et comprenez pourquoi.")}</h1>
     <p>{pick("Discover your risk profile, add the context for this money, then explore and compare Canadian investments with clearer explanations.","Découvrez votre profil de risque, ajoutez le contexte de cet argent, puis explorez et comparez des placements canadiens avec des explications plus claires.")}</p>
     <div className="platform-hero-actions">
      <Link className="btn primary" href="/dna/assessment">Start your DNA <span aria-hidden>→</span></Link>
      <Link className="btn platform-btn-secondary" href="/explore">{pick("Explore investments","Explorer les placements")}</Link>
     </div>
     <div className="platform-hero-trust">
      <span>{pick("◒ Built for Canadian investors","◒ Conçu pour les investisseurs canadiens")}</span>
      <span>{pick("◆ Clear, explainable research","◆ Recherche claire et explicable")}</span>
      <span>{pick("▮ Educational, not advice","▮ Éducatif, pas un conseil")}</span>
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
  </div>

  <HomeWorkspaceReturn/>

  <div className="desktop-home-experience">
  <section className="platform-how" id="how-it-works">
   <div className="container">
    <div className="platform-section-heading compact">
     <div><div className="eyebrow">{pick("A simple path to smarter research","Un parcours simple vers une recherche plus éclairée")}</div><h2>{pick("How it works","Comment ça marche")}</h2></div>
     <p>{pick("From self-knowledge to better investment research in three clear steps.","De la connaissance de soi à une meilleure recherche en placement, en trois étapes claires.")}</p>
    </div>
    <div className="platform-steps">
     <article><span className="step-number">1</span><span className="step-icon">◉</span><div><h3>{pick("Discover your DNA","Découvrir votre DNA")}</h3><p>{pick("Answer the assessment to understand risk tolerance, capacity and decision style.","Répondez à l’évaluation pour comprendre votre tolérance au risque, votre capacité et votre style de décision.")}</p></div></article>
     <span className="step-arrow" aria-hidden>→</span>
     <article><span className="step-number">2</span><span className="step-icon">▤</span><div><h3>{pick("Add investment context","Ajouter le contexte du placement")}</h3><p>{pick("Tell us what this money is for, when you may need it and how much flexibility you have.","Précisez l’objectif de cet argent, quand vous pourriez en avoir besoin et votre marge de manœuvre.")}</p></div></article>
     <span className="step-arrow" aria-hidden>→</span>
     <article><span className="step-number">3</span><span className="step-icon">▥</span><div><h3>{pick("Explore matches & compare","Explorer les correspondances et comparer")}</h3><p>{pick("Research compatible investments and compare the details that matter for each asset type.","Recherchez des placements compatibles et comparez les données importantes pour chaque catégorie d’actif.")}</p></div></article>
    </div>
   </div>
  </section>

  <section className="platform-capabilities">
   <div className="container platform-capabilities-grid">
    <div className="platform-section-heading vertical">
     <div className="eyebrow">{pick("More than a screening tool","Plus qu’un simple filtre")}</div>
     <h2>{pick("Built for a smarter investing experience","Conçu pour une expérience de placement plus éclairée")}</h2>
     <p>{pick("Investor DNA is one layer of the platform. Research, comparison, Product Risk and watchlists continue the journey.","Investor DNA est une couche de la plateforme. La recherche, la comparaison, Product Risk et la liste de suivi prolongent le parcours.")}</p>
    </div>
    <div className="platform-capability-cards">
     {CAPABILITIES(pick).map(item=><article key={item.title}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}
    </div>
   </div>
  </section>

  <section className="platform-assets">
   <div className="container">
    <div className="platform-section-heading">
     <div><div className="eyebrow">{pick("Explore opportunities","Explorer les possibilités")}</div><h2>{pick("Different assets. Different information.","Des actifs différents. Des informations différentes.")}</h2></div>
     <div className="platform-heading-action"><p>{pick("Each card uses the metrics that actually matter for that investment type.","Chaque fiche présente les mesures qui comptent vraiment pour ce type de placement.")}</p><Link href="/explore">{pick("Explore all investments →","Explorer tous les placements →")}</Link></div>
    </div>
    <HomeAssetRail/>
   </div>
  </section>

  <section className="platform-intelligence">
   <div className="container platform-intelligence-grid">
    <article className="platform-intro-copy">
     <div className="eyebrow">{pick("Your DNA in action","Votre DNA en action")}</div>
     <h2>{pick("A compatibility layer, not a guess.","Une couche de compatibilité, pas une supposition.")}</h2>
     <p>{pick("DNA Match combines your personal profile with the goal for this money. Product Risk separately describes how an investment behaves under risk.","DNA Match combine votre profil personnel avec l’objectif de cet argent. Product Risk décrit séparément le comportement du placement face au risque.")}</p>
     <div className="platform-inline-actions"><Link href="/match">{pick("Open DNA Match →","Ouvrir DNA Match →")}</Link><Link href="/research/product-risk">{pick("How Product Risk works →","Comprendre Product Risk →")}</Link></div>
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
  </div>
 </div>;
}
