# Investing DNA

Premium investor personality assessment frontend.

## Flow
Landing → Consent → 36 questions → autosave → submit → Investor DNA result.

## Backend
Uses the existing Supabase `investing-dna-pilot` v2 Edge Function with public URL + anon/publishable key only.

Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the deployment environment. Never use a service-role key in the browser.
