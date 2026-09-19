"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {Home, Dna, Search, Heart, UserRound} from "lucide-react";

const items=[
 {label:"Home",href:"/profile",Icon:Home,match:(path:string)=>path==="/profile"||path==="/dashboard"},
 {label:"DNA",href:"/dna",Icon:Dna,match:(path:string)=>path.startsWith("/dna")||path==="/match"},
 {label:"Explore",href:"/explore",Icon:Search,match:(path:string)=>path.startsWith("/explore")||path.startsWith("/investment/")||path==="/screener"||path==="/compare"},
 {label:"Watchlist",href:"/watchlist",Icon:Heart,match:(path:string)=>path.startsWith("/watchlist")},
 {label:"Profile",href:"/account",Icon:UserRound,match:(path:string)=>path.startsWith("/account")}
] as const;

const APP_ROUTES=["/profile","/dashboard","/dna","/explore","/investment","/match","/screener","/compare","/watchlist","/account"];

export function MobileAppNav(){
 const pathname=usePathname()||"/";
 const inApp=APP_ROUTES.some(route=>pathname===route||pathname.startsWith(route+"/"));
 if(!inApp)return null;

 return <nav className="mobile-app-nav" aria-label="Mobile app navigation">
  <div className="mobile-app-nav-inner">
   {items.map(({label,href,Icon,match})=>{
    const active=match(pathname);
    return <Link key={label} href={href} className={active?"mobile-app-nav-item active":"mobile-app-nav-item"} aria-current={active?"page":undefined}>
     <Icon size={21} strokeWidth={active?2.5:1.9} aria-hidden="true"/>
     <span>{label}</span>
    </Link>;
   })}
  </div>
 </nav>;
}
