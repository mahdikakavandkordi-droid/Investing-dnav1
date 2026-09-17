-- Keep the raw Product Risk sensor table intentionally service-only while satisfying the explicit-policy contract.
create policy product_risk_sensor_evidence_service_only
on public.product_risk_sensor_evidence
for all to service_role
using (true)
with check (true);
