"use client";

import Link from "next/link";
import {useState} from "react";
import {useAccount} from "@/lib/use-account";
import {supabase} from "@/lib/supabase";
import {clearReturningWorkspaceCache} from "@/lib/returning-workspace";
import {useLocale} from "@/lib/locale";

export default function AccountPage(){
 const {user,loading}=useAccount();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const {pick}=useLocale();

 async function signOut(){
  if(!supabase||busy)return;
  setBusy(true);setError("");
  try{
   const currentUserId=user?.id;
   const {error:authError}=await supabase.auth.signOut({scope:"local"});
   if(authError)throw authError;
   clearReturningWorkspaceCache(currentUserId);
  }catch(e){setError(e instanceof Error?e.message:pick("Unable to sign out.","Impossible de se déconnecter."));}
  finally{setBusy(false);}
 }

 if(loading)return <main className="mobile-account-page"><div className="mobile-account-shell"><div className="mobile-account-card">{pick("Loading your profile…","Chargement de votre profil…")}</div></div></main>;

 return <main className="mobile-account-page">
  <div className="mobile-account-shell">
   <header className="mobile-account-hero">
    <div className="eyebrow">{pick("Profile","Profil")}</div>
    <h1>{pick("Your Investing DNA account","Votre compte Investing DNA")}</h1>
    <p>{pick("Keep account details separate from your research workspace.","Gardez les détails du compte séparés de votre espace de recherche.")}</p>
   </header>

   {user?<>
    <section className="mobile-account-card">
     <span className="mobile-account-label">{pick("Signed in as","Connecté comme")}</span>
     <strong>{user.email||pick("Account","Compte")}</strong>
     <p>{pick("Your saved DNA and watchlist stay connected to this account.","Votre DNA enregistré et votre liste de suivi restent associés à ce compte.")}</p>
    </section>
    <section className="mobile-account-menu">
     <Link href="/profile"><span>{pick("My workspace","Mon espace")}</span><b>›</b></Link>
     <Link href="/dna/result"><span>{pick("My Investor DNA","Mon Investor DNA")}</span><b>›</b></Link>
     <Link href="/watchlist"><span>{pick("Saved research","Recherche enregistrée")}</span><b>›</b></Link>
     <Link href="/privacy"><span>{pick("Privacy","Confidentialité")}</span><b>›</b></Link>
     <Link href="/research"><span>{pick("Research methodology","Méthodologie de recherche")}</span><b>›</b></Link>
    </section>
    <button className="btn mobile-account-signout" disabled={busy} onClick={()=>void signOut()}>{busy?pick("Signing out…","Déconnexion…"):pick("Sign out","Se déconnecter")}</button>
   </>:<section className="mobile-account-card">
    <h2>{pick("Save your DNA when it becomes useful.","Enregistrez votre DNA lorsque cela devient utile.")}</h2>
    <p>{pick("You can explore and complete the assessment before creating an account.","Vous pouvez explorer et terminer l’évaluation avant de créer un compte.")}</p>
    <div className="actions"><Link className="btn primary" href="/profile">{pick("Sign in or create account","Se connecter ou créer un compte")}</Link></div>
   </section>}
   {error&&<div className="notice" role="alert">{error}</div>}
  </div>
 </main>;
}
