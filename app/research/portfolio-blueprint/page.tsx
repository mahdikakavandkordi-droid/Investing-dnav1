"use client";

import Link from 'next/link';
import {PORTFOLIO_BLUEPRINT_VERSION} from '@/lib/portfolio-blueprint';
import {useLocale} from '@/lib/locale';

export default function PortfolioBlueprintMethodology(){
 const {pick}=useLocale();
 return <section className="section"><div className="container narrow">
  <div className="eyebrow">{pick("Portfolio Blueprint methodology","Méthodologie Portfolio Blueprint")}</div>
  <h1>{pick("How the three asset-class scenarios are built","Comment les trois scénarios par catégorie d’actif sont construits")}</h1>

  <div className="card">
   <h2>{pick("Purpose","Objectif")}</h2>
   <p>{pick("Portfolio Blueprint translates a completed Investor DNA plus one complete investment-goal context into three educational asset-class scenarios: More Defensive, Your Core Blueprint and More Growth.","Portfolio Blueprint transforme un Investor DNA terminé et un contexte complet d’objectif de placement en trois scénarios éducatifs par catégorie d’actif : Plus défensif, Votre Blueprint principal et Plus de croissance.")}</p>
   <p>{pick("It does not choose a security, geographic market, sector, manager or fund. The current output is limited to Equity, Fixed income and Cash.","Il ne choisit aucun titre, marché géographique, secteur, gestionnaire ou fonds. Le résultat actuel est limité aux Actions, au Revenu fixe et aux Liquidités.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Inputs","Données utilisées")}</h2>
   <p>{pick("The current model uses risk tolerance, financial capacity, time horizon, liquidity need, goal type and the stated need for principal protection. It does not generate a blueprint when either risk score or any required goal-context field is unavailable.","Le modèle actuel utilise la tolérance au risque, la capacité financière, l’horizon, le besoin de liquidité, le type d’objectif et le besoin déclaré de protection du capital. Il ne génère pas de blueprint si l’un des scores de risque ou l’un des champs de contexte requis est indisponible.")}</p>
   <p>{pick("Behavioral DNA and investing experience remain visible in the overall report but do not mechanically increase or decrease the Equity percentage. Behavioral tendencies are not treated as permission to take more market risk, and experience is better used later when explaining implementation complexity. Age and investment amount are likewise not converted into allocation points when the more direct horizon/capacity constraints are already available.","Le DNA comportemental et l’expérience en placement restent visibles dans le rapport global, mais n’augmentent ni ne diminuent mécaniquement le pourcentage d’actions. Les tendances comportementales ne sont pas considérées comme une permission de prendre davantage de risque de marché, et l’expérience sert plutôt à expliquer plus tard la complexité de mise en œuvre. L’âge et le montant investi ne sont pas non plus transformés en points de répartition lorsque les contraintes plus directes d’horizon et de capacité sont disponibles.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Guardrails before growth","Des garde-fous avant la croissance")}</h2>
   <p>{pick("Financial capacity acts as a ceiling rather than a bonus: a high willingness to take risk cannot override a lower ability to absorb loss. Time horizon, liquidity, goal type and principal-protection needs can reduce market exposure further.","La capacité financière agit comme un plafond plutôt que comme un bonus : une forte volonté de prendre du risque ne peut pas dépasser une capacité plus faible à absorber une perte. L’horizon, la liquidité, le type d’objectif et les besoins de protection du capital peuvent réduire davantage l’exposition au marché.")}</p>
   <p>{pick("A full-principal-protection requirement or an emergency-reserve goal moves the current research model to the Cash bucket rather than assigning market-risk assets simply to make the scenarios look different. A horizon under one year also prevents the More Growth scenario from increasing equity beyond Core. When a hard boundary leaves no room for a distinct scenario, the interface shows the constraint instead of inventing one.","Une exigence de protection complète du capital ou un objectif de fonds d’urgence déplace le modèle actuel vers la catégorie Liquidités plutôt que d’ajouter des actifs exposés au marché uniquement pour différencier les scénarios. Un horizon de moins d’un an empêche aussi le scénario Plus de croissance d’augmenter les actions au-delà du scénario principal. Lorsqu’une contrainte forte ne laisse aucune marge pour un scénario distinct, l’interface affiche cette contrainte au lieu d’en inventer un.")}</p>
   <p>{pick("The Cash bucket is an asset-class placeholder, not a promise that every cash-like product is insured or risk-free; account structure, issuer and applicable deposit-insurance limits still matter.","La catégorie Liquidités est un repère de catégorie d’actif, pas une promesse que chaque produit assimilable à des liquidités est assuré ou sans risque; la structure du compte, l’émetteur et les limites applicables d’assurance-dépôts restent importants.")}</p>
  </div>

  <div className="card">
   <h2>{pick("What changes between scenarios","Ce qui change entre les scénarios")}</h2>
   <p>{pick("The Core Blueprint is the centre produced by the current inputs. The More Defensive scenario reduces equity and increases the stability/liquidity buffer. The More Growth scenario can increase equity only when the same goal constraints leave room to do so.","Le Blueprint principal est le point central produit par les données actuelles. Le scénario Plus défensif réduit les actions et augmente la réserve de stabilité et de liquidité. Le scénario Plus de croissance peut augmenter les actions seulement lorsque les mêmes contraintes d’objectif laissent suffisamment de marge.")}</p>
   <p>{pick("All displayed allocations use five-percentage-point increments to avoid implying a level of precision the research model does not support.","Toutes les répartitions affichées utilisent des incréments de cinq points de pourcentage afin de ne pas suggérer un niveau de précision que le modèle de recherche ne soutient pas.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Research status","Statut de recherche")}</h2>
   <p>{pick("Current model version:","Version actuelle du modèle :")} <strong>{PORTFOLIO_BLUEPRINT_VERSION}</strong>.</p>
   <p>{pick("This is a deterministic research rule set, not an empirically validated portfolio optimizer and not a forecast of expected return. The allocation logic should be reviewed during the pilot and before any positioning as personalized investment advice.","Il s’agit d’un ensemble déterministe de règles de recherche, et non d’un optimiseur de portefeuille validé empiriquement ni d’une prévision de rendement attendu. La logique de répartition doit être révisée pendant le pilote et avant toute présentation comme conseil en placement personnalisé.")}</p>
  </div>

  <div className="actions">
   <Link className="btn" href="/research">{pick("Research & limitations","Recherche et limites")}</Link>
   <Link className="btn primary" href="/dna/result">{pick("Back to my report","Retour à mon rapport")}</Link>
  </div>
 </div></section>;
}
