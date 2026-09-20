"use client";

import Link from 'next/link';
import {useLocale} from '@/lib/locale';

export default function PilotPrivacy(){
 const {pick}=useLocale();
 return <section className="section"><div className="container narrow">
  <div className="eyebrow">{pick("Pilot privacy summary","Résumé de confidentialité du pilote")}</div>
  <h1>{pick("What the pilot records","Ce que le pilote enregistre")}</h1>

  <div className="card">
   <h2>{pick("Product analytics","Analytique produit")}</h2>
   <p>{pick("During the pilot, Investor DNA records privacy-minimized product events so we can understand where people complete, stop, explore, save and return.","Pendant le pilote, Investor DNA enregistre des événements produit minimisés sur le plan de la confidentialité afin de comprendre où les utilisateurs terminent, s’arrêtent, explorent, enregistrent et reviennent.")}</p>
   <p>{pick("The analytics layer uses a random browser visitor ID and a random browser-session ID. It may also record the route, event type, an investment identifier when relevant, and limited product-state metadata.","La couche analytique utilise un identifiant aléatoire de visiteur du navigateur et un identifiant aléatoire de session. Elle peut aussi enregistrer la route, le type d’événement, un identifiant de placement lorsque pertinent et des métadonnées limitées sur l’état du produit.")}</p>
   <p>{pick("The analytics event tables are not designed to store your name, email address, IP address or the text of your questionnaire answers.","Les tables d’événements analytiques ne sont pas conçues pour stocker votre nom, votre adresse courriel, votre adresse IP ni le texte de vos réponses au questionnaire.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Assessment and account data","Données d’évaluation et de compte")}</h2>
   <p>{pick("Your Investing DNA assessment answers are stored by the assessment service because they are required to calculate and reproduce your profile. If you choose to create an account and save your result, Investor DNA can associate your completed assessment, investment context and saved investments with that account.","Vos réponses à l’évaluation Investing DNA sont conservées par le service d’évaluation parce qu’elles sont nécessaires pour calculer et reproduire votre profil. Si vous créez un compte et enregistrez votre résultat, Investor DNA peut associer à ce compte votre évaluation terminée, votre contexte de placement et vos placements enregistrés.")}</p>
   <p>{pick("A completed guest assessment keeps only a limited claim ticket in browser storage for optional account saving; the full completed guest draft is not kept there after completion.","Une évaluation invitée terminée ne conserve dans le navigateur qu’un jeton limité permettant l’enregistrement facultatif dans un compte; le brouillon invité complet n’y est pas conservé après la fin.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Investment research activity","Activité de recherche sur les placements")}</h2>
   <p>{pick("The pilot can record that an investment research page, Compare, Screener or Watchlist was used and can attach an internal investment identifier to that product event. It does not turn your research activity into an order or execute a trade.","Le pilote peut enregistrer l’utilisation d’une page de recherche, de Comparer, du filtre ou de la liste de suivi et associer un identifiant interne de placement à cet événement. Il ne transforme pas votre activité de recherche en ordre et n’exécute aucune transaction.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Pilot comprehension feedback","Commentaires sur la compréhension")}</h2>
   <p>{pick("The pilot feedback form can ask whether DNA Match felt like it was telling you what to buy or whether you interpreted a Match score as an estimate of future return. These are product-safety and comprehension signals only. They do not change your Investor DNA, Match score or questionnaire result and are excluded from psychometric-validation inputs.","Le formulaire de commentaires peut demander si DNA Match vous a semblé indiquer quoi acheter ou si vous avez interprété un score Match comme une estimation du rendement futur. Il s’agit uniquement de signaux de sécurité produit et de compréhension. Ils ne modifient ni votre Investor DNA, ni votre score Match, ni le résultat du questionnaire et sont exclus des données de validation psychométrique.")}</p>
  </div>

  <div className="card">
   <h2>{pick("PDF report export","Exportation du rapport PDF")}</h2>
   <p>{pick("You can download or print your current Investor DNA report without creating an account. A guest export uses the same short-lived assessment capability already held by your browser; a saved-account export is checked against the signed-in owner.","Vous pouvez télécharger ou imprimer votre rapport Investor DNA actuel sans créer de compte. Une exportation invitée utilise la même autorisation temporaire d’évaluation déjà détenue par votre navigateur; une exportation depuis un compte enregistré est vérifiée auprès du propriétaire connecté.")}</p>
   <p>{pick("If PDF email delivery is enabled, the email address is used only to deliver that report and is sent to the configured transactional email provider. Investor DNA does not store the raw recipient address in the report-delivery audit; the audit keeps a one-way hash, assessment reference, provider status and time for abuse controls and troubleshooting.","Si l’envoi du PDF par courriel est activé, l’adresse est utilisée uniquement pour livrer ce rapport et est transmise au fournisseur de courriel transactionnel configuré. Investor DNA ne stocke pas l’adresse brute du destinataire dans le journal de livraison; celui-ci conserve une empreinte irréversible, la référence de l’évaluation, le statut du fournisseur et l’heure pour les contrôles d’abus et le dépannage.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Returning workspace continuity","Continuité de l’espace de travail")}</h2>
   <p>{pick("If you sign in, Investor DNA can keep a small account-owned continuity snapshot so the Home workspace can tell whether newer sourced market data is available for investments you already saved. That snapshot can include the previous workspace time, saved-investment count, per-saved-investment last-seen price date and opaque internal version identifiers.","Si vous vous connectez, Investor DNA peut conserver un petit instantané de continuité lié au compte afin que l’accueil puisse indiquer si de nouvelles données de marché sourcées sont disponibles pour les placements déjà enregistrés. Cet instantané peut inclure l’heure de la visite précédente, le nombre de placements enregistrés, la dernière date de prix vue pour chacun et des identifiants internes de version.")}</p>
   <p>{pick("This continuity state is not used to infer that an investment became better or worse, and it is not part of the questionnaire or psychometric-validation dataset. The browser keeps the returned summary only for the current tab/session so revisiting Home during one sitting does not repeatedly move the baseline.","Cet état de continuité n’est pas utilisé pour déduire qu’un placement est devenu meilleur ou pire et ne fait pas partie du questionnaire ni des données de validation psychométrique. Le navigateur conserve le résumé retourné uniquement pour l’onglet ou la session en cours afin que les retours à l’accueil pendant une même visite ne déplacent pas continuellement la référence.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Pilot feedback","Commentaires du pilote")}</h2>
   <p>{pick("If you submit pilot feedback, we record your ease, trust and usefulness scores, whether the Match explanation was understood, whether you would return, and any optional text you choose to provide. Feedback is used to improve the research-stage product.","Si vous envoyez des commentaires, nous enregistrons vos notes de facilité, de confiance et d’utilité, si l’explication du Match a été comprise, si vous reviendriez ainsi que tout texte facultatif fourni. Ces commentaires servent à améliorer le produit en phase de recherche.")}</p>
  </div>

  <div className="card">
   <h2>{pick("Controlled cognitive study","Étude cognitive contrôlée")}</h2>
   <p>{pick("The cognitive-study route is separate from normal development traffic. Participants enter through a moderator-controlled invite code so the research cohort is not silently mixed with ordinary testing.","La route de l’étude cognitive est séparée du trafic normal de développement. Les participants utilisent un code d’invitation contrôlé par un modérateur afin que la cohorte de recherche ne soit pas mélangée aux tests ordinaires.")}</p>
   <p>{pick("This page is a transparent pilot summary, not the final legal privacy policy for a public launch. Formal privacy and legal review remain pre-launch gates.","Cette page est un résumé transparent du pilote, et non la politique juridique finale de confidentialité pour un lancement public. Une révision formelle de la confidentialité et des aspects juridiques demeure requise avant le lancement.")}</p>
  </div>

  <div className="actions">
   <Link className="btn" href="/research">{pick("Research & limitations","Recherche et limites")}</Link>
   <Link className="btn primary" href="/feedback">{pick("Pilot feedback","Commentaires du pilote")}</Link>
  </div>
 </div></section>;
}
