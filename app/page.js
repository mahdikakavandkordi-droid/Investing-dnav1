 'use client';
import { useEffect, useMemo, useState } from "react";

const FN = "https://bxjjannguzzzqsamnhem.supabase.co/functions/v1/investing-dna-pilot";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SESSION_KEY = "investing_dna_session_v1";

async function api(action, body={}) {
  const r=await fetch(FN,{
    method:"POST",
    headers:{"Content-Type":"application/json",...(ANON?{"apikey":ANON,"Authorization":`Bearer ${ANON}`}:{})},
    body:JSON.stringify({action,...body})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||data.message||"Request failed");
  return data;
}

function normalizeOptions(raw){
  if(Array.isArray(raw)) return raw;
  if(raw && Array.isArray(raw.options)) return raw.options;
  if(raw && typeof raw==="object"){
    return Object.entries(raw).map(([key,value])=>{
      if(value && typeof value==="object")
        return {...value,key:value.key??key,value:value.value??key,label_en:value.label_en??value.label??value.text_en??value.text??String(key)};
      return {key,value:key,label_en:String(value)};
    });
  }
  return [];
}
function optionValue(o,i){ return o&&typeof o==="object" ? o.value??o.key??o.id??i : o; }
function optionLabel(o,i){ return o&&typeof o==="object" ? o.label??o.label_en??o.text_en??o.text??o.label_fa??String(optionValue(o,i)) : String(o); }
function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,Number(n)||0)); }

const faOptions={
 RT01:["بازده ۶٪ با تغییرات بسیار کم قیمت","بازده ۱۰٪ با مقداری نوسان قیمت","بازده ۱۶٪ با نوسان شدید قیمت","بازده ۲۵٪ با نوسان بسیار شدید قیمت"],RT02:["بیشتر یا تمام آن را می‌فروشم","بخشی از آن را می‌فروشم","آن را نگه می‌دارم","بیشتر خرید می‌کنم"],RT03:["۹۵٪ احتمال سود ۴٬۰۰۰ دلار؛ ۵٪ احتمال زیان ۵۰۰ دلار","۸۰٪ احتمال سود ۶٬۰۰۰ دلار؛ ۲۰٪ احتمال زیان ۲٬۰۰۰ دلار","۶۵٪ احتمال سود ۱۰٬۰۰۰ دلار؛ ۳۵٪ احتمال زیان ۵٬۰۰۰ دلار","۵۰٪ احتمال سود ۱۶٬۰۰۰ دلار؛ ۵۰٪ احتمال زیان ۸٬۰۰۰ دلار"],RT04:["اول از همه از پولم محافظت می‌کنم","برای بازده بهتر مقداری ریسک می‌پذیرم","با نوسان شدید قیمت راحت هستم","برای بازده بسیار بالاتر، زیان‌های بزرگ را می‌پذیرم"],RT05:["می‌فروشم و سراغ گزینه دیگری می‌روم","آن را بررسی می‌کنم و شاید بخشی را بفروشم","اگر دلیل اولیه‌ام هنوز معتبر باشد نگهش می‌دارم","اگر دلیل اولیه‌ام همچنان قوی باشد نگه می‌دارم و شاید بیشتر بخرم"],RT06:["خیلی ناراحت می‌شوم","تا حدی ناراحت می‌شوم","راحت هستم","کاملاً راحت هستم"],RT07:["سریع می‌فروشم","صبر می‌کنم و قبل از اقدام فکر می‌کنم","سرمایه‌گذاری‌هایم را نگه می‌دارم","دنبال فرصتی برای خرید می‌گردم"],RT08:["جلوگیری از زیان","ایجاد تعادل بین ریسک و بازده","دستیابی به بازده بیشتر","دستیابی به بیشترین سود ممکن"],RT09:["از آن اجتناب می‌کنم","فقط مبلغ کمی سرمایه‌گذاری می‌کنم","اگر همچنان به آن باور داشته باشم سرمایه‌گذاری می‌کنم","با جدیت سرمایه‌گذاری در آن را بررسی می‌کنم"],RT10:["معمولاً از ریسک‌های بزرگ اجتناب کرده‌ام","گاهی بیشتر از حدی که با آن راحت بودم ریسک کرده‌ام","ریسک قابل‌توجهی در سرمایه‌گذاری پذیرفته‌ام","برای بازده بالقوه بیشتر، ریسک بسیار بالایی پذیرفته‌ام"],RT07B:["خیلی محتمل است","تا حدی محتمل است","بعید است","خیلی بعید است"],
 BD01:["احتمال بالای از دست دادن پول","تغییرات شدید قیمت","عدم‌قطعیت زیاد","احتمال از دست دادن یک فرصت خوب"],BD02:["بله","لزوماً نه","نه — عوامل دیگری هم می‌توانند یک سرمایه‌گذاری را پرریسک‌تر یا کم‌ریسک‌تر کنند"],BD04:["اصلاً","کم","زیاد","خیلی زیاد"],BD05:["حدود ۵۰٪","حدود ۶۵٪","حدود ۸۰٪","حدود ۹۵٪"],BD07:["خیلی کمتر علاقه‌مند می‌شوم","تقریباً به همان اندازه","کمی بیشتر علاقه‌مند می‌شوم","خیلی بیشتر علاقه‌مند می‌شوم"],BD08:["قیمت ۱۰۰ دلاری که پرداخت کردم","قیمت فعلی ۶۰ دلار","ارزش واقعی سرمایه‌گذاری از نظر من در امروز"],BD09:["بیشتر دنبال اطلاعاتی می‌گردم که نظر من را تأیید کند","به نظر آنها گوش می‌دهم، اما بیشتر روی دیدگاه خودم تمرکز می‌کنم","دلایل آنها را با دیدگاه خودم مقایسه می‌کنم","صبر می‌کنم و اطلاعات بیشتری بررسی می‌کنم"],BD11:["می‌فروشم و سود را قطعی می‌کنم","بخشی را می‌فروشم و بخشی را نگه می‌دارم","اگر هنوز به آن باور داشته باشم نگهش می‌دارم","اگر چشم‌انداز را بهتر بدانم بیشتر می‌خرم"],BD12:["معمولاً از دیدگاه اولیه‌ام دفاع می‌کنم","محتاط‌تر می‌شوم","تصمیمم را دوباره بررسی می‌کنم","اگر اطلاعات جدید به‌اندازه کافی قوی باشد تصمیمم را تغییر می‌دهم"],BD15:["صبر می‌کنم تا شرایط کم‌ابهام‌تر شود","قیمت نسبت به ارزش سرمایه‌گذاری جذاب به نظر می‌رسد","بازده احتمالی بلندمدت جذاب به نظر می‌رسد","افت قیمت فرصتی برای خرید در زمانی ایجاد کرده که دیگران نگران‌اند"],
 RC01:["کمتر از ۴۰٬۰۰۰ دلار","۴۰٬۰۰۰ تا ۷۹٬۹۹۹ دلار","۸۰٬۰۰۰ تا ۱۴۹٬۹۹۹ دلار","۱۵۰٬۰۰۰ دلار یا بیشتر"],RC02:["خیلی نامطمئن یا بسیار متغیر","گاهی تغییر می‌کند","عمدتاً پایدار","خیلی پایدار"],RC03:["کمتر از ۲۵٬۰۰۰ دلار","۲۵٬۰۰۰ تا ۹۹٬۹۹۹ دلار","۱۰۰٬۰۰۰ تا ۴۹۹٬۹۹۹ دلار","۵۰۰٬۰۰۰ دلار یا بیشتر"],RC04:["زیاد — میزان سرمایه‌گذاری من را محدود می‌کند","متوسط","کم","خیلی کم یا بدون بدهی قابل‌توجه"],RC05:["کمتر از ۱ ماه","۱ تا ۳ ماه","۳ تا ۶ ماه","بیش از ۶ ماه"],RC06:["۴ نفر یا بیشتر","۲ تا ۳ نفر","۱ نفر","هیچ‌کس"],RC07:["ممکن است برای پرداخت نیازهای ضروری دچار مشکل شوم","باید تغییرات بزرگی در سبک زندگی‌ام ایجاد کنم","ناراحت‌کننده است اما قابل مدیریت است","تأثیر کمی بر سبک زندگی من دارد"],RC08:["بیش از ۵۰٪","۲۵٪ تا ۵۰٪","۱۰٪ تا ۲۵٪","کمتر از ۱۰٪"],RC09:["خیر","احتمالاً نه","احتمالاً بله","قطعاً بله"],RC10:["امن نیست","تا حدی نامطمئن","عمدتاً امن","کاملاً امن"]
};
const scaleFa={BD03:["اصلاً مطمئن نیستم",1,2,3,4,5,6,7,8,9,"کاملاً مطمئن هستم"],BD06:["اصلاً",1,2,3,4,5,6,7,8,9,"کاملاً"],BD10:["اصلاً",1,2,3,4,5,6,7,8,9,"خیلی زیاد"],BD13:["اصلاً توانمند نیستم",1,2,3,4,5,6,7,8,9,"کاملاً توانمندم"],BD14:["اصلاً دشوار نیست",1,2,3,4,5,6,7,8,9,"بسیار دشوار است"]};
function localizedOptions(q,lang){
 if(lang!=="fa") return normalizeOptions(q.options);
 const arr=faOptions[q.question_id]||scaleFa[q.question_id];
 if(arr) return arr.map((label,i)=>({value:q.question_type==="scale"?i:(q.options?.[i]?.value??String.fromCharCode(65+i)),label:String(label)}));
 return normalizeOptions(q.options);
}

const traitCopy={
  overconfidence:["Overconfidence","Strong conviction can sometimes make uncertainty feel smaller than it really is."],
  recency_bias:["Recency Bias","Recent market moves may have more influence on your judgment than the longer-term picture."],
  social_influence:["Social Influence","Other investors' opinions or outcomes may influence your decisions more than you intend."],
  anchoring:["Anchoring","An early price, opinion or reference point can sometimes stay influential after new evidence appears."],
  confirmation_bias:["Confirmation Bias","You may be more likely to notice evidence that supports an existing investment view."],
  regret_sensitivity:["Regret Sensitivity","The fear of making the wrong decision can sometimes affect how quickly you act."],
  disposition_effect:["Disposition Effect","You may be tempted to treat winning and losing positions differently when deciding what to do next."],
  emotional_reactivity:["Emotional Reactivity","Strong market moves can make it harder to stay aligned with a pre-planned strategy."],
  adaptability:["Adaptability","You are willing to revise your view when meaningful new evidence changes the investment case."],
  self_confidence:["Self-Confidence","You generally trust your ability to make investment decisions."],
  financial_self_efficacy:["Financial Self-Efficacy","You feel capable of understanding and managing important financial decisions."]
};

const traitLocalized={
 fr:{overconfidence:["Surconfiance","Une forte conviction peut parfois réduire la perception de l’incertitude."],recency_bias:["Biais de récence","Les mouvements récents du marché peuvent peser plus que les tendances de long terme."],social_influence:["Influence sociale","Les opinions ou résultats d’autres investisseurs peuvent influencer vos décisions."],anchoring:["Ancrage","Un prix ou point de référence initial peut rester influent malgré de nouvelles informations."],confirmation_bias:["Biais de confirmation","Vous pouvez accorder davantage d’attention aux éléments qui confirment votre opinion."],regret_sensitivity:["Sensibilité au regret","La crainte de faire le mauvais choix peut parfois influencer votre vitesse d’action."],disposition_effect:["Effet de disposition","Vous pouvez traiter différemment vos positions gagnantes et perdantes."],emotional_reactivity:["Réactivité émotionnelle","De forts mouvements de marché peuvent rendre plus difficile le respect d’une stratégie préparée."],adaptability:["Adaptabilité","Vous êtes prêt à revoir votre opinion lorsque de nouvelles données importantes apparaissent."],self_confidence:["Confiance en soi","Vous faites généralement confiance à votre capacité à prendre des décisions d’investissement."],financial_self_efficacy:["Efficacité financière","Vous vous sentez capable de comprendre et de gérer les décisions financières importantes."]},
 fa:{overconfidence:["اعتمادبه‌نفس بیش‌ازحد","اعتماد بالا به تحلیل خود گاهی می‌تواند میزان عدم‌قطعیت را کوچک‌تر از واقعیت نشان دهد."],recency_bias:["سوگیری تازگی","حرکت‌های اخیر بازار ممکن است بیش از تصویر بلندمدت روی قضاوت شما اثر بگذارند."],social_influence:["تأثیر اجتماعی","نظر یا نتیجه دیگر سرمایه‌گذاران ممکن است بیش از چیزی که قصد دارید بر تصمیم شما اثر بگذارد."],anchoring:["لنگر ذهنی","قیمت یا نظر اولیه ممکن است حتی پس از دریافت اطلاعات جدید همچنان اثرگذار بماند."],confirmation_bias:["سوگیری تأییدی","ممکن است بیشتر متوجه شواهدی شوید که دیدگاه قبلی شما را تأیید می‌کنند."],regret_sensitivity:["حساسیت به پشیمانی","ترس از تصمیم اشتباه گاهی می‌تواند بر سرعت تصمیم‌گیری شما اثر بگذارد."],disposition_effect:["اثر تمایل به فروش","ممکن است هنگام تصمیم‌گیری با موقعیت‌های سودده و زیان‌ده رفتار متفاوتی داشته باشید."],emotional_reactivity:["واکنش‌پذیری هیجانی","نوسانات شدید بازار ممکن است پایبندی به استراتژی از پیش تعیین‌شده را سخت‌تر کند."],adaptability:["انعطاف‌پذیری","وقتی شواهد مهم تغییر می‌کنند، آماده‌اید دیدگاه خود را اصلاح کنید."],self_confidence:["اعتمادبه‌نفس","معمولاً به توانایی خود در تصمیم‌گیری سرمایه‌گذاری اعتماد دارید."],financial_self_efficacy:["توانمندی مالی","خودتان را در درک و مدیریت تصمیم‌های مالی مهم توانمند می‌دانید."]}
};
function localizedTrait(key,lang){return traitLocalized[lang]?.[key]||traitCopy[key]||null;}
function prettyTrait(key){
  return traitCopy[key]?.[0] || String(key||"").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());
}
function traitDescription(key){
  return traitCopy[key]?.[1] || "This trait adds context to how you approach investment decisions.";
}

export default function Home(){
  const [screen,setScreen]=useState("landing"),[session,setSession]=useState(null);
  const [questions,setQuestions]=useState([]),[answers,setAnswers]=useState({});
  const [idx,setIdx]=useState(0),[result,setResult]=useState(null),[error,setError]=useState("");
  const [busy,setBusy]=useState(false),[saving,setSaving]=useState(false);
  const [context,setContext]=useState({});
  const [contextIdx,setContextIdx]=useState(0);
  const [language,setLanguage]=useState("en");

  useEffect(()=>{
    try{const l=localStorage.getItem("investing_dna_language_v1");if(l&&["en","fr","fa"].includes(l)) setLanguage(l);
      const s=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
      if(s?.session_token&&s?.assessment_id) setSession(s);
    }catch{}
  },[]);

  useEffect(()=>{try{localStorage.setItem("investing_dna_language_v1",language)}catch{};
    if(typeof document!=="undefined"){document.documentElement.lang=language;document.documentElement.dir=language==="fa"?"rtl":"ltr"}
  },[language]);

  function storeSession(d){
    if(!d?.session_token||!d?.assessment_id) throw new Error("Assessment session could not be created. Please try again.");
    setSession(d);
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(d))}catch{}
    return d;
  }
  function clearSession(){
    setSession(null);setQuestions([]);setAnswers({});setIdx(0);setContext({});setContextIdx(0);
    try{localStorage.removeItem(SESSION_KEY)}catch{}
  }
  async function start(){
    setBusy(true);setError("");
    try{
      clearSession();
      const d=await api("start",{cohort_code:"PILOT_V1_3",language_code:language,consent_version:`pilot-v1.3-${language}`}),s=storeSession(d);
      const q=await api("questionnaire",{assessment_id:s.assessment_id,session_token:s.session_token});
      const list=q.questions||q;
      if(!Array.isArray(list)||!list.length) throw new Error("Questionnaire could not be loaded. Please try again.");
      setQuestions(list);setScreen("quiz");
    }catch(e){clearSession();setError(e.message||"Unable to start assessment.")}
    finally{setBusy(false)}
  }
  async function save(qid,value){
    if(!session?.assessment_id||!session?.session_token){setError("Your assessment session expired. Please restart the assessment.");return;}
    setAnswers(a=>({...a,[qid]:value}));setError("");setSaving(true);
    try{
      await api("save_answers",{assessment_id:session.assessment_id,session_token:session.session_token,answers:[{question_id:qid,answer_value:{value}}]});
    }catch(e){setError(e.message||"Unable to save your answer.")}
    finally{setSaving(false)}
  }
  const contextQuestions=[
    {id:"CTX_GOAL",key:"goal",titleKey:"contextGoal",opts:[
      {v:"growth",en:"Grow my wealth",fr:"Faire croître mon patrimoine",fa:"افزایش سرمایه و ثروت"},
      {v:"retirement",en:"Retirement",fr:"Retraite",fa:"بازنشستگی"},
      {v:"house_purchase",en:"Buying a home",fr:"Achat d’un logement",fa:"خرید خانه"},
      {v:"education",en:"Education",fr:"Études / éducation",fa:"تحصیل"},
      {v:"income",en:"Generate income",fr:"Générer un revenu",fa:"ایجاد درآمد"},
      {v:"wealth_preservation",en:"Preserve my capital",fr:"Préserver mon capital",fa:"حفظ سرمایه"},
      {v:"other",en:"Something else",fr:"Autre objectif",fa:"هدف دیگر"}]},
    {id:"CTX_HORIZON",key:"time_horizon",titleKey:"contextHorizon",opts:[
      {v:"under_2",en:"Less than 2 years",fr:"Moins de 2 ans",fa:"کمتر از ۲ سال"},
      {v:"2_5",en:"2–5 years",fr:"2 à 5 ans",fa:"۲ تا ۵ سال"},
      {v:"5_10",en:"5–10 years",fr:"5 à 10 ans",fa:"۵ تا ۱۰ سال"},
      {v:"10_plus",en:"More than 10 years",fr:"Plus de 10 ans",fa:"بیش از ۱۰ سال"}]},
    {id:"CTX_LIQUIDITY",key:"liquidity_need",titleKey:"contextLiquidity",opts:[
      {v:"high",en:"Very important — I may need it soon",fr:"Très important — je pourrais en avoir besoin bientôt",fa:"خیلی مهم است؛ ممکن است به‌زودی به آن نیاز داشته باشم"},
      {v:"medium",en:"Somewhat important",fr:"Assez important",fa:"تا حدی مهم است"},
      {v:"low",en:"Not very important — I can leave it invested",fr:"Peu important — je peux laisser l’argent investi",fa:"خیلی مهم نیست؛ می‌توانم پول را سرمایه‌گذاری‌شده نگه دارم"}]},
    {id:"CTX_RETURN",key:"required_return",titleKey:"contextReturn",opts:[
      {v:"preserve",en:"Protect capital first",fr:"Priorité à la protection du capital",fa:"اولویت با حفظ سرمایه است"},
      {v:"moderate",en:"Steady growth",fr:"Croissance régulière",fa:"رشد باثبات"},
      {v:"growth",en:"Strong long-term growth",fr:"Forte croissance à long terme",fa:"رشد قابل‌توجه در بلندمدت"},
      {v:"aggressive",en:"Maximum growth potential",fr:"Potentiel de croissance maximal",fa:"بیشترین پتانسیل رشد"}]},
    {id:"CTX_LOSS",key:"loss_consequence",titleKey:"contextLoss",opts:[
      {v:"severe",en:"I would struggle to cover essential needs",fr:"J’aurais du mal à couvrir mes besoins essentiels",fa:"برای تأمین نیازهای ضروری دچار مشکل می‌شوم"},
      {v:"meaningful",en:"It would require major lifestyle changes",fr:"Cela exigerait des changements importants dans mon mode de vie",fa:"نیاز به تغییرات جدی در سبک زندگی‌ام دارد"},
      {v:"manageable",en:"It would hurt, but I could manage it",fr:"Ce serait difficile, mais gérable",fa:"سخت خواهد بود، اما قابل مدیریت است"},
      {v:"low_impact",en:"It would have little impact on my life",fr:"Cela aurait peu d’impact sur ma vie",fa:"تأثیر کمی بر زندگی‌ام دارد"}]},
    {id:"CTX_EXPERIENCE",key:"experience",titleKey:"contextExperience",opts:[
      {v:"beginner",en:"I'm new to investing",fr:"Je débute en investissement",fa:"تازه‌کارم"},
      {v:"some",en:"I have some experience",fr:"J’ai une certaine expérience",fa:"کمی تجربه دارم"},
      {v:"experienced",en:"I invest regularly and understand the basics",fr:"J’investis régulièrement et je maîtrise les bases",fa:"به‌طور منظم سرمایه‌گذاری می‌کنم و مفاهیم پایه را می‌دانم"},
      {v:"advanced",en:"I’m experienced and comfortable with complex investments",fr:"Je suis expérimenté et à l’aise avec les placements complexes",fa:"تجربه زیادی دارم و با سرمایه‌گذاری‌های پیچیده راحت هستم"}]}
  ];

  async function saveContextAndFinish(){
    if(!session?.assessment_id||!session?.session_token){setError("Your assessment session expired. Please restart the assessment.");return;}
    const missing=contextQuestions.filter(q=>!context[q.key]);
    if(missing.length){setError(language==="fa"?"لطفاً این سؤال را پاسخ دهید.":language==="fr"?"Veuillez répondre à cette question.":"Please answer this question.");return;}
    setBusy(true);setError("");
    try{
      const rows=contextQuestions.map(q=>({question_id:q.id,answer_value:{value:context[q.key]}}));
      await api("save_answers",{assessment_id:session.assessment_id,session_token:session.session_token,answers:rows});
      const d=await api("submit",{assessment_id:session.assessment_id,session_token:session.session_token});
      setResult(d);setScreen("result");
    }catch(e){setError(e.message||"Unable to generate your result.")}
    finally{setBusy(false)}
  }

  async function submit(){
    if(!session?.assessment_id||!session?.session_token){setError("Your assessment session expired. Please restart the assessment.");return;}
    setBusy(true);setError("");
    try{
      const d=await api("submit",{assessment_id:session.assessment_id,session_token:session.session_token});
      setResult(d);setScreen("result");
    }catch(e){setError(e.message||"Unable to generate your result.")}
    finally{setBusy(false)}
  }

  const Brand=({compact=false})=><img className={compact?"brand-logo compact":"brand-logo"} width={compact?72:160} height={compact?40:80} src="/logo.png" alt="Investing DNA"/>;

  const ui={
    en:{eyebrow:"INVESTING DNA · V1.3",title:"Know your investor.",title2:"Before you invest.",lead:"A deeper look at how you respond to risk, uncertainty, opportunity and pressure.",cta:"Discover My Investor DNA",questions:"36 questions",time:"~7 minutes",report:"Personal report",disclaimer:"Educational assessment only. Not investment, financial or psychological advice.",before:"BEFORE WE BEGIN",consentTitle:"Your answers shape your DNA.",consentBody:"There are 36 questions. Answer honestly rather than choosing what you think a “good investor” should choose.",privacy:"Privacy first.",privacyBody:"Your assessment is used to generate your Investor DNA report.",start:"I understand — Start Assessment →",back:"Back",next:"Next →",reveal:"Reveal My DNA →",selected:"Selected",analyzing:"Analyzing…",starting:"Starting…",tolerance:"RISK TOLERANCE",capacity:"RISK CAPACITY",behavior:"BEHAVIORAL DNA",notAtAll:"Not at all",extremely:"Extremely",yourDNA:"YOUR INVESTOR DNA · V1.3",riskProfile:"YOUR RISK PROFILE",mapTitle:"Where you sit on the risk map",riskTolerance:"Risk Tolerance",riskCapacity:"Risk Capacity",zone:"Your zone",how:"HOW YOU INVEST",fingerprint:"Your decision fingerprint",decision:"DECISION STYLE",pressure:"UNDER PRESSURE",decisionDesc:"How you tend to approach investment decisions.",pressureDesc:"How your decision-making can change when markets get stressful.",strengths:"YOUR STRENGTHS",watch:"WHAT TO WATCH",strength:"Strength",watchLabel:"Watch",emptyStrength:"Your profile shows a balanced set of strengths.",emptyWatch:"No major behavioral watchouts were flagged.",character:"YOUR INVESTOR CHARACTER",mapNote:"Your tolerance reflects how comfortable you are with risk. Your capacity reflects how much risk your financial situation can absorb.",print:"Save / Print Report ↗",profile:"Your Investor Profile",contextEyebrow:"INVESTMENT CONTEXT",contextTitle:"Now tell us about this investment.",contextLead:"Your DNA describes how you behave. These questions describe your current situation. They will not change your DNA score.",contextNext:"Continue →",contextFinish:"Build My Profile →",contextStep:"6 questions",contextGoal:"What is the main goal for this money?",contextHorizon:"When do you expect to need this money?",contextLiquidity:"How important is it that you can access this money quickly?",contextReturn:"Which return objective best matches your goal?",contextLoss:"If this investment lost 30%, what would the impact be on your life?",contextExperience:"How would you describe your investing experience?"},
    fr:{eyebrow:"INVESTING DNA · V1.3",title:"Découvrez votre profil d’investisseur.",title2:"Avant d’investir.",lead:"Une analyse plus approfondie de votre réaction au risque, à l’incertitude, aux occasions et à la pression.",cta:"Découvrir mon Investor DNA",questions:"36 questions",time:"~7 minutes",report:"Rapport personnel",disclaimer:"Évaluation éducative uniquement. Ne constitue pas un conseil en placement, financier ou psychologique.",before:"AVANT DE COMMENCER",consentTitle:"Vos réponses façonnent votre DNA.",consentBody:"Il y a 36 questions. Répondez honnêtement plutôt que de choisir ce qu’un « bon investisseur » devrait répondre.",privacy:"Confidentialité d’abord.",privacyBody:"Votre évaluation sert à générer votre rapport Investor DNA.",start:"J’ai compris — Commencer →",back:"Retour",next:"Suivant →",reveal:"Révéler mon DNA →",selected:"Sélectionné",analyzing:"Analyse…",starting:"Démarrage…",tolerance:"TOLÉRANCE AU RISQUE",capacity:"CAPACITÉ DE RISQUE",behavior:"DNA COMPORTEMENTAL",notAtAll:"Pas du tout",extremely:"Tout à fait",yourDNA:"VOTRE INVESTOR DNA · V1.3",riskProfile:"VOTRE PROFIL DE RISQUE",mapTitle:"Votre position sur la carte du risque",riskTolerance:"Tolérance au risque",riskCapacity:"Capacité de risque",zone:"Votre zone",how:"VOTRE STYLE D’INVESTISSEMENT",fingerprint:"Votre empreinte décisionnelle",decision:"STYLE DE DÉCISION",pressure:"SOUS PRESSION",decisionDesc:"Votre manière habituelle d’aborder les décisions d’investissement.",pressureDesc:"La façon dont vos décisions peuvent changer sous stress de marché.",strengths:"VOS FORCES",watch:"POINTS À SURVEILLER",strength:"Force",watchLabel:"À surveiller",emptyStrength:"Votre profil montre un ensemble équilibré de forces.",emptyWatch:"Aucun point comportemental majeur à surveiller n’a été signalé.",character:"VOTRE PERSONNAGE D’INVESTISSEUR",mapNote:"Votre tolérance reflète votre confort face au risque. Votre capacité reflète la quantité de risque que votre situation financière peut absorber.",print:"Enregistrer / Imprimer le rapport ↗",profile:"Votre profil d’investisseur",contextEyebrow:"CONTEXTE D’INVESTISSEMENT",contextTitle:"Parlons maintenant de ce placement.",contextLead:"Votre DNA décrit votre façon d’investir. Ces questions décrivent votre situation actuelle. Elles ne modifient pas votre score DNA.",contextNext:"Continuer →",contextFinish:"Créer mon profil →",contextStep:"6 questions",contextGoal:"Quel est l’objectif principal de cet argent ?",contextHorizon:"Quand prévoyez-vous avoir besoin de cet argent ?",contextLiquidity:"À quel point est-il important de pouvoir accéder rapidement à cet argent ?",contextReturn:"Quel objectif de rendement correspond le mieux à votre projet ?",contextLoss:"Si ce placement perdait 30 %, quel serait l’impact sur votre vie ?",contextExperience:"Comment décririez-vous votre expérience en investissement ?"},
    fa:{eyebrow:"INVESTING DNA · V1.3",title:"سرمایه‌گذار درونت را بشناس.",title2:"قبل از اینکه سرمایه‌گذاری کنی.",lead:"نگاهی عمیق‌تر به واکنش شما نسبت به ریسک، عدم‌قطعیت، فرصت و فشار.",cta:"DNA سرمایه‌گذاری من را ببین",questions:"۳۶ سؤال",time:"حدود ۷ دقیقه",report:"گزارش شخصی",disclaimer:"این ارزیابی صرفاً آموزشی است و توصیه سرمایه‌گذاری، مالی یا روان‌شناختی نیست.",before:"قبل از شروع",consentTitle:"پاسخ‌های شما DNA شما را شکل می‌دهند.",consentBody:"۳۶ سؤال وجود دارد. صادقانه پاسخ دهید و چیزی را انتخاب نکنید که فکر می‌کنید یک «سرمایه‌گذار خوب» باید انتخاب کند.",privacy:"حریم خصوصی اولویت ماست.",privacyBody:"از ارزیابی شما برای ساخت گزارش DNA سرمایه‌گذاری استفاده می‌شود.",start:"متوجه شدم — شروع ارزیابی ←",back:"بازگشت",next:"بعدی ←",reveal:"DNA من را نشان بده ←",selected:"انتخاب شده",analyzing:"در حال تحلیل…",starting:"در حال شروع…",tolerance:"تحمل ریسک",capacity:"ظرفیت ریسک",behavior:"DNA رفتاری",notAtAll:"اصلاً",extremely:"کاملاً",yourDNA:"DNA سرمایه‌گذاری شما · V1.3",riskProfile:"پروفایل ریسک شما",mapTitle:"جایگاه شما روی نقشه ریسک",riskTolerance:"تحمل ریسک",riskCapacity:"ظرفیت ریسک",zone:"ناحیه شما",how:"سبک سرمایه‌گذاری شما",fingerprint:"اثر انگشت تصمیم‌گیری شما",decision:"سبک تصمیم‌گیری",pressure:"تحت فشار",decisionDesc:"نحوه معمول شما در تصمیم‌های سرمایه‌گذاری.",pressureDesc:"نحوه‌ای که تصمیم‌گیری شما ممکن است در شرایط پراسترس بازار تغییر کند.",strengths:"نقاط قوت شما",watch:"مواردی که باید مراقبشان باشید",strength:"نقطه قوت",watchLabel:"مورد قابل توجه",emptyStrength:"پروفایل شما مجموعه‌ای متعادل از نقاط قوت را نشان می‌دهد.",emptyWatch:"مورد رفتاری مهمی برای مراقبت شناسایی نشد.",character:"شخصیت سرمایه‌گذاری شما",mapNote:"تحمل ریسک نشان می‌دهد چقدر با ریسک راحت هستید. ظرفیت ریسک نشان می‌دهد وضعیت مالی شما چه میزان ریسک را می‌تواند تحمل کند.",print:"ذخیره / چاپ گزارش ←",profile:"پروفایل سرمایه‌گذار شما"}
  }[language]||null;

  if(screen==="landing") return <main className={`shell ${language==="fa"?"rtl":""}`}><section className="hero">
    <Brand/><div className="language-picker" role="group" aria-label="Language"><button className={language==="en"?"active":""} onClick={()=>setLanguage("en")}>English</button><button className={language==="fr"?"active":""} onClick={()=>setLanguage("fr")}>Français</button><button className={language==="fa"?"active":""} onClick={()=>setLanguage("fa")}>فارسی</button></div>
    <div className="eyebrow">{ui.eyebrow}</div>
    <h1>{ui.title}<br/><span>{ui.title2}</span></h1>
    <p className="lead">{ui.lead}</p>
    <button onClick={()=>setScreen("consent")} className="primary">{ui.cta} <b>{language==="fa"?"←":"→"}</b></button>
    <div className="mini"><span>{ui.questions}</span><span>{ui.time}</span><span>{ui.report}</span></div>
    <p className="disclaimer">{ui.disclaimer}</p>
  </section></main>;

  if(screen==="consent") return <main className={`shell ${language==="fa"?"rtl":""}`}><section className="card narrow">
    <Brand compact/><div className="language-picker compact-picker"><button className={language==="en"?"active":""} onClick={()=>setLanguage("en")}>English</button><button className={language==="fr"?"active":""} onClick={()=>setLanguage("fr")}>Français</button><button className={language==="fa"?"active":""} onClick={()=>setLanguage("fa")}>فارسی</button></div>
    <div className="eyebrow">{ui.before}</div><h2>{ui.consentTitle}</h2>
    <p>{ui.consentBody}</p>
    <div className="notice"><strong>{ui.privacy}</strong><br/>{ui.privacyBody}</div>
    {error&&<div className="error">{error}</div>}
    <button className="primary" disabled={busy} onClick={start}>{busy?ui.starting:ui.start}</button>
    <button className="ghost" onClick={()=>{setError("");setScreen("landing")}}>{ui.back}</button>
  </section></main>;

  if(screen==="quiz"){
    const q=questions[idx],pct=Math.round(((idx+1)/questions.length)*100),value=q&&answers[q.question_id];
    if(!q) return <main className="shell"><div className="card">Loading questionnaire…</div></main>;
    const opts=localizedOptions(q,language);
    const isScale=q.question_type==="scale";
    return <main className={`shell ${language==="fa"?"rtl":""}`}><section className="quiz">
      <header><div><Brand compact/><div className="eyebrow">INVESTOR DNA</div></div><div className="count">{idx+1} / {questions.length}</div></header>
      <div className="progress"><i style={{width:`${pct}%`}}/></div>
      <div className="qtype">{q.section==="risk_tolerance"?ui.tolerance:q.section==="risk_capacity"?ui.capacity:ui.behavior}</div>
      <h2>{q.prompt||q.prompt_en||"Question"}</h2>
      {isScale ? <div className="scale-wrap">
        <div className="scale-value">{value==null?"—":value}</div>
        <input className="scale-input" type="range" min="0" max="10" step="1" value={value==null?5:value} onChange={e=>save(q.question_id,Number(e.target.value))}/>
        <div className="scale-labels"><span>0</span><span>5</span><span>10</span></div>
        <p className="scale-hint">0 = {ui.notAtAll} &nbsp; • &nbsp; 10 = {ui.extremely}</p>
      </div> : <div className="options">
        {opts.map((o,i)=>{const ov=optionValue(o,i),label=optionLabel(o,i);const selected=String(value)===String(ov);
return <button key={i} aria-pressed={selected} className={selected?"option selected":"option"} onClick={()=>save(q.question_id,ov)}>
  <span className="radio">{selected&&<span className="radio-dot" />}</span>
  <span className="option-label">{label}</span>
  {selected&&<span className="selected-badge">{ui.selected}</span>}
</button>})}
      </div>}
      {error&&<div className="error">{error}</div>}
      <footer><button className="ghost" disabled={idx===0} onClick={()=>setIdx(idx-1)}>{language==="fa"?"→ ":"← "}{ui.back}</button>
      {idx<questions.length-1?<button className="primary small" disabled={value==null||saving} onClick={()=>setIdx(idx+1)}>{ui.next}</button>:
      <button className="primary small" disabled={value==null||busy||saving} onClick={()=>{setContextIdx(0);setError("");setScreen("context")}}>{ui.reveal}</button>}</footer>
    </section></main>
  }

  if(screen==="context"){
    const cq=contextQuestions[contextIdx];
    const cv=context[cq.key];
    return <main className={`shell ${language==="fa"?"rtl":""}`}><section className="context-card">
      <Brand compact/>
      <div className="eyebrow">{ui.contextEyebrow}</div>
      <h1>{ui.contextTitle}</h1>
      <p className="context-lead">{ui.contextLead}</p>
      <div className="context-progress"><i style={{width:`${((contextIdx+1)/contextQuestions.length)*100}%`}}/></div>
      <div className="context-count">{contextIdx+1} / {contextQuestions.length}</div>
      <h2>{ui[cq.titleKey]}</h2>
      <div className="options context-options">
        {cq.opts.map(o=>{
          const label=language==="fa"?o.fa:language==="fr"?o.fr:o.en;
          const selected=cv===o.v;
          return <button key={o.v} className={selected?"option selected":"option"} aria-pressed={selected} onClick={()=>{setContext(c=>({...c,[cq.key]:o.v}));setError("");}}>
            <span className="radio">{selected&&<span className="radio-dot"/>}</span><span className="option-label">{label}</span>{selected&&<span className="selected-badge">{ui.selected}</span>}
          </button>
        })}
      </div>
      {error&&<div className="error">{error}</div>}
      <footer>
        <button className="ghost" disabled={contextIdx===0||busy} onClick={()=>setContextIdx(i=>i-1)}>{language==="fa"?"→ ":"← "}{ui.back}</button>
        {contextIdx<contextQuestions.length-1
          ?<button className="primary small" disabled={!cv||busy} onClick={()=>setContextIdx(i=>i+1)}>{ui.contextNext}</button>
          :<button className="primary small" disabled={!cv||busy} onClick={saveContextAndFinish}>{busy?ui.analyzing:ui.contextFinish}</button>}
      </footer>
    </section></main>;
  }

  const r=result?.result||result||{},f=result?.fingerprint||{},n=result?.narrative||{};
  const tolerance=clamp(r.risk_tolerance),capacity=clamp(r.risk_capacity);
  const archetype=r.archetype||"";
  const archetypeNames={VAULT:"The Capital Protector",ANCHOR:"The Steady Builder",COOLHAND:"The Calm Conservative",SCOUT:"The Cautious Explorer",MAVERICK:"The Balanced Risk Taker",STRIKER:"The Calculated Aggressor",HOTSHOT:"The High-Risk Aspirant",HIGHROLLER:"The High-Conviction Investor",JACKPOT:"The Adaptive Risk Taker"};
  const archetypeTag={VAULT:"Protect first. Participate second.",ANCHOR:"Careful, but not frozen.",COOLHAND:"You can take risk, but you do not need to.",SCOUT:"Curious about risk, careful with consequences.",MAVERICK:"Comfortable taking calculated risk.",STRIKER:"Ready to act when the odds justify it.",HOTSHOT:"Willing to swing hard, but capacity may say no.",HIGHROLLER:"High appetite with meaningful financial room.",JACKPOT:"High appetite. High capacity. Discipline matters."};
  const archetypeLocalized=language==="fa"?{VAULT:"محافظ سرمایه",ANCHOR:"سازنده باثبات",COOLHAND:"محافظ آرام",SCOUT:"کاوشگر محتاط",MAVERICK:"ریسک‌پذیر متعادل",STRIKER:"مهاجم حساب‌شده",HOTSHOT:"ریسک‌پذیر بلندپرواز",HIGHROLLER:"سرمایه‌گذار با اطمینان بالا",JACKPOT:"ریسک‌پذیر انعطاف‌پذیر"}:language==="fr"?{VAULT:"Protecteur du capital",ANCHOR:"Bâtisseur stable",COOLHAND:"Conservateur serein",SCOUT:"Explorateur prudent",MAVERICK:"Preneur de risque équilibré",STRIKER:"Agresseur calculé",HOTSHOT:"Aspirant à haut risque",HIGHROLLER:"Investisseur à forte conviction",JACKPOT:"Preneur de risque adaptable"}:{};
  const archetypeDisplay=archetypeLocalized[archetype]||archetypeNames[archetype]||ui.profile;
  const archetypeTagLocalized=language==="fa"?{VAULT:"اول از سرمایه محافظت می‌کنی؛ بعد مشارکت می‌کنی.",ANCHOR:"محتاطی، اما متوقف نمی‌شوی.",COOLHAND:"توان پذیرش ریسک را داری، اما نیازی به آن نداری.",SCOUT:"به ریسک کنجکاوی، اما پیامدها را جدی می‌گیری.",MAVERICK:"با ریسک حساب‌شده راحتی.",STRIKER:"وقتی احتمال موفقیت توجیه کند، آماده اقدامی.",HOTSHOT:"حاضر به نوسان شدید هستی، اما ظرفیت مالی ممکن است محدودت کند.",HIGHROLLER:"اشتها و ظرفیت مالی بالایی برای ریسک داری.",JACKPOT:"اشتها و ظرفیت ریسک بالا داری؛ انضباط اهمیت بیشتری پیدا می‌کند."}:{};
  const decisionLabels={"Conviction-Driven":{fr:"Guidé par la conviction",fa:"تصمیم‌گیری مبتنی بر اطمینان"},Adaptive:{fr:"Adaptatif",fa:"انعطاف‌پذیر"},"Socially Influenced":{fr:"Influencé socialement",fa:"متأثر از دیگران"},"Recency-Sensitive":{fr:"Sensible aux tendances récentes",fa:"حساس به روندهای اخیر"},Balanced:{fr:"Équilibré",fa:"متعادل"}};
  const pressureLabels={"Emotionally Reactive":{fr:"Réactif émotionnellement",fa:"واکنش‌پذیر هیجانی"},Composed:{fr:"Maîtrisé",fa:"آرام و مسلط"},"Adaptive Under Pressure":{fr:"Adaptatif sous pression",fa:"انعطاف‌پذیر تحت فشار"},Balanced:{fr:"Équilibré",fa:"متعادل"}};
  const localStyle=(value,map)=>language==="en"?value:(map[value]?.[language]||value||"—");
  const watchouts=(f.watchouts||[]).slice(0,3);
  const strengths=(f.strengths||[]).slice(0,3);

  return <main className={`shell ${language==="fa"?"rtl":""}`}><section className="result">
    <Brand compact/>
    <div className="result-top"><div><div className="eyebrow">{ui.yourDNA}</div><h1>{archetype}</h1><p className="archetype-name">{archetypeDisplay}</p><p className="tagline">{archetypeTagLocalized[archetype]||archetypeTag[archetype]||"Your investment style, decoded."}</p></div></div>

    <section className="risk-section">
      <div className="section-heading"><div><small>{ui.riskProfile}</small><h2>{ui.mapTitle}</h2></div></div>
      <div className="risk-map-wrap">
        <div className="y-axis-label">{ui.capacity}</div>
        <div className="risk-map">
          <div className={`zone z-high-low ${archetype==="COOLHAND"?"selected":""}`}><span>{language==="fa"?"کم":language==="fr"?"FAIBLE":"LOW"}</span><b>COOLHAND</b></div>
          <div className={`zone z-high-med ${archetype==="STRIKER"?"selected":""}`}><span>{language==="fa"?"متوسط":language==="fr"?"MOYEN":"MEDIUM"}</span><b>STRIKER</b></div>
          <div className={`zone z-high-high ${archetype==="JACKPOT"?"selected":""}`}><span>{language==="fa"?"زیاد":language==="fr"?"ÉLEVÉ":"HIGH"}</span><b>JACKPOT</b></div>
          <div className={`zone z-med-low ${archetype==="ANCHOR"?"selected":""}`}><span>{language==="fa"?"کم":language==="fr"?"FAIBLE":"LOW"}</span><b>ANCHOR</b></div>
          <div className={`zone z-med-med ${archetype==="MAVERICK"?"selected":""}`}><span>{language==="fa"?"متوسط":language==="fr"?"MOYEN":"MEDIUM"}</span><b>MAVERICK</b></div>
          <div className={`zone z-med-high ${archetype==="HIGHROLLER"?"selected":""}`}><span>{language==="fa"?"زیاد":language==="fr"?"ÉLEVÉ":"HIGH"}</span><b>HIGHROLLER</b></div>
          <div className={`zone z-low-low ${archetype==="VAULT"?"selected":""}`}><span>{language==="fa"?"کم":language==="fr"?"FAIBLE":"LOW"}</span><b>VAULT</b></div>
          <div className={`zone z-low-med ${archetype==="SCOUT"?"selected":""}`}><span>{language==="fa"?"متوسط":language==="fr"?"MOYEN":"MEDIUM"}</span><b>SCOUT</b></div>
          <div className={`zone z-low-high ${archetype==="HOTSHOT"?"selected":""}`}><span>{language==="fa"?"زیاد":language==="fr"?"ÉLEVÉ":"HIGH"}</span><b>HOTSHOT</b></div>
          <div className="crosshair x1"/><div className="crosshair x2"/><div className="crosshair y1"/><div className="crosshair y2"/>
        </div>
        <div className="x-axis-label">{ui.tolerance}</div>
      </div>
      <div className="risk-values"><div><b>{Math.round(tolerance)}</b><span>{ui.riskTolerance}</span></div><div><b>{Math.round(capacity)}</b><span>{ui.riskCapacity}</span></div><div className="zone-read"><b>{archetype}</b><span>{ui.zone}</span></div></div>
      <p className="map-note">{ui.mapNote}</p>
    </section>

    <section className="behavior-section">
      <div className="section-heading"><div><small>{ui.how}</small><h2>{ui.fingerprint}</h2></div></div>
      <div className="grid"><article><small>{ui.decision}</small><h3>{localStyle(f.decision_style,decisionLabels)}</h3><p>{ui.decisionDesc}</p></article><article><small>{ui.pressure}</small><h3>{localStyle(f.pressure_style,pressureLabels)}</h3><p>{ui.pressureDesc}</p></article></div>
    </section>

    <section className="insights-section">
      <div className="insight-columns">
        <article className="insight-card"><small>{ui.strengths}</small>{strengths.length?strengths.map((k,i)=><div className="trait" key={k}><div className="trait-title"><b>{localizedTrait(k,language)?.[0]||prettyTrait(k)}</b><span>{ui.strength}</span></div><p>{localizedTrait(k,language)?.[1]||traitDescription(k)}</p></div>):<p className="empty">{ui.emptyStrength}</p>}</article>
        <article className="insight-card watch-card"><small>{ui.watch}</small>{watchouts.length?watchouts.map(k=><div className="trait" key={k}><div className="trait-title"><b>{localizedTrait(k,language)?.[0]||prettyTrait(k)}</b><span>{ui.watchLabel}</span></div><p>{localizedTrait(k,language)?.[1]||traitDescription(k)}</p></div>):<p className="empty">{ui.emptyWatch}</p>}</article>
      </div>
    </section>

    <section className="character-card"><small>{ui.character}</small><h2>{archetypeDisplay||"The Investor"}</h2><p>{language==="fa"?`پروفایل شما ترکیبی منحصربه‌فرد از تحمل ریسک، ظرفیت مالی و الگوهای رفتاری را نشان می‌دهد.`:language==="fr"?`Votre profil reflète une combinaison unique de tolérance au risque, de capacité financière et de tendances comportementales.`:(n.summary||"Your profile reflects a distinct combination of risk tolerance, financial capacity and behavioral tendencies.")}</p></section>

    <p className="disclaimer">Investing DNA is an educational assessment, not investment, financial or psychological advice. Your result is a snapshot of your responses at the time of assessment.</p>
    <button className="primary" onClick={()=>window.print()}>{ui.print}</button>
  </section></main>
}
