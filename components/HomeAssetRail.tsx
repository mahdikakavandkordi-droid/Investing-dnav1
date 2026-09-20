"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {searchInstruments} from "@/lib/instruments";
import type {Instrument} from "@/lib/instruments";
import {useLocale} from "@/lib/locale";

const ORDER=["ETF","GIC","BOND","T_BILL","COMMERCIAL_PAPER"] as const;
const PREFERRED:Record<string,string[]>={
 ETF:["VGRO","XBAL","VAB"],
 GIC:["RBC-GIC-1Y-CASH"],
 BOND:["GOC-BOND-5Y","GOC-BOND-2Y","GOC-BOND-10Y"],
 T_BILL:["GOC-TBILL-3M","GOC-TBILL-6M","GOC-TBILL-1Y"],
 COMMERCIAL_PAPER:["CA-CP-REF"]
};

export function HomeAssetRail(){
 const [items,setItems]=useState<Instrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const railRef=useRef<HTMLDivElement|null>(null);
 const {locale,pick}=useLocale();

 useEffect(()=>{
  let active=true;
  searchInstruments({limit:100})
   .then(data=>{if(active)setItems(Array.isArray(data)?data:[])})
   .catch(err=>{if(active)setError(err instanceof Error?err.message:String(err))})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);

 const cards=useMemo(()=>ORDER.map(type=>pickInstrument(items,type)).filter(Boolean) as Instrument[],[items]);

 if(loading)return <div className="home-asset-rail" aria-label={pick("Loading investment examples","Chargement des exemples de placement")}>
  {ORDER.map(type=><div className="home-asset-card home-asset-skeleton" key={type}><div/><div/><div/><div/></div>)}
 </div>;

 if(error||cards.length===0)return <div className="home-asset-fallback">
  <p>{pick("Investment examples are temporarily unavailable.","Les exemples de placement sont temporairement indisponibles.")}</p>
  <Link href="/explore">{pick("Open Explore →","Ouvrir Explorer →")}</Link>
 </div>;

 const scroll=(direction:number)=>{
  railRef.current?.scrollBy({left:direction*340,behavior:"smooth"});
 };

 return <div className="home-asset-rail-shell">
  <div className="home-asset-rail-top">
   <span>{pick("Asset-specific research cards","Fiches de recherche par catégorie d’actif")}</span>
   <div className="home-asset-rail-controls" aria-label={pick("Scroll investment types","Faire défiler les catégories de placement")}>
    <button type="button" onClick={()=>scroll(-1)} aria-label={pick("Scroll assets left","Faire défiler vers la gauche")}>←</button>
    <button type="button" onClick={()=>scroll(1)} aria-label={pick("Scroll assets right","Faire défiler vers la droite")}>→</button>
   </div>
  </div>
  <div className="home-asset-rail" aria-label={pick("Investment types","Catégories de placement")} ref={railRef}>
   {cards.map(item=><AssetCard item={item} key={item.id} locale={locale}/>)}
  </div>
 </div>;
}

function pickInstrument(items:Instrument[],assetType:string){
 const candidates=items.filter(item=>item.asset_type===assetType);
 const preferred=PREFERRED[assetType]||[];
 for(const symbol of preferred){
  const found=candidates.find(item=>item.symbol===symbol);
  if(found)return found;
 }
 return candidates[0];
}

function AssetCard({item,locale}:{item:Instrument;locale:"en"|"fr"}){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 const type=assetName(item.asset_type,locale);
 const metrics=assetMetrics(item,locale);
 const tags=assetTags(item,locale);

 return <article className={"home-asset-card asset-"+String(item.asset_type||"unknown").toLowerCase()}>
  <div className="home-asset-topline">
   <span className="home-asset-type">{type}</span>
   <span className="home-asset-symbol">{item.symbol}</span>
  </div>

  <div className="home-asset-copy">
   <h3>{item.name}</h3>
   {item.issuer_name&&<p className="home-asset-issuer">{item.issuer_name}</p>}
   <p>{item.profile_summary||item.description||pick("Source-backed research profile available.","Profil de recherche appuyé par des sources disponible.")}</p>
  </div>

  {tags.length>0&&<div className="home-asset-tags">{tags.map(tag=><span key={tag}>{tag}</span>)}</div>}

  <div className="home-asset-metrics">
   {metrics.map(metric=><div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
  </div>

  <div className="home-asset-risk">
   <div><span>{pick("Risk profile","Profil de risque")}</span><strong>{prettyLocalized(item.risk_level,locale)||riskFallback(item,locale)}</strong></div>
   <div className="home-risk-track"><i className={"risk-"+riskClass(item)}/></div>
  </div>

  <div className="home-asset-footer">
   <span>{footerCopy(item,locale)}</span>
   <Link href={"/investment/"+item.id}>{pick("View details →","Voir les détails →")}</Link>
  </div>
 </article>;
}

function assetName(type:string|undefined,locale:"en"|"fr"="en"){
 if(type==="T_BILL")return locale==="fr"?"Bon du Trésor":"T-Bill";
 if(type==="COMMERCIAL_PAPER")return locale==="fr"?"Papier commercial":"Commercial Paper";
 return prettyLocalized(type,locale)||(locale==="fr"?"Placement":"Investment");
}

function assetMetrics(item:Instrument,locale:"en"|"fr"="en"){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 if(item.asset_type==="ETF"){
  const allocation=item.profile_target_allocation;
  const equity=numberValue((item as Instrument&{equity_pct?:number|null}).equity_pct);
  const fixed=numberValue((item as Instrument&{fixed_income_pct?:number|null}).fixed_income_pct);
  return compact([
   {label:pick("Equity","Actions"),value:equity!=null?fmt(equity,"%"):allocation?.equity!=null?fmt(allocation.equity,"%"):null},
   {label:pick("Fixed income","Revenu fixe"),value:fixed!=null?fmt(fixed,"%"):allocation?.fixed_income!=null?fmt(allocation.fixed_income,"%"):null},
   {label:"MER",value:numberValue(item.mer_pct)!=null?fmt(Number(item.mer_pct),"%"):null},
   {label:pick("Liquidity","Liquidité"),value:prettyLocalized(item.liquidity_level,locale)}
  ]);
 }
 if(item.asset_type==="GIC")return compact([
  {label:pick("Interest rate","Taux d’intérêt"),value:numberValue(item.deposit_rate_pct)!=null?fmt(Number(item.deposit_rate_pct),"%"):null},
  {label:pick("Term","Durée"),value:item.term_months?(locale==="fr"?item.term_months+" mois":item.term_months+" months"):null},
  {label:pick("Redeemability","Rachetable"),value:prettyLocalized(item.redeemability,locale)},
  {label:pick("Deposit insurance","Assurance-dépôts"),value:item.deposit_insurance_eligible===true?(item.deposit_insurance_scheme||pick("Eligible","Admissible")):item.deposit_insurance_eligible===false?pick("Not indicated","Non indiqué"):null}
 ]);
 if(item.asset_type==="BOND")return compact([
  {label:pick("Coupon","Coupon"),value:numberValue(item.coupon_pct)!=null?fmt(Number(item.coupon_pct),"%"):null},
  {label:pick("Yield to maturity","Rendement à l’échéance"),value:numberValue(item.yield_to_maturity_pct)!=null?fmt(Number(item.yield_to_maturity_pct),"%"):null},
  {label:pick("Maturity","Échéance"),value:item.maturity_date?shortDate(item.maturity_date,locale):null},
  {label:pick("Liquidity","Liquidité"),value:prettyLocalized(item.liquidity_level,locale)}
 ]);
 if(item.asset_type==="T_BILL")return compact([
  {label:pick("Yield to maturity","Rendement à l’échéance"),value:numberValue(item.yield_to_maturity_pct)!=null?fmt(Number(item.yield_to_maturity_pct),"%"):null},
  {label:pick("Liquidity","Liquidité"),value:prettyLocalized(item.liquidity_level,locale)},
  {label:pick("Price movement","Mouvement du prix"),value:prettyLocalized(item.price_volatility,locale)},
  {label:pick("Protection basis","Base de protection"),value:prettyLocalized(item.capital_protection,locale)}
 ]);
 return compact([
  {label:pick("Liquidity","Liquidité"),value:prettyLocalized(item.liquidity_level,locale)},
  {label:pick("Price movement","Mouvement du prix"),value:prettyLocalized(item.price_volatility,locale)},
  {label:pick("Protection basis","Base de protection"),value:prettyLocalized(item.capital_protection,locale)},
  {label:pick("Currency","Devise"),value:item.currency||null}
 ]);
}

function assetTags(item:Instrument,locale:"en"|"fr"="en"){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 if(item.asset_type==="ETF")return compactStrings([
  item.profile_management_style?prettyLocalized(item.profile_management_style,locale):null,
  item.diversification_level?prettyLocalized(item.diversification_level,locale)+" "+pick("diversification","diversification"):null,
  item.liquidity_level?prettyLocalized(item.liquidity_level,locale)+" "+pick("liquidity","liquidité"):null
 ]).slice(0,3);
 if(item.asset_type==="GIC")return compactStrings([
  item.redeemability?prettyLocalized(item.redeemability,locale):null,
  item.deposit_insurance_eligible?pick("Deposit-insurance eligible","Admissible à l’assurance-dépôts"):null,
  item.capital_protection?prettyLocalized(item.capital_protection,locale):null
 ]).slice(0,3);
 if(item.asset_type==="BOND")return compactStrings([
  item.credit_exposure?prettyLocalized(item.credit_exposure,locale)+" "+pick("credit","crédit"):null,
  item.interest_rate_sensitivity?prettyLocalized(item.interest_rate_sensitivity,locale)+" "+pick("rate sensitivity","sensibilité aux taux"):null,
  item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null
 ]).slice(0,3);
 if(item.asset_type==="T_BILL")return compactStrings([pick("Government backed","Soutenu par le gouvernement"),pick("Short term","Court terme"),item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null]).slice(0,3);
 return compactStrings([pick("Educational reference","Référence éducative"),item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null]).slice(0,3);
}

function footerCopy(item:Instrument,locale:"en"|"fr"="en"){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 if(item.asset_type==="ETF")return pick("Portfolio structure","Structure du portefeuille");
 if(item.asset_type==="GIC")return pick("Deposit terms","Modalités du dépôt");
 if(item.asset_type==="BOND")return pick("Yield & maturity","Rendement et échéance");
 if(item.asset_type==="T_BILL")return pick("Short-term government debt","Dette gouvernementale à court terme");
 return pick("Money-market reference","Référence du marché monétaire");
}

function riskFallback(item:Instrument,locale:"en"|"fr"="en"){
 const pick=(en:string,fr:string)=>locale==="fr"?fr:en;
 if(item.price_volatility==="very_low"||item.price_volatility==="none")return pick("Low","Faible");
 if(item.price_volatility==="low")return pick("Low to Medium","Faible à moyen");
 if(item.price_volatility==="medium")return pick("Medium","Moyen");
 if(item.price_volatility==="high")return pick("High","Élevé");
 return pick("Research available","Recherche disponible");
}

function riskClass(item:Instrument){
 const raw=String(item.risk_level||item.price_volatility||"").toLowerCase();
 if(raw.includes("high")&&!raw.includes("medium"))return "high";
 if(raw.includes("medium")&&raw.includes("high"))return "medhigh";
 if(raw.includes("medium"))return "medium";
 if(raw.includes("low")&&raw.includes("medium"))return "lowmed";
 return "low";
}

function numberValue(value:unknown){
 const num=Number(value);
 return Number.isFinite(num)?num:null;
}
function fmt(value:number,suffix:string){return new Intl.NumberFormat("en-CA",{maximumFractionDigits:2}).format(value)+suffix}
function shortDate(value:string,locale:"en"|"fr"="en"){
 const date=new Date(value+"T00:00:00");
 return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(locale==="fr"?"fr-CA":"en-CA",{year:"numeric",month:"short",day:"numeric"}).format(date);
}
function pretty(value:unknown){
 if(typeof value!=="string"||!value)return "";
 return value.replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());
}
function compact<T extends {value:string|null}>(rows:T[]){return rows.filter(row=>row.value!=null).slice(0,4) as T[]}
function compactStrings(values:(string|null)[]){return values.filter((value):value is string=>!!value)}


function prettyLocalized(value:unknown,locale:"en"|"fr"){
 const raw=pretty(value);
 if(locale==="en")return raw;
 const map:Record<string,string>={
  High:"Élevé",Medium:"Moyen",Low:"Faible","Low To Medium":"Faible à moyen","Medium To High":"Moyen à élevé",
  None:"Aucune",Redeemable:"Rachetable",Diversified:"Diversifié",Concentrated:"Concentré",
  Passive:"Passif","Very Low":"Très faible","Insured Deposit":"Dépôt assuré",Contractual:"Contractuel"
 };
 return map[raw]||raw;
}
