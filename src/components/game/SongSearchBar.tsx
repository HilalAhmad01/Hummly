'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Music, Film, User, SkipForward } from 'lucide-react';
import { SearchableSong } from '@/types/game';
import { searchSongs } from '@/lib/search-engine';

interface SongSearchBarProps {
  onSelectGuess: (song: SearchableSong) => void;
  onSkipRound: () => void;
  skipButtonLabel?: string;
  disabled?: boolean;
  isWrongAttemptFlash?: boolean;
  roundNumber?: number;
}

function SongSearchBar({
  onSelectGuess,
  onSkipRound,
  skipButtonLabel = 'Skip',
  disabled = false,
  isWrongAttemptFlash = false,
  roundNumber = 1,
}: SongSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableSong[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus input on new round
  useEffect(() => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    setIsOpen(false);

    if (!disabled && inputRef.current) {
      focusTimeoutRef.current = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [roundNumber, disabled]);

  // Real-time fuzzy query
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length > 0) {
      const matches = searchSongs(value, 6);
      setResults(matches);
      setSelectedIndex(matches.length > 0 ? 0 : -1);
      setIsOpen(true);
    } else {
      setResults([]);
      setSelectedIndex(-1);
      setIsOpen(false);
    }
  };

  const handleSelect = useCallback(
    (song: SearchableSong) => {
      if (disabled) return;
      setIsOpen(false);
      setQuery('');
      onSelectGuess(song);
    },
    [disabled, onSelectGuess]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
        return;
      }
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-3.5 mt-auto">
      {/* Full-Pill Search Input (Exact match to Reference UI) */}
      <div className="w-full relative">
        <div className="relative flex items-center">
          <div className="absolute left-5 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              if (query.trim().length > 0 && results.length > 0) {
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            placeholder="Search songs..."
            className={`w-full h-14 pl-14 pr-5 rounded-full bg-[#121915] text-white placeholder:text-slate-500 text-base font-medium focus:outline-none transition-all shadow-lg ${
              isWrongAttemptFlash
                ? 'border-2 border-rose-500 bg-rose-950/20 text-rose-200'
                : 'border border-white/10 focus:border-[#00E575]/50'
            }`}
          />
        </div>

        {/* Floating Autocomplete Dropdown */}
        {isOpen && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 bottom-[calc(100%+8px)] z-50 rounded-2xl border border-white/10 bg-[#0B101E]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
              <span>Matching Songs</span>
              <span className="text-[10px] text-[#00E575] font-normal">&uarr;&darr; + Enter</span>
            </div>

            <ul className="max-h-60 overflow-y-auto divide-y divide-white/5 py-1">
              {results.map((song, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <li
                    key={song.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleSelect(song)}
                    className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#00E575]/20 text-white'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#00E575] text-[#060A08] font-bold' : 'bg-white/5 text-[#00E575]'
                        }`}
                      >
                        <Music className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate leading-tight">
                          {song.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                          <span className="truncate text-slate-300">{song.movie_or_album}</span>
                          <span>&bull;</span>
                          <span className="truncate text-slate-400">{song.artist}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/5 text-slate-400 border border-white/10 uppercase ml-2 flex-shrink-0">
                      {song.era}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Full-Pill Skip Button (Exact match to Reference UI) */}
      <button
        type="button"
        onClick={onSkipRound}
        disabled={disabled}
        className="w-full h-14 rounded-full bg-[#16201B] hover:bg-[#1C2923] active:bg-[#121915] border border-white/10 hover:border-[#00E575]/30 text-slate-200 font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-40 shadow-md"
      >
        {/* Skip Icon matching reference UI */}
        <div className="flex items-center justify-center">
          <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-slate-300" />
          <div className="w-0.5 h-3 bg-slate-300 ml-0.5" />
        </div>
        <span>{skipButtonLabel}</span>
      </button>
    </div>
  );
}

export default memo(SongSearchBar);
