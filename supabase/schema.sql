-- ==============================================================================
-- HUMMLY SUPABASE DATABASE SCHEMA (Single-Player & Real-Time Multiplayer)
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

  -- Clean username (alphanumeric and underscore only, max 20 chars)
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

-- 4. Create GAME_SESSIONS Table (Single Player History & Stats)
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

-- ==============================================================================
-- 7. MULTIPLAYER ROOMS & SYNCHRONIZATION TABLES
-- ==============================================================================

-- 7.1 Multiplayer Rooms Table
create table if not exists public.multiplayer_rooms (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'lobby', -- 'lobby' | 'playing' | 'revealing' | 'finished'
  game_mode text not null default 'classic', -- 'classic' | 'fastest_finger'
  era_filter text not null default 'all',
  current_round integer not null default 1,
  total_rounds integer not null default 10,
  playlist jsonb not null default '[]'::jsonb,
  round_start_time bigint, -- Synchronized epoch timestamp for Fastest Finger countdown
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.multiplayer_rooms enable row level security;

create policy "Multiplayer rooms are viewable by everyone."
  on public.multiplayer_rooms for select
  using (true);

create policy "Authenticated users can create multiplayer rooms."
  on public.multiplayer_rooms for insert
  with check (auth.uid() is not null);

create policy "Room players or host can update rooms."
  on public.multiplayer_rooms for update
  using (
    auth.uid() = host_id
    or exists (
      select 1 from public.multiplayer_players
      where room_id = public.multiplayer_rooms.id
      and user_id = auth.uid()
    )
  );

-- 7.2 Multiplayer Players Table (Up to 5 players per room)
create table if not exists public.multiplayer_players (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.multiplayer_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  username text not null,
  avatar_url text,
  is_host boolean not null default false,
  is_ready boolean not null default false,
  total_score integer not null default 0,
  correct_count integer not null default 0,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

alter table public.multiplayer_players enable row level security;

create policy "Multiplayer players are viewable by everyone."
  on public.multiplayer_players for select
  using (true);

create policy "Authenticated users can join rooms."
  on public.multiplayer_players for insert
  with check (auth.uid() = user_id);

create policy "Players can update their own row."
  on public.multiplayer_players for update
  using (auth.uid() = user_id);

create policy "Players can leave rooms."
  on public.multiplayer_players for delete
  using (auth.uid() = user_id);

-- 7.3 Multiplayer Guesses Table (Synchronous Round Tracking)
create table if not exists public.multiplayer_guesses (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.multiplayer_rooms(id) on delete cascade not null,
  round_number integer not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stage_index integer not null default 0,
  is_correct boolean not null default false,
  score_awarded integer not null default 0,
  guess_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, round_number, user_id)
);

alter table public.multiplayer_guesses enable row level security;

create policy "Multiplayer guesses are viewable by everyone."
  on public.multiplayer_guesses for select
  using (true);

create policy "Players can submit guesses for their user_id."
  on public.multiplayer_guesses for insert
  with check (auth.uid() = user_id);

-- Enable Realtime for all multiplayer tables
alter publication supabase_realtime add table public.multiplayer_rooms;
alter publication supabase_realtime add table public.multiplayer_players;
alter publication supabase_realtime add table public.multiplayer_guesses;
