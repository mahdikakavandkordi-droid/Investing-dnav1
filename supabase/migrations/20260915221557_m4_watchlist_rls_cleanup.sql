drop policy if exists "users can delete own watchlists" on public.watchlists;
drop policy if exists "users can create own watchlists" on public.watchlists;
drop policy if exists "users can read own watchlists" on public.watchlists;
drop policy if exists "users can update own watchlists" on public.watchlists;

drop policy if exists "users can delete own watchlist items" on public.watchlist_items;
drop policy if exists "users can create own watchlist items" on public.watchlist_items;
drop policy if exists "users can read own watchlist items" on public.watchlist_items;
drop policy if exists "users can update own watchlist items" on public.watchlist_items;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
