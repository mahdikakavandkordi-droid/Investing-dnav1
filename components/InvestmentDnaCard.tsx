import type {InvestmentDna} from "@/lib/investments";

const AXES:[keyof InvestmentDna,string,string][]=[
  ['risk_score','Risk','How much market risk this investment is designed to carry.'],
  ['growth_score','Growth','How strongly this investment leans toward long-term growth.'],
  ['income_score','Income','How strongly income is part of the investment’s role.'],
  ['stability_score','Stability','How strongly the investment emphasizes stability over growth.'],
  ['diversification_score','Diversification','How broadly the investment spreads exposure.'],
  ['complexity_score','Complexity','How much investing knowledge may be useful to understand the product.'],
];
function n(value:unknown){const x=Number(value);return Number.isFinite(x)?Math.max(0,Math.min(100,x)):null;}
function band(value:unknown){const x=n(value);if(x===null)return 'Not available';if(x<40)return 'Lower';if(x<70)return 'Moderate';return 'Higher';}
function monthsLabel(value:unknown){const m=Number(value);if(!Number.isFinite(m)||m<=0)return 'Horizon not available';if(m<12)return `${m}+ months`;if(m%12===0)return `${m/12}+ year${m===12?'':'s'}`;return `${Math.round(m/12)}+ years`;}

export function InvestmentDnaCard({dna}:{dna:InvestmentDna}){
  return <section className="investment-dna-card">
    <div className="investment-dna-head">
      <div><div className="eyebrow">Investment DNA</div><h2>What this investment is built to do</h2><p>These signals summarize the investment itself. Higher is not automatically better — the question is how well the pattern fits what you need.</p></div>
      <div className="investment-dna-risk"><span>Risk level</span><strong>{dna.risk_band||band(dna.risk_score)}</strong></div>
    </div>
    <div className="investment-dna-grid">
      {AXES.map(([key,label,help])=>{const value=n(dna[key]);return <div className="investment-dna-axis" key={String(key)}>
        <div className="investment-dna-axis-top"><span>{label}</span><strong>{value===null?'—':band(value)}</strong></div>
        <div className="investment-dna-bar" aria-label={`${label}: ${value??'not available'} out of 100`}><div style={{width:`${value??0}%`}}/></div>
        <p>{help}</p>
      </div>})}
    </div>
    <div className="investment-dna-facts">
      {n(dna.equity_pct)!==null&&<div><span>Equity exposure</span><strong>{Math.round(Number(dna.equity_pct))}%</strong></div>}
      <div><span>Suggested minimum horizon</span><strong>{monthsLabel(dna.minimum_horizon_months)}</strong></div>
      <div><span>Concentration</span><strong>{dna.concentration_level||'Not available'}</strong></div>
      {dna.style_class&&<div><span>Style</span><strong>{dna.style_class.replaceAll('_',' ')}</strong></div>}
    </div>
    <p className="fine muted investment-dna-note">Investment DNA is a research-stage classification built from the available fund profile and risk data. It is a discovery aid, not a recommendation.</p>
  </section>;
}
