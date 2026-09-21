-- Wording revision only: preserve the original instrument, dimensions and score mappings.
-- Engineering cohort; wording has not been psychometrically validated.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.question_bank WHERE version='v1.10-cognitive-candidate' AND active) <> 28 THEN
  RAISE EXCEPTION 'Expected 28 source questions';
 END IF;
END $$;
INSERT INTO public.question_bank
SELECT (jsonb_populate_record(NULL::public.question_bank,
 to_jsonb(q) || jsonb_build_object('version','v1.10-clarity-1'))).*
FROM public.question_bank q WHERE version='v1.10-cognitive-candidate';

UPDATE public.question_bank q
SET prompt_en=p.prompt_en, prompt_fa=p.prompt_fa, prompt_fr=p.prompt_fr
FROM jsonb_to_recordset($wording$[
  {
    "question_id": "BD01",
    "prompt_en": "A friend, coworker, or online creator says an investment made them a lot of money. Before checking the investment and whether it suits you, how much would their success increase your willingness to put money into it (not just learn more about it)?",
    "prompt_fa": "یکی از دوستان، همکاران یا تولیدکنندگان محتوا می‌گوید از یک سرمایه‌گذاری سود زیادی کرده است. پیش از بررسی آن سرمایه‌گذاری و مناسب‌بودنش برای خودت، موفقیت او چقدر تمایل تو را به پول‌گذاشتن در آن افزایش می‌دهد (نه فقط کسب اطلاعات بیشتر)؟",
    "prompt_fr": "Un ami, un collègue ou un créateur de contenu dit avoir gagné beaucoup avec un placement. Avant de vérifier ce placement et son adéquation à votre situation, dans quelle mesure sa réussite augmenterait-elle votre volonté d’y placer de l’argent (et pas seulement de vous renseigner) ?"
  },
  {
    "question_id": "BD05",
    "prompt_en": "You paid $100 for an investment. It is now worth $60, and its prospects have worsened. Ignore taxes and transaction costs. When deciding what to do next, how much would the price you originally paid influence you?",
    "prompt_fa": "برای یک سرمایه‌گذاری ۱۰۰ دلار پرداخت کرده‌ای. اکنون ۶۰ دلار می‌ارزد و چشم‌اندازش بدتر شده است. مالیات و هزینه معامله را نادیده بگیر. هنگام تصمیم‌گیری برای قدم بعدی، قیمت خرید اولیه چقدر بر تو اثر می‌گذارد؟",
    "prompt_fr": "Vous avez payé 100 $ pour un placement qui vaut maintenant 60 $, et ses perspectives se sont dégradées. Ignorez les impôts et les frais de transaction. Dans quelle mesure le prix d’achat initial influencerait-il votre prochaine décision ?"
  },
  {
    "question_id": "BD10",
    "prompt_en": "Imagine you sold an investment and it later rose a lot. If you felt regret, how much would that feeling affect your next investment decision? Choose “Not at all” if you would not feel regret or it would not affect your decision.",
    "prompt_fa": "فرض کن سرمایه‌گذاری‌ای را فروخته‌ای و بعد ارزشش خیلی بالا رفته است. اگر احساس پشیمانی کنی، این احساس چقدر بر تصمیم سرمایه‌گذاری بعدی‌ات اثر می‌گذارد؟ اگر پشیمان نمی‌شوی یا این احساس بر تصمیم تو اثر ندارد، «اصلاً» را انتخاب کن.",
    "prompt_fr": "Imaginez avoir vendu un placement dont la valeur augmente ensuite beaucoup. Si vous ressentiez du regret, dans quelle mesure ce sentiment influencerait-il votre prochaine décision de placement ? Choisissez « Pas du tout » si vous ne ressentiriez aucun regret ou s’il n’influencerait pas votre décision."
  },
  {
    "question_id": "RC01",
    "prompt_en": "Thinking about an average month over the next 12 months, what share of the after-tax money available for your household budget would remain after essential costs and required debt payments? Include pay, pension, benefits and planned withdrawals from savings. For irregular income, use a cautious monthly average; do not count borrowing or hoped-for investment gains.",
    "prompt_fa": "با درنظرگرفتن میانگین ماهانه در ۱۲ ماه آینده، چه سهمی از پول پس از مالیاتِ در دسترس برای بودجه خانوار، بعد از هزینه‌های ضروری و اقساط الزامی باقی می‌ماند؟ حقوق، مستمری، کمک‌هزینه و برداشت برنامه‌ریزی‌شده از پس‌انداز را حساب کن. برای درآمد نامنظم، میانگین ماهانه محتاطانه‌ای در نظر بگیر؛ وام و سود احتمالی سرمایه‌گذاری را حساب نکن.",
    "prompt_fr": "Pour un mois moyen des 12 prochains mois, quelle part des fonds après impôt disponibles pour le budget du ménage resterait après les dépenses essentielles et les remboursements obligatoires ? Incluez salaire, pension, prestations et retraits prévus de l’épargne. Pour des revenus irréguliers, utilisez une moyenne mensuelle prudente ; excluez les emprunts et les gains de placement espérés."
  },
  {
    "question_id": "RC02",
    "prompt_en": "How predictable are the funds you rely on for essential living costs over the next 12 months? Include income, pension, benefits or planned withdrawals from savings; having no salary does not by itself make these funds unpredictable.",
    "prompt_fa": "پولی که در ۱۲ ماه آینده برای هزینه‌های ضروری زندگی به آن تکیه می‌کنی چقدر قابل پیش‌بینی است؟ درآمد، مستمری، کمک‌هزینه یا برداشت برنامه‌ریزی‌شده از پس‌انداز را در نظر بگیر؛ نداشتن حقوق به‌تنهایی به معنی غیرقابل‌پیش‌بینی‌بودن این پول نیست.",
    "prompt_fr": "Dans quelle mesure les fonds sur lesquels vous comptez pour vos dépenses essentielles sont-ils prévisibles sur les 12 prochains mois ? Incluez revenus, pension, prestations ou retraits prévus de l’épargne ; ne pas avoir de salaire ne rend pas ces fonds imprévisibles en soi."
  },
  {
    "question_id": "RC03",
    "prompt_en": "If the funds you normally use for living costs stopped being available, how long could your accessible emergency money cover essential household expenses without borrowing or selling the investments you are assessing? A separate account is not required: count only money available for emergencies, outside the investments at risk and not already committed to planned spending.",
    "prompt_fa": "اگر پولی که معمولاً هزینه زندگی را از آن می‌پردازی دیگر در دسترس نباشد، ذخیره اضطراریِ قابل‌برداشتت تا چه مدت هزینه‌های ضروری خانوار را پوشش می‌دهد، بدون وام‌گرفتن یا فروش سرمایه‌گذاری مورد ارزیابی؟ حساب جدا لازم نیست؛ فقط پولِ در دسترس برای وضعیت اضطراری را حساب کن که جزو سرمایه در معرض زیان نیست و برای مخارج برنامه‌ریزی‌شده کنار گذاشته نشده است.",
    "prompt_fr": "Si les fonds que vous utilisez habituellement pour vivre n’étaient plus disponibles, combien de temps votre réserve d’urgence accessible couvrirait-elle les dépenses essentielles du ménage, sans emprunter ni vendre les placements évalués ? Un compte distinct n’est pas nécessaire : comptez uniquement les fonds accessibles en cas d’urgence, hors des placements exposés aux pertes et non déjà affectés aux dépenses prévues."
  },
  {
    "question_id": "RC05",
    "prompt_en": "Think of the money you are considering investing or keeping invested, excluding the emergency reserve you counted earlier. If those investments lost 20% and did not recover before you needed the money, would your household have to cut essential spending or miss an important financial commitment?",
    "prompt_fa": "پولی را در نظر بگیر که قصد سرمایه‌گذاری یا نگه‌داشتن آن در سرمایه‌گذاری را داری؛ ذخیره اضطراری‌ای را که قبلاً حساب کردی کنار بگذار. اگر این سرمایه‌گذاری‌ها ۲۰٪ افت کنند و تا زمان نیاز به پول جبران نشوند، آیا خانوارت مجبور می‌شود هزینه‌های ضروری را کاهش دهد یا از انجام یک تعهد مالی مهم بازبماند؟",
    "prompt_fr": "Pensez à l’argent que vous envisagez d’investir ou de conserver investi, en excluant la réserve d’urgence comptée précédemment. Si ces placements perdaient 20 % sans récupérer avant que vous ayez besoin de cet argent, votre ménage devrait-il réduire ses dépenses essentielles ou manquer un engagement financier important ?"
  }
]$wording$::jsonb)
 AS p(question_id text,prompt_en text,prompt_fa text,prompt_fr text)
WHERE q.version='v1.10-clarity-1' AND q.question_id=p.question_id;

-- RC01 now explicitly includes budgeted withdrawals: keep numeric option boundaries unchanged.
UPDATE public.question_bank SET
 options=jsonb_set(options,'{0,label}','"Nothing is left, or essential costs exceed available funds"'),
 options_fa=jsonb_set(options_fa,'{0,label}','"چیزی باقی نمی‌ماند یا هزینه‌های ضروری بیشتر از پول در دسترس است"'),
 options_fr=jsonb_set(options_fr,'{0,label}','"Il ne reste rien, ou les dépenses essentielles dépassent les fonds disponibles"')
WHERE version='v1.10-clarity-1' AND question_id='RC01';

INSERT INTO public.scoring_dimensions(version,section,dimension_key,display_name,weight,min_score,max_score,is_core)
SELECT 'v1.10-clarity-1',section,dimension_key,display_name,weight,min_score,max_score,is_core
FROM public.scoring_dimensions WHERE version='v1.10-cognitive-candidate';
INSERT INTO public.pilot_cohorts(code,questionnaire_version,model_version,target_n,status,notes)
VALUES ('DEV_V1_10_CLARITY','v1.10-clarity-1','dna-v1.10-research',9999,'collecting',
'Engineering only. Seven prompts clarified in EN/FA/FR; same 28 items, score mappings, weights and capacity guards. Do not pool with the original instrument for validation.');
