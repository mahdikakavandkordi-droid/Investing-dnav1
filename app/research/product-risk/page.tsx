"use client";

import Link from 'next/link';
import {PRODUCT_RISK_DIMENSIONS} from '@/lib/product-risk/dimensions';
import {useLocale} from '@/lib/locale';

const FR_DIMENSIONS:Record<string,{label:string;shortDefinition:string;whyItMatters:string}>={
 loss_potential:{
  label:'Potentiel de perte',
  shortDefinition:'Décrit l’ampleur de perte que la structure du placement peut raisonnablement exposer dans des conditions défavorables.',
  whyItMatters:'Une plus grande possibilité de perte peut rendre le placement moins adapté à de l’argent qui doit rester protégé ou disponible bientôt.'
 },
 price_movement:{
  label:'Mouvement du prix',
  shortDefinition:'Décrit l’ampleur des variations de valeur de marché auxquelles le placement peut être exposé.',
  whyItMatters:'Des mouvements de prix plus importants peuvent créer davantage d’incertitude avant la vente ou l’échéance.'
 },
 access_to_money:{
  label:'Accès aux fonds',
  shortDefinition:'Décrit la facilité avec laquelle le placement peut généralement être vendu ou racheté et transformé en liquidités.',
  whyItMatters:'L’accès est particulièrement important lorsque l’argent peut être nécessaire à court terme.'
 },
 diversification:{
  label:'Diversification',
  shortDefinition:'Décrit dans quelle mesure l’exposition est répartie plutôt que concentrée dans un seul émetteur, marché ou segment.',
  whyItMatters:'Une exposition plus large peut réduire la dépendance à une seule source de risque, sans éliminer le risque de perte.'
 }
};

export default function ProductRiskMethodology(){
 const {locale,pick}=useLocale();
 return <section className="section product-risk-method-page-v1">
  <div className="container narrow">
   <div className="eyebrow">{pick("Research methodology","Méthodologie de recherche")}</div>
   <h1>{pick("How Product Risk DNA works","Comment fonctionne Product Risk DNA")}</h1>
   <p className="muted">{pick("Product Risk DNA describes the investment itself. It is separate from Investor DNA and separate from DNA Match.","Product Risk DNA décrit le placement lui-même. Il est distinct d’Investor DNA et de DNA Match.")}</p>

   <div className="card">
    <h2>{pick("Overall Risk is not DNA Match","Le risque global n’est pas DNA Match")}</h2>
    <p>{pick("Overall Risk summarizes source-backed product characteristics through an asset-specific research model. It does not use your age, goals, risk tolerance or investment context, and it is not a recommendation to buy, sell or hold.","Le risque global résume des caractéristiques du produit appuyées par des sources au moyen d’un modèle de recherche propre à la catégorie d’actif. Il n’utilise ni votre âge, ni vos objectifs, ni votre tolérance au risque, ni votre contexte de placement et ne constitue pas une recommandation d’achat, de vente ou de conservation.")}</p>
    <p>{pick("DNA Match is a different layer: it compares eligible investment characteristics with your Investor DNA and the context for the money you are considering investing.","DNA Match est une couche différente : il compare les caractéristiques admissibles d’un placement avec votre Investor DNA et le contexte de l’argent que vous envisagez d’investir.")}</p>
   </div>

   <div className="product-risk-method-grid-v1">
    {PRODUCT_RISK_DIMENSIONS.map(item=>{
     const translated=FR_DIMENSIONS[item.code];
     const label=locale==="fr"?(translated?.label||item.label):item.label;
     const definition=locale==="fr"?(translated?.shortDefinition||item.shortDefinition):item.shortDefinition;
     const why=locale==="fr"?(translated?.whyItMatters||item.whyItMatters):item.whyItMatters;
     return <div className="card" key={item.code}>
      <div className="eyebrow">{item.direction==='higher_is_better'?pick("Higher can be beneficial","Un niveau plus élevé peut être favorable"):pick("Higher means more risk pressure","Un niveau plus élevé signifie davantage de pression de risque")}</div>
      <h2>{label}</h2>
      <p>{definition}</p>
      <p className="muted fine">{why}</p>
     </div>;
    })}
   </div>

   <div className="card">
    <h2>{pick("Same four questions, different measurement engines","Les mêmes quatre questions, des moteurs de mesure différents")}</h2>
    <p>{pick("An ETF, GIC, T-Bill and bond do not create risk in the same way. Product Risk keeps the consumer language consistent while the server uses asset-specific evidence underneath it.","Un FNB, un CPG, un bon du Trésor et une obligation ne créent pas le risque de la même façon. Product Risk garde un langage cohérent pour l’utilisateur tandis que le serveur utilise des preuves propres à chaque catégorie d’actif.")}</p>
    <ul>
     <li>{pick("ETF Price Movement can use the verified issuer/CSA risk classification; diversification can use holdings breadth and concentration; access can use bid-ask evidence when verified.","Pour un FNB, le Mouvement du prix peut utiliser la classification de risque vérifiée de l’émetteur ou des ACVM; la diversification peut utiliser l’étendue et la concentration des placements; l’accès peut utiliser des données d’écart acheteur-vendeur lorsqu’elles sont vérifiées.")}</li>
     <li>{pick("GIC risk emphasizes principal protection, issuer/deposit-insurance structure and redemption rules.","Le risque d’un CPG met l’accent sur la protection du capital, la structure de l’émetteur et de l’assurance-dépôts ainsi que les règles de rachat.")}</li>
     <li>{pick("T-Bill and bond risk emphasizes issuer credit, maturity, duration/rate sensitivity and market access.","Le risque des bons du Trésor et des obligations met l’accent sur le crédit de l’émetteur, l’échéance, la duration ou la sensibilité aux taux et l’accès au marché.")}</li>
     <li>{pick("Missing critical evidence stays Unknown or lowers confidence; it is never silently treated as Low.","Les preuves essentielles manquantes restent Inconnues ou réduisent le niveau de confiance; elles ne sont jamais silencieusement traitées comme un risque Faible.")}</li>
    </ul>
   </div>

   <div className="card">
    <h2>{pick("How confidence works","Comment fonctionne le niveau de confiance")}</h2>
    <p>{pick("Confidence describes the quality and completeness of the evidence behind the displayed band, not how certain future markets are. A High risk confidence does not mean the future is predictable.","Le niveau de confiance décrit la qualité et la complétude des preuves derrière la catégorie affichée, et non le degré de certitude sur les marchés futurs. Une confiance élevée dans l’évaluation du risque ne signifie pas que l’avenir est prévisible.")}</p>
    <p>{pick("For example, an ETF can have High-confidence official Price Movement evidence but only Medium-confidence Access evidence. In that case the overall Product Risk confidence is capped rather than overstated.","Par exemple, un FNB peut disposer de preuves officielles très fiables sur le Mouvement du prix, mais seulement de preuves de confiance moyenne sur l’Accès aux fonds. Dans ce cas, la confiance globale de Product Risk est plafonnée plutôt que surestimée.")}</p>
   </div>

   <div className="card">
    <h2>{pick("Publication gate","Contrôle de publication")}</h2>
    <p>{pick("Only explicitly reviewed and published profiles can appear on an investment page. Research drafts and calibration outputs remain hidden from the public Product Risk card.","Seuls les profils explicitement révisés et publiés peuvent apparaître sur une page de placement. Les brouillons de recherche et résultats de calibration restent masqués de la fiche Product Risk publique.")}</p>
    <p>{pick("Official issuer disclosures remain their own source-backed facts. Product Risk does not rewrite an official risk classification into a fake personalized score.","Les divulgations officielles de l’émetteur restent des faits distincts appuyés par leurs sources. Product Risk ne transforme pas une classification officielle du risque en faux score personnalisé.")}</p>
   </div>

   <div className="actions">
    <Link className="btn" href="/research">{pick("Research & limitations","Recherche et limites")}</Link>
    <Link className="btn primary" href="/explore">{pick("Explore investments","Explorer les placements")}</Link>
   </div>
  </div>
 </section>;
}
