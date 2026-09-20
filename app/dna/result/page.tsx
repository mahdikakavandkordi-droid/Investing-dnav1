"use client";

import {useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";
import {supabase,rpc} from "@/lib/supabase";
import {trackProductEvent} from "@/lib/analytics";
import {
 hasCompleteInvestmentContext,
 normalizePersonalization,
 readDraft,
 writeClaimPersonalization
} from "@/lib/dna";
import {effectiveMatchStatus,matchFitLabel,matchScorePresentation} from "@/lib/match-presentation";
import type {AppState,DNA,MatchItem,MatchPayload,PersonalizationProfile} from "@/lib/dna";
import {DnaSummary} from "@/components/DnaSummary";
import {ReportActions} from "@/components/ReportActions";
import {useLocale} from "@/lib/locale";

export default function Result(){
 const [dna,setDna]=useState<DNA|null>(null);
 const [report,setReport]=useState<DNA|null>(null);
 const [personal,setPersonal]=useState<PersonalizationProfile|null>(null);
 const [matches,setMatches]=useState<MatchPayload|null>(null);
 const [pending,setPending]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [sendingEmail,setSendingEmail]=useState(false);
 const [emailMessage,setEmailMessage]=useState('');
 const [assessmentId,setAssessmentId]=useState<string|null>(null);
 const [guestSessionToken,setGuestSessionToken]=useState<string|null>(null);
 const {pick}=useLocale();

 useEffect(()=>{
  let active=true;
  (async()=>{
   const session=supabase?(await supabase.auth.getSession()).data.session:null;
   const local=readDraft(session?.user.id||null);
   if(local?.result){
    if(active){
     setDna(local.result.result);
     setReport(local.result.report?.report||null);
     setMatches(local.result.match||null);
     setPending(!local.result.account_linked);
     setAssessmentId(local.session.assessment_id);
     setGuestSessionToken(local.result.account_linked?null:local.session.session_token);
     setPersonal(local.personalization||personalFromContext(local.result.report?.report?.investment_context||local.result.result.investment_context));
    }
    return;
   }
   if(session){
    const state=await rpc<AppState>('get_current_investor_app_state');
    if(active){
     setDna(state.dna);setReport(state.report);setMatches(state.matches||null);setPending(false);
     setAssessmentId(state.assessment_id||null);setGuestSessionToken(null);
     setPersonal(normalizePersonalization(session.user.user_metadata)||personalFromContext(state.report?.investment_context||state.dna?.investment_context));
    }
   }
  })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[]);

 const investmentContext=report?.investment_context||dna?.investment_context;
 const hasContext=hasCompleteInvestmentContext(investmentContext);
 const displayMatchStatus=effectiveMatchStatus(matches?.status,hasContext)||undefined;
 const topMatches=useMemo(()=>normalizeMatches(matches,displayMatchStatus).slice(0,3),[matches,displayMatchStatus]);
 const reviewRequired=displayMatchStatus==='review_required';

 async function emailSaveLink(email:string,profile:PersonalizationProfile){
  if(!supabase||sendingEmail||!pending)return;
  setSendingEmail(true);setEmailMessage('');setError('');
  try{
   if(!writeClaimPersonalization(profile))throw new Error(pick('This browser could not preserve the report details needed to finish saving. Please keep this tab open and try again.','Ce navigateur n’a pas pu conserver les détails nécessaires pour terminer l’enregistrement. Gardez cet onglet ouvert et réessayez.'));
   const redirect=new URL('/profile',location.origin);redirect.searchParams.set('save','dna');
   const {error:authError}=await supabase.auth.signInWithOtp({
    email:email.trim(),
    options:{shouldCreateUser:true,emailRedirectTo:redirect.toString(),data:profile}
   });
   if(authError)throw authError;
   void trackProductEvent('secure_link_requested',{metadata:{source:'dna_result'}});
   setEmailMessage(pick('Check your email and open the secure link in this same browser to finish saving this guest report. After it is saved, you can sign in from other devices.','Consultez votre courriel et ouvrez le lien sécurisé dans ce même navigateur pour terminer l’enregistrement de ce rapport invité. Une fois enregistré, vous pourrez vous connecter à partir d’autres appareils.'));
  }catch(e){setError(e instanceof Error?e.message:pick('Unable to send the secure email link.','Impossible d’envoyer le lien sécurisé par courriel.'));}
  finally{setSendingEmail(false);}
 }

 if(loading)return <LoadingResult/>;
 if(!dna)return <MissingResult error={error}/>;
 return <main className="result-page"><div className="container result-container">
  <DnaSummary dna={dna} report={report} personal={personal}/>
  <ReportActions assessmentId={assessmentId} guestSessionToken={guestSessionToken}/>
  {pending
   ? <GuestSaveCard personal={personal} sending={sendingEmail} message={emailMessage} onSubmit={emailSaveLink}/>
   : <SavedResultCard/>}
  <ContextCallout hasContext={hasContext} matchStatus={displayMatchStatus}/>
  {reviewRequired?<MatchReviewCallout matches={matches!}/>:topMatches.length>0&&<MatchPreview matches={topMatches} matchStatus={displayMatchStatus} hasContext={hasContext}/>} 
  <PilotFeedbackCard/>
  {error&&<p className="notice" role="alert">{error}</p>}
 </div></main>;
}

function LoadingResult(){const {pick}=useLocale();return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>{pick("Building your Investor DNA report…","Préparation de votre rapport Investor DNA…")}</h1><p className="muted">{pick("Turning your answers into a profile you can actually use.","Transformation de vos réponses en un profil que vous pouvez réellement utiliser.")}</p></div></div></main>}
function MissingResult({error}:{error:string}){const {pick}=useLocale();return <main className="result-page"><div className="container result-container"><div className="result-loading-card"><h1>{error?pick('Could not load your DNA','Impossible de charger votre DNA'):pick('Your guest report is no longer available','Votre rapport invité n’est plus disponible')}</h1>{error?<p role="alert">{error}</p>:<p>{pick("Guest reports are kept only for the current browser session. Take the assessment again, or sign in if you previously saved your Investor DNA.","Les rapports invités sont conservés uniquement pendant la session actuelle du navigateur. Reprenez l’évaluation ou connectez-vous si vous aviez déjà enregistré votre Investor DNA.")}</p>}<div className="actions"><Link className="btn primary" href="/dna/assessment">{pick("Take the assessment","Faire l’évaluation")}</Link><Link className="btn" href="/login">{pick("Sign in to saved DNA","Se connecter à mon DNA enregistré")}</Link>{error&&<button className="btn" onClick={()=>location.reload()}>{pick("Retry","Réessayer")}</button>}</div></div></div></main>}

function ContextCallout({hasContext,matchStatus}:{hasContext:boolean;matchStatus?:string}){
 const {pick}=useLocale();
 if(!hasContext){
  return <section className="result-next-card result-context-cta"><div><div className="eyebrow">{pick("Next · put your DNA into action","Prochaine étape · mettre votre DNA en action")}</div><h2>{pick("Tell us what this money is for.","Dites-nous à quoi sert cet argent.")}</h2><p>{pick("Your personal report is complete. Add a goal, time horizon, access needs and principal-protection requirement when you want context-aware DNA Match research.","Votre rapport personnel est terminé. Ajoutez un objectif, un horizon, des besoins d’accès et une exigence de protection du capital pour utiliser DNA Match avec contexte.")}</p></div><Link className="btn primary" href="/dna/context?returnTo=/dna/result">{pick("Set an investment goal","Définir un objectif de placement")}</Link></section>;
 }
 if(matchStatus==='review_required'){
  return <section className="result-next-card result-context-cta"><div><div className="eyebrow">{pick("Your DNA in action","Votre DNA en action")}</div><h2>{pick("This goal is connected, but Match is paused.","Cet objectif est connecté, mais Match est en pause.")}</h2><p>{pick("Your personal DNA is unchanged and the money context is saved. A safety or data-review gate is preventing ranked ETF results for this context.","Votre DNA personnel reste inchangé et le contexte financier est enregistré. Une vérification de sécurité ou de données empêche actuellement le classement des FNB pour ce contexte.")}</p></div><div className="actions compact"><Link className="btn primary" href="/match">{pick("Review Match status","Réviser l’état du Match")}</Link><Link className="btn" href="/dna/context?returnTo=/dna/result">{pick("Edit this goal","Modifier cet objectif")}</Link></div></section>;
 }
 if(matchStatus==='context_required'){
  return <section className="result-next-card result-context-cta"><div><div className="eyebrow">{pick("Your DNA in action","Votre DNA en action")}</div><h2>{pick("This context still needs another look.","Ce contexte doit encore être révisé.")}</h2><p>{pick("The report has goal details, but Match still considers required context incomplete. Review the goal, horizon, access need and principal-protection choice before using numeric compatibility.","Le rapport contient les détails de l’objectif, mais Match considère encore le contexte requis comme incomplet. Révisez l’objectif, l’horizon, le besoin d’accès et le choix de protection du capital avant d’utiliser la compatibilité numérique.")}</p></div><Link className="btn primary" href="/dna/context?returnTo=/dna/result">{pick("Review this goal","Réviser cet objectif")}</Link></section>;
 }
 return <section className="result-next-card result-context-cta"><div><div className="eyebrow">{pick("Your DNA in action","Votre DNA en action")}</div><h2>{pick("This goal is connected to your DNA.","Cet objectif est connecté à votre DNA.")}</h2><p>{pick("Your personal Investor DNA stays intact. Goal, horizon, access needs and principal protection form a separate layer for this specific money.","Votre Investor DNA personnel reste intact. L’objectif, l’horizon, les besoins d’accès et la protection du capital forment une couche distincte pour cet argent précis.")}</p></div><div className="actions compact"><Link className="btn primary" href="/match">{pick("Open context-aware Match","Ouvrir Match avec contexte")}</Link><Link className="btn" href="/dna/context?returnTo=/dna/result">{pick("Edit this goal","Modifier cet objectif")}</Link></div></section>;
}

function GuestSaveCard({personal,sending,message,onSubmit}:{personal:PersonalizationProfile|null;sending:boolean;message:string;onSubmit:(email:string,profile:PersonalizationProfile)=>Promise<void>}){
 const {pick}=useLocale();
 const [open,setOpen]=useState(false);
 const [email,setEmail]=useState('');
 const [firstName,setFirstName]=useState(personal?.first_name||'');
 const age=personal?.age||0;
 function submit(event:FormEvent){event.preventDefault();const profile=normalizePersonalization({first_name:firstName,age});if(!profile)return;void onSubmit(email,profile);}
 return <>
  <section className="report-save-launch"><div><div className="eyebrow">{pick("Optional account","Compte facultatif")}</div><strong>{pick("Save your Investor DNA","Enregistrer votre Investor DNA")}</strong><p>{pick("Keep this report in your dashboard and receive a secure email link to reopen it later.","Conservez ce rapport dans votre tableau de bord et recevez un lien sécurisé par courriel pour le rouvrir plus tard.")}</p><div className="report-save-benefits"><span>{pick("Dashboard access","Accès au tableau de bord")}</span><span>{pick("Secure email link","Lien sécurisé par courriel")}</span><span>{pick("DNA Match continuity","Continuité de DNA Match")}</span></div></div><button className="btn primary" onClick={()=>setOpen(true)}>{pick("Save my report","Enregistrer mon rapport")}</button></section>
  {open&&<div className="save-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}><section className="save-modal" role="dialog" aria-modal="true" aria-labelledby="save-report-title"><div className="save-modal-head"><div><div className="eyebrow">{pick("Free · passwordless","Gratuit · sans mot de passe")}</div><h2 id="save-report-title">{pick("Save your Investor DNA","Enregistrer votre Investor DNA")}</h2><p>{pick("Email and first name are enough to create the account.","Le courriel et le prénom suffisent pour créer le compte.")}</p></div><button className="save-modal-close" aria-label={pick("Close","Fermer")} onClick={()=>setOpen(false)}>×</button></div><form onSubmit={submit}><div className="save-modal-fields"><label><span>Email *</span><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label><span>{pick("First name *","Prénom *")}</span><input autoComplete="given-name" required value={firstName} onChange={e=>setFirstName(e.target.value)}/></label></div><button className="btn primary" disabled={sending||!email.trim()||!firstName.trim()}>{sending?pick('Sending secure link…','Envoi du lien sécurisé…'):pick('Create account & save my report','Créer le compte et enregistrer mon rapport')}</button><p className="save-modal-fine">{pick("The email contains a secure sign-in link, not an attachment. For this guest report, open the first save link in this same browser; after the report is attached to your account, it can be reopened from other devices.","Le courriel contient un lien de connexion sécurisé, pas une pièce jointe. Pour ce rapport invité, ouvrez le premier lien d’enregistrement dans ce même navigateur; une fois le rapport associé à votre compte, vous pourrez le rouvrir sur d’autres appareils.")}</p>{message&&<p className="notice" role="status">{message}</p>}</form></section></div>}
 </>;
}

function MatchReviewCallout({matches}:{matches:MatchPayload}){const {pick}=useLocale();const reasons=(matches.constraints?.reasons as string[]|undefined)||[];return <section className="result-next-card result-match-review"><div><div className="eyebrow">{pick("DNA Match paused","DNA Match en pause")}</div><h2>{pick("This money needs review before ranking ETFs.","Ce contexte doit être révisé avant de classer les FNB.")}</h2><p>{pick("The current context triggered a safety or product-data gate, so Investor DNA is not turning it into a ranked ETF list.","Le contexte actuel a déclenché une vérification de sécurité ou de données produit; Investor DNA ne le transforme donc pas en liste classée de FNB.")}</p>{reasons.length>0&&<ul className="result-list">{reasons.slice(0,3).map(reason=><li key={reason}>{reason}</li>)}</ul>}</div><Link className="btn primary" href="/match">{pick("Review Match status","Réviser l’état du Match")}</Link></section>}
function MatchPreview({matches,matchStatus,hasContext}:{matches:MatchItem[];matchStatus?:string;hasContext:boolean}){const {pick}=useLocale();const contextAware=matchStatus==='available'&&hasContext;return <section className="report-section matches-section"><div className="eyebrow">{pick("From DNA to research","Du DNA à la recherche")}</div><h2>{contextAware?pick('Context-aware ETF comparisons','Comparaisons FNB avec contexte'):pick('DNA-only ETF comparisons','Comparaisons FNB basées sur le DNA')}</h2><p className="report-lede">{contextAware?pick('These are compatibility signals based on your DNA and the context you added. They are not buy recommendations.','Il s’agit de signaux de compatibilité fondés sur votre DNA et le contexte ajouté. Ce ne sont pas des recommandations d’achat.'):pick('These comparisons use your DNA only. Add the purpose, horizon, access needs and principal-protection choice for context-aware Match.','Ces comparaisons utilisent uniquement votre DNA. Ajoutez l’objectif, l’horizon, les besoins d’accès et le choix de protection du capital pour un Match tenant compte du contexte.')}</p><div className="match-preview-grid">{matches.map(match=><MatchPreviewCard key={match.investment_id||match.symbol} match={match} matchStatus={matchStatus}/>)}</div><div className="matches-more"><Link className="btn primary" href="/match">{pick("See all DNA matches","Voir toutes les correspondances DNA")}</Link></div></section>}
function MatchPreviewCard({match,matchStatus}:{match:MatchItem;matchStatus?:string}){const {pick}=useLocale();const contextOnly=matchStatus==='context_required';const rowContextOnly=match.eligibility==='context_required'||match.recommendation_tier==='consider';const allowExplanation=!contextOnly||rowContextOnly;const why=allowExplanation?(match.explanation?.strengths?.[0]||match.explanation?.why_it_fits?.[0]||match.explanation?.watchouts?.[0]):undefined;const score=matchScorePresentation(match,matchStatus);return <article className="match-preview-card"><div className="match-preview-top"><span className="pill">{match.symbol}</span><strong>{score.numericValue==null?score.text:<>{score.numericValue}<small>/100</small></>}</strong></div><h3>{match.name||match.symbol}</h3><p className="match-fit-label">{matchFitLabel(match,matchStatus)}</p>{why&&<p className="muted">{why}</p>}{match.investment_id?<Link className="btn" href={`/investment/${match.investment_id}`}>{pick("View ETF details","Voir les détails du FNB")}</Link>:<Link className="btn" href="/match">{pick("Open DNA Match","Ouvrir DNA Match")}</Link>}</article>}
function SavedResultCard(){const {pick}=useLocale();return <section className="result-save-card"><div><strong>{pick("Your Investor DNA is saved.","Votre Investor DNA est enregistré.")}</strong><p>{pick("You can return to it from your dashboard and use it across Match, Explore and your watchlist.","Vous pouvez y revenir depuis votre tableau de bord et l’utiliser dans Match, Explorer et votre liste de suivi.")}</p></div><div className="result-actions"><Link className="btn primary" href="/profile">{pick("My dashboard","Mon tableau de bord")}</Link><Link className="btn" href="/explore">{pick("Explore investments","Explorer les placements")}</Link></div></section>}
function PilotFeedbackCard(){const {pick}=useLocale();return <section className="result-next-card"><div><div className="eyebrow">{pick("Pilot feedback","Commentaires pilote")}</div><h2>{pick("Did the result actually make sense?","Le résultat était-il vraiment clair?")}</h2><p>{pick("Give us one minute of feedback. It helps us validate clarity and usefulness before launch.","Accordez-nous une minute de rétroaction. Cela nous aide à valider la clarté et l’utilité avant le lancement.")}</p></div><Link className="btn" href="/feedback">{pick("Give pilot feedback","Donner mon avis")}</Link></section>}
function normalizeMatches(payload?:MatchPayload|null,status?:string):MatchItem[]{if(!payload)return [];const raw=Array.isArray(payload.results)&&payload.results.length?[...payload.results]:[...(payload.top_matches||[]),...(payload.alternatives||[]),...(payload.consider||[])];const seen=new Set<string>();const rows=raw.filter(item=>{if(seen.has(item.symbol))return false;seen.add(item.symbol);return true});return status==='available'?rows.sort((a,b)=>(b.match_score??-1)-(a.match_score??-1)):rows}
function personalFromContext(context?:DNA['investment_context']):PersonalizationProfile|null{return normalizePersonalization({first_name:context?.first_name,age:context?.age})}
