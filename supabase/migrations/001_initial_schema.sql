-- ==============================================================================
-- SWARAGUESS: BOLLYWOOD MUSIC TRIVIA SUPABASE SCHEMA MIGRATION
-- ==============================================================================

-- 1. Songs Table
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  movie_or_album text,
  language text not null default 'hindi',
  era text not null check (era in ('2020s', '2010s', '2000s', '90s', 'retro', 'all')),
  theme text default 'chartbuster',
  difficulty smallint default 2,
  deezer_track_id text,
  deezer_preview_url text,
  youtube_video_id text,
  cover_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  constraint songs_title_artist_unique unique (title, artist)
);

-- 2. User Profiles Table (Synced with Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  total_score bigint default 0,
  games_played int default 0,
  created_at timestamptz default now()
);

-- 3. Game Sessions Table
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  mode text not null default 'quick_play',
  era_filter text default 'all',
  score int not null,
  correct_count int not null,
  total_rounds int not null,
  played_at timestamptz default now()
);

-- 4. Daily Challenge Table
create table if not exists public.daily_challenge (
  challenge_date date primary key,
  song_id uuid references public.songs(id) on delete cascade
);

-- 5. Leaderboard Aggregation View
create or replace view public.leaderboard_view as
select 
  p.id as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(gs.score), 0) as total_score,
  count(gs.id) as games_played,
  coalesce(max(gs.score), 0) as high_score
from public.profiles p
left join public.game_sessions gs on gs.user_id = p.id
group by p.id, p.username, p.avatar_url
order by total_score desc;

-- 6. RPC Function to Increment Profile Score
create or replace function public.increment_profile_score(row_id uuid, score_to_add int)
returns void as $$
begin
  update public.profiles
  set 
    total_score = total_score + score_to_add,
    games_played = games_played + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- 7. Trigger to auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. Row Level Security (RLS) Policies
alter table public.songs enable row level security;
alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.daily_challenge enable row level security;

-- Public Read for Active Songs
create policy "Allow public read access on active songs"
  on public.songs for select
  using (is_active = true);

-- Public Read for Profiles
create policy "Allow public read on profiles"
  on public.profiles for select
  using (true);

-- Authenticated update for own profile
create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Public Read for Game Sessions (Leaderboard stats)
create policy "Allow public read on game sessions"
  on public.game_sessions for select
  using (true);

-- Authenticated Insert for Game Sessions
create policy "Allow users to insert own game sessions"
  on public.game_sessions for insert
  with check (auth.uid() = user_id or user_id is null);

-- Public Read for Daily Challenge
create policy "Allow public read on daily challenge"
  on public.daily_challenge for select
  using (true);
