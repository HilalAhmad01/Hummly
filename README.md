# 🎬 SwaraGuess — The Ultimate Bollywood Music Trivia Game

A high-octane, dark-themed, mobile-first **Bollywood Song Guessing Game** built on **Next.js 14+ (App Router)**, **Tailwind CSS**, and **Supabase (Postgres & Auth)**, optimized for **100% free Vercel deployment** with zero unlicensed audio rehosting.

---

## 🌟 Key Features

- 🔍 **Interactive Autocomplete Search Bar**: Guess the song in real-time by typing song titles, movie names, or singers (Heardle / Wordle style) with sub-5ms instant in-memory fuzzy search.
- 🎧 **High-Fidelity 30s Audio Previews**: Direct HTML5 audio streaming via official Apple Music & Deezer preview CDNs + YouTube IFrame fallback (0 bandwidth consumed on Vercel).
- 🎬 **Rich Bollywood Eras & Themes**:
  - 🌟 **All Bollywood Hits**
  - 🔥 **2020s Chartbusters** (*Brahmāstra, Animal, Jawan, Pathaan, Bad Newz*)
  - 🎸 **Golden 2010s** (*Aashiqui 2, YJHD, Rockstar, Tamasha, ADHM*)
  - 🎧 **Nostalgic 2000s** (*Kal Ho Naa Ho, Jab We Met, K3G, Dil Chahta Hai*)
  - 📻 **90s Retro Classics** (*DDLJ, Kuch Kuch Hota Hai, Mohra, Baazigar*)
  - 💃 **Party & Dance Bangers** (*High-energy celebration & club anthems*)
  - 💖 **Romantic Melodies** (*Soulful love ballads & unplugged melodies*)
- ⚡ **Dynamic Speed Scoring & Streaks**: Faster answers earn up to 1,000 pts with consecutive streak multipliers up to 2.5x.
- 📱 **Mobile-First & PWA**: Touch-friendly buttons, "Tap to Start" audio context unlock for mobile browsers, and installable PWA shell.
- 🏆 **Global & Weekly Leaderboards**: Powered by Supabase Postgres with guest play support out of the box.
- 🛠️ **Automated Cataloging CLI Pipeline**: Easily lookup and validate 500+ Bollywood songs with a single command.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The game is immediately playable in Guest Mode with 120+ pre-curated Bollywood songs!

---

## 🗄️ Free Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard and execute the contents of [`supabase/migrations/001_initial_schema.sql`](file:///home/echidna/music%20guesser/supabase/migrations/001_initial_schema.sql).
3. Optional: Execute [`supabase/seed.sql`](file:///home/echidna/music%20guesser/supabase/seed.sql) to seed initial tracks.
4. Copy your **Project URL** and **anon key** from `Settings -> API` into your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎶 Offline Song Cataloging CLI Tool

Add hundreds of new songs to your trivia catalog in seconds:

1. Add your song titles and artists to [`scripts/song-list.json`](file:///home/echidna/music%20guesser/scripts/song-list.json).
2. Run the cataloging script:
```bash
npm run catalog:songs
```
This automatically queries the Apple Music and Deezer search APIs, runs fuzzy string matching, filters out karaoke/remixes, and writes:
- `scripts/import-ready.json` & `scripts/import-ready.csv` (High Confidence $\ge 75\%$)
- `scripts/needs-review.csv` (Flagged for manual review)

3. Import verified songs directly into your Supabase database:
```bash
npm run db:import
```

---

## 🌐 1-Click Vercel Deployment (100% Free Tier)

1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Your Bollywood trivia app is live worldwide!

---

## ⚖️ Legal & Compliance Attributions

- 🎵 Song audio previews are played directly from official 30-second streams via Apple Music and Deezer under standard non-commercial preview terms.
- 🎬 Video clips are embedded through the official YouTube IFrame Player API.
- 🚫 Zero unlicensed audio files are stored, converted, or rehosted.
