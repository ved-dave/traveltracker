-- Maps table
create table public.maps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  regions jsonb default '{}'::jsonb not null,
  colors jsonb default '{
    "visited": "#15a0b2",
    "lived": "#D85A30",
    "home": "#9B59B6"
  }'::jsonb not null,
  is_public boolean default false not null,
  updated_at timestamptz default now()
);

-- Index
create index maps_user_id_idx on public.maps(user_id);
