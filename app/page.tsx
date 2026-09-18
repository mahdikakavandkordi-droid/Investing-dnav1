import Image from "next/image";
import Link from "next/link";

const ARCHETYPES=[
 {key:"vault",name:"VAULT",number:"01",tagline:"Protect today. Compound tomorrow.",image:"/characters/vault.png"},
 {key:"anchor",name:"ANCHOR",number:"02",tagline:"Stay steady. Build with balance.",image:"/characters/anchor.png"},
 {key:"coolhand",name:"COOLHAND",number:"03",tagline:"Calm mind. Steady progress.",image:"/characters/coolhand.png"},
 {key:"scout",name:"SCOUT",number:"04",tagline:"Look ahead. Find opportunities.",image:"/characters/scout.png"},
 {key:"maverick",name:"MAVERICK",number:"05",tagline:"Your path. Your perspective.",image:"/characters/maverick.png"},
 {key:"charger",name:"CHARGER",number:"06",tagline:"Embrace the ride. Go further.",image:"/characters/hotshot.png"},
 {key:"striker",name:"STRIKER",number:"07",tagline:"Turn insight into action.",image:"/characters/striker.png"},
 {key:"pathfinder",name:"PATHFINDER",number:"08",tagline:"Explore more. Navigate with purpose.",image:"/characters/highroller.png"},
 {key:"vanguard",name:"VANGUARD",number:"09",tagline:"Challenge more. Shape what’s next.",image:"/characters/jackpot.png"}
];

/** Public Investor DNA landing page. */
export default function Home(){
 return <div className="reference-home">
  <section className="reference-home-hero">
   <div className="container reference-home-hero-grid">
    <div className="reference-home-copy">
     <div className="eyebrow">Investing DNA</div>
     <h1>Discover Your<br/>Investor DNA</h1>
     <p className="reference-home-kicker">Different paths. A brighter tomorrow.</p>
     <p className="reference-home-lede">We all invest differently. Answer a focused set of questions to uncover your Investor DNA — a clearer view of how you approach risk, decisions, and the purpose behind your money.</p>
     <div className="actions reference-home-actions">
      <Link className="btn primary" href="/dna/assessment">Start the assessment <span aria-hidden>→</span></Link>
      <Link className="btn reference-secondary" href="/explore">Explore investments</Link>
     </div>
     <p className="fine muted reference-home-note">About 5 minutes · No account required · Save later if you choose</p>
    </div>

    <div className="reference-hero-art" aria-hidden="true">
     <span className="reference-sun"/>
     <span className="reference-mountain reference-mountain-one"/>
     <span className="reference-mountain reference-mountain-two"/>
     <span className="reference-mountain reference-mountain-three"/>
     <span className="reference-lake"/>
     <span className="reference-tree tree-one"/>
     <span className="reference-tree tree-two"/>
     <span className="reference-tree tree-three"/>
     <span className="reference-tree tree-four"/>
     <div className="reference-hero-mantra">KNOW YOURSELF<br/>INVEST SMARTER<br/>GO FURTHER</div>
    </div>
   </div>
  </section>

  <section className="reference-archetypes">
   <div className="container">
    <div className="reference-section-head">
     <div>
      <div className="eyebrow">The 9 Investor DNA archetypes</div>
      <h2>Same destination. Different journeys.</h2>
     </div>
     <p>Your archetype is a simple way to summarize the relationship between risk tolerance and financial capacity. It is a starting point, not a label you have to live inside.</p>
    </div>

    <div className="reference-archetype-grid">
     {ARCHETYPES.map(item=><article className="reference-archetype-card" key={item.key}>
      <div className="reference-archetype-art">
       <span className="reference-card-sun"/>
       <span className="reference-card-ridge ridge-back"/>
       <span className="reference-card-ridge ridge-front"/>
       <Image src={item.image} alt="" width={260} height={180}/>
      </div>
      <div className="reference-archetype-copy">
       <span className="reference-archetype-number">{item.number}</span>
       <div><h3>{item.name}</h3><p>{item.tagline}</p></div>
      </div>
     </article>)}
    </div>

    <div className="reference-start-band">
     <div>
      <span className="reference-start-icon" aria-hidden>↗</span>
      <div><strong>Ready to find your Investor DNA?</strong><p>Start as a guest. Create an account only if you want to save your report.</p></div>
     </div>
     <Link className="btn primary" href="/dna/assessment">Start the assessment <span aria-hidden>→</span></Link>
    </div>
   </div>
  </section>

  <section className="reference-how">
   <div className="container reference-how-grid">
    <article><span>01</span><h3>Discover your DNA</h3><p>Understand risk tolerance, financial capacity, and how you tend to make decisions.</p></article>
    <article><span>02</span><h3>Add the goal</h3><p>Tell us what this money is for, when you may need it, and how much flexibility you have.</p></article>
    <article><span>03</span><h3>Explore with context</h3><p>Use Match, Explore and Compare to understand compatibility — without turning the experience into a recommendation.</p></article>
   </div>
  </section>
 </div>;
}
