"use client";

import type {CSSProperties} from 'react';
import Link from 'next/link';
import type {DNA,InvestmentContextProfile} from '@/lib/dna';
import {buildPortfolioBlueprint} from '@/lib/portfolio-blueprint';
import type {Allocation,BlueprintScenario} from '@/lib/portfolio-blueprint';
import {useLocale} from '@/lib/locale';

export function PortfolioBlueprint({dna,context}:{dna:DNA;context:InvestmentContextProfile}){
  const {locale,pick}=useLocale();
  const blueprint=buildPortfolioBlueprint(dna,context,locale);
  if(!blueprint)return null;

  const core=blueprint.scenarios.find(x=>x.key==='core');
  return <section className="report-section report-section-v2 portfolio-blueprint-section">
    <div className="portfolio-blueprint-head">
      <div>
        <div className="eyebrow">{pick("Part 3 · Portfolio Blueprint","Partie 3 · Portfolio Blueprint")}</div>
        <h2>{pick("See the trade-offs before choosing investments.","Voyez les compromis avant de choisir des placements.")}</h2>
        <p className="report-lede">{pick("These three asset-class scenarios use the same Investor DNA and goal context. They change only the balance between equity, fixed income and cash — not which specific fund or security to buy.","Ces trois scénarios par catégorie d’actif utilisent le même Investor DNA et le même contexte d’objectif. Ils modifient uniquement l’équilibre entre actions, revenu fixe et liquidités — pas le choix d’un fonds ou titre précis.")}</p>
      </div>
      {core&&<div className="blueprint-core-summary">
        <span>{pick("Your current centre","Votre point central actuel")}</span>
        <strong>{core.allocation.equity}% {pick("equity","actions")}</strong>
        <small>{core.allocation.fixedIncome}% {pick("fixed income","revenu fixe")} · {core.allocation.cash}% {pick("cash","liquidités")}</small>
      </div>}
    </div>

    <div className="portfolio-scenario-grid">
      {blueprint.scenarios.map(scenario=><ScenarioCard key={scenario.key} scenario={scenario}/>)}
    </div>

    <div className="blueprint-why">
      <div>
        <div className="eyebrow">{pick("Why the Core Blueprint lands here","Pourquoi le Blueprint principal arrive ici")}</div>
        <h3>{pick("Your capacity and goal constraints act as guardrails.","Votre capacité et les contraintes de votre objectif servent de garde-fous.")}</h3>
      </div>
      <ul>{blueprint.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>
    </div>

    <div className="blueprint-boundary">
      <span aria-hidden="true">i</span>
      <p><strong>{pick("Asset-class blueprint, not a portfolio recommendation.","Blueprint par catégorie d’actif, pas une recommandation de portefeuille.")}</strong> {blueprint.note} {pick("Geographic, sector and security-level allocations are intentionally not inferred here.","Les répartitions géographiques, sectorielles et au niveau des titres ne sont volontairement pas déduites ici.")} <Link href="/research/portfolio-blueprint">{pick("See how this blueprint is built →","Voir comment ce blueprint est construit →")}</Link></p>
    </div>
  </section>;
}

function ScenarioCard({scenario}:{scenario:BlueprintScenario}){
  const {pick}=useLocale();
  const {allocation}=scenario;
  return <article className={'portfolio-scenario-card '+(scenario.key==='core'?'core ':'')+(scenario.constrained?'constrained':'')}>
    <header>
      <div>
        <span className="scenario-kicker">{scenario.key==='defensive'?pick('Scenario 1','Scénario 1'):scenario.key==='core'?pick('Scenario 2','Scénario 2'):pick('Scenario 3','Scénario 3')}</span>
        <h3>{scenario.title}</h3>
      </div>
      {scenario.key==='core'?<span className="scenario-status">{pick("Core scenario","Scénario principal")}</span>:scenario.constrained?<span className="scenario-status neutral">{pick("Constraint capped","Plafonné par les contraintes")}</span>:null}
    </header>
    <p>{scenario.subtitle}</p>
    <div className="scenario-allocation-row">
      <AllocationDonut allocation={allocation}/>
      <AllocationLegend allocation={allocation}/>
    </div>
    {scenario.constraintNote&&<div className="scenario-constraint-note">{scenario.constraintNote}</div>}
  </article>;
}

function AllocationDonut({allocation}:{allocation:Allocation}){
  const {pick}=useLocale();
  const fixedEnd=allocation.equity+allocation.fixedIncome;
  const style={
    background:`conic-gradient(#17364b 0 ${allocation.equity}%, #0b8f84 ${allocation.equity}% ${fixedEnd}%, #dce5e6 ${fixedEnd}% 100%)`
  } as CSSProperties;
  return <div className="allocation-donut" style={style} aria-label={`${allocation.equity}% ${pick("equity","actions")}, ${allocation.fixedIncome}% ${pick("fixed income","revenu fixe")}, ${allocation.cash}% ${pick("cash","liquidités")}`}>
    <span><strong>100%</strong><small>{pick("allocation","répartition")}</small></span>
  </div>;
}

function AllocationLegend({allocation}:{allocation:Allocation}){
  const {pick}=useLocale();
  return <div className="allocation-legend">
    <div><span className="allocation-dot equity"/><b>{pick("Equity","Actions")}</b><strong>{allocation.equity}%</strong></div>
    <div><span className="allocation-dot fixed"/><b>{pick("Fixed income","Revenu fixe")}</b><strong>{allocation.fixedIncome}%</strong></div>
    <div><span className="allocation-dot cash"/><b>{pick("Cash","Liquidités")}</b><strong>{allocation.cash}%</strong></div>
  </div>;
}
