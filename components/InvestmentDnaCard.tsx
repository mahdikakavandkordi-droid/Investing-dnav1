import type {InvestmentDna} from "@/lib/investments";

const AXES:[keyof InvestmentDna,string,string][]=[
  ['growth_score','Growth orientation','How strongly the fund is positioned for long-term capital growth.'],
  ['income_score','Income orientation','How important income and fixed-income exposure are to the fund’s role.'],
  ['stability_score','Stability orientation','How much the portfolio structure leans toward a steadier, more defensive mix.'],
  ['diversification_score','Diversification breadth','How broadly the fund spreads exposure across markets, regions or asset classes.'],
];
function n(value:unknown){const x=Number(value);return Number.isFinite(x)?Math.max(0,Math.min(100,x)):null;}
function band(value:unknown){const x=n(value);if(x===null)return 'Not available';if(x<40)return 'Lower';if(x<70)return 'Moderate';return 'Higher';}
function monthsLabel(value:unknown){const m=Number(value);if(!Number.isFinite(m)||m<=0)return 'Horizon not available';if(m<12)return `${m}+ months`;if(m%12===0)return `${m/12}+ year${m===12?'':'s'}`;return `${Math.round(m/12)}+ years`;}
function dateLabel(value?:string){if(!value)return null;const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric'}).format(d);}

export function InvestmentDnaCard({dna}:{dna:InvestmentDna}){
  const official=dna.official_risk_rating||dna.risk_band;
  const sourceDate=dateLabel(dna.official_risk_source_date);
  return <section className="investment-dna-card">
    <div className="investment-dna-head">
      <div><div className="eyebrow">Investment DNA</div><h2>What this investment is built to do</h2><p>Start with the fund manager’s official Canadian risk rating. Then use a few simple profile signals to understand the fund’s role and trade-offs.</p></div>
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

    <div className="investment-dna-subhead"><h3>Investment DNA signals</h3><p>These are broad research labels, not regulatory ratings or precise 0–100 measurements. They summarize the fund’s structure using issuer data.</p></div>
    <div className="investment-dna-grid">
      {AXES.map(([key,label,help])=>{const value=n(dna[key]);return <div className="investment-dna-axis" key={String(key)}>
        <div className="investment-dna-axis-top"><span>{label}</span><strong>{value===null?'—':band(value)}</strong></div>
        <p>{help}</p>
      </div>})}
    </div>

    <details className="investment-dna-methodology">
      <summary>How we derive these signals</summary>
      <div>
        <p><strong>Growth orientation:</strong> mainly the fund’s equity allocation and stated investment objective.</p>
        <p><strong>Income orientation:</strong> the role of fixed income and distributions in the fund’s stated portfolio design. It is not a forecast of future yield.</p>
        <p><strong>Stability orientation:</strong> the defensive side of the asset mix, especially fixed-income weight, considered alongside the fund’s official risk category.</p>
        <p><strong>Diversification breadth:</strong> how broadly the official portfolio structure spreads exposure across asset classes, markets and regions.</p>
        <p>These rules are used for discovery and compatibility. They do not replace the issuer’s official risk rating and are not a recommendation to buy or sell.</p>
      </div>
    </details>

    <div className="investment-dna-facts">
      {n(dna.equity_pct)!==null&&<div><span>Equity exposure</span><strong>{Math.round(Number(dna.equity_pct))}%</strong></div>}
      <div><span>Suggested minimum horizon</span><strong>{monthsLabel(dna.minimum_horizon_months)}</strong></div>
      <div><span>Concentration</span><strong>{dna.concentration_level||'Not available'}</strong></div>
      {dna.style_class&&<div><span>Style</span><strong>{dna.style_class.replaceAll('_',' ')}</strong></div>}
    </div>
  </section>;
}
