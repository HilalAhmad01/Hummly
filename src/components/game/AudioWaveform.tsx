'use client';

import React, { memo } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  heightClass?: string;
}

// Pre-calculated diverse heights & animation delays for organic visualizer rhythm (Hoisted outside to prevent re-allocations)
const HEIGHTS = [45, 85, 30, 95, 60, 40, 90, 70, 100, 50, 80, 35, 75, 90, 65, 45, 80, 60];
const DELAYS = [0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.15, 0.35, 0.7, 0.25, 0.45, 0.1, 0.55, 0.3, 0.65, 0.2, 0.4, 0.5];

function AudioWaveform({
  isPlaying,
  barCount = 18,
  heightClass = 'h-12',
}: AudioWaveformProps) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${heightClass} px-4 py-2`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const height = HEIGHTS[i % HEIGHTS.length];
        const delay = DELAYS[i % DELAYS.length];

        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-slate-700/60'
            }`}
            style={{
              height: isPlaying ? `${height}%` : '20%',
              animationName: isPlaying ? 'wave' : 'none',
              animationDuration: '1.1s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default memo(AudioWaveform);
