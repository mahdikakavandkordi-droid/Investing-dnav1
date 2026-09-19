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


const references=[
 {
  source:'CSA / CIRO',
  title:'Client Focused Reforms — risk profile guidance',
  href:'https://www.ciro.ca/newsroom/publications/joint-canadian-securities-administrators-canadian-investment-regulatory-organization-staff-notice-31-0',
  informs:'Separating risk tolerance (willingness) from risk capacity (ability to endure financial loss), collecting both independently and reconciling conflicts.'
 },
 {
  source:'CIRO',
  title:'Know-your-client and suitability determination for retail clients',
  href:'https://www.ciro.ca/newsroom/publications/know-your-client-and-suitability-determination-retail-clients',
  informs:'Risk-profile construction, financial circumstances, liquidity, age/life stage and the principle that the overall risk profile should not outrun the weaker of tolerance and capacity.'
 },
 {
  source:'CFA Institute',
  title:'Basics of Portfolio Planning and Construction',
  href:'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/basics-of-portfolio-planning-and-construction',
  informs:'The distinction between willingness and ability to take risk, plus liquidity, time horizon and other investor constraints.'
 },
 {
  source:'Grable & Lytton (1999)',
  title:'Financial risk tolerance revisited: the development of a risk assessment instrument',
  href:'https://openjournals.libs.uga.edu/fsr/article/view/3890',
  informs:'The research tradition of measuring financial risk tolerance with a multidimensional questionnaire and then testing reliability and validity.'
 },
 {
  source:'Kahneman & Tversky (1979)',
  title:'Prospect Theory: An Analysis of Decision Under Risk',
  href:'https://kahneman.scholar.princeton.edu/sites/g/files/toruqf3831/files/kahneman/files/prospect_theory.pdf',
  informs:'Behavior under uncertainty, reference-dependent evaluation and asymmetric reactions to gains and losses that motivate a separate behavioral layer.'
 },
 {
  source:'ESMA / MiFID II',
  title:'Article 25 — assessment of suitability and appropriateness',
  href:'https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mifid-ii/article-25-assessment-suitability-and',
  informs:'Keeping knowledge/experience, financial situation including ability to bear losses, and objectives including risk tolerance as distinct suitability inputs.'
 }
];

const validationRoadmap=[
 ['1','Cognitive review','Check whether people understand each question and answer option the way the model intends.','Planned'],
 ['2','Pilot sample','Collect enough completed assessments to inspect score distributions, missingness and item behaviour.','Planned'],
 ['3','Reliability','Estimate internal consistency for multi-item constructs and identify weak or redundant items.','Planned'],
 ['4','Factor structure','Test whether the observed responses support the intended latent dimensions instead of only the designed labels.','Planned'],
 ['5','Stability','Run test–retest analysis to see whether stable traits remain reasonably stable over time.','Planned'],
 ['6','Convergent validation','Compare relevant scores with an established financial risk-tolerance measure and related external criteria.','Planned'],
 ['7','Calibration & fairness','Revisit weights, thresholds and 3×3 cut-points; test subgroup and language effects before making stronger claims.','Planned'],
 ['8','Versioned release','Publish the validated model version, retain historical model versions and document any scoring changes.','Planned']
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
   </section>

   <section className="methodology-card methodology-foundations">
    <div className="methodology-section-head">
     <div><div className="eyebrow">Research foundations</div><h2>What informed the model</h2></div>
     <span className="methodology-status">Evidence-informed · not yet validated</span>
    </div>
    <p className="methodology-section-intro">Investor DNA does not copy any single questionnaire or claim that its 28-item model has already been validated. Its architecture is informed by established investor-risk, suitability and behavioral-finance literature. The specific questions, scoring rules, thresholds, 3×3 matrix and archetype names are proprietary research-stage constructs.</p>
    <div className="methodology-reference-grid">
     {references.map(reference=><article className="methodology-reference" key={reference.title}>
      <div className="methodology-reference-source">{reference.source}</div>
      <h3>{reference.title}</h3>
      <p>{reference.informs}</p>
      <a href={reference.href} target="_blank" rel="noreferrer">Open source ↗</a>
     </article>)}
    </div>
    <div className="methodology-proprietary-note">
     <strong>Important distinction</strong>
     <p>The references above support concepts used in the design. They do not validate Investing DNA’s exact 28 questions, the five Behavioral DNA dimensions, current weights, score bands, 3×3 cut-points or nine archetypes. Those parts must be tested with Investing DNA data before stronger scientific claims are made.</p>
    </div>
   </section>

   <section className="methodology-card methodology-validation">
    <div className="methodology-section-head">
     <div><div className="eyebrow">Validation roadmap</div><h2>How we plan to test and improve the model</h2></div>
     <span className="methodology-status methodology-status-planned">Planned research</span>
    </div>
    <p className="methodology-section-intro">Validation is treated as an iterative product-research process, not a one-time badge. Results from each stage can lead to question rewrites, dropped items, new weights, different thresholds or a revised model version.</p>
    <div className="methodology-validation-list">
     {validationRoadmap.map(([step,title,copy,status])=><article key={step}>
      <span className="validation-step">{step}</span>
      <div><h3>{title}</h3><p>{copy}</p></div>
      <em>{status}</em>
     </article>)}
    </div>
    <div className="methodology-validation-footer">
     <p><strong>Versioning rule:</strong> material methodology changes should create a new model version rather than silently rewriting prior results.</p>
     <div className="actions"><Link className="btn primary" href="/dna/assessment">Start the assessment</Link><Link className="btn" href="/research">Research & limitations</Link></div>
    </div>
   </section>
  </div>
 </main>;
}
