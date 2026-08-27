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
  Users,
  Crown,
  Sparkles,
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
    id: 'punjabi',
    title: 'Punjabi Songs',
    subtitle: '150+ chartbusters from Sidhu Moose Wala, Karan Aujla, Shubh, Diljit & AP Dhillon',
    eraBadge: '150+ Tracks',
    icon: Flame,
    gradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    borderColor: 'border-orange-500/30 hover:border-orange-500/60',
    popularSongs: 'Karan Aujla, Sidhu Moose Wala, Shubh, AP Dhillon, Diljit Dosanjh, Navaan Sandhu',
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
          Play solo instantly or host a real-time 5-player room with friends to compete for the podium!
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
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-xl justify-center">
          <Link
            href="/play"
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:bg-[#00D06A] text-[#060A08] font-black text-base flex items-center justify-center gap-2.5 shadow-[0_0_40px_rgba(0,229,117,0.35)] hover:shadow-[0_0_60px_rgba(0,229,117,0.55)] hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
            <span>Play Solo (Quick Play)</span>
          </Link>

          <Link
            href="/multiplayer"
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#18231E] hover:bg-[#202E27] border border-[#00E575]/50 text-[#00E575] font-black text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,229,117,0.15)] hover:scale-105 active:scale-95 transition-all"
          >
            <Users className="w-5 h-5" />
            <span>Play With Friends (5 Players)</span>
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
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">5 Players</div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
              Live Rooms
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

      {/* Multiplayer Feature Spotlight Banner */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="w-full rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#111714] to-purple-950/40 border border-[#00E575]/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-2 max-w-lg text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00E575] uppercase tracking-wider self-center md:self-start">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Real-time Multiplayer</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              Host a 10-Round Match With Up to 5 Friends!
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Listen together, guess in real-time, and see who climbs the Gold, Silver & Bronze victory podium.
            </p>
          </div>

          <Link
            href="/multiplayer"
            className="px-6 py-3.5 rounded-full bg-[#00E575] hover:bg-[#00F77F] text-[#060A08] font-black text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(0,229,117,0.3)] shrink-0 hover:scale-105 transition-all"
          >
            <Crown className="w-4 h-4" />
            <span>Host or Join Room</span>
          </Link>
        </div>
      </section>

      {/* Category Grid Section */}
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-[#00E575]" />
                    </div>

                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10 group-hover:border-[#00E575]/40 transition-colors">
                      {cat.eraBadge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#00E575] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    {cat.subtitle}
                  </p>

                  <div className="text-[11px] text-slate-500 font-medium">
                    <span className="text-slate-400">Featured: </span>
                    {cat.popularSongs}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#00E575]">
                  <span>Play Category</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
