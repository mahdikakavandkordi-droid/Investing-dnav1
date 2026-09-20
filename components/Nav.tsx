"use client";

import Link from 'next/link';
import {useAccount} from '@/lib/use-account';
import {BrandMark} from '@/components/BrandMark';
import {LanguageToggle,useLocale} from '@/lib/locale';

export function Nav(){
 const {user,loading}=useAccount();
 const {pick}=useLocale();
 return <header className="nav platform-nav">
  <div className="navin">
   <BrandMark/>
   <nav className="links platform-nav-links" aria-label="Main navigation">
    <Link href="/#how-it-works">{pick("How it works","Comment ça marche")}</Link>
    <Link href="/explore">{pick("Explore","Explorer")}</Link>
    <Link href="/compare">{pick("Compare","Comparer")}</Link>
    <Link href="/research">{pick("Research","Recherche")}</Link>
   </nav>
   <div className="account-links platform-account-links">
    <LanguageToggle/><Link className="profile-link" href="/profile">{user?pick("Dashboard","Tableau de bord"):loading?pick("Account","Compte"):pick("Sign in","Connexion")}</Link>
    <Link className="btn primary platform-nav-cta" href="/dna/assessment">{pick("Start your DNA","Découvrir mon DNA")}</Link>
   </div>
  </div>
 </header>;
}
