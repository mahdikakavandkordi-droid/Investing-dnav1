"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {UserRound} from "lucide-react";
import {BrandMark} from "@/components/BrandMark";
import {LanguageToggle,useLocale} from "@/lib/locale";

const APP_ROUTES=["/","/profile","/dashboard","/dna","/explore","/investment","/match","/screener","/compare","/watchlist","/account","/signup","/login"];

export function MobileAppHeader(){
 const pathname=usePathname()||"/";
 const {pick}=useLocale();
 const inApp=APP_ROUTES.some(route=>pathname===route||pathname.startsWith(route+"/"));
 if(!inApp)return null;

 const focused=pathname.startsWith("/dna/assessment");
 return <header className={focused?"mobile-app-header focused":"mobile-app-header"}>
  <div className="mobile-app-header-inner">
   <BrandMark/>
   {!focused&&<div className="mobile-app-header-actions">
    <LanguageToggle compact/>
    {!pathname.startsWith("/account")&&<Link className="mobile-app-profile-button" href="/account" aria-label={pick("Open profile","Ouvrir le profil")}>
     <UserRound size={18} strokeWidth={2}/>
    </Link>}
   </div>}
  </div>
 </header>;
}
