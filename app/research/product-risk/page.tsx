import Link from 'next/link';
import {PRODUCT_RISK_DIMENSIONS} from '@/lib/product-risk/dimensions';

export default function ProductRiskMethodology(){
 return <section className="section product-risk-method-page-v1">
  <div className="container narrow">
   <div className="eyebrow">Research methodology</div>
   <h1>How Product Risk DNA works</h1>
   <p className="muted">Product Risk DNA describes the investment itself. It is separate from Investor DNA and separate from DNA Match.</p>

   <div className="card">
    <h2>Overall Risk is not DNA Match</h2>
    <p>Overall Risk summarizes source-backed product characteristics through an asset-specific research model. It does not use your age, goals, risk tolerance or investment context, and it is not a recommendation to buy, sell or hold.</p>
    <p>DNA Match is a different layer: it compares eligible investment characteristics with your Investor DNA and the context for the money you are considering investing.</p>
   </div>

   <div className="product-risk-method-grid-v1">
    {PRODUCT_RISK_DIMENSIONS.map(item=><div className="card" key={item.code}>
     <div className="eyebrow">{item.direction==='higher_is_better'?'Higher can be beneficial':'Higher means more risk pressure'}</div>
     <h2>{item.label}</h2>
     <p>{item.shortDefinition}</p>
     <p className="muted fine">{item.whyItMatters}</p>
    </div>)}
   </div>

   <div className="card">
    <h2>Same four questions, different measurement engines</h2>
    <p>An ETF, GIC, T-Bill and bond do not create risk in the same way. Product Risk keeps the consumer language consistent while the server uses asset-specific evidence underneath it.</p>
    <ul>
     <li>ETF Price Movement can use the verified issuer/CSA risk classification; diversification can use holdings breadth and concentration; access can use bid-ask evidence when verified.</li>
     <li>GIC risk emphasizes principal protection, issuer/deposit-insurance structure and redemption rules.</li>
     <li>T-Bill and bond risk emphasizes issuer credit, maturity, duration/rate sensitivity and market access.</li>
     <li>Missing critical evidence stays Unknown or lowers confidence; it is never silently treated as Low.</li>
    </ul>
   </div>

   <div className="card">
    <h2>How confidence works</h2>
    <p>Confidence describes the quality and completeness of the evidence behind the displayed band, not how certain future markets are. A High risk confidence does not mean the future is predictable.</p>
    <p>For example, an ETF can have High-confidence official Price Movement evidence but only Medium-confidence Access evidence. In that case the overall Product Risk confidence is capped rather than overstated.</p>
   </div>

   <div className="card">
    <h2>Publication gate</h2>
    <p>Only explicitly reviewed and published profiles can appear on an investment page. Research drafts and calibration outputs remain hidden from the public Product Risk card.</p>
    <p>Official issuer disclosures remain their own source-backed facts. Product Risk does not rewrite an official risk classification into a fake personalized score.</p>
   </div>

   <div className="actions">
    <Link className="btn" href="/research">Research & limitations</Link>
    <Link className="btn primary" href="/explore">Explore investments</Link>
   </div>
  </div>
 </section>;
}
