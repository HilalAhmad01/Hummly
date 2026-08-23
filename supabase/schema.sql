-- ==============================================================================
-- HUMMLY SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create PROFILES Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  total_score bigint default 0 not null,
  games_played integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Public can read all profiles (for leaderboards and user cards)
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using (true);

-- Authenticated users can insert their own profile
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

-- Authenticated users can update their own profile
create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Trigger: Automatically Create Profile on User Signup (Google OAuth & Email)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_username text;
  final_username text;
  user_avatar text;
begin
  -- Extract username from metadata or email
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Clean username (alphanumeric only, max 20 chars)
  final_username := regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g');
  if length(final_username) < 3 then
    final_username := 'player_' || substr(new.id::text, 1, 6);
  end if;

  -- Ensure uniqueness by appending suffix if already taken
  if exists (select 1 from public.profiles where username = final_username) then
    final_username := final_username || '_' || substr(new.id::text, 1, 4);
  end if;

  -- Extract avatar URL if provided by Google OAuth
  user_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    null
  );

  insert into public.profiles (id, username, avatar_url, total_score, games_played)
  values (new.id, final_username, user_avatar, 0, 0)
  on conflict (id) do update
  set
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    username = coalesce(public.profiles.username, excluded.username);

  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Create GAME_SESSIONS Table
create table if not exists public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  mode text not null default 'quick_play',
  era_filter text default 'all',
  score integer default 0 not null,
  correct_count integer default 0 not null,
  total_rounds integer default 10 not null,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on game_sessions
alter table public.game_sessions enable row level security;

-- Everyone can view game sessions for leaderboards
create policy "Game sessions are viewable by everyone."
  on public.game_sessions for select
  using (true);

-- Authenticated users or anonymous players can insert game sessions
create policy "Anyone can insert game sessions."
  on public.game_sessions for insert
  with check (true);

-- 5. Create High-Performance LEADERBOARD_VIEW
create or replace view public.leaderboard_view as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.total_score,
  p.games_played,
  coalesce(max(g.score), 0) as high_score
from public.profiles p
left join public.game_sessions g on p.id = g.user_id
group by p.id, p.username, p.avatar_url, p.total_score, p.games_played
order by p.total_score desc;

-- 6. RPC Function to Increment Profile Score & Games Played
create or replace function public.increment_profile_score(
  row_id uuid,
  score_to_add integer
)
returns void as $$
begin
  update public.profiles
  set
    total_score = total_score + score_to_add,
    games_played = games_played + 1
  where id = row_id;
end;
$$ language plpgsql security definer;
