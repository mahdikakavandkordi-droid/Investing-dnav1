"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase,pilot} from "@/lib/supabase";
import {Question,AnswerValue,Draft,Submission,answerRows,optionsFor,readDraft,writeDraft,writeEphemeralResult,clearDraft} from "@/lib/dna";

type Locale='en'|'fr'|'fa';

const COPY={
  en:{
    eyebrow:'Investing DNA assessment',title:'Understand how you invest.',lede:'A short, research-stage assessment of your risk tolerance, decision patterns, financial capacity and investing experience.',questions:'28 questions',guest:'No account required',save:'Save it if you want',principle:'There is no “best investor.”',principleBody:'There is only a better fit for who you are, what you can handle, and what you are trying to achieve.',start:'Start as guest',starting:'Starting…',accountTitle:'Want to keep your Investor DNA?',accountBody:'Create a free account to save your result, build your investor profile and return to personalized matches later.',accountCta:'Create free account',signin:'Already have an account? Sign in',consent:'Research candidate only — not a diagnostic or investment recommendation. Your guest progress can be restored while you are taking the assessment, but the completed guest report disappears if you refresh or leave unless you save it.',question:'Question',back:'Back',next:'Next',result:'See my DNA',calculating:'Calculating…',hint:'Pick the closest answer. You can go back and change it.',restore:'Restoring your progress…',retryTitle:'Unable to load your assessment',retryBody:'Your saved draft could not be restored.',retry:'Try again',fresh:'Start fresh',language:'Language',sections:{risk_tolerance:'Risk tolerance',behavioral_dna:'Behavioral DNA',risk_capacity:'Financial capacity',investment_experience:'Investment experience'}
  },
  fr:{
    eyebrow:'Évaluation Investing DNA',title:'Comprenez votre façon d’investir.',lede:'Une courte évaluation, encore au stade de la recherche, de votre tolérance au risque, de vos habitudes de décision, de votre capacité financière et de votre expérience en investissement.',questions:'28 questions',guest:'Aucun compte requis',save:'Sauvegardez si vous le souhaitez',principle:'Il n’existe pas de « meilleur investisseur ».',principleBody:'Il existe seulement une meilleure adéquation avec qui vous êtes, ce que vous pouvez tolérer et ce que vous cherchez à accomplir.',start:'Commencer sans compte',starting:'Démarrage…',accountTitle:'Vous voulez conserver votre Investor DNA ?',accountBody:'Créez un compte gratuit pour sauvegarder votre résultat, construire votre profil d’investisseur et retrouver plus tard vos correspondances personnalisées.',accountCta:'Créer un compte gratuit',signin:'Vous avez déjà un compte ? Se connecter',consent:'Version de recherche uniquement — ce n’est ni un diagnostic ni une recommandation de placement. Votre progression peut être restaurée pendant l’évaluation, mais le rapport invité disparaît si vous actualisez ou quittez la page à moins de le sauvegarder.',question:'Question',back:'Retour',next:'Suivant',result:'Voir mon DNA',calculating:'Calcul…',hint:'Choisissez la réponse la plus proche. Vous pourrez revenir en arrière pour la modifier.',restore:'Restauration de votre progression…',retryTitle:'Impossible de charger votre évaluation',retryBody:'Votre brouillon sauvegardé n’a pas pu être restauré.',retry:'Réessayer',fresh:'Recommencer',language:'Langue',sections:{risk_tolerance:'Tolérance au risque',behavioral_dna:'DNA comportemental',risk_capacity:'Capacité financière',investment_experience:'Expérience en investissement'}
  },
  fa:{
    eyebrow:'ارزیابی Investing DNA',title:'روش سرمایه‌گذاری خودت را بهتر بشناس.',lede:'یک ارزیابی کوتاه و در مرحله پژوهش از میزان تحمل ریسک، الگوهای تصمیم‌گیری، توان مالی و تجربه سرمایه‌گذاری تو.',questions:'۲۸ سؤال',guest:'بدون نیاز به حساب',save:'در صورت تمایل ذخیره کن',principle:'هیچ «بهترین سرمایه‌گذار»ی وجود ندارد.',principleBody:'فقط گزینه‌ای هست که بهتر با خودت، میزان ریسکی که می‌توانی تحمل کنی و چیزی که می‌خواهی به آن برسی هماهنگ باشد.',start:'شروع بدون حساب',starting:'در حال شروع…',accountTitle:'می‌خواهی Investor DNA تو باقی بماند؟',accountBody:'یک حساب رایگان بساز تا نتیجه‌ات ذخیره شود، پروفایل سرمایه‌گذاری‌ات شکل بگیرد و بعداً به Matchهای شخصی‌سازی‌شده برگردی.',accountCta:'ساخت حساب رایگان',signin:'حساب داری؟ وارد شو',consent:'این نسخه هنوز پژوهشی است و تشخیص یا توصیه سرمایه‌گذاری محسوب نمی‌شود. پاسخ‌ها حین انجام تست قابل بازیابی‌اند، اما گزارش مهمان با رفرش یا خروج از صفحه پاک می‌شود مگر اینکه آن را ذخیره کنی.',question:'سؤال',back:'قبلی',next:'بعدی',result:'مشاهده DNA من',calculating:'در حال محاسبه…',hint:'نزدیک‌ترین پاسخ را انتخاب کن؛ بعداً می‌توانی برگردی و تغییرش بدهی.',restore:'در حال بازیابی پاسخ‌ها…',retryTitle:'ارزیابی بارگذاری نشد',retryBody:'نسخه ذخیره‌شده در این مرورگر قابل بازیابی نبود.',retry:'تلاش دوباره',fresh:'شروع از ابتدا',language:'زبان',sections:{risk_tolerance:'تحمل ریسک',behavioral_dna:'DNA رفتاری',risk_capacity:'توان مالی',investment_experience:'تجربه سرمایه‌گذاری'}
  }
} as const;

export default function Assessment() {
  const router=useRouter();
  const [draft,setDraft]=useState<Draft|null>(null),[questions,setQuestions]=useState<Question[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[warning,setWarning]=useState("");
  const [locale,setLocale]=useState<Locale>('en');
  const lock=useRef(false);
  const t=COPY[locale];

  useEffect(()=>{try{const saved=localStorage.getItem('investing-dna:language');if(saved==='fr'||saved==='fa'||saved==='en')setLocale(saved);}catch{}},[]);

  useEffect(()=>{let active=true;
    (async()=>{
      if(!supabase) throw new Error("The assessment service is not configured yet.");
      const {data:{session}}=await supabase.auth.getSession();
      const saved=readDraft(session?.user.id || null);
      if(!active)return;
      if(saved?.result){router.replace('/dna/result');return;}
      if(saved){
        const sessionLanguage=(saved.session as Draft['session'] & {language_code?:Locale}).language_code;
        if(sessionLanguage)setLocale(sessionLanguage);
        setDraft(saved);
        const data=await pilot<{questions:Question[]}>('questionnaire',saved.session);
        if(active){setQuestions(data.questions);if(!data.questions?.length)throw new Error('No questions are available.');}
      }
    })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false;};
  },[router]);

  function changeLocale(value:Locale){setLocale(value);try{localStorage.setItem('investing-dna:language',value);}catch{}}

  function persist(next:Draft){
    setDraft(next);
    if(!writeDraft(next))setWarning("This browser cannot keep your progress after closing the page. Keep this page open until you finish.");
  }

  async function start(){
    if(lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {
      if(!supabase)throw new Error('The assessment service is not configured yet.');
      const {data:{session}}=await supabase.auth.getSession();
      const s=await pilot<Draft['session']>('start',{
        cohort_code:'DEV_V1_10',
        language_code:locale,
        consent_version:`prepilot-v1.10-${locale}`
      });
      const next:Draft={version:1,createdAt:Date.now(),ownerId:session?.user.id||null,session:s,answers:{},index:0};
      persist(next);
      const data=await pilot<{questions:Question[]}>('questionnaire',s);
      if(!data.questions?.length)throw new Error('No questions are available. Please try again later.');
      setQuestions(data.questions);
    }catch(e){setError(e instanceof Error?e.message:'Unable to start.');}
    finally{lock.current=false;setBusy(false);}
  }

  async function finish(){
    if(!draft || lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {
      if(!questions.every(q=>Array.isArray(draft.answers[q.question_id])?(draft.answers[q.question_id] as string[]).length>0:draft.answers[q.question_id]!==undefined))throw new Error('Please answer every question before submitting.');
      await pilot('save_answers',{...draft.session,answers:answerRows(draft.answers)});
      const result=await pilot<Submission>('submit',draft.session);
      if(!result.result)throw new Error('The result is not available yet.');
      const completed={...draft,result};
      setDraft(completed);
      writeEphemeralResult(completed);
      router.push('/dna/result');
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit.');}
    finally{lock.current=false;setBusy(false);}
  }

  const q=questions[draft?.index||0];
  const chosen=q&&draft?.answers[q.question_id];
  const options=q?optionsFor(q):[];
  const multiple=q?.question_type==='multi_choice';
  const answered=Array.isArray(chosen)?chosen.length>0:chosen!==undefined;
  function choose(value:string){
    if(!draft||!q)return;
    let next:AnswerValue=value;
    if(multiple){
      const previous=Array.isArray(chosen)?chosen:[];
      next=value==='none'?['none']:previous.includes(value)?previous.filter(v=>v!==value):[...previous.filter(v=>v!=='none'),value];
    }
    persist({...draft,answers:{...draft.answers,[q.question_id]:next}});
  }

  const current=(draft?.index||0)+1;
  const direction=locale==='fa'?'rtl':'ltr';
  const section=(q?.section&&t.sections[q.section as keyof typeof t.sections])||'Investor DNA';

  return <main className="assessment-page"><div className="container assessment-container">
    {loading?<div className="assessment-card assessment-loading"><h1>{t.restore}</h1></div>:!draft?<div className="assessment-card assessment-intro" dir={direction} lang={locale}>
      <div className="assessment-intro-top"><div className="eyebrow">{t.eyebrow}</div><label className="language-picker"><span>{t.language}</span><select value={locale} onChange={e=>changeLocale(e.target.value as Locale)} aria-label={t.language}><option value="en">English</option><option value="fr">Français</option><option value="fa">فارسی</option></select></label></div>
      <h1>{t.title}</h1>
      <p className="assessment-lede">{t.lede}</p>
      <div className="assessment-meta" aria-label="Assessment details"><span>{t.questions}</span><span>{t.guest}</span><span>{t.save}</span></div>
      <div className="assessment-principle"><span className="principle-mark">✦</span><div><p className="principle-title">{t.principle}</p><p>{t.principleBody}</p></div></div>
      <button className="btn primary assessment-start" disabled={busy} onClick={start}>{busy?t.starting:t.start}</button>
      <div className="assessment-account-card"><div><p className="account-card-title">{t.accountTitle}</p><p>{t.accountBody}</p></div><div className="account-card-actions"><Link className="btn account-create" href="/profile?mode=signup">{t.accountCta}</Link><Link className="account-signin" href="/profile">{t.signin}</Link></div></div>
      <p className="muted fine assessment-consent">{t.consent}</p>
      {error&&<p role="alert" className="notice">{error}</p>}
    </div>:q?<div className="assessment-card question-shell" dir={direction} lang={locale}>
      <div className="question-header"><div><div className="eyebrow">{section}</div><div className="question-count">{t.question} {current} / {questions.length}</div></div><div className="question-percent">{Math.round((current/questions.length)*100)}%</div></div>
      <progress aria-label="Assessment progress" max={questions.length} value={current}/>
      <h1 className="question-title">{q.prompt}</h1>
      {multiple&&<p>{locale==='fa'?'همهٔ موارد مرتبط را انتخاب کن.':locale==='fr'?'Sélectionnez toutes les réponses pertinentes.':'Select all that apply.'}</p>}
      <div className="question-options" role="group" aria-label="Answer choices">
        {options.map(o=><button aria-pressed={Array.isArray(chosen)?chosen.includes(o.value):chosen===o.value} className={'option '+((Array.isArray(chosen)?chosen.includes(o.value):chosen===o.value)?'active':'')} key={o.value} disabled={busy} onClick={()=>choose(o.value)}><span>{o.label}</span></button>)}
      </div>
      <div className="question-actions">
        <button className="btn" disabled={busy||draft.index===0} onClick={()=>persist({...draft,index:draft.index-1})}>{t.back}</button>
        {draft.index<questions.length-1?<button className="btn primary" disabled={busy||!answered} onClick={()=>persist({...draft,index:draft.index+1})}>{t.next}</button>:<button className="btn primary" disabled={busy||!answered} onClick={finish}>{busy?t.calculating:t.result}</button>}
      </div>
      <p className="muted fine question-hint">{t.hint}</p>
      {error&&<p role="alert" className="notice">{error}</p>}
      {warning&&<p role="status" className="notice">{warning}</p>}
    </div>:<div className="assessment-card"><h1>{t.retryTitle}</h1><p className="muted">{t.retryBody}</p><div className="question-actions"><button className="btn" onClick={()=>location.reload()}>{t.retry}</button><button className="btn" onClick={()=>{clearDraft();setDraft(null);setError('')}}>{t.fresh}</button></div>{error&&<p role="alert" className="notice">{error}</p>}</div>}
  </div></main>;
}
