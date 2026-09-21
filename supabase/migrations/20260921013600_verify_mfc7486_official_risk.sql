-- Verify the official risk classification for Mackenzie All-Equity ETF Portfolio Series A.
-- Allocation-derived Investment DNA remains fail-closed until a complete sourced
-- allocation is stored; this official risk label is independent of that guard.

insert into public.investment_official_risk_ratings(
 investment_id,official_risk_rating,band_min,band_max,issuer,source_type,source_title,
 source_url,source_date,effective_date,methodology,verification_note,verified_at,updated_at
)
values(
 (select id from public.investments where symbol='MFC7486' and exchange='FUND'),
 'Medium',40,60,'Mackenzie Investments','Issuer Fund Profile',
 'Mackenzie All-Equity ETF Portfolio Series A Fund Profile',
 'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-all-equity-etf-portfolio-a-07486-en.pdf','2026-07-31','2026-07-31',
 'Issuer-disclosed Canadian fund risk tolerance from the current Series A fund profile.',
 'Official Mackenzie fund profile states the fund is rated Medium risk. Allocation-derived DNA signals remain withheld until a complete sourced allocation is stored.',
 now(),now()
)
on conflict(investment_id) do update set
 official_risk_rating=excluded.official_risk_rating,
 band_min=excluded.band_min,
 band_max=excluded.band_max,
 issuer=excluded.issuer,
 source_type=excluded.source_type,
 source_title=excluded.source_title,
 source_url=excluded.source_url,
 source_date=excluded.source_date,
 effective_date=excluded.effective_date,
 methodology=excluded.methodology,
 verification_note=excluded.verification_note,
 verified_at=excluded.verified_at,
 updated_at=excluded.updated_at;
