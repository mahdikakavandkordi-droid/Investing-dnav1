import Link from 'next/link';

const matrix=[
 ['COOLHAND','STRIKER','VANGUARD'],
 ['ANCHOR','MAVERICK','PATHFINDER'],
 ['VAULT','SCOUT','CHARGER']
];

const behavioral=[
 ['Decision independence','How much you separate other people’s excitement from your own decision.'],
 ['Long-term orientation','How well you keep recent performance in perspective.'],
 ['Reference flexibility','How easily you look past the price you paid and reassess from today.'],
 ['Evidence discipline','How willing you are to test your view against new evidence.'],
 ['Emotional decision control','How well you keep stress and regret from taking over the decision.']
];

export default function InvestorDnaMethodology(){
 return <main className="dna-methodology-page">
  <div className="container dna-methodology-container">
   <Link className="detail-back-link" href="/dna/assessment">← Back to the assessment</Link>

   <section className="dna-methodology-hero">
    <div>
     <div className="eyebrow">Investor DNA methodology</div>
     <h1>How the 28 answers become an Investor DNA profile.</h1>
     <p>Investor DNA separates willingness to take risk, financial ability to absorb loss, decision behaviour and investing experience. The archetype is the headline; the underlying dimensions remain visible in the report.</p>
    </div>
    <div className="methodology-count">
     <strong>28</strong><span>questions</span>
     <small>4 measurement layers</small>
    </div>
   </section>

   <section className="methodology-four-layers">
    <article><b>10</b><div><span>Risk tolerance</span><p>Your emotional willingness to live with uncertainty, losses and market movement.</p></div></article>
    <article><b>10</b><div><span>Behavioral DNA</span><p>Decision tendencies that can shape how you react to information, performance and pressure.</p></div></article>
    <article><b>5</b><div><span>Financial capacity</span><p>Your financial room to absorb investment loss without disrupting essential commitments.</p></div></article>
    <article><b>3</b><div><span>Investment experience</span><p>Context about what you have owned, decided on and experienced through market declines.</p></div></article>
   </section>

   <section className="methodology-grid-two">
    <article className="methodology-card">
     <div className="eyebrow">Layer 1 + Layer 3</div>
     <h2>The 3×3 archetype matrix</h2>
     <p>The archetype is determined by the relationship between <strong>Risk Tolerance</strong> and <strong>Financial Capacity</strong>. These are deliberately kept separate: wanting more risk is not the same thing as being financially able to absorb more loss.</p>
     <div className="methodology-matrix-wrap">
      <div className="methodology-axis methodology-axis-y">Financial capacity ↑</div>
      <div className="methodology-matrix">{matrix.flat().map(name=><div key={name}><strong>{name}</strong></div>)}</div>
      <div className="methodology-axis methodology-axis-x">Risk tolerance →</div>
     </div>
     <p className="methodology-note">Current report presentation groups normalized scores into Lower, Moderate and Higher bands. The scoring model itself remains versioned so research changes can be tracked.</p>
    </article>

    <article className="methodology-card">
     <div className="eyebrow">Layer 2</div>
     <h2>Behavioral DNA adds the “how.”</h2>
     <p>Behavioral scores do not decide the 3×3 archetype. They explain how two people in the same risk zone may still make very different investment decisions.</p>
     <div className="methodology-behavior-list">{behavioral.map(([title,copy])=><div key={title}><span>{title}</span><p>{copy}</p></div>)}</div>
    </article>
   </section>

   <section className="methodology-grid-two">
    <article className="methodology-card">
     <div className="eyebrow">Financial capacity</div>
     <h2>Capacity can be constrained by real-life obligations.</h2>
     <p>The five capacity questions look at financial buffer, income stability, emergency reserves, required commitments and the practical impact of a material loss. The model can apply a capacity guard when a financial constraint should prevent an otherwise higher score from being interpreted too generously.</p>
    </article>
    <article className="methodology-card">
     <div className="eyebrow">Investment experience</div>
     <h2>Experience is context, not permission to take more risk.</h2>
     <p>The three experience questions cover decision-making history, product exposure and experience through a broad market decline. In the current research model, experience helps explain the report but does not automatically increase Risk Tolerance or Financial Capacity.</p>
    </article>
   </section>

   <section className="methodology-card methodology-research-stage">
    <div className="eyebrow">Research-stage model</div>
    <h2>What the result does — and does not — mean</h2>
    <p>This assessment is a research candidate, not a validated psychometric diagnostic and not an investment recommendation. It is designed to make the inputs and reasoning visible so users can understand the profile rather than receive a black-box label.</p>
    <p>Question wording, scoring rules and model versions are tracked so the methodology can be reviewed and refined during research. A future validated version may change thresholds or weighting; historical results should therefore retain their model version.</p>
    <div className="actions"><Link className="btn primary" href="/dna/assessment">Start the assessment</Link><Link className="btn" href="/research">Research & limitations</Link></div>
   </section>
  </div>
 </main>;
}
