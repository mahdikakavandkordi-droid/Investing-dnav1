"use client";

import Link from 'next/link';
import {useLocale} from '@/lib/locale';

const matrix=[
 ['COOLHAND','STRIKER','VANGUARD'],
 ['ANCHOR','MAVERICK','PATHFINDER'],
 ['VAULT','SCOUT','CHARGER']
];

const references=[
 {
  source:'CSA / CIRO',
  title:'Client Focused Reforms — risk profile guidance',
  href:'https://www.ciro.ca/newsroom/publications/joint-canadian-securities-administrators-canadian-investment-regulatory-organization-staff-notice-31-0',
  informsEn:'Separating risk tolerance (willingness) from risk capacity (ability to endure financial loss), collecting both independently and reconciling conflicts.',
  informsFr:'Séparer la tolérance au risque (volonté) de la capacité de risque (aptitude à supporter une perte financière), recueillir les deux indépendamment et réconcilier les conflits.'
 },
 {
  source:'CIRO',
  title:'Know-your-client and suitability determination for retail clients',
  href:'https://www.ciro.ca/newsroom/publications/know-your-client-and-suitability-determination-retail-clients',
  informsEn:'Risk-profile construction, financial circumstances, liquidity, age/life stage and the principle that the overall risk profile should not outrun the weaker of tolerance and capacity.',
  informsFr:'Construction du profil de risque, situation financière, liquidité, âge et étape de vie, ainsi que le principe voulant que le profil de risque global ne dépasse pas le plus faible de la tolérance et de la capacité.'
 },
 {
  source:'CFA Institute',
  title:'Basics of Portfolio Planning and Construction',
  href:'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/basics-of-portfolio-planning-and-construction',
  informsEn:'The distinction between willingness and ability to take risk, plus liquidity, time horizon and other investor constraints.',
  informsFr:'La distinction entre la volonté et la capacité de prendre du risque, ainsi que la liquidité, l’horizon et les autres contraintes de l’investisseur.'
 },
 {
  source:'Grable & Lytton (1999)',
  title:'Financial risk tolerance revisited: the development of a risk assessment instrument',
  href:'https://openjournals.libs.uga.edu/fsr/article/view/3890',
  informsEn:'The research tradition of measuring financial risk tolerance with a multidimensional questionnaire and then testing reliability and validity.',
  informsFr:'La tradition de recherche consistant à mesurer la tolérance au risque financier à l’aide d’un questionnaire multidimensionnel, puis à tester sa fiabilité et sa validité.'
 },
 {
  source:'Kahneman & Tversky (1979)',
  title:'Prospect Theory: An Analysis of Decision Under Risk',
  href:'https://kahneman.scholar.princeton.edu/sites/g/files/toruqf3831/files/kahneman/files/prospect_theory.pdf',
  informsEn:'Behavior under uncertainty, reference-dependent evaluation and asymmetric reactions to gains and losses that motivate a separate behavioral layer.',
  informsFr:'Le comportement sous incertitude, l’évaluation dépendante d’un point de référence et les réactions asymétriques aux gains et aux pertes qui motivent une couche comportementale distincte.'
 },
 {
  source:'ESMA / MiFID II',
  title:'Article 25 — assessment of suitability and appropriateness',
  href:'https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mifid-ii/article-25-assessment-suitability-and',
  informsEn:'Keeping knowledge/experience, financial situation including ability to bear losses, and objectives including risk tolerance as distinct suitability inputs.',
  informsFr:'Maintenir comme facteurs distincts les connaissances et l’expérience, la situation financière incluant la capacité à supporter des pertes, et les objectifs incluant la tolérance au risque.'
 }
];

export default function InvestorDnaMethodology(){
 const {locale,pick}=useLocale();
 const behavioral=[
  [pick('Decision independence','Indépendance décisionnelle'),pick('How much you separate other people’s excitement from your own decision.','Dans quelle mesure vous séparez l’enthousiasme des autres de votre propre décision.')],
  [pick('Long-term orientation','Orientation long terme'),pick('How well you keep recent performance in perspective.','Dans quelle mesure vous gardez le rendement récent en perspective.')],
  [pick('Reference flexibility','Flexibilité des repères'),pick('How easily you look past the price you paid and reassess from today.','Dans quelle mesure vous pouvez dépasser le prix payé et réévaluer à partir d’aujourd’hui.')],
  [pick('Evidence discipline','Discipline face aux preuves'),pick('How willing you are to test your view against new evidence.','Dans quelle mesure vous êtes prêt à tester votre point de vue face à de nouvelles preuves.')],
  [pick('Emotional decision control','Contrôle émotionnel des décisions'),pick('How well you keep stress and regret from taking over the decision.','Dans quelle mesure vous empêchez le stress et le regret de prendre le dessus.')]
 ];

 const validationRoadmap=[
  ['1',pick('Cognitive review','Révision cognitive'),pick('Check whether people understand each question and answer option the way the model intends.','Vérifier si les participants comprennent chaque question et chaque choix de réponse comme le modèle le prévoit.')],
  ['2',pick('Pilot sample','Échantillon pilote'),pick('Collect enough completed assessments to inspect score distributions, missingness and item behaviour.','Recueillir suffisamment d’évaluations terminées pour examiner les distributions de scores, les données manquantes et le comportement des items.')],
  ['3',pick('Reliability','Fiabilité'),pick('Estimate internal consistency for multi-item constructs and identify weak or redundant items.','Estimer la cohérence interne des construits à plusieurs items et identifier les items faibles ou redondants.')],
  ['4',pick('Factor structure','Structure factorielle'),pick('Test whether the observed responses support the intended latent dimensions instead of only the designed labels.','Tester si les réponses observées soutiennent les dimensions latentes prévues plutôt que seulement les catégories conçues.')],
  ['5',pick('Stability','Stabilité'),pick('Run test–retest analysis to see whether stable traits remain reasonably stable over time.','Effectuer une analyse test-retest pour vérifier si les traits stables demeurent raisonnablement stables dans le temps.')],
  ['6',pick('Convergent validation','Validation convergente'),pick('Compare relevant scores with an established financial risk-tolerance measure and related external criteria.','Comparer les scores pertinents à une mesure établie de tolérance au risque financier et à des critères externes connexes.')],
  ['7',pick('Calibration & fairness','Calibration et équité'),pick('Revisit weights, thresholds and 3×3 cut-points; test subgroup and language effects before making stronger claims.','Réexaminer les poids, seuils et points de coupure de la matrice 3×3; tester les effets de sous-groupes et de langue avant de formuler des affirmations plus fortes.')],
  ['8',pick('Versioned release','Version publiée'),pick('Publish the validated model version, retain historical model versions and document any scoring changes.','Publier la version validée du modèle, conserver les versions historiques et documenter toute modification de la notation.')]
 ];

 return <main className="dna-methodology-page">
  <div className="container dna-methodology-container">
   <Link className="detail-back-link" href="/dna/assessment">← {pick("Back to the assessment","Retour à l’évaluation")}</Link>

   <section className="dna-methodology-hero">
    <div>
     <div className="eyebrow">{pick("Investor DNA methodology","Méthodologie Investor DNA")}</div>
     <h1>{pick("How the 28 answers become an Investor DNA profile.","Comment 28 réponses deviennent un profil Investor DNA.")}</h1>
     <p>{pick("Investor DNA separates willingness to take risk, financial ability to absorb loss, decision behaviour and investing experience. The archetype is the headline; the underlying dimensions remain visible in the report.","Investor DNA sépare la volonté de prendre du risque, la capacité financière à absorber une perte, le comportement décisionnel et l’expérience en placement. L’archétype est le titre; les dimensions sous-jacentes restent visibles dans le rapport.")}</p>
    </div>
    <div className="methodology-count">
     <strong>28</strong><span>{pick("questions","questions")}</span>
     <small>{pick("4 measurement layers","4 couches de mesure")}</small>
    </div>
   </section>

   <section className="methodology-four-layers">
    <article><b>10</b><div><span>{pick("Risk tolerance","Tolérance au risque")}</span><p>{pick("Your emotional willingness to live with uncertainty, losses and market movement.","Votre volonté émotionnelle de vivre avec l’incertitude, les pertes et les mouvements du marché.")}</p></div></article>
    <article><b>10</b><div><span>{pick("Behavioral DNA","DNA comportemental")}</span><p>{pick("Decision tendencies that can shape how you react to information, performance and pressure.","Des tendances décisionnelles qui peuvent influencer votre réaction à l’information, au rendement et à la pression.")}</p></div></article>
    <article><b>5</b><div><span>{pick("Financial capacity","Capacité financière")}</span><p>{pick("Your financial room to absorb investment loss without disrupting essential commitments.","Votre marge financière pour absorber une perte de placement sans perturber vos engagements essentiels.")}</p></div></article>
    <article><b>3</b><div><span>{pick("Investment experience","Expérience en placement")}</span><p>{pick("Context about what you have owned, decided on and experienced through market declines.","Contexte sur ce que vous avez détenu, les décisions que vous avez prises et votre expérience des baisses de marché.")}</p></div></article>
   </section>

   <section className="methodology-grid-two">
    <article className="methodology-card">
     <div className="eyebrow">{pick("Layer 1 + Layer 3","Couche 1 + Couche 3")}</div>
     <h2>{pick("The 3×3 archetype matrix","La matrice d’archétypes 3×3")}</h2>
     <p>{pick("The archetype is determined by the relationship between Risk Tolerance and Financial Capacity. These are deliberately kept separate: wanting more risk is not the same thing as being financially able to absorb more loss.","L’archétype est déterminé par la relation entre la Tolérance au risque et la Capacité financière. Elles sont volontairement séparées : vouloir davantage de risque n’est pas la même chose qu’être financièrement capable d’absorber une perte plus importante.")}</p>
     <div className="methodology-matrix-wrap">
      <div className="methodology-axis methodology-axis-y">{pick("Financial capacity ↑","Capacité financière ↑")}</div>
      <div className="methodology-matrix">{matrix.flat().map(name=><div key={name}><strong>{name}</strong></div>)}</div>
      <div className="methodology-axis methodology-axis-x">{pick("Risk tolerance →","Tolérance au risque →")}</div>
     </div>
     <p className="methodology-note">{pick("Current report presentation groups normalized scores into Lower, Moderate and Higher bands. The scoring model itself remains versioned so research changes can be tracked.","La présentation actuelle du rapport regroupe les scores normalisés en catégories Faible, Modéré et Élevé. Le modèle de notation reste versionné afin que les changements de recherche puissent être suivis.")}</p>
    </article>

    <article className="methodology-card">
     <div className="eyebrow">{pick("Layer 2","Couche 2")}</div>
     <h2>{pick("Behavioral DNA adds the “how.”","Le DNA comportemental ajoute le « comment ».")}</h2>
     <p>{pick("Behavioral scores do not decide the 3×3 archetype. They explain how two people in the same risk zone may still make very different investment decisions.","Les scores comportementaux ne déterminent pas l’archétype 3×3. Ils expliquent comment deux personnes dans la même zone de risque peuvent tout de même prendre des décisions de placement très différentes.")}</p>
     <div className="methodology-behavior-list">{behavioral.map(([title,copy])=><div key={title}><span>{title}</span><p>{copy}</p></div>)}</div>
    </article>
   </section>

   <section className="methodology-grid-two">
    <article className="methodology-card">
     <div className="eyebrow">{pick("Financial capacity","Capacité financière")}</div>
     <h2>{pick("Capacity can be constrained by real-life obligations.","La capacité peut être limitée par des obligations réelles.")}</h2>
     <p>{pick("The five capacity questions look at financial buffer, income stability, emergency reserves, required commitments and the practical impact of a material loss. The model can apply a capacity guard when a financial constraint should prevent an otherwise higher score from being interpreted too generously.","Les cinq questions de capacité examinent la marge financière, la stabilité du revenu, le fonds d’urgence, les engagements obligatoires et l’impact pratique d’une perte importante. Le modèle peut appliquer un garde-fou de capacité lorsqu’une contrainte financière devrait empêcher l’interprétation trop généreuse d’un score autrement plus élevé.")}</p>
    </article>
    <article className="methodology-card">
     <div className="eyebrow">{pick("Investment experience","Expérience en placement")}</div>
     <h2>{pick("Experience is context, not permission to take more risk.","L’expérience est un contexte, pas une permission de prendre plus de risque.")}</h2>
     <p>{pick("The three experience questions cover decision-making history, product exposure and experience through a broad market decline. In the current research model, experience helps explain the report but does not automatically increase Risk Tolerance or Financial Capacity.","Les trois questions d’expérience couvrent l’historique de prise de décision, l’exposition aux produits et l’expérience d’une baisse générale du marché. Dans le modèle de recherche actuel, l’expérience aide à expliquer le rapport mais n’augmente pas automatiquement la Tolérance au risque ni la Capacité financière.")}</p>
    </article>
   </section>

   <section className="methodology-card methodology-research-stage">
    <div className="eyebrow">{pick("Research-stage model","Modèle en phase de recherche")}</div>
    <h2>{pick("What the result does — and does not — mean","Ce que le résultat signifie — et ne signifie pas")}</h2>
    <p>{pick("This assessment is a research candidate, not a validated psychometric diagnostic and not an investment recommendation. It is designed to make the inputs and reasoning visible so users can understand the profile rather than receive a black-box label.","Cette évaluation est un outil candidat de recherche, pas un diagnostic psychométrique validé ni une recommandation de placement. Elle est conçue pour rendre visibles les données et le raisonnement afin que les utilisateurs comprennent leur profil plutôt que de recevoir une étiquette opaque.")}</p>
    <p>{pick("Question wording, scoring rules and model versions are tracked so the methodology can be reviewed and refined during research. A future validated version may change thresholds or weighting; historical results should therefore retain their model version.","Le libellé des questions, les règles de notation et les versions du modèle sont suivis afin que la méthodologie puisse être révisée et améliorée pendant la recherche. Une future version validée pourrait modifier les seuils ou les pondérations; les résultats historiques doivent donc conserver leur version de modèle.")}</p>
   </section>

   <section className="methodology-card methodology-foundations">
    <div className="methodology-section-head">
     <div><div className="eyebrow">{pick("Research foundations","Fondements de recherche")}</div><h2>{pick("What informed the model","Ce qui a guidé le modèle")}</h2></div>
     <span className="methodology-status">{pick("Evidence-informed · not yet validated","Fondé sur des données probantes · pas encore validé")}</span>
    </div>
    <p className="methodology-section-intro">{pick("Investor DNA does not copy any single questionnaire or claim that its 28-item model has already been validated. Its architecture is informed by established investor-risk, suitability and behavioral-finance literature. The specific questions, scoring rules, thresholds, 3×3 matrix and archetype names are proprietary research-stage constructs.","Investor DNA ne copie aucun questionnaire unique et ne prétend pas que son modèle de 28 items est déjà validé. Son architecture s’appuie sur la littérature établie sur le risque investisseur, la convenance et la finance comportementale. Les questions précises, règles de notation, seuils, matrice 3×3 et noms d’archétypes sont des construits propriétaires en phase de recherche.")}</p>
    <div className="methodology-reference-grid">
     {references.map(reference=><article className="methodology-reference" key={reference.title}>
      <div className="methodology-reference-source">{reference.source}</div>
      <h3>{reference.title}</h3>
      <p>{locale==="fr"?reference.informsFr:reference.informsEn}</p>
      <a href={reference.href} target="_blank" rel="noreferrer">{pick("Open source ↗","Ouvrir la source ↗")}</a>
     </article>)}
    </div>
    <div className="methodology-proprietary-note">
     <strong>{pick("Important distinction","Distinction importante")}</strong>
     <p>{pick("The references above support concepts used in the design. They do not validate Investing DNA’s exact 28 questions, the five Behavioral DNA dimensions, current weights, score bands, 3×3 cut-points or nine archetypes. Those parts must be tested with Investing DNA data before stronger scientific claims are made.","Les références ci-dessus soutiennent les concepts utilisés dans la conception. Elles ne valident pas les 28 questions exactes d’Investing DNA, les cinq dimensions du DNA comportemental, les pondérations actuelles, les catégories de scores, les seuils de la matrice 3×3 ni les neuf archétypes. Ces éléments doivent être testés avec les données d’Investing DNA avant toute affirmation scientifique plus forte.")}</p>
    </div>
   </section>

   <section className="methodology-card methodology-validation">
    <div className="methodology-section-head">
     <div><div className="eyebrow">{pick("Validation roadmap","Feuille de route de validation")}</div><h2>{pick("How we plan to test and improve the model","Comment nous prévoyons tester et améliorer le modèle")}</h2></div>
     <span className="methodology-status methodology-status-planned">{pick("Planned research","Recherche planifiée")}</span>
    </div>
    <p className="methodology-section-intro">{pick("Validation is treated as an iterative product-research process, not a one-time badge. Results from each stage can lead to question rewrites, dropped items, new weights, different thresholds or a revised model version.","La validation est traitée comme un processus itératif de recherche produit, et non comme un badge obtenu une seule fois. Les résultats de chaque étape peuvent entraîner la réécriture de questions, la suppression d’items, de nouvelles pondérations, des seuils différents ou une version révisée du modèle.")}</p>
    <div className="methodology-validation-list">
     {validationRoadmap.map(([step,title,copy])=><article key={step}>
      <span className="validation-step">{step}</span>
      <div><h3>{title}</h3><p>{copy}</p></div>
      <em>{pick("Planned","Planifié")}</em>
     </article>)}
    </div>
    <div className="methodology-validation-footer">
     <p><strong>{pick("Versioning rule:","Règle de versionnement :")}</strong> {pick("material methodology changes should create a new model version rather than silently rewriting prior results.","les changements méthodologiques importants devraient créer une nouvelle version du modèle plutôt que de réécrire silencieusement les résultats antérieurs.")}</p>
     <div className="actions">
      <Link className="btn primary" href="/dna/assessment">{pick("Start the assessment","Commencer l’évaluation")}</Link>
      <Link className="btn" href="/research">{pick("Research & limitations","Recherche et limites")}</Link>
     </div>
    </div>
   </section>
  </div>
 </main>;
}
