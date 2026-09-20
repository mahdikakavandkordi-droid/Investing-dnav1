import type {CSSProperties} from 'react';
import Link from 'next/link';
import type {DNA,InvestmentContextProfile} from '@/lib/dna';
import {buildPortfolioBlueprint} from '@/lib/portfolio-blueprint';
import type {Allocation,BlueprintScenario} from '@/lib/portfolio-blueprint';

export function PortfolioBlueprint({dna,context}:{dna:DNA;context:InvestmentContextProfile}){
  const blueprint=buildPortfolioBlueprint(dna,context);
  if(!blueprint)return null;

  const core=blueprint.scenarios.find(x=>x.key==='core');
  return <section className="report-section report-section-v2 portfolio-blueprint-section">
    <div className="portfolio-blueprint-head">
      <div>
        <div className="eyebrow">Part 3 · Asset mix scenarios</div>
        <h2>Three ways to balance growth, stability and liquidity.</h2>
        <p className="report-lede">These three scenarios use the same Investor DNA and goal context. They change only the balance between equity, fixed income and cash / capital preservation — not how much to put into an ETF, mutual fund or GIC.</p>
      </div>
      {core&&<div className="blueprint-core-summary">
        <span>Your current centre</span>
        <strong>{core.allocation.equity}% equity</strong>
        <small>{core.allocation.fixedIncome}% fixed income · {core.allocation.cash}% cash</small>
      </div>}
    </div>

    <div className="portfolio-scenario-grid">
      {blueprint.scenarios.map(scenario=><ScenarioCard key={scenario.key} scenario={scenario}/>)}
    </div>

    <div className="blueprint-why">
      <div>
        <div className="eyebrow">Why your Core scenario lands here</div>
        <h3>Your capacity and goal constraints act as guardrails.</h3>
      </div>
      <ul>{blueprint.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>
    </div>

    <div className="blueprint-boundary">
      <span aria-hidden="true">i</span>
      <div>
       <p><strong>Asset-class scenarios, not product percentages.</strong> {blueprint.note} Equity and fixed income can be researched through ETFs and mutual funds; GICs can support the capital-preservation sleeve when their term and access rules fit the goal.</p>
       <div className="actions compact"><Link className="btn primary" href="/explore">Explore investments for this mix</Link><Link href="/research/portfolio-blueprint">See how the scenarios are built →</Link></div>
      </div>
    </div>
  </section>;
}

function ScenarioCard({scenario}:{scenario:BlueprintScenario}){
  const {allocation}=scenario;
  return <article className={'portfolio-scenario-card '+(scenario.key==='core'?'core ':'')+(scenario.constrained?'constrained':'')}>
    <header>
      <div>
        <span className="scenario-kicker">{scenario.key==='defensive'?'Scenario 1':scenario.key==='core'?'Scenario 2':'Scenario 3'}</span>
        <h3>{scenario.title}</h3>
      </div>
      {scenario.key==='core'?<span className="scenario-status">Core scenario</span>:scenario.constrained?<span className="scenario-status neutral">Constraint capped</span>:null}
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
  const fixedEnd=allocation.equity+allocation.fixedIncome;
  const style={
    background:`conic-gradient(#17364b 0 ${allocation.equity}%, #0b8f84 ${allocation.equity}% ${fixedEnd}%, #dce5e6 ${fixedEnd}% 100%)`
  } as CSSProperties;
  return <div className="allocation-donut" style={style} aria-label={`${allocation.equity}% equity, ${allocation.fixedIncome}% fixed income, ${allocation.cash}% cash`}>
    <span><strong>100%</strong><small>allocation</small></span>
  </div>;
}

function AllocationLegend({allocation}:{allocation:Allocation}){
  return <div className="allocation-legend">
    <div><span className="allocation-dot equity"/><b>Equity</b><strong>{allocation.equity}%</strong></div>
    <div><span className="allocation-dot fixed"/><b>Fixed income</b><strong>{allocation.fixedIncome}%</strong></div>
    <div><span className="allocation-dot cash"/><b>Cash</b><strong>{allocation.cash}%</strong></div>
  </div>;
}
