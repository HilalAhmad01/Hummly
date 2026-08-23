import React from 'react';
import Link from 'next/link';
import {
  Play,
  Flame,
  Music2,
  Trophy,
  Headphones,
  Zap,
  Film,
  Radio,
  Heart,
  PartyPopper,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { BollywoodEra } from '@/types/game';

interface EraCategory {
  id: BollywoodEra;
  title: string;
  subtitle: string;
  eraBadge: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  popularSongs: string;
}

const BOLLYWOOD_CATEGORIES: EraCategory[] = [
  {
    id: 'all',
    title: 'All Bollywood Hits',
    subtitle: '500+ iconic songs spanning every golden era',
    eraBadge: '500+ Tracks',
    icon: Music2,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
    popularSongs: 'Arijit Singh, KK, Sonu Nigam, Atif Aslam & Kishore Kumar',
  },
  {
    id: '2020s',
    title: '2020s Chartbusters',
    subtitle: 'Modern streaming anthems and viral chart-toppers',
    eraBadge: '2020 - 2026',
    icon: Flame,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    popularSongs: 'Animal, Jawan, Brahmāstra, Stree 2, Bad Newz, Tauba Tauba',
  },
  {
    id: '2010s',
    title: 'Golden 2010s',
    subtitle: 'The era of Aashiqui 2, YJHD, Rockstar & Pritam melodies',
    eraBadge: '2010 - 2019',
    icon: Music2,
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    borderColor: 'border-cyan-500/30 hover:border-cyan-500/60',
    popularSongs: 'Tum Hi Ho, Balam Pichkari, Channa Mereya, Kabira, Gerua',
  },
  {
    id: '2000s',
    title: 'Nostalgic 2000s',
    subtitle: 'Y2K blockbusters, Sonu Nigam & KK evergreen memories',
    eraBadge: '2000 - 2009',
    icon: Headphones,
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    borderColor: 'border-purple-500/30 hover:border-purple-500/60',
    popularSongs: 'Kal Ho Naa Ho, Jab We Met, K3G, Dil Chahta Hai, Rang De Basanti',
  },
  {
    id: '90s',
    title: '90s Retro Classics',
    subtitle: 'DDLJ, Kuch Kuch Hota Hai, Kumar Sanu & Alka Yagnik gold',
    eraBadge: '1990 - 1999',
    icon: Radio,
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    borderColor: 'border-rose-500/30 hover:border-rose-500/60',
    popularSongs: 'Tujhe Dekha Toh, Pehla Nasha, Chaiyya Chaiyya, Baazigar',
  },
  {
    id: 'party',
    title: 'Party & Dance Bangers',
    subtitle: 'High-energy celebration, sangeet, and club anthems',
    eraBadge: 'Dance Mode',
    icon: PartyPopper,
    gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    borderColor: 'border-yellow-500/30 hover:border-yellow-500/60',
    popularSongs: 'Badtameez Dil, Dhoom Machale, Ghungroo, Aankh Marey, Kar Gayi Chull',
  },
  {
    id: 'romance',
    title: 'Romantic Melodies',
    subtitle: 'Soulful love ballads and unforgettable acoustic melodies',
    eraBadge: 'Love Songs',
    icon: Heart,
    gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
    borderColor: 'border-pink-500/30 hover:border-pink-500/60',
    popularSongs: 'Tum Se Hi, Agar Tum Saath Ho, Raataan Lambiyan, Hawayein',
  },
];

export default function HomePage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 flex flex-col items-center text-center">
        {/* Brand Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111714] border border-[#00E575]/30 text-[#00E575] font-bold text-xs sm:text-sm mb-6 shadow-[0_0_20px_rgba(0,229,117,0.15)]">
          <div className="w-2 h-2 rounded-full bg-[#00E575] animate-ping" />
          <span>The #1 Bollywood Song Guessing Game</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight max-w-4xl leading-[1.1]">
          Can You Guess The{' '}
          <span className="text-[#00E575] drop-shadow-[0_0_35px_rgba(0,229,117,0.4)]">
            Bollywood Song
          </span>{' '}
          From A 0.2s Snippet?
        </h1>

        <p className="max-w-2xl text-slate-300 text-base sm:text-lg mt-5 font-medium leading-relaxed">
          Listen to progressive mystery audio snippets unlocking from 0.2s up to 10s.
          Search by song title, film, or singer, maintain your streak, and top the global leaderboard.
        </p>

        {/* 5-Stage Progressive Difficulty Preview */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#131B17] text-[#C084FC] border border-white/5 shadow-sm">
            0.2s Impossible (1000 pts)
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#131B17] text-[#FB7185] border border-white/5 shadow-sm">
            0.8s Expert (800 pts)
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#131B17] text-[#F87171] border border-white/5 shadow-sm">
            2.5s Hard (600 pts)
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#131B17] text-[#FBBF24] border border-white/5 shadow-sm">
            5.0s Medium (400 pts)
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#131B17] text-[#34D399] border border-white/5 shadow-sm">
            10.0s Easy (200 pts)
          </span>
        </div>

        {/* Play CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
          <Link
            href="/play"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:bg-[#00D06A] text-[#060A08] font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(0,229,117,0.35)] hover:shadow-[0_0_60px_rgba(0,229,117,0.55)] hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
            <span>Play Quick Play (All Eras)</span>
          </Link>

          <Link
            href="/leaderboard"
            className="w-full sm:w-auto px-6 py-4 rounded-full bg-[#131B17] hover:bg-[#1A2520] border border-white/10 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </Link>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-3 gap-4 max-w-lg w-full mt-12 pt-8 border-t border-white/5 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#00E575] font-mono">500+</div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
              Curated Songs
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">5 Stages</div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
              0.2s &rarr; 10s Unlock
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">100%</div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
              Free To Play
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section (Fills PC Screen Beautifully) */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Film className="w-6 h-6 text-[#00E575]" />
            <span>Pick a Bollywood Category</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Choose your favorite decade or mood to test your musical instincts
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {BOLLYWOOD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/play?era=${cat.id}`}
                className={`group relative rounded-3xl bg-[#111714] p-5 sm:p-6 flex flex-col justify-between border ${cat.borderColor} bg-gradient-to-b ${cat.gradient} hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 shadow-lg overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#00E575] group-hover:rotate-6 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/10">
                      {cat.eraBadge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-[#00E575] transition-colors">
                    {cat.title}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[200px] text-slate-400">{cat.popularSongs}</span>
                  <span className="flex items-center gap-1 font-bold text-[#00E575] group-hover:translate-x-1 transition-transform flex-shrink-0">
                    Play <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
