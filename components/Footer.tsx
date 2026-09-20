"use client";

import Link from 'next/link';
import {useLocale} from '@/lib/locale';

/** Persistent research-stage product disclosure and policy navigation. */
export function Footer(){
 const {pick}=useLocale();
 return <footer className="section">
  <div className="container">
   <p className="fine muted">
    {pick(
     "Investor DNA is a research-stage educational compatibility platform. Compatibility is not a return forecast or a recommendation to buy or sell.",
     "Investor DNA est une plateforme éducative de compatibilité en phase de recherche. La compatibilité n’est ni une prévision de rendement ni une recommandation d’achat ou de vente."
    )}
   </p>
   <div className="actions">
    <Link href="/research">{pick("Research & limitations","Recherche et limites")}</Link>
    <Link href="/privacy">{pick("Pilot privacy","Confidentialité du pilote")}</Link>
    <Link href="/feedback">{pick("Feedback","Commentaires")}</Link>
   </div>
  </div>
 </footer>;
}
