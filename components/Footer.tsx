import Link from 'next/link';

/** Persistent research-stage product disclosure and policy navigation. */
export function Footer(){
 return <footer className="section">
  <div className="container">
   <p className="fine muted">
    Investor DNA is a research-stage educational compatibility platform. Compatibility is not a return forecast or a recommendation to buy or sell.
   </p>
   <div className="actions">
    <Link href="/research">Research & limitations</Link>
    <Link href="/privacy">Pilot privacy</Link>
    <Link href="/feedback">Feedback</Link>
   </div>
  </div>
 </footer>;
}
