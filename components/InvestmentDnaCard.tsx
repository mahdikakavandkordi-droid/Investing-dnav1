import type {InvestmentDna} from "@/lib/investments";

const AXES:[keyof InvestmentDna,string,string][]=[
  ['growth_score','Growth orientation','How strongly the fund’s strategic asset mix leans toward long-term growth.'],
  ['income_score','Income orientation','How strongly income is part of the fund’s intended role.'],
  ['stability_score','Stability orientation','How strongly the structure leans toward a steadier, more defensive mix.'],
  ['diversification_score','Exposure breadth','How broadly the fund spreads exposure across asset classes and meaningful geographic regions.'],
];
function n(value:unknown){const x=Number(value);return Number.isFinite(x)?Math.max(0,Math.min(100,x)):null;}
function band(value:unknown){const x=n(value);if(x===null)return 'Not available';if(x<40)return 'Lower';if(x<70)return 'Moderate';return 'Higher';}
function dateLabel(value?:string){if(!value)return null;const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);}

export function InvestmentDnaCard({dna}:{dna:InvestmentDna}){
  const official=dna.official_risk_rating||dna.risk_band;
  const sourceDate=dateLabel(dna.official_risk_source_date);
  const equity=n(dna.equity_pct);
  const fixed=n(dna.fixed_income_pct);
  const inputs=[
    equity!==null?`${Math.round(equity)}% equity`:null,
    fixed!==null?`${Math.round(fixed)}% fixed income`:null,
    dna.geographic_scope||null,
    official?`Official risk: ${official}`:null,
  ].filter(Boolean).join(' · ');

  return <section className="investment-dna-card">
    <div className="investment-dna-head">
      <div><div className="eyebrow">Investment DNA</div><h2>What this investment is built to do</h2><p>Start with the fund manager’s official Canadian risk rating. Then use a small set of transparent profile signals to understand the fund’s role and trade-offs.</p></div>
    </div>

    <div className="official-risk-card">
      <div className="official-risk-copy">
        <span className="official-risk-kicker">Official risk rating</span>
        <strong>{official||'Not available'}</strong>
        <p>{dna.official_risk_issuer?`${dna.official_risk_issuer} reports this rating in its official disclosure.`:'Official issuer risk data is not available for this investment yet.'}</p>
      </div>
      {dna.official_risk_source_url&&<div className="official-risk-source">
        <span>Source: {dna.official_risk_issuer||dna.official_risk_source_type||'Official issuer'}{sourceDate?` · ${sourceDate}`:''}</span>
        <a href={dna.official_risk_source_url} target="_blank" rel="noreferrer">View official source ↗</a>
      </div>}
    </div>
    <p className="official-risk-method">This is the issuer-disclosed Canadian risk classification. It is not an Investing DNA score and it does not predict future losses or returns.</p>

    <div className="investment-dna-subhead"><h3>Investment DNA signals</h3><p>These are broad research labels, not regulatory ratings or precise 0–100 measurements. Each label is generated from a fixed rule set using fund-structure data.</p></div>
    <div className="investment-dna-grid">
      {AXES.map(([key,label,help])=>{const value=n(dna[key]);return <div className="investment-dna-axis" key={String(key)}>
        <div className="investment-dna-axis-top"><span>{label}</span><strong>{value===null?'—':band(value)}</strong></div>
        <p>{help}</p>
      </div>})}
    </div>

    {inputs&&<p className="investment-dna-inputs"><strong>Inputs used for this fund:</strong> {inputs}</p>}

    <details className="investment-dna-methodology">
      <summary>How we derive these signals</summary>
      <div>
        <p><strong>Growth orientation:</strong> the strategic equity allocation. A larger equity share produces a stronger growth orientation.</p>
        <p><strong>Income orientation:</strong> 80% comes from the fixed-income share and 20% from whether the fund’s stated objective explicitly includes income. Distribution frequency by itself does not raise this signal.</p>
        <p><strong>Stability orientation:</strong> 60% comes from fixed-income allocation and 40% from the inverse of the issuer’s official risk category.</p>
        <p><strong>Exposure breadth:</strong> 70% reflects the number of meaningful geographic regions and 30% reflects whether the strategic allocation spans both equities and fixed income.</p>
        <p>We do not use the current holdings count here because our holdings coverage is not yet complete enough across every ETF. These labels support discovery and compatibility; they are not a recommendation to buy or sell.</p>
      </div>
    </details>
  </section>;
}
