'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxjjannguzzzqsamnhem.supabase.co';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2fijbzQmFxdayOXr1C_fA_OMx4FepZ';
const FN = `${SUPABASE_URL}/functions/v1/investing-dna-pilot`;
const ASSESSMENT_KEY = 'investing_dna_session_v2';
const LANGUAGE_KEY = 'investing_dna_language_v2';

const supabase = createClient(SUPABASE_URL, PUBLIC_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

async function edgeApi(action, body = {}, accessToken = null) {
  const headers = { 'Content-Type': 'application/json', apikey: PUBLIC_KEY };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(FN, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...body }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
  return data;
}

const COPY = {
  en: {
    home: 'Home', dna: 'Investing DNA', explore: 'Explore', screener: 'Screener', compare: 'Compare', watchlist: 'Watchlist', profile: 'Profile',
    signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out', saveDna: 'Save my DNA', optionalAccount: 'Optional account',
    heroEyebrow: 'INVESTING DNA · INTELLIGENT INVESTING', heroTitle: 'Know yourself. Invest better.', heroLead: 'Understand the investor behind the decision — then explore real investments and see how well they fit your Investor DNA.',
    discover: 'Discover my Investor DNA', exploreInvestments: 'Explore investments', realPlatform: 'From self-knowledge to investment fit',
    feature1: 'Know yourself', feature1b: 'Measure Risk Tolerance, Risk Capacity and Behavioral DNA.', feature2: 'Explore real investments', feature2b: 'Browse a live investment universe from the product database.', feature3: 'Find your fit', feature3b: 'See personalized compatibility after your DNA assessment.',
    educational: 'Educational platform only. Compatibility signals are not investment advice.',
    universe: 'INVESTMENT UNIVERSE', exploreTitle: 'Explore investments', exploreLead: 'Search, filter, compare and open full investment profiles.', search: 'Search symbol, fund, issuer or category…', all: 'All', allRisk: 'All risk levels', allRegions: 'All regions', sort: 'Sort', featured: 'Featured', topMatch: 'Best DNA fit', return1y: '1Y return', mer: 'MER', yield: 'Yield', risk: 'Risk', view: 'View', addCompare: 'Compare', removeCompare: 'Remove', addWatchlist: 'Save', saved: 'Saved', noResults: 'No investments match these filters.', loading: 'Loading live data…',
    liveData: 'Live backend data', sourceStatus: 'Connected to Supabase', dataError: 'Could not load investment data.',
    detail: 'Investment profile', overview: 'Overview', performance: 'Performance & risk', construction: 'Portfolio construction', suitability: 'Who this may fit', objective: 'Objective', benchmark: 'Benchmark', strategy: 'Strategy', issuer: 'Issuer', region: 'Region', currency: 'Currency', inception: 'Inception', price: 'Price', return3y: '3Y annualized', return5y: '5Y annualized', volatility: '1Y volatility', drawdown: '1Y max drawdown', sharpe: 'Sharpe ratio', beta: 'Beta', aum: 'AUM', equity: 'Equity', fixedIncome: 'Fixed income', keyRisks: 'Key risks', dnaFit: 'Your DNA fit', whyFits: 'Why it fits', watch: 'What to watch', fitUnavailable: 'Complete your Investor DNA to unlock a personalized fit score.',
    compareTitle: 'Compare investments', compareLead: 'Compare up to three investments side by side.', needTwo: 'Choose at least two investments to compare.', metric: 'Metric', clear: 'Clear',
    screenerTitle: 'Investment screener', screenerLead: 'Use risk, region, type and fee filters to narrow the universe.', maxMer: 'Maximum MER', anyFee: 'Any MER',
    watchlistTitle: 'Your watchlist', watchlistLead: 'Saved investments stay here when you sign in.', authNeeded: 'Sign in to keep a watchlist and save your Investor DNA across visits.', emptyWatchlist: 'Your watchlist is empty.',
    profileTitle: 'Your Investor Profile', profileLead: 'Your saved DNA, latest assessment and platform activity.', noSavedDna: 'No saved Investor DNA yet.', takeAssessment: 'Take assessment', retake: 'Retake assessment', latestDna: 'Latest Investor DNA', decisionStyle: 'Decision style', pressureStyle: 'Under pressure', lastActivity: 'Last activity', savedItems: 'Saved investments',
    before: 'BEFORE WE BEGIN', consentTitle: 'Your answers shape your DNA.', consentBody: 'There are 36 questions. Answer honestly rather than choosing what you think a “good investor” should choose.', privacy: 'Privacy first', privacyBody: 'You can complete the assessment anonymously. Creating an account is optional and lets you save your DNA, watchlist and future activity.', start: 'Start assessment', starting: 'Starting…', back: 'Back', next: 'Next', reveal: 'Reveal my DNA', analyzing: 'Analyzing…', question: 'Question', of: 'of', tolerance: 'RISK TOLERANCE', capacity: 'RISK CAPACITY', behavior: 'BEHAVIORAL DNA', notAtAll: 'Not at all', extremely: 'Extremely',
    resultEyebrow: 'YOUR INVESTOR DNA', riskProfile: 'Risk profile', riskTolerance: 'Risk Tolerance', riskCapacity: 'Risk Capacity', fingerprint: 'Decision fingerprint', strengths: 'Strengths', watchouts: 'Watchouts', completeContext: 'Complete investment context', seeMatches: 'See investment matches', saveAndReturn: 'Save my DNA',
    contextTitle: 'Complete your investment context', contextLead: 'This turns a DNA-only compatibility signal into a more useful context-aware view.', firstName: 'First name', age: 'Age', amount: 'Amount to invest', amountOptional: 'Amount (optional)', goal: 'Primary goal', horizon: 'Time horizon', liquidity: 'Liquidity need', requiredReturn: 'Return objective', lossImpact: 'If this fell 30%, impact on your life', experience: 'Investing experience', finishContext: 'Save context', skipContext: 'Skip for now', contextSaved: 'Investment context saved.',
    retirement: 'Retirement / long-term wealth', growth: 'General growth', home: 'Home purchase', education: 'Education', income: 'Income', emergency: 'Emergency reserve', under2: 'Under 2 years', y1to3: '1–3 years', y3to5: '3–5 years', y5plus: '5+ years', high: 'High', medium: 'Medium', low: 'Low', preserve: 'Protect capital; return is secondary', moderateGrowth: 'Moderate growth', strongGrowth: 'Strong long-term growth', maxGrowth: 'Maximize potential growth', severe: 'Severe — essential plans would be disrupted', meaningful: 'Meaningful — I would need to change plans', manageable: 'Manageable — uncomfortable but absorbable', minimal: 'Minimal — little effect on my life', beginner: 'Beginner', some: 'Some experience', experienced: 'Experienced', advanced: 'Advanced',
    authTitleIn: 'Sign in to Investing DNA', authTitleUp: 'Create your Investing DNA account', email: 'Email', password: 'Password', passwordHint: 'At least 6 characters', submitIn: 'Sign in', submitUp: 'Create account', switchUp: 'Need an account? Create one', switchIn: 'Already have an account? Sign in', close: 'Close', checkEmail: 'Account created. Check your email if confirmation is required.', signedIn: 'Signed in successfully.', dnaSaved: 'Your assessment is now linked to your account.',
    retry: 'Retry', connected: 'Connected', account: 'Account', anonymous: 'Anonymous',
  },
  fr: {
    home: 'Accueil', dna: 'Investing DNA', explore: 'Explorer', screener: 'Filtreur', compare: 'Comparer', watchlist: 'Favoris', profile: 'Profil',
    signIn: 'Connexion', signUp: 'Créer un compte', signOut: 'Déconnexion', saveDna: 'Enregistrer mon DNA', optionalAccount: 'Compte facultatif',
    heroEyebrow: 'INVESTING DNA · INVESTISSEMENT INTELLIGENT', heroTitle: 'Connaissez-vous. Investissez mieux.', heroLead: 'Comprenez l’investisseur derrière la décision, puis explorez de vrais placements et voyez leur compatibilité avec votre Investor DNA.',
    discover: 'Découvrir mon Investor DNA', exploreInvestments: 'Explorer les placements', realPlatform: 'De la connaissance de soi à la compatibilité',
    feature1: 'Mieux vous connaître', feature1b: 'Mesurez votre tolérance, votre capacité au risque et votre DNA comportemental.', feature2: 'Explorer de vrais placements', feature2b: 'Parcourez un univers de placements alimenté par la base de données.', feature3: 'Trouver votre compatibilité', feature3b: 'Obtenez une compatibilité personnalisée après votre évaluation.',
    educational: 'Plateforme éducative uniquement. Les signaux de compatibilité ne sont pas des conseils en placement.',
    universe: 'UNIVERS DE PLACEMENTS', exploreTitle: 'Explorer les placements', exploreLead: 'Recherchez, filtrez, comparez et ouvrez des profils complets.', search: 'Rechercher symbole, fonds, émetteur ou catégorie…', all: 'Tous', allRisk: 'Tous les niveaux de risque', allRegions: 'Toutes les régions', sort: 'Trier', featured: 'En vedette', topMatch: 'Meilleure compatibilité DNA', return1y: 'Rendement 1 an', mer: 'RFG', yield: 'Rendement', risk: 'Risque', view: 'Voir', addCompare: 'Comparer', removeCompare: 'Retirer', addWatchlist: 'Enregistrer', saved: 'Enregistré', noResults: 'Aucun placement ne correspond aux filtres.', loading: 'Chargement des données…',
    liveData: 'Données du backend', sourceStatus: 'Connecté à Supabase', dataError: 'Impossible de charger les placements.',
    detail: 'Profil du placement', overview: 'Aperçu', performance: 'Rendement et risque', construction: 'Construction du portefeuille', suitability: 'À qui cela peut convenir', objective: 'Objectif', benchmark: 'Indice de référence', strategy: 'Stratégie', issuer: 'Émetteur', region: 'Région', currency: 'Devise', inception: 'Création', price: 'Prix', return3y: '3 ans annualisé', return5y: '5 ans annualisé', volatility: 'Volatilité 1 an', drawdown: 'Baisse max 1 an', sharpe: 'Ratio de Sharpe', beta: 'Bêta', aum: 'Actif géré', equity: 'Actions', fixedIncome: 'Revenu fixe', keyRisks: 'Principaux risques', dnaFit: 'Votre compatibilité DNA', whyFits: 'Pourquoi cela convient', watch: 'Points à surveiller', fitUnavailable: 'Complétez votre Investor DNA pour obtenir un score personnalisé.',
    compareTitle: 'Comparer les placements', compareLead: 'Comparez jusqu’à trois placements côte à côte.', needTwo: 'Choisissez au moins deux placements.', metric: 'Mesure', clear: 'Effacer',
    screenerTitle: 'Filtreur de placements', screenerLead: 'Filtrez par risque, région, type et frais.', maxMer: 'RFG maximum', anyFee: 'Tous les RFG',
    watchlistTitle: 'Vos favoris', watchlistLead: 'Vos placements enregistrés restent ici lorsque vous êtes connecté.', authNeeded: 'Connectez-vous pour conserver vos favoris et votre Investor DNA.', emptyWatchlist: 'Aucun placement enregistré.',
    profileTitle: 'Votre profil d’investisseur', profileLead: 'Votre DNA enregistré, votre dernière évaluation et votre activité.', noSavedDna: 'Aucun Investor DNA enregistré.', takeAssessment: 'Faire l’évaluation', retake: 'Refaire l’évaluation', latestDna: 'Dernier Investor DNA', decisionStyle: 'Style de décision', pressureStyle: 'Sous pression', lastActivity: 'Dernière activité', savedItems: 'Placements enregistrés',
    before: 'AVANT DE COMMENCER', consentTitle: 'Vos réponses façonnent votre DNA.', consentBody: 'Il y a 36 questions. Répondez honnêtement plutôt que de choisir ce qu’un « bon investisseur » devrait répondre.', privacy: 'Confidentialité d’abord', privacyBody: 'Vous pouvez faire l’évaluation anonymement. Le compte est facultatif et sert à conserver votre DNA, vos favoris et votre activité.', start: 'Commencer', starting: 'Démarrage…', back: 'Retour', next: 'Suivant', reveal: 'Révéler mon DNA', analyzing: 'Analyse…', question: 'Question', of: 'sur', tolerance: 'TOLÉRANCE AU RISQUE', capacity: 'CAPACITÉ DE RISQUE', behavior: 'DNA COMPORTEMENTAL', notAtAll: 'Pas du tout', extremely: 'Tout à fait',
    resultEyebrow: 'VOTRE INVESTOR DNA', riskProfile: 'Profil de risque', riskTolerance: 'Tolérance au risque', riskCapacity: 'Capacité de risque', fingerprint: 'Empreinte décisionnelle', strengths: 'Forces', watchouts: 'Points à surveiller', completeContext: 'Compléter le contexte', seeMatches: 'Voir les compatibilités', saveAndReturn: 'Enregistrer mon DNA',
    contextTitle: 'Complétez votre contexte d’investissement', contextLead: 'Cela rend la compatibilité plus pertinente en ajoutant votre situation actuelle.', firstName: 'Prénom', age: 'Âge', amount: 'Montant à investir', amountOptional: 'Montant (facultatif)', goal: 'Objectif principal', horizon: 'Horizon', liquidity: 'Besoin de liquidité', requiredReturn: 'Objectif de rendement', lossImpact: 'Impact d’une baisse de 30 %', experience: 'Expérience', finishContext: 'Enregistrer le contexte', skipContext: 'Plus tard', contextSaved: 'Contexte enregistré.',
    retirement: 'Retraite / patrimoine à long terme', growth: 'Croissance générale', home: 'Achat d’une maison', education: 'Études', income: 'Revenu', emergency: 'Fonds d’urgence', under2: 'Moins de 2 ans', y1to3: '1–3 ans', y3to5: '3–5 ans', y5plus: '5 ans et +', high: 'Élevé', medium: 'Moyen', low: 'Faible', preserve: 'Protéger le capital; rendement secondaire', moderateGrowth: 'Croissance modérée', strongGrowth: 'Forte croissance à long terme', maxGrowth: 'Maximiser la croissance potentielle', severe: 'Sévère — projets essentiels perturbés', meaningful: 'Important — je devrais modifier mes plans', manageable: 'Gérable — inconfortable mais absorbable', minimal: 'Minime — peu d’effet sur ma vie', beginner: 'Débutant', some: 'Une certaine expérience', experienced: 'Expérimenté', advanced: 'Avancé',
    authTitleIn: 'Connexion à Investing DNA', authTitleUp: 'Créer votre compte Investing DNA', email: 'Courriel', password: 'Mot de passe', passwordHint: 'Au moins 6 caractères', submitIn: 'Se connecter', submitUp: 'Créer le compte', switchUp: 'Pas de compte? Créez-en un', switchIn: 'Déjà un compte? Connectez-vous', close: 'Fermer', checkEmail: 'Compte créé. Vérifiez votre courriel si une confirmation est requise.', signedIn: 'Connexion réussie.', dnaSaved: 'Votre évaluation est maintenant liée à votre compte.',
    retry: 'Réessayer', connected: 'Connecté', account: 'Compte', anonymous: 'Anonyme',
  },
  fa: {
    home: 'خانه', dna: 'DNA سرمایه‌گذاری', explore: 'سرمایه‌گذاری‌ها', screener: 'فیلتر پیشرفته', compare: 'مقایسه', watchlist: 'لیست من', profile: 'پروفایل',
    signIn: 'ورود', signUp: 'ساخت حساب', signOut: 'خروج', saveDna: 'ذخیره DNA من', optionalAccount: 'حساب اختیاری',
    heroEyebrow: 'INVESTING DNA · سرمایه‌گذاری هوشمند', heroTitle: 'خودت را بشناس. بهتر سرمایه‌گذاری کن.', heroLead: 'اول سرمایه‌گذار پشت تصمیم را بشناس؛ بعد سرمایه‌گذاری‌های واقعی را بررسی کن و ببین چقدر با DNA سرمایه‌گذاری تو هماهنگ‌اند.',
    discover: 'DNA سرمایه‌گذاری من را پیدا کن', exploreInvestments: 'بررسی سرمایه‌گذاری‌ها', realPlatform: 'از شناخت خود تا پیدا کردن گزینه مناسب',
    feature1: 'خودت را بشناس', feature1b: 'تحمل ریسک، ظرفیت ریسک و DNA رفتاری خودت را اندازه بگیر.', feature2: 'داده واقعی را ببین', feature2b: 'محصولات واقعی را مستقیم از دیتابیس پلتفرم بررسی کن.', feature3: 'تناسب خودت را پیدا کن', feature3b: 'بعد از ارزیابی، امتیاز سازگاری هر سرمایه‌گذاری با DNA خودت را ببین.',
    educational: 'این پلتفرم صرفاً آموزشی است و امتیازهای سازگاری توصیه سرمایه‌گذاری نیستند.',
    universe: 'دنیای سرمایه‌گذاری', exploreTitle: 'سرمایه‌گذاری‌ها را بررسی کن', exploreLead: 'جستجو، فیلتر، مقایسه و پروفایل کامل هر محصول را باز کن.', search: 'نماد، صندوق، شرکت یا دسته‌بندی را جستجو کن…', all: 'همه', allRisk: 'همه سطح‌های ریسک', allRegions: 'همه مناطق', sort: 'مرتب‌سازی', featured: 'منتخب', topMatch: 'بیشترین تطابق DNA', return1y: 'بازده ۱ ساله', mer: 'هزینه (MER)', yield: 'بازده نقدی', risk: 'ریسک', view: 'مشاهده', addCompare: 'مقایسه', removeCompare: 'حذف', addWatchlist: 'ذخیره', saved: 'ذخیره شده', noResults: 'هیچ سرمایه‌گذاری با این فیلترها پیدا نشد.', loading: 'در حال دریافت داده واقعی…',
    liveData: 'داده زنده بک‌اند', sourceStatus: 'متصل به Supabase', dataError: 'دریافت اطلاعات سرمایه‌گذاری‌ها ناموفق بود.',
    detail: 'پروفایل سرمایه‌گذاری', overview: 'معرفی', performance: 'بازده و ریسک', construction: 'ساختار پرتفوی', suitability: 'برای چه کسی مناسب‌تر است', objective: 'هدف', benchmark: 'شاخص مبنا', strategy: 'استراتژی', issuer: 'ناشر', region: 'منطقه', currency: 'ارز', inception: 'تاریخ شروع', price: 'قیمت', return3y: 'بازده سالانه ۳ ساله', return5y: 'بازده سالانه ۵ ساله', volatility: 'نوسان ۱ ساله', drawdown: 'بیشترین افت ۱ ساله', sharpe: 'نسبت شارپ', beta: 'بتا', aum: 'دارایی تحت مدیریت', equity: 'سهام', fixedIncome: 'درآمد ثابت', keyRisks: 'ریسک‌های اصلی', dnaFit: 'تطابق با DNA شما', whyFits: 'چرا می‌تواند مناسب باشد', watch: 'چه چیزهایی را باید مراقب باشید', fitUnavailable: 'برای دیدن امتیاز شخصی، ابتدا DNA سرمایه‌گذاری خود را کامل کنید.',
    compareTitle: 'مقایسه سرمایه‌گذاری‌ها', compareLead: 'تا سه سرمایه‌گذاری را کنار هم مقایسه کن.', needTwo: 'حداقل دو سرمایه‌گذاری برای مقایسه انتخاب کن.', metric: 'معیار', clear: 'پاک کردن',
    screenerTitle: 'فیلتر پیشرفته سرمایه‌گذاری', screenerLead: 'با ریسک، منطقه، نوع محصول و هزینه، گزینه‌ها را محدود کن.', maxMer: 'حداکثر MER', anyFee: 'هر میزان هزینه',
    watchlistTitle: 'لیست سرمایه‌گذاری‌های من', watchlistLead: 'وقتی وارد حساب باشی، گزینه‌های ذخیره‌شده اینجا می‌مانند.', authNeeded: 'برای نگه‌داشتن Watchlist و ذخیره DNA بین مراجعه‌ها وارد حساب شو.', emptyWatchlist: 'هنوز چیزی ذخیره نکرده‌ای.',
    profileTitle: 'پروفایل سرمایه‌گذار شما', profileLead: 'DNA ذخیره‌شده، آخرین ارزیابی و فعالیت شما در پلتفرم.', noSavedDna: 'هنوز DNA ذخیره‌شده‌ای نداری.', takeAssessment: 'شروع ارزیابی', retake: 'ارزیابی دوباره', latestDna: 'آخرین DNA سرمایه‌گذاری', decisionStyle: 'سبک تصمیم‌گیری', pressureStyle: 'رفتار تحت فشار', lastActivity: 'آخرین فعالیت', savedItems: 'سرمایه‌گذاری‌های ذخیره‌شده',
    before: 'قبل از شروع', consentTitle: 'پاسخ‌های شما DNA شما را شکل می‌دهند.', consentBody: '۳۶ سؤال وجود دارد. صادقانه پاسخ بده؛ نه چیزی که فکر می‌کنی یک «سرمایه‌گذار خوب» باید انتخاب کند.', privacy: 'حریم خصوصی در اولویت است', privacyBody: 'می‌توانی ارزیابی را بدون ساخت حساب انجام بدهی. حساب کاملاً اختیاری است و فقط برای ذخیره DNA، لیست و فعالیت‌های بعدی استفاده می‌شود.', start: 'شروع ارزیابی', starting: 'در حال شروع…', back: 'بازگشت', next: 'بعدی', reveal: 'نمایش DNA من', analyzing: 'در حال تحلیل…', question: 'سؤال', of: 'از', tolerance: 'تحمل ریسک', capacity: 'ظرفیت ریسک', behavior: 'DNA رفتاری', notAtAll: 'اصلاً', extremely: 'کاملاً',
    resultEyebrow: 'DNA سرمایه‌گذاری شما', riskProfile: 'پروفایل ریسک', riskTolerance: 'تحمل ریسک', riskCapacity: 'ظرفیت ریسک', fingerprint: 'اثر انگشت تصمیم‌گیری', strengths: 'نقاط قوت', watchouts: 'موارد قابل توجه', completeContext: 'تکمیل شرایط سرمایه‌گذاری', seeMatches: 'دیدن تطابق سرمایه‌گذاری‌ها', saveAndReturn: 'ذخیره DNA من',
    contextTitle: 'شرایط سرمایه‌گذاری‌ات را کامل کن', contextLead: 'این اطلاعات باعث می‌شود تطابق‌ها فقط بر اساس DNA نباشند و شرایط واقعی سرمایه‌گذاری تو هم در نظر گرفته شود.', firstName: 'نام', age: 'سن', amount: 'مبلغ سرمایه‌گذاری', amountOptional: 'مبلغ (اختیاری)', goal: 'هدف اصلی', horizon: 'افق زمانی', liquidity: 'نیاز به نقدشوندگی', requiredReturn: 'هدف بازده', lossImpact: 'اگر این سرمایه‌گذاری ۳۰٪ افت کند چه اثری دارد؟', experience: 'تجربه سرمایه‌گذاری', finishContext: 'ذخیره شرایط', skipContext: 'فعلاً رد کن', contextSaved: 'شرایط سرمایه‌گذاری ذخیره شد.',
    retirement: 'بازنشستگی / ثروت بلندمدت', growth: 'رشد عمومی سرمایه', home: 'خرید خانه', education: 'تحصیل', income: 'درآمد دوره‌ای', emergency: 'ذخیره اضطراری', under2: 'کمتر از ۲ سال', y1to3: '۱ تا ۳ سال', y3to5: '۳ تا ۵ سال', y5plus: 'بیش از ۵ سال', high: 'زیاد', medium: 'متوسط', low: 'کم', preserve: 'حفظ سرمایه؛ بازده در اولویت دوم است', moderateGrowth: 'رشد متعادل', strongGrowth: 'رشد قوی بلندمدت', maxGrowth: 'بیشینه‌کردن رشد بالقوه', severe: 'شدید — برنامه‌های ضروری مختل می‌شوند', meaningful: 'قابل‌توجه — باید برنامه‌هایم را تغییر بدهم', manageable: 'قابل مدیریت — ناراحت‌کننده اما قابل تحمل', minimal: 'کم — اثر مهمی روی زندگی‌ام ندارد', beginner: 'مبتدی', some: 'کمی تجربه', experienced: 'باتجربه', advanced: 'پیشرفته',
    authTitleIn: 'ورود به Investing DNA', authTitleUp: 'ساخت حساب Investing DNA', email: 'ایمیل', password: 'رمز عبور', passwordHint: 'حداقل ۶ کاراکتر', submitIn: 'ورود', submitUp: 'ساخت حساب', switchUp: 'حساب نداری؟ بساز', switchIn: 'حساب داری؟ وارد شو', close: 'بستن', checkEmail: 'حساب ساخته شد. اگر تأیید ایمیل فعال باشد، ایمیلت را بررسی کن.', signedIn: 'با موفقیت وارد شدی.', dnaSaved: 'این ارزیابی به حساب تو متصل و ذخیره شد.',
    retry: 'تلاش دوباره', connected: 'متصل', account: 'حساب', anonymous: 'بدون حساب',
  },
};

const ARCHETYPE = {
  VAULT: { en: 'The Capital Protector', fr: 'Protecteur du capital', fa: 'محافظ سرمایه' },
  ANCHOR: { en: 'The Steady Builder', fr: 'Bâtisseur stable', fa: 'سازنده باثبات' },
  COOLHAND: { en: 'The Calm Conservative', fr: 'Conservateur serein', fa: 'محافظ آرام' },
  SCOUT: { en: 'The Cautious Explorer', fr: 'Explorateur prudent', fa: 'کاوشگر محتاط' },
  MAVERICK: { en: 'The Balanced Risk Taker', fr: 'Preneur de risque équilibré', fa: 'ریسک‌پذیر متعادل' },
  STRIKER: { en: 'The Calculated Aggressor', fr: 'Agresseur calculé', fa: 'مهاجم حساب‌شده' },
  HOTSHOT: { en: 'The High-Risk Aspirant', fr: 'Aspirant à haut risque', fa: 'ریسک‌پذیر بلندپرواز' },
  HIGHROLLER: { en: 'The High-Conviction Investor', fr: 'Investisseur à forte conviction', fa: 'سرمایه‌گذار با اطمینان بالا' },
  JACKPOT: { en: 'The Adaptive Risk Taker', fr: 'Preneur de risque adaptable', fa: 'ریسک‌پذیر انعطاف‌پذیر' },
};

const CONTEXT_OPTIONS = {
  goal: [
    ['retirement', 'retirement'], ['growth', 'growth'], ['house', 'home'], ['education', 'education'], ['income', 'income'], ['emergency', 'emergency'],
  ],
  time_horizon: [['under_2_years', 'under2'], ['1_3_years', 'y1to3'], ['3_5_years', 'y3to5'], ['5_plus_years', 'y5plus']],
  liquidity_need: [['high', 'high'], ['medium', 'medium'], ['low', 'low']],
  required_return: [['capital_preservation', 'preserve'], ['moderate_growth', 'moderateGrowth'], ['strong_growth', 'strongGrowth'], ['maximum_growth', 'maxGrowth']],
  loss_consequence: [['severe', 'severe'], ['meaningful', 'meaningful'], ['manageable', 'manageable'], ['minimal', 'minimal']],
  experience: [['beginner', 'beginner'], ['some', 'some'], ['experienced', 'experienced'], ['advanced', 'advanced']],
};

function fmtPct(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(digits)}%` : '—';
}
function fmtMoney(value, currency = 'CAD') {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}
function fmtCompact(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-CA', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
function optionArray(q, language) {
  const raw = language === 'fr' ? q.options_fr : language === 'fa' ? q.options_fa : q.options;
  const fallback = Array.isArray(q.options) ? q.options : [];
  return Array.isArray(raw) && raw.length ? raw : fallback;
}
function questionPrompt(q, language) {
  return q?.[`prompt_${language}`] || q?.prompt || q?.prompt_en || '';
}
function sectionName(section, c) {
  if (section === 'risk_tolerance') return c.tolerance;
  if (section === 'risk_capacity') return c.capacity;
  return c.behavior;
}
function normalizeJsonList(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return value ? [String(value)] : [];
}
function matchFromSubmit(result) {
  const list = result?.match?.results;
  return Array.isArray(list) ? list : [];
}

function Brand({ compact = false }) {
  return <button className={`brand ${compact ? 'compact' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Investing DNA">
    <img src="/logo.png" alt="Investing DNA" />
  </button>;
}

function LanguagePicker({ language, setLanguage }) {
  return <div className="language-picker" role="group" aria-label="Language">
    <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
    <button className={language === 'fr' ? 'active' : ''} onClick={() => setLanguage('fr')}>FR</button>
    <button className={language === 'fa' ? 'active' : ''} onClick={() => setLanguage('fa')}>فا</button>
  </div>;
}

function EmptyState({ children }) { return <div className="empty-state">{children}</div>; }

export default function Home() {
  const [language, setLanguage] = useState('en');
  const c = COPY[language] || COPY.en;
  const [screen, setScreen] = useState('home');
  const [authSession, setAuthSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [pendingClaim, setPendingClaim] = useState(false);
  const [profileHome, setProfileHome] = useState(null);
  const [savedDna, setSavedDna] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [userMatches, setUserMatches] = useState([]);

  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [search, setSearch] = useState('');
  const [assetType, setAssetType] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [maxMer, setMaxMer] = useState('any');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const [assessmentSession, setAssessmentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [context, setContext] = useState({
    first_name: '', age: '', amount_to_invest: '', goal: 'growth', time_horizon: '5_plus_years', liquidity_need: 'low', required_return: 'moderate_growth', loss_consequence: 'manageable', experience: 'some',
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && COPY[savedLanguage]) setLanguage(savedLanguage);
      const savedAssessment = JSON.parse(localStorage.getItem(ASSESSMENT_KEY) || 'null');
      if (savedAssessment?.assessment_id && savedAssessment?.session_token) setAssessmentSession(savedAssessment);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch {}
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) setAuthSession(data.session || null); });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setAuthSession(session || null));
    return () => { mounted = false; subscription?.subscription?.unsubscribe(); };
  }, []);

  useEffect(() => { loadCatalog(); }, []);

  useEffect(() => {
    if (authSession?.user) loadUserData(authSession);
    else {
      setProfileHome(null); setSavedDna(null); setWatchlist([]); setUserMatches([]);
    }
  }, [authSession?.user?.id]);

  async function loadCatalog() {
    setCatalogLoading(true); setCatalogError('');
    const fields = 'id,symbol,name,legal_name,asset_type,category,subcategory,strategy,sector,region,country_code,currency,exchange,description,inception_date,is_featured,data_status,issuer_name,issuer_website,metrics_as_of_date,price,daily_change_pct,return_1m_pct,return_3m_pct,return_1y_pct,return_3y_annualized_pct,return_5y_annualized_pct,yield_pct,distribution_frequency,mer_pct,aum,volume,risk_level,volatility_1y_pct,max_drawdown_1y_pct,beta,sharpe_ratio,standard_deviation_pct,data_quality_status,data_quality_score,profile_objective,profile_benchmark,profile_methodology,profile_portfolio_construction,profile_target_allocation,profile_geographic_exposure,profile_currency_hedging,profile_distribution_policy,profile_management_style,profile_replication_method,profile_ideal_for,profile_key_risks,profile_summary,equity_pct,fixed_income_pct';
    const { data, error: loadError } = await supabase.from('v_app_investment_catalog').select(fields).order('is_featured', { ascending: false }).order('name');
    if (loadError) setCatalogError(loadError.message || c.dataError);
    else setCatalog(Array.isArray(data) ? data : []);
    setCatalogLoading(false);
  }

  async function loadUserData(session = authSession) {
    if (!session?.user) return;
    const [homeRes, dnaRes, watchRes] = await Promise.all([
      supabase.from('v_investor_home').select('*').maybeSingle(),
      supabase.from('v_app_dna').select('*').maybeSingle(),
      supabase.from('v_app_watchlist').select('*').order('created_at', { ascending: false }),
    ]);
    if (!homeRes.error) setProfileHome(homeRes.data || null);
    if (!dnaRes.error) setSavedDna(dnaRes.data || null);
    if (!watchRes.error) setWatchlist(Array.isArray(watchRes.data) ? watchRes.data : []);
    const assessmentId = dnaRes.data?.latest_assessment_id || homeRes.data?.latest_assessment_id;
    if (assessmentId) {
      const { data } = await supabase.from('v_investment_match_ranked').select('*').eq('assessment_id', assessmentId).order('match_rank').limit(100);
      setUserMatches(Array.isArray(data) ? data : []);
    } else setUserMatches([]);
  }

  const submitMatches = useMemo(() => matchFromSubmit(result), [result]);
  const matchMap = useMemo(() => {
    const map = new Map();
    for (const item of userMatches) map.set(item.investment_id, item);
    for (const item of submitMatches) map.set(item.investment_id, item);
    return map;
  }, [userMatches, submitMatches]);

  const regions = useMemo(() => [...new Set(catalog.map(x => x.region).filter(Boolean))].sort(), [catalog]);
  const types = useMemo(() => [...new Set(catalog.map(x => x.asset_type).filter(Boolean))].sort(), [catalog]);
  const riskLevels = useMemo(() => [...new Set(catalog.map(x => x.risk_level).filter(Boolean))].sort(), [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    const max = maxMer === 'any' ? null : Number(maxMer);
    const rows = catalog.filter(x => {
      const haystack = [x.symbol, x.name, x.issuer_name, x.category, x.subcategory, x.strategy, x.region].filter(Boolean).join(' ').toLowerCase();
      return (!q || haystack.includes(q)) &&
        (assetType === 'All' || x.asset_type === assetType) &&
        (riskFilter === 'All' || x.risk_level === riskFilter) &&
        (regionFilter === 'All' || x.region === regionFilter) &&
        (max === null || (x.mer_pct !== null && Number(x.mer_pct) <= max));
    });
    return rows.sort((a, b) => {
      if (sortBy === 'match') return Number(matchMap.get(b.id)?.match_score || -1) - Number(matchMap.get(a.id)?.match_score || -1);
      if (sortBy === 'return') return Number(b.return_1y_pct ?? -999) - Number(a.return_1y_pct ?? -999);
      if (sortBy === 'fee') return Number(a.mer_pct ?? 999) - Number(b.mer_pct ?? 999);
      if (sortBy === 'name') return String(a.name).localeCompare(String(b.name));
      return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) || String(a.name).localeCompare(String(b.name));
    });
  }, [catalog, search, assetType, riskFilter, regionFilter, maxMer, sortBy, matchMap]);

  async function openInvestment(investment) {
    setSelectedInvestment(investment); setScreen('detail'); setDetailLoading(true); setError('');
    const { data, error: detailError } = await supabase.from('v_app_investment_detail').select('*').eq('id', investment.id).maybeSingle();
    if (detailError) setError(detailError.message);
    if (data) setSelectedInvestment(data);
    setDetailLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleCompare(id) {
    setCompareIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= 3 ? [...ids.slice(1), id] : [...ids, id]);
  }

  async function toggleWatchlist(investmentId) {
    if (!authSession?.user) { setAuthMode('signin'); setAuthOpen(true); return; }
    const isSaved = watchlist.some(x => x.investment_id === investmentId);
    setBusy(true); setError('');
    const { error: rpcError } = await supabase.rpc('app_watchlist', { p_action: isSaved ? 'remove' : 'add', p_investment_id: investmentId });
    if (rpcError) setError(rpcError.message);
    else await loadUserData();
    setBusy(false);
  }

  function persistAssessment(session) {
    setAssessmentSession(session);
    try { localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(session)); } catch {}
    return session;
  }

  async function startAssessment() {
    setBusy(true); setError(''); setNotice(''); setAnswers({}); setQuestionIndex(0); setResult(null);
    try {
      const started = await edgeApi('start', { cohort_code: 'PILOT_V1_3', language_code: language, consent_version: `platform-v2-${language}` }, authSession?.access_token || null);
      const stored = persistAssessment(started);
      const questionnaire = await edgeApi('questionnaire', { assessment_id: stored.assessment_id, session_token: stored.session_token }, authSession?.access_token || null);
      const list = questionnaire.questions || questionnaire;
      if (!Array.isArray(list) || !list.length) throw new Error('Questionnaire returned no questions.');
      setQuestions(list); setScreen('quiz');
    } catch (e) { setError(e.message || 'Unable to start assessment.'); }
    setBusy(false);
  }

  async function saveAnswer(questionId, value) {
    if (!assessmentSession?.assessment_id) return;
    setAnswers(current => ({ ...current, [questionId]: value }));
    try {
      await edgeApi('save_answers', { assessment_id: assessmentSession.assessment_id, session_token: assessmentSession.session_token, answers: [{ question_id: questionId, answer_value: { value } }] }, authSession?.access_token || null);
    } catch (e) { setError(e.message || 'Unable to save answer.'); }
  }

  async function submitAssessment() {
    if (!assessmentSession?.assessment_id) return;
    setBusy(true); setError('');
    try {
      const data = await edgeApi('submit', { assessment_id: assessmentSession.assessment_id, session_token: assessmentSession.session_token }, authSession?.access_token || null);
      setResult(data);
      persistAssessment({ ...assessmentSession, account_linked: Boolean(data.account_linked), completed: true });
      setScreen('result');
      if (authSession?.user) await loadUserData();
    } catch (e) { setError(e.message || 'Unable to generate result.'); }
    setBusy(false);
  }

  async function saveContext() {
    if (!assessmentSession?.assessment_id) return;
    if (!String(context.first_name || '').trim() || !context.age) { setError(`${c.firstName} / ${c.age}`); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...context, age: Number(context.age), amount_to_invest: context.amount_to_invest ? Number(context.amount_to_invest) : 'prefer_not_to_say' };
      const data = await edgeApi('save_context', { assessment_id: assessmentSession.assessment_id, session_token: assessmentSession.session_token, context: payload }, authSession?.access_token || null);
      setResult(current => ({ ...(current || {}), report: data.report || current?.report, investment_context: data.investment_context || payload, match: data.match || current?.match, portfolio: data.portfolio || current?.portfolio }));
      setNotice(c.contextSaved); setScreen('result');
      if (authSession?.user) await loadUserData();
    } catch (e) { setError(e.message || 'Unable to save context.'); }
    setBusy(false);
  }

  async function claimAssessment(accessToken = authSession?.access_token) {
    if (!assessmentSession?.assessment_id || !accessToken) return false;
    try {
      await edgeApi('claim_assessment', { assessment_id: assessmentSession.assessment_id, session_token: assessmentSession.session_token }, accessToken);
      persistAssessment({ ...assessmentSession, account_linked: true });
      setNotice(c.dnaSaved);
      await loadUserData({ ...authSession, access_token: accessToken, user: authSession?.user || { id: 'current' } });
      return true;
    } catch (e) {
      if (String(e.message).includes('already linked')) return true;
      setError(e.message || 'Unable to link assessment.'); return false;
    }
  }

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (authMode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
        if (authError) throw authError;
        if (data.session) {
          setAuthSession(data.session); setNotice(c.signedIn); setAuthOpen(false);
          if (pendingClaim) { await claimAssessment(data.session.access_token); setPendingClaim(false); }
        } else setNotice(c.checkEmail);
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (authError) throw authError;
        setAuthSession(data.session); setNotice(c.signedIn); setAuthOpen(false);
        if (pendingClaim) { await claimAssessment(data.session.access_token); setPendingClaim(false); }
      }
    } catch (e) { setError(e.message || 'Authentication failed.'); }
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut(); setScreen('home'); setNotice(''); setError('');
  }

  function requestSaveDna() {
    if (authSession?.user) { claimAssessment(); return; }
    setPendingClaim(true); setAuthMode('signup'); setAuthOpen(true);
  }

  function go(next) { setScreen(next); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  const nav = <header className="platform-nav">
    <Brand compact />
    <nav className="nav-links" aria-label="Primary">
      <button className={screen === 'home' ? 'active' : ''} onClick={() => go('home')}>{c.home}</button>
      <button className={['consent','quiz','result','context'].includes(screen) ? 'active' : ''} onClick={() => go(result ? 'result' : 'consent')}>{c.dna}</button>
      <button className={['explore','detail'].includes(screen) ? 'active' : ''} onClick={() => go('explore')}>{c.explore}</button>
      <button className={screen === 'screener' ? 'active' : ''} onClick={() => go('screener')}>{c.screener}</button>
      <button className={screen === 'compare' ? 'active' : ''} onClick={() => go('compare')}>{c.compare}{compareIds.length ? ` (${compareIds.length})` : ''}</button>
      <button className={screen === 'watchlist' ? 'active' : ''} onClick={() => go('watchlist')}>{c.watchlist}</button>
    </nav>
    <div className="nav-actions">
      <span className="backend-pill"><i />{c.connected}</span>
      <LanguagePicker language={language} setLanguage={setLanguage} />
      {authSession?.user ? <button className="account-button" onClick={() => go('profile')}>{c.profile}</button> : <button className="account-button" onClick={() => { setAuthMode('signin'); setAuthOpen(true); }}>{c.signIn}</button>}
    </div>
  </header>;

  function InvestmentCard({ item }) {
    const match = matchMap.get(item.id);
    const isSaved = watchlist.some(x => x.investment_id === item.id);
    const inCompare = compareIds.includes(item.id);
    return <article className="investment-card">
      <div className="investment-card-top"><div><span className="type-chip">{item.asset_type || '—'}</span>{item.is_featured && <span className="feature-chip">{c.featured}</span>}</div><strong className="symbol">{item.symbol}</strong></div>
      <h3>{item.name}</h3>
      <p className="muted line-clamp">{[item.category, item.region, item.issuer_name].filter(Boolean).join(' · ')}</p>
      {match && <div className="match-chip"><b>{Math.round(Number(match.match_score))}%</b><span>{match.fit_label || match.recommendation_tier?.replaceAll('_',' ') || c.dnaFit}</span></div>}
      <div className="mini-stats"><div><span>{c.risk}</span><b>{item.risk_level || '—'}</b></div><div><span>{c.return1y}</span><b>{fmtPct(item.return_1y_pct)}</b></div><div><span>{c.mer}</span><b>{fmtPct(item.mer_pct, 2)}</b></div></div>
      <div className="card-actions"><button className="primary small" onClick={() => openInvestment(item)}>{c.view} →</button><button className={inCompare ? 'soft active' : 'soft'} onClick={() => toggleCompare(item.id)}>{inCompare ? c.removeCompare : c.addCompare}</button><button className={isSaved ? 'icon-button saved' : 'icon-button'} onClick={() => toggleWatchlist(item.id)} aria-label={isSaved ? c.saved : c.addWatchlist}>{isSaved ? '★' : '☆'}</button></div>
    </article>;
  }

  function CatalogControls({ advanced = false }) {
    return <>
      <div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={c.search} /></div>
      <div className="filter-row">
        <select value={assetType} onChange={e => setAssetType(e.target.value)}><option value="All">{c.all}</option>{types.map(x => <option key={x}>{x}</option>)}</select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}><option value="All">{c.allRisk}</option>{riskLevels.map(x => <option key={x}>{x}</option>)}</select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}><option value="All">{c.allRegions}</option>{regions.map(x => <option key={x}>{x}</option>)}</select>
        {advanced && <select value={maxMer} onChange={e => setMaxMer(e.target.value)}><option value="any">{c.anyFee}</option><option value="0.25">≤ 0.25%</option><option value="0.5">≤ 0.50%</option><option value="1">≤ 1.00%</option><option value="2">≤ 2.00%</option></select>}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="featured">{c.featured}</option><option value="match">{c.topMatch}</option><option value="return">{c.return1y}</option><option value="fee">{c.mer}</option><option value="name">A–Z</option></select>
      </div>
    </>;
  }

  function CatalogGrid() {
    if (catalogLoading) return <div className="loading-panel">{c.loading}</div>;
    if (catalogError) return <div className="error-box">{catalogError}<button onClick={loadCatalog}>{c.retry}</button></div>;
    if (!filteredCatalog.length) return <EmptyState>{c.noResults}</EmptyState>;
    return <div className="investment-grid">{filteredCatalog.map(item => <InvestmentCard key={item.id} item={item} />)}</div>;
  }

  let content = null;

  if (screen === 'home') content = <main className="page home-page">
    <section className="hero-section">
      <div className="hero-copy"><span className="eyebrow">{c.heroEyebrow}</span><h1>{c.heroTitle}</h1><p>{c.heroLead}</p><div className="hero-actions"><button className="primary" onClick={() => go('consent')}>{c.discover} →</button><button className="secondary" onClick={() => go('explore')}>{c.exploreInvestments} →</button></div><div className="backend-proof"><span><i />{c.liveData}</span><b>{catalog.length || '—'}</b><span>{c.sourceStatus}</span></div></div>
      <div className="hero-visual"><div className="dna-orbit"><div className="orbit-core"><img src="/logo.png" alt="" /></div><span className="orbit-node n1">DNA</span><span className="orbit-node n2">Risk</span><span className="orbit-node n3">Fit</span><span className="orbit-node n4">Data</span></div></div>
    </section>
    <section className="feature-strip"><div><span>01</span><h3>{c.feature1}</h3><p>{c.feature1b}</p></div><div><span>02</span><h3>{c.feature2}</h3><p>{c.feature2b}</p></div><div><span>03</span><h3>{c.feature3}</h3><p>{c.feature3b}</p></div></section>
    <section className="platform-flow"><span className="eyebrow">{c.realPlatform}</span><div className="flow-line"><b>{c.dna}</b><i>→</i><b>{c.explore}</b><i>→</i><b>{c.compare}</b><i>→</i><b>{c.watchlist}</b><i>→</i><b>{c.profile}</b></div></section>
    <p className="disclaimer">{c.educational}</p>
  </main>;

  if (screen === 'explore' || screen === 'screener') content = <main className="page catalog-page">
    <section className="page-heading"><div><span className="eyebrow">{c.universe}</span><h1>{screen === 'screener' ? c.screenerTitle : c.exploreTitle}</h1><p>{screen === 'screener' ? c.screenerLead : c.exploreLead}</p></div><div className="connection-card"><i /><div><b>{c.liveData}</b><span>{c.sourceStatus}</span></div></div></section>
    <CatalogControls advanced={screen === 'screener'} />
    <div className="results-count">{filteredCatalog.length} / {catalog.length}</div>
    <CatalogGrid />
  </main>;

  if (screen === 'detail') {
    const x = selectedInvestment;
    const match = x ? matchMap.get(x.id) : null;
    const why = normalizeJsonList(match?.explanation?.why_it_fits || match?.why_it_fits);
    const watches = normalizeJsonList(match?.explanation?.watchouts || match?.watchouts);
    const risks = normalizeJsonList(x?.profile_key_risks);
    content = <main className="page detail-page">
      {!x ? <EmptyState>{c.loading}</EmptyState> : <>
        <button className="back-link" onClick={() => go('explore')}>← {c.explore}</button>
        <section className="detail-hero"><div><div className="detail-chips"><span>{x.asset_type}</span><span>{x.category}</span><span>{x.region}</span></div><div className="symbol-big">{x.symbol}</div><h1>{x.name}</h1><p>{x.profile_summary || x.description || [x.strategy, x.issuer_name].filter(Boolean).join(' · ')}</p></div><div className="detail-actions">{match ? <div className="fit-score"><span>{c.dnaFit}</span><b>{Math.round(Number(match.match_score))}%</b><em>{match.fit_label || match.recommendation_tier?.replaceAll('_',' ')}</em></div> : <div className="fit-empty">{c.fitUnavailable}<button onClick={() => go('consent')}>{c.takeAssessment}</button></div>}<button className="secondary" onClick={() => toggleCompare(x.id)}>{compareIds.includes(x.id) ? c.removeCompare : c.addCompare}</button><button className="secondary" onClick={() => toggleWatchlist(x.id)}>{watchlist.some(w => w.investment_id === x.id) ? `★ ${c.saved}` : `☆ ${c.addWatchlist}`}</button></div></section>
        {detailLoading && <div className="loading-line" />}
        <section className="detail-stat-grid"><div><span>{c.price}</span><b>{fmtMoney(x.price, x.currency || 'CAD')}</b></div><div><span>{c.return1y}</span><b>{fmtPct(x.return_1y_pct)}</b></div><div><span>{c.mer}</span><b>{fmtPct(x.mer_pct,2)}</b></div><div><span>{c.risk}</span><b>{x.risk_level || '—'}</b></div><div><span>{c.yield}</span><b>{fmtPct(x.yield_pct,2)}</b></div><div><span>{c.aum}</span><b>{fmtCompact(x.aum)}</b></div></section>
        <div className="detail-columns">
          <section className="info-card"><h2>{c.overview}</h2><Info label={c.objective} value={x.profile_objective || x.description} /><Info label={c.benchmark} value={x.profile_benchmark} /><Info label={c.strategy} value={x.strategy || x.profile_management_style} /><Info label={c.issuer} value={x.issuer_name} /><Info label={c.region} value={x.region} /><Info label={c.currency} value={x.currency} /><Info label={c.inception} value={x.inception_date} /></section>
          <section className="info-card"><h2>{c.performance}</h2><Metric label={c.return3y} value={fmtPct(x.return_3y_annualized_pct)} /><Metric label={c.return5y} value={fmtPct(x.return_5y_annualized_pct)} /><Metric label={c.volatility} value={fmtPct(x.volatility_1y_pct)} /><Metric label={c.drawdown} value={fmtPct(x.max_drawdown_1y_pct)} /><Metric label={c.sharpe} value={x.sharpe_ratio == null ? '—' : Number(x.sharpe_ratio).toFixed(2)} /><Metric label={c.beta} value={x.beta == null ? '—' : Number(x.beta).toFixed(2)} /></section>
          <section className="info-card"><h2>{c.construction}</h2><Allocation label={c.equity} value={x.equity_pct} /><Allocation label={c.fixedIncome} value={x.fixed_income_pct} /><Info label={c.strategy} value={x.profile_portfolio_construction || x.profile_methodology} /><Info label={c.objective} value={x.profile_ideal_for} /></section>
          <section className="info-card"><h2>{match ? c.dnaFit : c.keyRisks}</h2>{match ? <><h3>{c.whyFits}</h3>{why.length ? <ul>{why.map((v,i)=><li key={i}>{String(v)}</li>)}</ul> : <p className="muted">{match.explanation?.summary || match.summary || '—'}</p>}<h3>{c.watch}</h3>{watches.length ? <ul>{watches.map((v,i)=><li key={i}>{String(v)}</li>)}</ul> : <p className="muted">—</p>}</> : risks.length ? <ul>{risks.map((v,i)=><li key={i}>{String(v)}</li>)}</ul> : <p className="muted">{x.profile_ideal_for || '—'}</p>}</section>
        </div>
      </>}
    </main>;
  }

  if (screen === 'compare') {
    const selected = compareIds.map(id => catalog.find(x => x.id === id)).filter(Boolean);
    const rows = [
      [c.risk, x => x.risk_level || '—'], [c.return1y, x => fmtPct(x.return_1y_pct)], [c.return3y, x => fmtPct(x.return_3y_annualized_pct)], [c.mer, x => fmtPct(x.mer_pct,2)], [c.yield, x => fmtPct(x.yield_pct,2)], [c.volatility, x => fmtPct(x.volatility_1y_pct)], [c.drawdown, x => fmtPct(x.max_drawdown_1y_pct)], [c.sharpe, x => x.sharpe_ratio == null ? '—' : Number(x.sharpe_ratio).toFixed(2)], [c.aum, x => fmtCompact(x.aum)], [c.equity, x => fmtPct(x.equity_pct)], [c.fixedIncome, x => fmtPct(x.fixed_income_pct)], [c.dnaFit, x => matchMap.get(x.id) ? `${Math.round(Number(matchMap.get(x.id).match_score))}%` : '—'],
    ];
    content = <main className="page"><section className="page-heading"><div><span className="eyebrow">{c.compare}</span><h1>{c.compareTitle}</h1><p>{c.compareLead}</p></div>{selected.length ? <button className="secondary" onClick={() => setCompareIds([])}>{c.clear}</button> : null}</section>{selected.length < 2 ? <><EmptyState>{c.needTwo}</EmptyState><div className="comparison-picker">{catalog.slice(0,6).map(x => <button key={x.id} onClick={() => toggleCompare(x.id)}>{x.symbol} · {x.name}</button>)}</div></> : <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>{c.metric}</th>{selected.map(x => <th key={x.id}><b>{x.symbol}</b><span>{x.name}</span><button onClick={() => openInvestment(x)}>{c.view}</button></th>)}</tr></thead><tbody>{rows.map(([label,getter]) => <tr key={label}><td>{label}</td>{selected.map(x => <td key={x.id}>{getter(x)}</td>)}</tr>)}</tbody></table></div>}</main>;
  }

  if (screen === 'watchlist') content = <main className="page"><section className="page-heading"><div><span className="eyebrow">{c.watchlist}</span><h1>{c.watchlistTitle}</h1><p>{c.watchlistLead}</p></div></section>{!authSession?.user ? <div className="auth-gate"><p>{c.authNeeded}</p><button className="primary" onClick={() => { setAuthMode('signin'); setAuthOpen(true); }}>{c.signIn}</button><button className="secondary" onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>{c.signUp}</button></div> : watchlist.length ? <div className="investment-grid">{watchlist.map(w => { const item = catalog.find(x => x.id === w.investment_id) || w; return <InvestmentCard key={w.investment_id} item={{ ...item, id: w.investment_id }} />; })}</div> : <EmptyState>{c.emptyWatchlist}</EmptyState>}</main>;

  if (screen === 'profile') content = <main className="page profile-page"><section className="page-heading"><div><span className="eyebrow">{c.profile}</span><h1>{c.profileTitle}</h1><p>{c.profileLead}</p></div>{authSession?.user && <button className="secondary" onClick={signOut}>{c.signOut}</button>}</section>{!authSession?.user ? <div className="auth-gate"><p>{c.authNeeded}</p><button className="primary" onClick={() => setAuthOpen(true)}>{c.signIn}</button></div> : <div className="profile-grid"><section className="profile-card"><span>{c.account}</span><h2>{profileHome?.display_name || authSession.user.email}</h2><p>{authSession.user.email}</p><div className="profile-stats"><div><b>{profileHome?.watchlist_count ?? watchlist.length}</b><span>{c.savedItems}</span></div><div><b>{savedDna?.latest_assessment_id ? '1' : '0'}</b><span>{c.latestDna}</span></div></div></section><section className="profile-card dna-profile-card">{savedDna ? <><span>{c.latestDna}</span><h2>{ARCHETYPE[savedDna.archetype]?.[language] || savedDna.archetype}</h2><div className="risk-bars"><RiskBar label={c.riskTolerance} value={savedDna.risk_tolerance} /><RiskBar label={c.riskCapacity} value={savedDna.risk_capacity} /></div><Info label={c.decisionStyle} value={savedDna.decision_style} /><Info label={c.pressureStyle} value={savedDna.pressure_style} /><button className="primary" onClick={() => go('consent')}>{c.retake}</button></> : <><span>{c.latestDna}</span><h2>{c.noSavedDna}</h2><button className="primary" onClick={() => go('consent')}>{c.takeAssessment}</button></>}</section></div>}</main>;

  if (screen === 'consent') content = <main className="assessment-shell"><section className="assessment-card consent-card"><Brand /><LanguagePicker language={language} setLanguage={setLanguage} /><span className="eyebrow">{c.before}</span><h1>{c.consentTitle}</h1><p>{c.consentBody}</p><div className="privacy-note"><b>{c.privacy}</b><span>{c.privacyBody}</span><small>{authSession?.user ? `${c.account}: ${authSession.user.email}` : c.anonymous}</small></div><button className="primary wide" disabled={busy} onClick={startAssessment}>{busy ? c.starting : `${c.start} →`}</button></section></main>;

  if (screen === 'quiz') {
    const q = questions[questionIndex];
    const value = q ? answers[q.question_id] : undefined;
    const opts = q ? optionArray(q, language) : [];
    const isScale = q?.question_type === 'scale';
    const progress = questions.length ? ((questionIndex + 1) / questions.length) * 100 : 0;
    content = <main className="assessment-shell"><section className="assessment-card quiz-card"><div className="quiz-head"><Brand compact /><LanguagePicker language={language} setLanguage={setLanguage} /><span>{c.question} {questionIndex + 1} {c.of} {questions.length}</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div>{q ? <><span className="eyebrow">{sectionName(q.section, c)}</span><h1>{questionPrompt(q, language)}</h1>{isScale ? <div className="scale-block"><b>{value ?? 5}</b><input type="range" min="0" max="10" step="1" value={value ?? 5} onChange={e => saveAnswer(q.question_id, Number(e.target.value))} /><div><span>{c.notAtAll}</span><span>{c.extremely}</span></div></div> : <div className="answer-list">{opts.map((o, i) => { const ov = typeof o === 'object' ? (o.value ?? o.key ?? i) : o; const label = typeof o === 'object' ? (o.label ?? o.label_en ?? String(ov)) : String(o); return <button key={`${ov}-${i}`} className={value === ov ? 'selected' : ''} onClick={() => saveAnswer(q.question_id, ov)}><span>{String.fromCharCode(65+i)}</span><b>{label}</b>{value === ov && <em>✓</em>}</button>; })}</div>}<div className="quiz-footer"><button className="secondary" disabled={questionIndex === 0} onClick={() => setQuestionIndex(i => i - 1)}>← {c.back}</button>{questionIndex < questions.length - 1 ? <button className="primary" disabled={value === undefined} onClick={() => setQuestionIndex(i => i + 1)}>{c.next} →</button> : <button className="primary" disabled={value === undefined || busy} onClick={submitAssessment}>{busy ? c.analyzing : `${c.reveal} →`}</button>}</div></> : <div className="loading-panel">{c.loading}</div>}</section></main>;
  }

  if (screen === 'result') {
    const r = result?.result || result || savedDna || {};
    const f = result?.fingerprint || savedDna || {};
    const archetype = r.archetype || savedDna?.archetype;
    const strengths = normalizeJsonList(f.strengths || savedDna?.strengths);
    const watchouts = normalizeJsonList(f.watchouts || savedDna?.watchouts);
    const image = archetype ? `/characters/${String(archetype).toLowerCase()}.png` : null;
    content = <main className="assessment-shell result-shell"><section className="result-card"><div className="result-top"><div><Brand compact /><span className="eyebrow">{c.resultEyebrow}</span><h1>{ARCHETYPE[archetype]?.[language] || archetype || c.profileTitle}</h1></div>{image && <img src={image} alt="" />}</div><section><h2>{c.riskProfile}</h2><div className="risk-result-grid"><RiskBar label={c.riskTolerance} value={r.risk_tolerance} /><RiskBar label={c.riskCapacity} value={r.risk_capacity} /></div></section><section><h2>{c.fingerprint}</h2><div className="fingerprint-grid"><div><span>{c.decisionStyle}</span><b>{f.decision_style || '—'}</b></div><div><span>{c.pressureStyle}</span><b>{f.pressure_style || '—'}</b></div></div></section><section className="insight-grid"><div><h2>{c.strengths}</h2>{strengths.length ? <ul>{strengths.map((x,i)=><li key={i}>{String(x).replaceAll('_',' ')}</li>)}</ul> : <p>—</p>}</div><div><h2>{c.watchouts}</h2>{watchouts.length ? <ul>{watchouts.map((x,i)=><li key={i}>{String(x).replaceAll('_',' ')}</li>)}</ul> : <p>—</p>}</div></section><div className="result-actions"><button className="primary" onClick={() => go('context')}>{c.completeContext} →</button><button className="secondary" onClick={() => { setSortBy('match'); go('explore'); }}>{c.seeMatches} →</button>{!assessmentSession?.account_linked && <button className="secondary accent" onClick={requestSaveDna}>{c.saveAndReturn}</button>}</div><p className="disclaimer">{c.educational}</p></section></main>;
  }

  if (screen === 'context') content = <main className="assessment-shell"><section className="assessment-card context-card"><div className="quiz-head"><Brand compact /><LanguagePicker language={language} setLanguage={setLanguage} /></div><span className="eyebrow">{c.dna}</span><h1>{c.contextTitle}</h1><p>{c.contextLead}</p><div className="context-grid"><Field label={c.firstName}><input value={context.first_name} onChange={e => setContext(v => ({ ...v, first_name: e.target.value }))} /></Field><Field label={c.age}><input type="number" min="18" max="100" value={context.age} onChange={e => setContext(v => ({ ...v, age: e.target.value }))} /></Field><Field label={c.amountOptional}><input type="number" min="0" value={context.amount_to_invest} onChange={e => setContext(v => ({ ...v, amount_to_invest: e.target.value }))} placeholder="CAD" /></Field><ContextSelect label={c.goal} field="goal" value={context.goal} setContext={setContext} c={c} /><ContextSelect label={c.horizon} field="time_horizon" value={context.time_horizon} setContext={setContext} c={c} /><ContextSelect label={c.liquidity} field="liquidity_need" value={context.liquidity_need} setContext={setContext} c={c} /><ContextSelect label={c.requiredReturn} field="required_return" value={context.required_return} setContext={setContext} c={c} /><ContextSelect label={c.lossImpact} field="loss_consequence" value={context.loss_consequence} setContext={setContext} c={c} /><ContextSelect label={c.experience} field="experience" value={context.experience} setContext={setContext} c={c} /></div><div className="result-actions"><button className="primary" disabled={busy} onClick={saveContext}>{busy ? c.analyzing : c.finishContext}</button><button className="secondary" onClick={() => go('result')}>{c.skipContext}</button></div></section></main>;

  return <div className={`platform-app ${language === 'fa' ? 'rtl' : ''}`}>
    {!['consent','quiz','result','context'].includes(screen) && nav}
    {content}
    {(error || notice) && <div className={`toast ${error ? 'error' : 'success'}`}><span>{error || notice}</span><button onClick={() => { setError(''); setNotice(''); }}>×</button></div>}
    {compareIds.length > 0 && !['compare','quiz','result','context','consent'].includes(screen) && <button className="compare-float" onClick={() => go('compare')}>{c.compare} · {compareIds.length}</button>}
    {authOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false); }}><section className="auth-modal"><button className="modal-close" onClick={() => setAuthOpen(false)}>×</button><Brand compact /><span className="eyebrow">{c.optionalAccount}</span><h2>{authMode === 'signin' ? c.authTitleIn : c.authTitleUp}</h2><form onSubmit={submitAuth}><label>{c.email}<input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} /></label><label>{c.password}<input type="password" minLength="6" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder={c.passwordHint} /></label><button className="primary wide" disabled={busy}>{busy ? c.analyzing : authMode === 'signin' ? c.submitIn : c.submitUp}</button></form><button className="text-button" onClick={() => setAuthMode(m => m === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? c.switchUp : c.switchIn}</button></section></div>}
  </div>;
}

function Info({ label, value }) { return <div className="info-row"><span>{label}</span><b>{value || '—'}</b></div>; }
function Metric({ label, value }) { return <div className="metric-row"><span>{label}</span><b>{value}</b></div>; }
function Allocation({ label, value }) { const n = Math.max(0, Math.min(100, Number(value) || 0)); return <div className="allocation"><div><span>{label}</span><b>{value == null ? '—' : `${n.toFixed(0)}%`}</b></div><div className="allocation-track"><i style={{ width: `${n}%` }} /></div></div>; }
function RiskBar({ label, value }) { const n = Math.max(0, Math.min(100, Number(value) || 0)); return <div className="risk-bar"><div><span>{label}</span><b>{n.toFixed(0)}</b></div><div><i style={{ width: `${n}%` }} /></div></div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function ContextSelect({ label, field, value, setContext, c }) { return <Field label={label}><select value={value} onChange={e => setContext(v => ({ ...v, [field]: e.target.value }))}>{CONTEXT_OPTIONS[field].map(([v,key]) => <option key={v} value={v}>{c[key]}</option>)}</select></Field>; }
