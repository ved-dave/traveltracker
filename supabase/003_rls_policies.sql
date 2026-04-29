-- Enable RLS
alter table public.users enable row level security;
alter table public.maps  enable row level security;

-- USERS table policies
-- Anyone can read users (needed for username lookup on profile pages)
create policy "users: public read"
  on public.users for select
  using (true);

-- Only the authenticated user can insert their own row
create policy "users: insert own"
  on public.users for insert
  with check (auth.uid() = id);

-- Only the authenticated user can update their own row
create policy "users: update own"
  on public.users for update
  using (auth.uid() = id);

-- MAPS table policies
-- Public maps are readable by anyone; private maps only by owner
create policy "maps: read if public or owner"
  on public.maps for select
  using (
    is_public = true
    or auth.uid() = user_id
  );

-- Only the owner can insert their map row
create policy "maps: insert own"
  on public.maps for insert
  with check (auth.uid() = user_id);

-- Only the owner can update their map
create policy "maps: update own"
  on public.maps for update
  using (auth.uid() = user_id);

-- Only the owner can delete their map
create policy "maps: delete own"
  on public.maps for delete
  using (auth.uid() = user_id);
