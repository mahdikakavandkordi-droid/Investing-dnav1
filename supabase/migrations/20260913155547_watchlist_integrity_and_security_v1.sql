alter table public.watchlists drop constraint if exists watchlists_profile_id_fkey;
alter table public.watchlists add constraint watchlists_profile_id_fkey foreign key (profile_id) references public.profiles(id) on delete cascade;

alter table public.watchlist_items drop constraint if exists watchlist_items_watchlist_id_fkey;
alter table public.watchlist_items add constraint watchlist_items_watchlist_id_fkey foreign key (watchlist_id) references public.watchlists(id) on delete cascade;

alter table public.watchlist_items drop constraint if exists watchlist_items_investment_id_fkey;
alter table public.watchlist_items add constraint watchlist_items_investment_id_fkey foreign key (investment_id) references public.investments(id) on delete cascade;

-- Security-definer RPCs must enforce ownership themselves. The current V1
-- functions are intended for server-side orchestration only.
revoke all on function public.get_or_create_watchlist(uuid) from public, anon, authenticated;
revoke all on function public.add_to_watchlist(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.remove_from_watchlist(uuid,uuid) from public, anon, authenticated;
revoke all on function public.get_watchlist(uuid) from public, anon, authenticated;

create index if not exists watchlists_profile_id_idx on public.watchlists(profile_id);
create index if not exists watchlist_items_watchlist_id_idx on public.watchlist_items(watchlist_id);
create index if not exists watchlist_items_investment_id_idx on public.watchlist_items(investment_id);