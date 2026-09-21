"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {instrumentDisplayName,searchInstruments} from "@/lib/instruments";
import type {Instrument} from "@/lib/instruments";

const ORDER=["ETF","MUTUAL_FUND","GIC"] as const;
const PREFERRED:Record<string,string[]>={
 ETF:["VGRO","XBAL","VAB"],
 MUTUAL_FUND:["RBF460","RBF461","RBF459"],
 GIC:["RBC-GIC-1Y-CASH"]
};

export function HomeAssetRail(){
 const [items,setItems]=useState<Instrument[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const railRef=useRef<HTMLDivElement|null>(null);

 useEffect(()=>{
  let active=true;
  searchInstruments({limit:100})
   .then(data=>{if(active)setItems(Array.isArray(data)?data:[])})
   .catch(err=>{if(active)setError(err instanceof Error?err.message:String(err))})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);

 const cards=useMemo(()=>ORDER.map(type=>pick(items,type)).filter(Boolean) as Instrument[],[items]);

 if(loading)return <div className="home-asset-rail" aria-label="Loading investment examples">
  {ORDER.map(type=><div className="home-asset-card home-asset-skeleton" key={type}><div/><div/><div/><div/></div>)}
 </div>;

 if(error||cards.length===0)return <div className="home-asset-fallback">
  <p>Investment examples are temporarily unavailable.</p>
  <Link href="/explore">Open Explore →</Link>
 </div>;

 const scroll=(direction:number)=>{
  railRef.current?.scrollBy({left:direction*340,behavior:"smooth"});
 };

 return <div className="home-asset-rail-shell">
  <div className="home-asset-rail-top">
   <span>Asset-specific research cards</span>
   <div className="home-asset-rail-controls" aria-label="Scroll investment types">
    <button type="button" onClick={()=>scroll(-1)} aria-label="Scroll assets left">←</button>
    <button type="button" onClick={()=>scroll(1)} aria-label="Scroll assets right">→</button>
   </div>
  </div>
  <div className="home-asset-rail" aria-label="Investment types" ref={railRef}>
   {cards.map(item=><AssetCard item={item} key={item.id}/>)}
  </div>
 </div>;
}

function pick(items:Instrument[],assetType:string){
 const candidates=items.filter(item=>item.asset_type===assetType);
 const preferred=PREFERRED[assetType]||[];
 for(const symbol of preferred){
  const found=candidates.find(item=>item.symbol===symbol);
  if(found)return found;
 }
 return candidates[0];
}

function AssetCard({item}:{item:Instrument}){
 const type=assetName(item.asset_type);
 const metrics=assetMetrics(item);
 const tags=assetTags(item);

 return <article className={"home-asset-card asset-"+String(item.asset_type||"unknown").toLowerCase()}>
  <div className="home-asset-topline">
   <span className="home-asset-type">{type}</span>
   <span className="home-asset-symbol">{item.symbol}</span>
  </div>

  <div className="home-asset-copy">
   <h3>{instrumentDisplayName(item)}</h3>
   {item.issuer_name&&<p className="home-asset-issuer">{item.issuer_name}</p>}
   <p>{item.profile_summary||item.description||"Source-backed research profile available."}</p>
  </div>

  {tags.length>0&&<div className="home-asset-tags">{tags.map(tag=><span key={tag}>{tag}</span>)}</div>}

  <div className="home-asset-metrics">
   {metrics.map(metric=><div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
  </div>

  <div className="home-asset-risk">
   <div><span>Risk profile</span><strong>{pretty(item.risk_level)||riskFallback(item)}</strong></div>
   <div className="home-risk-track"><i className={"risk-"+riskClass(item)}/></div>
  </div>

  <div className="home-asset-footer">
   <span>{footerCopy(item)}</span>
   <Link href={"/investment/"+item.id}>View details →</Link>
  </div>
 </article>;
}

function assetName(type?:string){
 if(type==="MUTUAL_FUND")return "Mutual Fund";
 if(type==="T_BILL")return "T-Bill";
 if(type==="COMMERCIAL_PAPER")return "Commercial Paper";
 return pretty(type)||"Investment";
}

function assetMetrics(item:Instrument){
 if(item.asset_type==="ETF"){
  const allocation=item.profile_target_allocation;
  const equity=numberValue((item as Instrument&{equity_pct?:number|null}).equity_pct);
  const fixed=numberValue((item as Instrument&{fixed_income_pct?:number|null}).fixed_income_pct);
  return compact([
   {label:"Equity",value:equity!=null?fmt(equity,"%"):allocation?.equity!=null?fmt(allocation.equity,"%"):null},
   {label:"Fixed income",value:fixed!=null?fmt(fixed,"%"):allocation?.fixed_income!=null?fmt(allocation.fixed_income,"%"):null},
   {label:"MER",value:numberValue(item.mer_pct)!=null?fmt(Number(item.mer_pct),"%"):null},
   {label:"Liquidity",value:pretty(item.liquidity_level)}
  ]);
 }
 if(item.asset_type==="MUTUAL_FUND")return compact([
  {label:"NAV",value:numberValue(item.price)!=null?fmt(Number(item.price),""):null},
  {label:"Risk",value:pretty(item.risk_level)},
  {label:"MER",value:numberValue(item.mer_pct)!=null?fmt(Number(item.mer_pct),"%"):null},
  {label:"Series",value:item.series_name||null}
 ]);
 if(item.asset_type==="GIC")return compact([
  {label:"Interest rate",value:numberValue(item.deposit_rate_pct)!=null?fmt(Number(item.deposit_rate_pct),"%"):null},
  {label:"Term",value:item.term_months?item.term_months+" months":null},
  {label:"Redeemability",value:pretty(item.redeemability)},
  {label:"Deposit insurance",value:item.deposit_insurance_eligible===true?(item.deposit_insurance_scheme||"Eligible"):item.deposit_insurance_eligible===false?"Not indicated":null}
 ]);
 if(item.asset_type==="BOND")return compact([
  {label:"Coupon",value:numberValue(item.coupon_pct)!=null?fmt(Number(item.coupon_pct),"%"):null},
  {label:"Yield to maturity",value:numberValue(item.yield_to_maturity_pct)!=null?fmt(Number(item.yield_to_maturity_pct),"%"):null},
  {label:"Maturity",value:item.maturity_date?shortDate(item.maturity_date):null},
  {label:"Liquidity",value:pretty(item.liquidity_level)}
 ]);
 if(item.asset_type==="T_BILL")return compact([
  {label:"Yield to maturity",value:numberValue(item.yield_to_maturity_pct)!=null?fmt(Number(item.yield_to_maturity_pct),"%"):null},
  {label:"Liquidity",value:pretty(item.liquidity_level)},
  {label:"Price movement",value:pretty(item.price_volatility)},
  {label:"Protection basis",value:pretty(item.capital_protection)}
 ]);
 return compact([
  {label:"Liquidity",value:pretty(item.liquidity_level)},
  {label:"Price movement",value:pretty(item.price_volatility)},
  {label:"Protection basis",value:pretty(item.capital_protection)},
  {label:"Currency",value:item.currency||null}
 ]);
}

function assetTags(item:Instrument){
 if(item.asset_type==="ETF")return compactStrings([
  item.profile_management_style?pretty(item.profile_management_style):null,
  item.diversification_level?pretty(item.diversification_level)+" diversification":null,
  item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null
 ]).slice(0,3);
 if(item.asset_type==="MUTUAL_FUND")return compactStrings([
  item.cifsc_category||item.category||null,
  item.profile_management_style?pretty(item.profile_management_style):null,
  item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null
 ]).slice(0,3);
 if(item.asset_type==="GIC")return compactStrings([
  item.redeemability?pretty(item.redeemability):null,
  item.deposit_insurance_eligible?"Deposit-insurance eligible":null,
  item.capital_protection?pretty(item.capital_protection):null
 ]).slice(0,3);
 if(item.asset_type==="BOND")return compactStrings([
  item.credit_exposure?pretty(item.credit_exposure)+" credit":null,
  item.interest_rate_sensitivity?pretty(item.interest_rate_sensitivity)+" rate sensitivity":null,
  item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null
 ]).slice(0,3);
 if(item.asset_type==="T_BILL")return compactStrings(["Government backed","Short term",item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null]).slice(0,3);
 return compactStrings(["Educational reference",item.liquidity_level?pretty(item.liquidity_level)+" liquidity":null]).slice(0,3);
}

function footerCopy(item:Instrument){
 if(item.asset_type==="ETF")return "Portfolio structure";
 if(item.asset_type==="MUTUAL_FUND")return "Fund profile & fees";
 if(item.asset_type==="GIC")return "Deposit terms";
 if(item.asset_type==="BOND")return "Yield & maturity";
 if(item.asset_type==="T_BILL")return "Short-term government debt";
 return "Money-market reference";
}

function riskFallback(item:Instrument){
 if(item.price_volatility==="very_low"||item.price_volatility==="none")return "Low";
 if(item.price_volatility==="low")return "Low to Medium";
 if(item.price_volatility==="medium")return "Medium";
 if(item.price_volatility==="high")return "High";
 return "Research available";
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
function shortDate(value:string){
 const date=new Date(value+"T00:00:00");
 return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"short",day:"numeric"}).format(date);
}
function pretty(value:unknown){
 if(typeof value!=="string"||!value)return "";
 return value.replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());
}
function compact<T extends {value:string|null}>(rows:T[]){return rows.filter(row=>row.value!=null).slice(0,4) as T[]}
function compactStrings(values:(string|null)[]){return values.filter((value):value is string=>!!value)}
