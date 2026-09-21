/**
 * Localized UI copy for the Investing DNA assessment shell.
 *
 * This is presentation copy only. Questionnaire prompts/options come from the
 * versioned server questionnaire and must not be moved or edited here.
 */
export type AssessmentLocale='en'|'fr'|'fa';
export type AssessmentCohort='DEV_V1_10_CLARITY'|'COGNITIVE_V1_10';

export const ASSESSMENT_COPY={
 en:{
  of:'of',progress:'Answered questions',multiple:'Select all that apply.',continue:'Continue',
  complete:'Assessment complete',personalTitle:'Almost there.',firstName:'First name (optional)',age:'Age (optional)',
  personalBody:'You can add your first name, your age, both, or neither. These details personalize your report and do not change your assessment score.',
  personalNote:'Leave both fields blank to go straight to your result. Saving your report to an account is optional afterward.',
  ageError:'Enter a whole-number age from 18 to 100, or leave it blank.',personalResult:'See my Investor DNA',
  eyebrow:'Investing DNA assessment',
  title:'Understand how you invest.',
  lede:'A short, research-stage assessment of your risk tolerance, decision patterns, financial capacity and investing experience.',
  questions:'28 questions',guest:'No account required',save:'Save it if you want',
  measureTitle:'What we measure',measureNote:'Four inputs build one Investor DNA profile.',methodology:'How the methodology works',
  principle:'There is no “best investor.”',
  principleBody:'There is only a better fit for who you are, what you can handle, and what you are trying to achieve.',
  start:'Start as guest',starting:'Starting…',
  accountTitle:'Want to keep your Investor DNA?',
  accountBody:'Create a free account to save your result, build your investor profile and return to personalized matches later.',
  accountCta:'Create free account',signin:'Already have an account? Sign in',
  consent:'Research candidate only — not a diagnostic or investment recommendation. Your guest progress can be restored while you are taking the assessment, but the completed guest report disappears if you refresh or leave unless you save it.',
  question:'Question',back:'Back',next:'Next',result:'See my DNA',calculating:'Calculating…',
  hint:'Pick the closest answer. You can go back and change it.',restore:'Restoring your progress…',
  retryTitle:'Unable to load your assessment',retryBody:'Your saved draft could not be restored.',retry:'Try again',fresh:'Start fresh',language:'Language',
  sections:{risk_tolerance:'Risk tolerance',behavioral_dna:'Behavioral DNA',risk_capacity:'Financial capacity',investment_experience:'Investment experience'}
 },
 fr:{
  of:'sur',progress:'Questions répondues',multiple:'Sélectionnez toutes les réponses qui s’appliquent.',continue:'Continuer',
  complete:'Évaluation terminée',personalTitle:'Vous y êtes presque.',firstName:'Prénom (facultatif)',age:'Âge (facultatif)',
  personalBody:'Vous pouvez ajouter votre prénom, votre âge, les deux ou aucun. Ces renseignements personnalisent le rapport sans modifier votre score.',
  personalNote:'Laissez les deux champs vides pour voir votre résultat. Vous pourrez ensuite choisir de sauvegarder votre rapport dans un compte.',
  ageError:'Entrez un âge entier de 18 à 100 ans, ou laissez ce champ vide.',personalResult:'Voir mon Investor DNA',
  eyebrow:'Évaluation Investing DNA',title:'Comprenez votre façon d’investir.',
  lede:'Une courte évaluation, encore au stade de la recherche, de votre tolérance au risque, de vos habitudes de décision, de votre capacité financière et de votre expérience en investissement.',
  questions:'28 questions',guest:'Aucun compte requis',save:'Sauvegardez si vous le souhaitez',
  measureTitle:'Ce que nous mesurons',measureNote:'Quatre dimensions composent un seul profil Investor DNA.',methodology:'Comprendre la méthodologie',
  principle:'Il n’existe pas de « meilleur investisseur ».',
  principleBody:'Il existe seulement une meilleure adéquation avec qui vous êtes, ce que vous pouvez tolérer et ce que vous cherchez à accomplir.',
  start:'Commencer sans compte',starting:'Démarrage…',
  accountTitle:'Vous voulez conserver votre Investor DNA ?',
  accountBody:'Créez un compte gratuit pour sauvegarder votre résultat, construire votre profil d’investisseur et retrouver plus tard vos correspondances personnalisées.',
  accountCta:'Créer un compte gratuit',signin:'Vous avez déjà un compte ? Se connecter',
  consent:'Version de recherche uniquement — ce n’est ni un diagnostic ni une recommandation de placement. Votre progression peut être restaurée pendant l’évaluation, mais le rapport invité disparaît si vous actualisez ou quittez la page à moins de le sauvegarder.',
  question:'Question',back:'Retour',next:'Suivant',result:'Voir mon DNA',calculating:'Calcul…',
  hint:'Choisissez la réponse la plus proche. Vous pourrez revenir en arrière pour la modifier.',restore:'Restauration de votre progression…',
  retryTitle:'Impossible de charger votre évaluation',retryBody:'Votre brouillon sauvegardé n’a pas pu être restauré.',retry:'Réessayer',fresh:'Recommencer',language:'Langue',
  sections:{risk_tolerance:'Tolérance au risque',behavioral_dna:'DNA comportemental',risk_capacity:'Capacité financière',investment_experience:'Expérience en investissement'}
 },
 fa:{
  of:'از',progress:'سؤال‌های پاسخ‌داده‌شده',multiple:'همه گزینه‌های مرتبط را انتخاب کن.',continue:'ادامه',
  complete:'ارزیابی تکمیل شد',personalTitle:'نتیجه‌ات آماده است.',firstName:'نام (اختیاری)',age:'سن (اختیاری)',
  personalBody:'می‌توانی نام، سن، هر دو یا هیچ‌کدام را وارد کنی. این اطلاعات فقط گزارش را شخصی می‌کنند و امتیاز ارزیابی را تغییر نمی‌دهند.',
  personalNote:'برای دیدن نتیجه می‌توانی هر دو کادر را خالی بگذاری. بعد از دیدن گزارش، ذخیره آن در حساب هم اختیاری است.',
  ageError:'سن را به‌صورت عدد صحیح بین ۱۸ تا ۱۰۰ وارد کن یا کادر را خالی بگذار.',personalResult:'مشاهده Investor DNA من',
  eyebrow:'ارزیابی Investing DNA',title:'روش سرمایه‌گذاری خودت را بهتر بشناس.',
  lede:'یک ارزیابی کوتاه و در مرحله پژوهش از میزان تحمل ریسک، الگوهای تصمیم‌گیری، توان مالی و تجربه سرمایه‌گذاری تو.',
  questions:'۲۸ سؤال',guest:'بدون نیاز به حساب',save:'در صورت تمایل ذخیره کن',
  measureTitle:'چه چیزهایی را می‌سنجیم',measureNote:'چهار بُعد در کنار هم پروفایل Investor DNA را می‌سازند.',methodology:'روش محاسبه را ببین',
  principle:'هیچ «بهترین سرمایه‌گذار»ی وجود ندارد.',
  principleBody:'فقط گزینه‌ای هست که بهتر با خودت، میزان ریسکی که می‌توانی تحمل کنی و چیزی که می‌خواهی به آن برسی هماهنگ باشد.',
  start:'شروع بدون حساب',starting:'در حال شروع…',
  accountTitle:'می‌خواهی Investor DNA تو باقی بماند؟',
  accountBody:'یک حساب رایگان بساز تا نتیجه‌ات ذخیره شود، پروفایل سرمایه‌گذاری‌ات شکل بگیرد و بعداً به Matchهای شخصی‌سازی‌شده برگردی.',
  accountCta:'ساخت حساب رایگان',signin:'حساب داری؟ وارد شو',
  consent:'این نسخه هنوز پژوهشی است و تشخیص یا توصیه سرمایه‌گذاری محسوب نمی‌شود. پاسخ‌ها حین انجام تست قابل بازیابی‌اند، اما گزارش مهمان با رفرش یا خروج از صفحه پاک می‌شود مگر اینکه آن را ذخیره کنی.',
  question:'سؤال',back:'قبلی',next:'بعدی',result:'مشاهده DNA من',calculating:'در حال محاسبه…',
  hint:'نزدیک‌ترین پاسخ را انتخاب کن؛ بعداً می‌توانی برگردی و تغییرش بدهی.',restore:'در حال بازیابی پاسخ‌ها…',
  retryTitle:'ارزیابی بارگذاری نشد',retryBody:'نسخه ذخیره‌شده در این مرورگر قابل بازیابی نبود.',retry:'تلاش دوباره',fresh:'شروع از ابتدا',language:'زبان',
  sections:{risk_tolerance:'تحمل ریسک',behavioral_dna:'DNA رفتاری',risk_capacity:'توان مالی',investment_experience:'تجربه سرمایه‌گذاری'}
 }
} as const;
