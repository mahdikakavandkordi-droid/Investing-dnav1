-- Align account table grants with the existing authenticated-only RLS policies.

revoke all privileges on table
  public.watchlists,
  public.watchlist_items,
  public.investor_saved_comparisons,
  public.investor_activity_events,
  public.report_snapshots
from anon;

revoke all privileges on table
  public.watchlists,
  public.watchlist_items,
  public.investor_saved_comparisons
from authenticated;

grant select, insert, update, delete on table
  public.watchlists,
  public.watchlist_items,
  public.investor_saved_comparisons
to authenticated;

revoke all privileges on table
  public.investor_activity_events,
  public.report_snapshots
from authenticated;

grant select on table
  public.investor_activity_events,
  public.report_snapshots
to authenticated;
