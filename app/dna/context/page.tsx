"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase,pilot,rpc} from "@/lib/supabase";
import {normalizePersonalization,readDraft,writeEphemeralResult} from "@/lib/dna";
import {formatInvestmentContext} from "@/lib/dna-presentation";
import type {AppState,Draft,InvestmentContextProfile,MatchPayload,PersonalizationProfile,Submission} from "@/lib/dna";

type ContextForm={first_name:string;age:string;amount_to_invest:string;goal:string;time_horizon:string;liquidity_need:string;principal_required:string;};
type ContextSaveResponse={report?:Submission['report'];match?:MatchPayload;};
const INITIAL_FORM:ContextForm={first_name:'',age:'',amount_to_invest:'',goal:'',time_horizon:'',liquidity_need:'',principal_required:''};
const CURRENT_HORIZONS=['lt_1y','1_3y','3_5y','5_10y','gt_10y'] as const;
const ALLOWED_RETURN_PATHS=new Set(['/dna/result','/match','/profile']);

export default function InvestmentContext(){
 const router=useRouter();
 const [draft,setDraft]=useState<Draft|null>(null);
 const [accountAssessmentId,setAccountAssessmentId]=useState<string|null>(null);
 const [form,setForm]=useState<ContextForm>(INITIAL_FORM);
 const [personal,setPersonal]=useState<PersonalizationProfile|null>(null);
 const [editing,setEditing]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 useEffect(()=>{let active=true;(async()=>{
  const session=supabase?(await supabase.auth.getSession()).data.session:null;
  const local=readDraft(session?.user.id||null);
  if(local?.result){if(!active)return;setDraft(local);const p=local.personalization||normalizePersonalization(session?.user.user_metadata);setPersonal(p);const context=local.result.report?.report?.investment_context||local.result.result.investment_context;if(context){setForm(withPersonal(formFromContext(context),p));setEditing(true)}else setForm(withPersonal(INITIAL_FORM,p));return;}
  if(session){const state=await rpc<AppState>('get_current_investor_app_state');if(!active)return;const p=normalizePersonalization(session.user.user_metadata)||personalFromContext(state.report?.investment_context||state.dna?.investment_context);setPersonal(p);if(state.assessment_id&&state.dna){setAccountAssessmentId(state.assessment_id);const context=state.report?.investment_context||state.dna.investment_context;if(context){setForm(withPersonal(formFromContext(context),p));setEditing(true)}else setForm(withPersonal(INITIAL_FORM,p));}}
 })().catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load investment context.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);

 function update<K extends keyof ContextForm>(key:K,value:ContextForm[K]){setForm(current=>({...current,[key]:value}))}
 const coreReady=!!form.goal&&!!form.time_horizon&&!!form.liquidity_need&&!!form.principal_required;
 const amountValue=form.amount_to_invest===''?null:Number(form.amount_to_invest);
 const amountValid=amountValue===null||(Number.isFinite(amountValue)&&amountValue>0);
 const hasAssessment=!!draft?.result||!!accountAssessmentId;

 async function save(){if(!hasAssessment||!coreReady||!amountValid)return;setBusy(true);setError('');try{
  const context={first_name:form.first_name.trim()||null,age:form.age?Number(form.age):null,amount_to_invest:amountValue,goal:form.goal,time_horizon:form.time_horizon,liquidity_need:form.liquidity_need,principal_required:form.principal_required};
  const data=draft?.session?.assessment_id?await pilot<ContextSaveResponse>('save_context',{...draft.session,context}):await rpc<ContextSaveResponse>('app_save_current_investment_context',{p_context:context});
  if(draft){const next:Draft={...draft,result:draft.result?{...draft.result,report:data.report||draft.result.report,match:data.match||draft.result.match}:draft.result};setDraft(next);writeEphemeralResult(next)}
  router.push(resolveReturnTarget(editing));
 }catch(e){setError(e instanceof Error?e.message:'Unable to save investment context.')}finally{setBusy(false)}}

 if(loading)return <ContextShell><div className="context-card"><h1>Loading your investment context…</h1></div></ContextShell>;
 if(!hasAssessment)return <MissingContextSource error={error}/>;
 return <ContextShell><div className="context-card"><div className="eyebrow">Your DNA in action</div><h1>{editing?'Review this investment goal.':'Let’s put your DNA into action.'}</h1><p className="context-lede">Your DNA describes you. These answers describe this particular pool of money and never rewrite your personal Investor DNA.</p><div className="context-identity"><div><small>Your personal profile</small><strong>{personal?.first_name||form.first_name||'Investor'}{personal?.age?` · Age ${personal.age}`:form.age?` · Age ${form.age}`:''}</strong></div><span>Name and age stay with your report.</span></div><CoreContextFields form={form} update={update}/><label className="context-field context-amount"><span>Amount you are considering (CAD) · optional</span><input type="number" min="0.01" step="0.01" value={form.amount_to_invest} onChange={event=>update('amount_to_invest',event.target.value)} placeholder="25,000"/></label>{!amountValid&&<p role="alert" className="notice">Enter a positive amount, or leave the amount blank.</p>}{error&&<p role="alert" className="notice">{error}</p>}<div className="context-actions"><button className="btn primary" disabled={busy||!coreReady||!amountValid} onClick={()=>void save()}>{busy?'Saving…':editing?'Update this goal':'See my personalized insights'}</button><Link className="btn" href={resolveCancelTarget()}>{editing?'Cancel':'Skip for now'}</Link></div>{!coreReady&&<p className="muted fine">Choose the four core goal answers above to create a context-aware Match. The amount can stay blank.</p>}<p className="muted fine">Context improves compatibility signals; it does not turn them into investment advice.</p></div></ContextShell>;
}

function ContextShell({children}:{children:React.ReactNode}){return <main className="context-page"><div className="container context-container">{children}</div></main>}
function MissingContextSource({error}:{error:string}){return <ContextShell><div className="context-card"><h1>No saved Investor DNA is available yet.</h1><p>{error||'Complete the assessment first, or sign in to the account that contains your saved DNA.'}</p><div className="actions"><Link className="btn primary" href="/dna/assessment">Take the assessment</Link><Link className="btn" href="/profile">Sign in</Link></div></div></ContextShell>}
function CoreContextFields({form,update}:{form:ContextForm;update:<K extends keyof ContextForm>(key:K,value:ContextForm[K])=>void}){const legacyHorizon=form.time_horizon&&!CURRENT_HORIZONS.includes(form.time_horizon as typeof CURRENT_HORIZONS[number])?form.time_horizon:null;return <div className="context-fields"><label className="context-field"><span>Investment goal</span><select value={form.goal} onChange={event=>update('goal',event.target.value)}><option value="" disabled>Choose a goal</option><option value="growth">General long-term growth</option><option value="retirement">Retirement</option><option value="house_purchase">Home purchase</option><option value="major_purchase">Major purchase</option><option value="education">Education</option><option value="income">Regular investment income</option><option value="wealth_preservation">Wealth preservation</option><option value="emergency_reserve">Emergency reserve / protect near-term money</option></select></label><label className="context-field"><span>When might you first need this money?</span><select value={form.time_horizon} onChange={event=>update('time_horizon',event.target.value)}><option value="" disabled>Choose a time horizon</option>{legacyHorizon&&<option value={legacyHorizon}>{formatInvestmentContext('time_horizon',legacyHorizon)} — previous selection</option>}<option value="lt_1y">Less than 1 year</option><option value="1_3y">1–3 years</option><option value="3_5y">3–5 years</option><option value="5_10y">5–10 years</option><option value="gt_10y">More than 10 years</option></select></label><label className="context-field"><span>How important is quick access?</span><select value={form.liquidity_need} onChange={event=>update('liquidity_need',event.target.value)}><option value="" disabled>Choose an access need</option><option value="high">High — I may need access on short notice</option><option value="medium">Medium — some access matters</option><option value="low">Low — I can leave it invested</option></select></label><label className="context-field"><span>At the time you need it, must the full amount be protected from investment loss?</span><select value={form.principal_required} onChange={event=>update('principal_required',event.target.value)}><option value="" disabled>Choose one</option><option value="yes">Yes — I need the full amount available</option><option value="no">No — I can accept market loss at that time</option><option value="unsure">I’m not sure</option></select></label></div>}
function formFromContext(context:InvestmentContextProfile):ContextForm{return {first_name:context.first_name||'',age:context.age==null?'':String(context.age),amount_to_invest:context.amount_to_invest==null?'':String(context.amount_to_invest),goal:context.goal==='preservation'?'wealth_preservation':context.goal||'',time_horizon:context.time_horizon||'',liquidity_need:context.liquidity_need||'',principal_required:context.principal_required||''}}
function withPersonal(form:ContextForm,personal:PersonalizationProfile|null):ContextForm{return {...form,first_name:form.first_name||personal?.first_name||'',age:form.age||(personal?.age?String(personal.age):'')}}
function personalFromContext(context?:DNAContext){return normalizePersonalization({first_name:context?.first_name,age:context?.age})}
type DNAContext=DNAContextAlias;type DNAContextAlias=InvestmentContextProfile|null|undefined;
function resolveReturnTarget(editing:boolean){if(typeof window==='undefined')return editing?'/match':'/dna/result';const requested=new URLSearchParams(window.location.search).get('returnTo');return requested&&ALLOWED_RETURN_PATHS.has(requested)?requested:editing?'/match':'/dna/result'}
function resolveCancelTarget(){if(typeof window==='undefined')return '/dna/result';const requested=new URLSearchParams(window.location.search).get('returnTo');return requested&&ALLOWED_RETURN_PATHS.has(requested)?requested:'/dna/result'}
