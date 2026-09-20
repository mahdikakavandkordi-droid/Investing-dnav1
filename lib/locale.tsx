"use client";

import {createContext,useContext,useEffect,useMemo,useState} from "react";
import type {ReactNode} from "react";

export type AppLocale="en"|"fr";

const STORAGE_KEY="investing-dna:language";
const COOKIE_KEY="investing-dna-language";

type LocaleContextValue={
 locale:AppLocale;
 setLocale:(locale:AppLocale)=>void;
 pick:(english:string,french:string)=>string;
};

const LocaleContext=createContext<LocaleContextValue|null>(null);

export function LocaleProvider({children}:{children:ReactNode}){
 const [locale,setLocaleState]=useState<AppLocale>("en");

 useEffect(()=>{
  try{
   const saved=localStorage.getItem(STORAGE_KEY);
   if(saved==="fr"||saved==="en")setLocaleState(saved);
  }catch{}
 },[]);

 useEffect(()=>{
  document.documentElement.lang=locale;
  document.documentElement.dir="ltr";
 },[locale]);

 function setLocale(next:AppLocale){
  setLocaleState(next);
  try{localStorage.setItem(STORAGE_KEY,next)}catch{}
  try{document.cookie=`${COOKIE_KEY}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`}catch{}
 }

 const value=useMemo<LocaleContextValue>(()=>({
  locale,
  setLocale,
  pick:(english,french)=>locale==="fr"?french:english
 }),[locale]);

 return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(){
 const value=useContext(LocaleContext);
 if(!value)throw new Error("useLocale must be used inside LocaleProvider");
 return value;
}

export function LanguageToggle({compact=false}:{compact?:boolean}){
 const {locale,setLocale}=useLocale();
 return <div className={compact?"locale-switch compact":"locale-switch"} role="group" aria-label={locale==="fr"?"Langue du site":"Site locale"}>
  <button type="button" className={locale==="en"?"active":""} aria-pressed={locale==="en"} onClick={()=>setLocale("en")}>EN</button>
  <button type="button" className={locale==="fr"?"active":""} aria-pressed={locale==="fr"} onClick={()=>setLocale("fr")}>FR</button>
 </div>;
}
