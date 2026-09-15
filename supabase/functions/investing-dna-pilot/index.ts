import { createClient } from '@supabase/supabase-js';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const EVENT_NAMES = new Set([
  'app_session_started','explore_viewed','assessment_started','assessment_completed','dna_result_viewed',
  'secure_link_requested','signup_requested','dna_claimed','investment_context_saved','match_viewed','fund_viewed',
  'screener_viewed','compare_viewed','watchlist_saved','watchlist_removed','watchlist_viewed','profile_viewed','feedback_submitted'
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function sha256(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
const langOf = (value: unknown) => value === 'fr' || value === 'fa' ? value : 'en';
const uuidOrNull = (value: unknown) => typeof value === 'string' && UUID_RE.test(value) ? value : null;
function cleanMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const allowed = new Set(['source','status','cohort_code','questionnaire_version','model_version','fit_status','selected_count','mode','returning']);
  const out: Record<string,string|number|boolean|null> = {};
  for (const [key,raw] of Object.entries(value as Record<string,unknown>)) {
    if (!allowed.has(key)) continue;
    if (typeof raw === 'string') out[key] = raw.slice(0, 100);
    else if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw;
    else if (typeof raw === 'boolean' || raw === null) out[key] = raw;
  }
  return out;
}
async function profileIdFor(admin: any, authUser: any) {
  if (!authUser?.id) return null;
  const { data } = await admin.from('profiles').select('id').eq('user_id', authUser.id).maybeSingle();
  return data?.id ?? null;
}
async function recordEvent(admin: any, authUser: any, body: any, eventName: string, extras: any = {}) {
  try {
    if (!EVENT_NAMES.has(eventName)) return false;
    const browserSessionId = uuidOrNull(body?.browser_session_id);
    const visitorId = uuidOrNull(body?.visitor_id);
    if (!browserSessionId) return false;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin.from('pilot_product_events').select('id', { count: 'exact', head: true })
      .eq('browser_session_id', browserSessionId).gte('created_at', since);
    if ((count ?? 0) >= 250) return false;
    const profileId = extras.profile_id ?? await profileIdFor(admin, authUser);
    const route = typeof extras.route === 'string' ? extras.route.slice(0, 180) : typeof body?.route === 'string' ? body.route.slice(0, 180) : null;
    const investmentId = uuidOrNull(extras.investment_id ?? body?.investment_id);
    const assessmentId = uuidOrNull(extras.assessment_id ?? body?.assessment_id);
    const metadata = cleanMetadata(extras.metadata ?? body?.metadata);
    const { error } = await admin.from('pilot_product_events').insert({
      browser_session_id: browserSessionId,
      visitor_id: visitorId,
      user_id: authUser?.id ?? null,
      profile_id: profileId,
      assessment_id: assessmentId,
      investment_id: investmentId,
      event_name: eventName,
      route,
      metadata,
    });
    return !error;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !serviceKey || !anonKey) return json({ error: 'Server configuration unavailable' }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const authHeader = req.headers.get('Authorization');
  const userClient = authHeader ? createClient(url, anonKey, { auth: { persistSession: false }, global: { headers: { Authorization: authHeader } } }) : null;
  let authUser: any = null;
  try {
    if (userClient) {
      const token = authHeader!.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await userClient.auth.getUser(token);
      authUser = user ?? null;
    }
  } catch { authUser = null; }

  try {
    const body = await req.json();
    const action = body?.action;
    if (!['start','questionnaire','save_answers','submit','save_context','claim_assessment','track_event','submit_feedback'].includes(action)) {
      return json({ error: 'Unsupported action' }, 400);
    }

    if (action === 'track_event') {
      if (!EVENT_NAMES.has(body?.event_name)) return json({ error: 'Unsupported event' }, 400);
      if (!uuidOrNull(body?.browser_session_id) || !uuidOrNull(body?.visitor_id)) return json({ error: 'Valid browser session and visitor IDs required' }, 400);
      const tracked = await recordEvent(admin, authUser, body, body.event_name);
      return json({ tracked });
    }

    if (action === 'submit_feedback') {
      const browserSessionId = uuidOrNull(body?.browser_session_id);
      const visitorId = uuidOrNull(body?.visitor_id);
      const score = (value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5 ? Number(value) : null;
      const ease = score(body?.ease_score), trust = score(body?.trust_score), usefulness = score(body?.usefulness_score);
      if (!browserSessionId || !visitorId || !ease || !trust || !usefulness || typeof body?.understood_match !== 'boolean' || typeof body?.would_return !== 'boolean') {
        return json({ error: 'Complete all pilot feedback fields' }, 400);
      }
      const openFeedback = typeof body?.open_feedback === 'string' ? body.open_feedback.trim().slice(0, 1500) : null;
      const assessmentId = uuidOrNull(body?.assessment_id);
      const now = new Date().toISOString();
      const { error } = await admin.from('pilot_feedback').upsert({
        browser_session_id: browserSessionId,
        visitor_id: visitorId,
        user_id: authUser?.id ?? null,
        assessment_id: assessmentId,
        ease_score: ease,
        trust_score: trust,
        usefulness_score: usefulness,
        understood_match: body.understood_match,
        would_return: body.would_return,
        open_feedback: openFeedback || null,
        updated_at: now,
      }, { onConflict: 'browser_session_id' });
      if (error) return json({ error: 'Unable to save feedback' }, 500);
      await recordEvent(admin, authUser, body, 'feedback_submitted', { assessment_id: assessmentId });
      return json({ saved: true });
    }

    if (action === 'start') {
      const cohortCode = body?.cohort_code ?? 'DEV_V1_10';
      const language_code = langOf(body?.language_code);
      const consentVersion = body?.consent_version ?? `platform-${language_code}`;
      const { data: cohort, error: ce } = await admin.from('pilot_cohorts').select('id,code,questionnaire_version,model_version,status,access_code_hash').eq('code', cohortCode).single();
      if (ce || !cohort || !['planned','collecting'].includes(cohort.status)) return json({ error: 'Pilot cohort unavailable' }, 400);
      if (cohort.access_code_hash) {
        const accessCode = typeof body?.cohort_access_code === 'string' ? body.cohort_access_code.trim() : '';
        if (!accessCode || accessCode.length > 100 || await sha256(accessCode) !== cohort.access_code_hash) return json({ error: 'Invalid research invite code' }, 403);
      }

      let profileId: string | null = null;
      if (authUser) {
        const { data: profile, error } = await userClient!.rpc('get_or_create_current_profile');
        if (error || !profile?.id) return json({ error: 'Unable to establish investor profile' }, 500);
        profileId = profile.id;
      }

      const sessionToken = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-','')}`;
      const hash = await sha256(sessionToken);
      const anon = `P-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      const { data: participant, error: pe } = await admin.from('pilot_participants').insert({
        cohort_id: cohort.id,
        anonymous_code: anon,
        consent_version: consentVersion,
        consented_at: new Date().toISOString(),
        session_token_hash: hash,
        language_code,
      }).select('id,anonymous_code,language_code').single();
      if (pe) throw pe;

      const { data: assessment, error: ae } = await admin.from('assessments').insert({
        pilot_participant_id: participant.id,
        profile_id: profileId,
        assessment_version: cohort.questionnaire_version,
        questionnaire_version: cohort.questionnaire_version,
        model_version: cohort.model_version,
        scoring_version: cohort.model_version,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        language_code,
      }).select('id,questionnaire_version,model_version,status,language_code,profile_id').single();
      if (ae) throw ae;
      await admin.from('pilot_cohorts').update({ status: 'collecting' }).eq('id', cohort.id);
      await recordEvent(admin, authUser, body, 'assessment_started', { assessment_id: assessment.id, profile_id: profileId, metadata: { cohort_code: cohort.code, questionnaire_version: assessment.questionnaire_version, model_version: assessment.model_version } });
      return json({
        participant_id: participant.id,
        anonymous_code: participant.anonymous_code,
        session_token: sessionToken,
        assessment_id: assessment.id,
        questionnaire_version: assessment.questionnaire_version,
        model_version: assessment.model_version,
        language_code,
        profile_id: profileId,
        account_linked: !!profileId,
      });
    }

    const assessmentId = body?.assessment_id;
    const sessionToken = body?.session_token;
    if (!assessmentId || !sessionToken) return json({ error: 'assessment_id and session_token required' }, 400);
    const hash = await sha256(sessionToken);
    const { data: assessment, error: ae } = await admin.from('assessments').select('id,status,questionnaire_version,pilot_participant_id,language_code,profile_id').eq('id', assessmentId).single();
    if (ae || !assessment) return json({ error: 'Assessment not found' }, 404);
    const { data: participant, error: pe } = await admin.from('pilot_participants').select('id,language_code').eq('id', assessment.pilot_participant_id).eq('session_token_hash', hash).is('withdrawn_at', null).single();
    if (pe || !participant) return json({ error: 'Invalid session' }, 401);

    if (assessment.profile_id) {
      if (!authUser) return json({ error: 'Sign in to access your saved assessment.' }, 401);
      const { data: owner } = await admin.from('profiles').select('user_id').eq('id', assessment.profile_id).single();
      if (owner?.user_id !== authUser.id) return json({ error: 'Assessment is not owned by this account.' }, 403);
    }
    if (action === 'claim_assessment') {
      if (!authUser) return json({ error: 'Authentication required to save your DNA' }, 401);
      const { data: profile, error } = await userClient!.rpc('get_or_create_current_profile');
      if (error || !profile?.id) return json({ error: 'Unable to establish investor profile' }, 500);
      const { data, error: claimError } = await admin.rpc('service_claim_assessment', { p_assessment_id: assessmentId, p_profile_id: profile.id });
      if (claimError) return json({ error: claimError.message }, 400);
      await recordEvent(admin, authUser, body, 'dna_claimed', { assessment_id: assessmentId, profile_id: profile.id });
      return json(data);
    }

    if (action === 'questionnaire') {
      const language = langOf(assessment.language_code || participant.language_code);
      const { data: rows, error } = await admin.from('question_bank')
        .select('question_id,version,section,construct,construct_role,question_type,prompt_en,prompt_fr,prompt_fa,options,options_fr,options_fa,sort_order,weight')
        .eq('version', assessment.questionnaire_version).eq('active', true).order('sort_order');
      if (error) throw error;
      const questions = (rows ?? []).map((x: any) => ({
        ...x,
        prompt: language === 'fr' ? (x.prompt_fr || x.prompt_en) : language === 'fa' ? (x.prompt_fa || x.prompt_en) : x.prompt_en,
        options: language === 'fr' ? (x.options_fr?.length ? x.options_fr : x.options) : language === 'fa' ? (x.options_fa?.length ? x.options_fa : x.options) : x.options,
      }));
      return json({ assessment_id: assessmentId, questionnaire_version: assessment.questionnaire_version, language_code: language, questions });
    }

    if (action === 'save_answers') {
      const answers = body?.answers;
      if (!Array.isArray(answers) || !answers.length) return json({ error: 'answers array required' }, 400);
      if (assessment.status !== 'in_progress') {
        const { data: saved, error } = await admin.from('answers').select('question_id,answer_value').eq('assessment_id', assessmentId);
        const byId = new Map((saved ?? []).map((x: any) => [x.question_id, JSON.stringify(x.answer_value)]));
        if (error || assessment.status !== 'completed' || answers.some((x: any) => byId.get(x.question_id) !== JSON.stringify(x.answer_value))) {
          return json({ error: 'Completed answers cannot be changed. Start a new assessment.' }, 409);
        }
        return json({ saved: answers.length, already_completed: true });
      }
      const { data: bank, error: bankError } = await admin.from('question_bank').select('question_id,question_type,options').eq('version', assessment.questionnaire_version).eq('active', true);
      if (bankError) throw bankError;
      const known = new Map((bank ?? []).map((x: any) => [x.question_id, x]));
      for (const answer of answers) {
        const q: any = known.get(answer?.question_id);
        if (!q) return json({ error: 'Unknown assessment question.' }, 400);
        const value = answer?.answer_value?.value;
        if (q.question_type === 'multi_choice') {
          if (!Array.isArray(value) || !value.length || new Set(value).size !== value.length || (value.includes('none') && value.length > 1) || value.some((v: string) => !q.options.some((o: any) => o.value === v))) return json({ error: 'Choose valid product experience options.' }, 400);
        } else if (Array.isArray(value) || typeof value !== 'string' || (q.question_type !== 'scale' && !q.options.some((o: any) => String(o.value) === value))) return json({ error: 'Choose a valid answer.' }, 400);
      }
      const rows = answers.map((x: any) => ({ assessment_id: assessmentId, question_id: x.question_id, answer_value: x.answer_value, answered_at: new Date().toISOString() }));
      const { error } = await admin.from('answers').upsert(rows, { onConflict: 'assessment_id,question_id' });
      if (error) throw error;
      return json({ saved: rows.length });
    }

    if (action === 'save_context') {
      if (!body?.context || typeof body.context !== 'object' || Array.isArray(body.context)) return json({ error: 'context object required' }, 400);
      const { data, error } = await admin.rpc('service_save_investment_context', { p_assessment_id: assessmentId, p_context: body.context });
      if (error) return json({ error: error.message }, 400);
      await recordEvent(admin, authUser, body, 'investment_context_saved', { assessment_id: assessmentId, profile_id: assessment.profile_id });
      return json(data);
    }

    const { data, error } = await admin.rpc('complete_dna_assessment', { p_assessment_id: assessmentId });
    if (error) return json({ error: error.message }, 400);
    await recordEvent(admin, authUser, body, 'assessment_completed', { assessment_id: assessmentId, profile_id: assessment.profile_id, metadata: { questionnaire_version: assessment.questionnaire_version } });
    return json(data);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 500);
  }
});
