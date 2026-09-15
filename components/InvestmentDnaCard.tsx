import type {InvestmentDna} from "@/lib/investments";

const AXES:[keyof InvestmentDna,string,string][]=[
  ['growth_score','Growth','How strongly this investment leans toward long-term growth.'],
  ['income_score','Income','How strongly income is part of the investment’s role.'],
  ['stability_score','Stability','How strongly the investment emphasizes stability over growth.'],
  ['diversification_score','Diversification','How broadly the investment spreads exposure.'],
  ['complexity_score','Complexity','How much investing knowledge may be useful to understand the product.'],
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
      <div><div className="eyebrow">Investment DNA</div><h2>What this investment is built to do</h2><p>Start with the fund manager’s official Canadian risk rating. Then use the Investment DNA signals to understand the product’s role, trade-offs and structure.</p></div>
    </div>

    <div className="official-risk-card">
      <div className="official-risk-copy">
        <span className="official-risk-kicker">Official risk rating</span>
        <strong>{official||'Not available'}</strong>
        <p>{dna.official_risk_issuer?`${dna.official_risk_issuer} reports this rating in its official disclosure.`:'Official issuer risk data is not available for this investment yet.'}</p>
      </div>
      {dna.official_risk_source_url&&<div className="official-risk-source">
        <span>{dna.official_risk_source_type||'Official disclosure'}{sourceDate?` · ${sourceDate}`:''}</span>
        <a href={dna.official_risk_source_url} target="_blank" rel="noreferrer">View official source ↗</a>
      </div>}
    </div>
    <p className="official-risk-method">This is the issuer-disclosed Canadian risk classification. It is not an Investing DNA score and it does not predict future losses or returns.</p>

    <div className="investment-dna-subhead"><h3>Investment DNA signals</h3><p>These additional signals are Investing DNA’s research-stage interpretation of the product. They help explain what kind of role it may play; higher is not automatically better.</p></div>
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
    <p className="fine muted investment-dna-note">Official risk comes from the issuer’s disclosure. Growth, income, stability, diversification and complexity are Investing DNA research signals used for discovery and compatibility — not a recommendation to buy or sell.</p>
  </section>;
}
