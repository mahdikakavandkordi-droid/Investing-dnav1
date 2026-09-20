"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {Home, Dna, Search, Heart, UserRound} from "lucide-react";
import {useLocale} from "@/lib/locale";

const items=[
 {key:"home",label:"Home",labelFr:"Accueil",href:"/",Icon:Home,match:(path:string)=>path==="/"||path==="/profile"||path==="/dashboard"},
 {key:"dna",label:"DNA",labelFr:"DNA",href:"/dna",Icon:Dna,match:(path:string)=>path.startsWith("/dna")||path==="/match"},
 {key:"explore",label:"Explore",labelFr:"Explorer",href:"/explore",Icon:Search,match:(path:string)=>path.startsWith("/explore")||path.startsWith("/investment/")||path==="/screener"||path==="/compare"},
 {key:"watchlist",label:"Watchlist",labelFr:"Suivi",href:"/watchlist",Icon:Heart,match:(path:string)=>path.startsWith("/watchlist")},
 {key:"profile",label:"Profile",labelFr:"Profil",href:"/account",Icon:UserRound,match:(path:string)=>path.startsWith("/account")}
] as const;

const APP_ROUTES=["/","/profile","/dashboard","/dna","/explore","/investment","/match","/screener","/compare","/watchlist","/account"];

export function MobileAppNav(){
 const pathname=usePathname()||"/";
 const {locale}=useLocale();
 const inApp=APP_ROUTES.some(route=>pathname===route||pathname.startsWith(route+"/"));
 if(!inApp||pathname.startsWith("/dna/assessment"))return null;

 return <nav className="mobile-app-nav" aria-label="Mobile app navigation">
  <div className="mobile-app-nav-inner">
   {items.map(({key,label,labelFr,href,Icon,match})=>{
    const active=match(pathname);
    return <Link key={key} href={href} className={active?"mobile-app-nav-item active":"mobile-app-nav-item"} aria-current={active?"page":undefined}>
     <Icon size={21} strokeWidth={active?2.5:1.9} aria-hidden="true"/>
     <span>{locale==="fr"?labelFr:label}</span>
    </Link>;
   })}
  </div>
 </nav>;
}
