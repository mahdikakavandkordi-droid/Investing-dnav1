"use client";

import Link from 'next/link';
import {useLocale} from '@/lib/locale';

export default function ResearchAndLimitations(){
 const {pick}=useLocale();
 return <section className="section"><div className="container narrow">
  <div className="eyebrow">{pick("Research & limitations","Recherche et limites")}</div>
  <h1>{pick("What Investor DNA is — and what it is not","Ce qu’Investor DNA est — et ce qu’il n’est pas")}</h1>

  <div className="card">
   <h2>{pick("Research-stage compatibility platform","Plateforme de compatibilité en phase de recherche")}</h2>
   <p>{pick("Investor DNA is designed to help people understand their investing profile and research how that profile relates to the structure and risk characteristics of investments. The Investing DNA assessment is a research candidate, not a validated psychometric diagnostic.","Investor DNA est conçu pour aider les utilisateurs à comprendre leur profil d’investisseur et à rechercher comment ce profil se rapporte à la structure et aux caractéristiques de risque des placements. L’évaluation Investing DNA est un outil candidat de recherche, pas un diagnostic psychométrique validé.")}</p>
   <p>{pick("Where DNA Match is enabled, compatibility scores describe how closely the information currently available about an ETF lines up with the saved Investing DNA and investment context supplied to the platform. They are not expected-return forecasts, ratings of investment quality, or instructions to buy, sell or hold a security.","Lorsque DNA Match est activé, les scores de compatibilité décrivent dans quelle mesure les informations actuellement disponibles sur un FNB correspondent à l’Investing DNA enregistré et au contexte de placement fourni à la plateforme. Ce ne sont ni des prévisions de rendement attendu, ni des notes de qualité d’un placement, ni des instructions d’achat, de vente ou de conservation.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Cross-asset research does not mean cross-asset advice","Recherche multi-actifs ne signifie pas conseil multi-actifs")}</h2>
   <p>{pick("Investor DNA can research representative ETFs, GICs, T-Bills, bonds and money-market structures through a shared Investment DNA language. Personalized DNA Match remains ETF-only in this phase. GICs, T-Bills, bonds, commercial paper and ABCP are research profiles until separate asset-specific Match models are designed and validated.","Investor DNA peut analyser des FNB, CPG, bons du Trésor, obligations et structures du marché monétaire représentatifs au moyen d’un langage Investment DNA commun. DNA Match personnalisé reste limité aux FNB à cette étape. Les CPG, bons du Trésor, obligations, papier commercial et PCAA demeurent des profils de recherche jusqu’à ce que des modèles Match propres à chaque catégorie soient conçus et validés.")}</p>
   <p>{pick("Individual stocks are intentionally outside the current V1 research scope.","Les actions individuelles sont volontairement exclues du périmètre de recherche actuel de la V1.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Portfolio Blueprint is an asset-class scenario tool","Portfolio Blueprint est un outil de scénarios par catégorie d’actif")}</h2>
   <p>{pick("When a complete goal context is available, the report can show More Defensive, Core and More Growth asset-class scenarios using Equity, Fixed income and Cash only. Financial capacity and goal constraints can cap the amount of market exposure; the tool does not infer Canada/US/international weights or select a fund.","Lorsqu’un contexte d’objectif complet est disponible, le rapport peut afficher les scénarios Plus défensif, Principal et Plus de croissance en utilisant uniquement Actions, Revenu fixe et Liquidités. La capacité financière et les contraintes d’objectif peuvent plafonner l’exposition au marché; l’outil ne déduit pas de pondérations Canada/États-Unis/internationales et ne choisit aucun fonds.")}</p>
   <p>{pick("The current blueprint is a deterministic research rule set, not a validated portfolio optimizer or expected-return model.","Le blueprint actuel est un ensemble déterministe de règles de recherche, pas un optimiseur de portefeuille validé ni un modèle de rendement attendu.")} <Link href="/research/portfolio-blueprint"><strong>{pick("Read the Portfolio Blueprint methodology →","Lire la méthodologie Portfolio Blueprint →")}</strong></Link></p>
  </div>

  <div className="card">
   <h2>{pick("Safety comes before ranking","La sécurité passe avant le classement")}</h2>
   <p>{pick("The ETF Match engine can pause ranking when key financial context is missing or when the stated situation indicates that a ranked comparison should not be produced. It can also return no suitable option inside the current ETF research universe rather than forcing a result.","Le moteur ETF Match peut suspendre le classement lorsque des éléments financiers essentiels sont manquants ou lorsque la situation indiquée signifie qu’une comparaison classée ne devrait pas être produite. Il peut aussi retourner qu’aucune option appropriée n’existe dans l’univers actuel de recherche des FNB plutôt que de forcer un résultat.")}</p>
   <p>{pick("Changing answers only to increase a Match score defeats the purpose of the tool. Scores should change because the investor's real circumstances change, the investment changes, or newer verified data becomes available.","Modifier ses réponses uniquement pour augmenter un score Match va à l’encontre de l’objectif de l’outil. Les scores devraient changer parce que la situation réelle de l’investisseur change, que le placement change ou que de nouvelles données vérifiées deviennent disponibles.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Investment data has coverage and freshness limits","Les données de placement ont des limites de couverture et de fraîcheur")}</h2>
   <p>{pick("Investor DNA distinguishes verified facts from partial research coverage. ETFs can have different holdings, exposure and portfolio-characteristic depth; fixed-income and deposit products have different source and market-data constraints. Missing data remains unavailable rather than being converted to zero or inferred without a source.","Investor DNA distingue les faits vérifiés de la couverture partielle de recherche. Les FNB peuvent avoir différents niveaux de détail sur leurs placements, leurs expositions et les caractéristiques du portefeuille; les produits de revenu fixe et de dépôt ont d’autres contraintes de source et de données de marché. Les données manquantes restent indisponibles plutôt que d’être transformées en zéro ou déduites sans source.")}</p>
   <p>{pick("Historical performance, current yields and posted deposit rates do not guarantee future results. Rates, prices, risk classifications, holdings and product terms can change. Research pages expose source and as-of information where available.","Le rendement historique, les rendements actuels et les taux de dépôt affichés ne garantissent pas les résultats futurs. Les taux, prix, classifications de risque, placements détenus et modalités des produits peuvent changer. Les pages de recherche indiquent la source et la date des données lorsqu’elles sont disponibles.")}</p>
   <p><Link href="/research/product-risk"><strong>{pick("Read the Product Risk DNA methodology →","Lire la méthodologie Product Risk DNA →")}</strong></Link></p>
  </div>

  <div className="card">
   <h2>{pick("Not a substitute for professional advice","Ne remplace pas un conseil professionnel")}</h2>
   <p>{pick("Investor DNA does not execute trades, hold client assets, or know every fact that may matter to an investment decision. Tax, legal, estate, debt, insurance and household considerations may require qualified professional advice.","Investor DNA n’exécute pas de transactions, ne détient pas les actifs des clients et ne connaît pas tous les faits pouvant compter dans une décision de placement. Les questions fiscales, juridiques, successorales, de dette, d’assurance et de situation familiale peuvent nécessiter l’avis d’un professionnel qualifié.")}</p>
   <p>{pick("The product is being piloted as an educational and research experience. Regulatory review remains a launch gate before any broader positioning as personalized investment advice.","Le produit est piloté comme une expérience éducative et de recherche. Une révision réglementaire demeure une étape obligatoire avant toute présentation plus large comme conseil en placement personnalisé.")}</p>
  </div>

  <div className="actions">
   <Link className="btn" href="/privacy">{pick("Pilot privacy summary","Résumé de confidentialité du pilote")}</Link>
   <Link className="btn primary" href="/dna/assessment">{pick("Discover my Investing DNA","Découvrir mon Investing DNA")}</Link>
  </div>
 </div></section>;
}
