"use client";

import Link from "next/link";
import {useState} from "react";
import {useAccount} from "@/lib/use-account";
import {supabase} from "@/lib/supabase";
import {clearReturningWorkspaceCache} from "@/lib/returning-workspace";

export default function AccountPage(){
 const {user,loading}=useAccount();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 async function signOut(){
  if(!supabase||busy)return;
  setBusy(true);setError("");
  try{
   const currentUserId=user?.id;
   const {error:authError}=await supabase.auth.signOut({scope:"local"});
   if(authError)throw authError;
   clearReturningWorkspaceCache(currentUserId);
  }catch(e){setError(e instanceof Error?e.message:"Unable to sign out.");}
  finally{setBusy(false);}
 }

 if(loading)return <main className="mobile-account-page"><div className="mobile-account-shell"><div className="mobile-account-card">Loading your profile…</div></div></main>;

 return <main className="mobile-account-page">
  <div className="mobile-account-shell">
   <header className="mobile-account-hero">
    <div className="eyebrow">Profile</div>
    <h1>Your Investing DNA account</h1>
    <p>Keep account details separate from your research workspace.</p>
   </header>

   {user?<>
    <section className="mobile-account-card">
     <span className="mobile-account-label">Signed in as</span>
     <strong>{user.email||"Account"}</strong>
     <p>Your saved DNA and watchlist stay connected to this account.</p>
    </section>
    <section className="mobile-account-menu">
     <Link href="/profile"><span>My workspace</span><b>›</b></Link>
     <Link href="/dna/result"><span>My Investor DNA</span><b>›</b></Link>
     <Link href="/watchlist"><span>Saved research</span><b>›</b></Link>
     <Link href="/privacy"><span>Privacy</span><b>›</b></Link>
     <Link href="/research"><span>Research methodology</span><b>›</b></Link>
    </section>
    <button className="btn mobile-account-signout" disabled={busy} onClick={()=>void signOut()}>{busy?"Signing out…":"Sign out"}</button>
   </>:<section className="mobile-account-card">
    <h2>Save your DNA when it becomes useful.</h2>
    <p>You can explore and complete the assessment before creating an account.</p>
    <div className="actions"><Link className="btn primary" href="/profile">Sign in or create account</Link></div>
   </section>}
   {error&&<div className="notice" role="alert">{error}</div>}
  </div>
 </main>;
}
