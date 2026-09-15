/**
 * Localized UI copy for the Investing DNA assessment shell.
 *
 * This is presentation copy only. Questionnaire prompts/options come from the
 * versioned server questionnaire and must not be moved or edited here.
 */
export type AssessmentLocale='en'|'fr'|'fa';
export type AssessmentCohort='DEV_V1_10'|'COGNITIVE_V1_10';

export const ASSESSMENT_COPY={
 en:{
  eyebrow:'Investing DNA assessment',
  title:'Understand how you invest.',
  lede:'A short, research-stage assessment of your risk tolerance, decision patterns, financial capacity and investing experience.',
  questions:'28 questions',guest:'No account required',save:'Save it if you want',
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
  eyebrow:'Évaluation Investing DNA',title:'Comprenez votre façon d’investir.',
  lede:'Une courte évaluation, encore au stade de la recherche, de votre tolérance au risque, de vos habitudes de décision, de votre capacité financière et de votre expérience en investissement.',
  questions:'28 questions',guest:'Aucun compte requis',save:'Sauvegardez si vous le souhaitez',
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
  eyebrow:'ارزیابی Investing DNA',title:'روش سرمایه‌گذاری خودت را بهتر بشناس.',
  lede:'یک ارزیابی کوتاه و در مرحله پژوهش از میزان تحمل ریسک، الگوهای تصمیم‌گیری، توان مالی و تجربه سرمایه‌گذاری تو.',
  questions:'۲۸ سؤال',guest:'بدون نیاز به حساب',save:'در صورت تمایل ذخیره کن',
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
