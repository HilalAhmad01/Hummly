'use client';

import React, { memo } from 'react';
import { SNIPPET_STAGES } from '@/types/game';

interface SnippetProgressTrackProps {
  currentStageIndex: number; // 0 to 4
  currentTimeSec: number;
  isPlaying: boolean;
  onSelectStage?: (stageIndex: number) => void;
  disabled?: boolean;
}

function SnippetProgressTrack({
  currentStageIndex,
  currentTimeSec,
  isPlaying,
  onSelectStage,
  disabled = false,
}: SnippetProgressTrackProps) {
  const currentStage = SNIPPET_STAGES[currentStageIndex] || SNIPPET_STAGES[0];
  const maxDuration = currentStage.durationSec;

  return (
    <div className="w-full my-3 select-none">
      {/* Segmented Timeline Track */}
      <div className="w-full h-4 bg-[#121A15] rounded-full p-0.5 flex gap-1.5 overflow-hidden border border-white/10">
        {SNIPPET_STAGES.map((stage, idx) => {
          const isUnlocked = idx <= currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <button
              key={stage.stageNumber}
              type="button"
              disabled={disabled}
              onClick={() => onSelectStage?.(idx)}
              className={`h-full flex-1 rounded-full transition-all duration-300 relative overflow-hidden cursor-pointer ${
                isUnlocked
                  ? isCurrent
                    ? 'bg-[#00E575] shadow-[0_0_12px_rgba(0,229,117,0.5)]'
                    : 'bg-[#00E575]/80 hover:bg-[#00E575]'
                  : 'bg-[#18231E] hover:bg-[#202E27]'
              }`}
              title={`${stage.name} (${stage.durationSec}s) - Click to switch snippet length`}
            >
              {/* Playback progress inside active stage */}
              {isUnlocked && isPlaying && isCurrent && (
                <div
                  className="absolute inset-0 bg-white/30 transition-all duration-75"
                  style={{
                    width: `${Math.min(100, (currentTimeSec / maxDuration) * 100)}%`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(SnippetProgressTrack);
