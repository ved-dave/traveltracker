-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null unique,
  email text not null,
  created_at timestamptz default now()
);

-- Username format constraint
alter table public.users
  add constraint username_format check (username ~ '^[a-z0-9-]{3,30}$');

-- Index
create index users_username_idx on public.users(username);
