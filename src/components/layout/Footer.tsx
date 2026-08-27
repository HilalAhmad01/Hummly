import React from 'react';
import Link from 'next/link';
import { Music2, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#050806]/95 backdrop-blur-md mt-auto py-8 px-4 sm:px-6 pb-20 md:pb-8 text-slate-400 text-xs relative z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand & Mission */}
        <div className="flex flex-col gap-2 items-center md:items-start">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center text-[#00E575]">
              <Music2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Hummly</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E575]/10 text-[#00E575] border border-[#00E575]/20">
              Desi Music Trivia
            </span>
          </div>
          <p className="max-w-md text-slate-400 text-xs leading-relaxed">
            The ultimate Bollywood & Punjabi music guessing game. Listen to short mystery snippets, test your music instincts, and compete with friends in real-time.
          </p>
        </div>

        {/* Creator Badge & GitHub Link */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href="https://github.com/HilalAhmad01"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#111A15] hover:bg-[#18261F] border border-white/10 hover:border-[#00E575]/40 text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            {/* Crisp GitHub SVG */}
            <svg
              className="w-4 h-4 text-[#00E575] group-hover:scale-110 transition-transform fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="text-xs font-medium">
              Made by <span className="font-bold text-white group-hover:text-[#00E575] transition-colors">Hilal Ahmad</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-[#00E575] transition-colors" />
          </a>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="max-w-6xl mx-auto mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <p className="text-slate-400 flex items-center gap-1.5 justify-center">
          <span>&copy; {new Date().getFullYear()} Hummly. Built with</span>
          <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" />
          <span>for music lovers everywhere.</span>
        </p>

        <div className="flex items-center gap-5 text-slate-400">
          <Link href="/play" className="text-[#00E575] hover:underline transition-colors font-medium">
            Quick Play
          </Link>
          <Link href="/multiplayer" className="hover:text-slate-200 transition-colors">
            Multiplayer Arena
          </Link>
          <Link href="/leaderboard" className="hover:text-slate-200 transition-colors">
            Leaderboard
          </Link>
          <a
            href="https://github.com/HilalAhmad01/Hummly"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <span>Source</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
