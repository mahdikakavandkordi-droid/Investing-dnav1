"use client";

import {useEffect,useMemo,useState} from "react";
import type {FormEvent,ReactNode} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {trackProductEvent} from "@/lib/analytics";
import {useAccount} from "@/lib/use-account";
import {useLocale} from "@/lib/locale";
import {validId} from "@/lib/investments";

type Mode="signup"|"login";

export function AuthEntry({mode}:{mode:Mode}){
 const {user,loading}=useAccount();
 const {locale,pick}=useLocale();
 const [email,setEmail]=useState("");
 const [firstName,setFirstName]=useState("");
 const [sentTo,setSentTo]=useState("");
 const [busy,setBusy]=useState(false);
 const [cooldown,setCooldown]=useState(0);
 const [error,setError]=useState("");

 useEffect(()=>{
  if(cooldown<=0)return;
  const timer=window.setInterval(()=>setCooldown(value=>Math.max(0,value-1)),1000);
  return()=>window.clearInterval(timer);
 },[cooldown]);

 const intent=useMemo(()=>{
  if(typeof window==="undefined")return {investment:null as string|null,saveDna:false};
  const params=new URLSearchParams(window.location.search);
  const investment=params.get("investment");
  return {investment:validId(investment)?investment:null,saveDna:params.get("save")==="dna"};
 },[]);

 const switchHref=buildAuthHref(mode==="signup"?"/login":"/signup",intent.investment,intent.saveDna);

 async function requestLink(){
  if(!supabase||busy||cooldown>0)return;
  const address=email.trim();
  if(!address)return;
  if(mode==="signup"&&!firstName.trim())return;

  setBusy(true);
  setError("");
  try{
   const redirect=new URL("/profile",location.origin);
   if(intent.investment)redirect.searchParams.set("investment",intent.investment);
   if(intent.saveDna)redirect.searchParams.set("save","dna");

   const metadata=mode==="signup"?{first_name:firstName.trim()}:undefined;
   const {error:authError}=await supabase.auth.signInWithOtp({
    email:address,
    options:{shouldCreateUser:mode==="signup",emailRedirectTo:redirect.toString(),data:metadata}
   });
   if(authError)throw authError;

   setSentTo(address);
   setCooldown(60);
   void trackProductEvent("secure_link_requested",{metadata:{source:mode==="signup"?"signup_page":"login_page"}});
  }catch(e){
   const raw=e instanceof Error?e.message:pick("Unable to send the secure link.","Impossible d’envoyer le lien sécurisé.");
   setError(friendlyAuthError(raw,locale,mode));
   if(/rate limit|too many/i.test(raw))setCooldown(60);
  }finally{setBusy(false)}
 }

 function submit(event:FormEvent){event.preventDefault();void requestLink()}

 if(loading)return <AuthShell><div className="card auth-card"><p role="status">{pick("Checking your account…","Vérification de votre compte…")}</p></div></AuthShell>;

 if(user)return <AuthShell><div className="card auth-card">
  <div className="eyebrow">{pick("Account","Compte")}</div>
  <h1>{pick("You’re already signed in.","Vous êtes déjà connecté.")}</h1>
  <p>{user.email}</p>
  <div className="actions"><Link className="btn primary" href="/profile">{pick("Open my dashboard","Ouvrir mon tableau de bord")}</Link><Link className="btn" href="/account">{pick("Account settings","Paramètres du compte")}</Link></div>
 </div></AuthShell>;

 const isSignup=mode==="signup";
 return <AuthShell><div className="card auth-card dedicated-auth-card">
  <div className="eyebrow">{isSignup?pick("Free account","Compte gratuit"):pick("Welcome back","Bon retour")}</div>
  <h1>{isSignup?pick("Create your Investing DNA account","Créer votre compte Investing DNA"):pick("Sign in to Investing DNA","Se connecter à Investing DNA")}</h1>
  <p>{isSignup
   ?pick("Save your Investor DNA, watchlist and research continuity. No password required.","Enregistrez votre Investor DNA, votre liste de suivi et la continuité de vos recherches. Aucun mot de passe requis.")
   :pick("Use the email address connected to your account. We’ll send a secure sign-in link.","Utilisez l’adresse courriel associée à votre compte. Nous vous enverrons un lien de connexion sécurisé.")}</p>

  {sentTo?<div className="auth-sent">
   <h2>{pick("Check your email","Consultez votre courriel")}</h2>
   <p>{pick("We sent a secure link to","Nous avons envoyé un lien sécurisé à")} <strong>{sentTo}</strong>.</p>
   {intent.saveDna
    ?<div className="auth-browser-note"><strong>{pick("Keep this tab open.","Gardez cet onglet ouvert.")}</strong><p>{pick("Open the newest link on this same device and browser so your completed guest DNA can be attached to the account.","Ouvrez le lien le plus récent sur ce même appareil et dans ce même navigateur afin que votre DNA invité terminé puisse être associé au compte.")}</p></div>
    :<div className="auth-browser-note"><strong>{pick("Use the newest link only.","Utilisez uniquement le lien le plus récent.")}</strong><p>{pick("The link signs you in without a password and returns you to your Investing DNA workspace.","Le lien vous connecte sans mot de passe et vous ramène à votre espace Investing DNA.")}</p></div>}
   <div className="auth-sent-actions">
    <button className="btn primary" type="button" disabled={busy||cooldown>0} onClick={()=>void requestLink()}>{busy?pick("Sending…","Envoi…"):cooldown>0?`${pick("Send again in","Renvoyer dans")} ${cooldown}s`:pick("Send a new link","Envoyer un nouveau lien")}</button>
    <button className="btn" type="button" disabled={busy} onClick={()=>{setSentTo("");setError("")}}>{pick("Use a different email","Utiliser une autre adresse")}</button>
   </div>
  </div>:<form onSubmit={submit} className="dedicated-auth-form">
   {isSignup&&<label className="context-field"><span>{pick("First name","Prénom")}</span><input autoComplete="given-name" required value={firstName} onChange={event=>setFirstName(event.target.value)} placeholder={pick("Your first name","Votre prénom")}/></label>}
   <label className="context-field"><span>{pick("Email address","Adresse courriel")}</span><input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/></label>
   <button className="btn primary" disabled={busy||cooldown>0||!email.trim()||(isSignup&&!firstName.trim())}>{busy?pick("Sending…","Envoi…"):isSignup?pick("Create account with secure link","Créer le compte avec un lien sécurisé"):pick("Email me a sign-in link","M’envoyer un lien de connexion")}</button>
  </form>}

  {error&&<p className="notice" role="alert">{error}</p>}

  <div className="dedicated-auth-switch">
   <span>{isSignup?pick("Already have an account?","Vous avez déjà un compte?"):pick("New to Investing DNA?","Nouveau sur Investing DNA?")}</span>
   <Link href={switchHref}>{isSignup?pick("Sign in","Connexion"):pick("Create free account","Créer un compte gratuit")}</Link>
  </div>

  {isSignup&&<p className="fine muted">{pick("We only ask for a first name and email at account creation. Your age belongs to the Investor DNA assessment, not the account itself.","À la création du compte, nous demandons uniquement un prénom et une adresse courriel. Votre âge fait partie de l’évaluation Investor DNA, pas du compte lui-même.")}</p>}
 </div></AuthShell>;
}

function AuthShell({children}:{children:ReactNode}){return <section className="profile-page auth-entry-page"><div className="container narrow">{children}</div></section>}

function buildAuthHref(path:string,investment:string|null,saveDna:boolean){
 const params=new URLSearchParams();
 if(investment)params.set("investment",investment);
 if(saveDna)params.set("save","dna");
 const query=params.toString();
 return query?path+"?"+query:path;
}

function friendlyAuthError(value:string,locale:"en"|"fr",mode:Mode){
 if(/expired|otp/i.test(value))return locale==="fr"?"Ce lien a expiré. Demandez un nouveau lien sécurisé.":"That link has expired. Request a new secure link.";
 if(/rate limit|too many/i.test(value))return locale==="fr"?"Trop de tentatives. Attendez une minute puis réessayez.":"Too many attempts. Wait a minute and try again.";
 if(mode==="login"&&/signups? not allowed|user not found|not found/i.test(value))return locale==="fr"?"Aucun compte n’a été trouvé avec cette adresse. Créez un compte gratuit.":"No account was found for that email. Create a free account.";
 return value;
}
