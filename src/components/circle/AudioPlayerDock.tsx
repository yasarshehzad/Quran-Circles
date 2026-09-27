import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Volume2, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Mic2,
  Sparkles,
  FastForward
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AudioPlayerDockProps {
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
  audioProgress: number;
  audioDuration: number;
  onSeek: (time: number) => void;
  currentVerseKey: string;
  surahName: string;
  reciters: any[];
  reciterId: number;
  onSelectReciter: (id: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  repeatMode: 'off' | '3x' | 'infinite';
  onChangeRepeatMode: (mode: 'off' | '3x' | 'infinite') => void;
  isVisible: boolean;
  onClose: () => void;
}

export const AudioPlayerDock: React.FC<AudioPlayerDockProps> = ({
  isPlaying,
  isLoading,
  onTogglePlay,
  audioProgress,
  audioDuration,
  onSeek,
  currentVerseKey,
  surahName,
  reciters,
  reciterId,
  onSelectReciter,
  playbackRate,
  onChangePlaybackRate,
  repeatMode,
  onChangeRepeatMode,
  isVisible,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  const currentReciter = reciters?.find(r => r.id === reciterId);
  const reciterName = currentReciter?.name || 'Mishari Rashid al-`Afasy';

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0;

  const nextRepeatMode = () => {
    if (repeatMode === 'off') onChangeRepeatMode('3x');
    else if (repeatMode === '3x') onChangeRepeatMode('infinite');
    else onChangeRepeatMode('off');
  };

  const cycleSpeed = () => {
    if (playbackRate === 1) onChangePlaybackRate(1.25);
    else if (playbackRate === 1.25) onChangePlaybackRate(0.75);
    else onChangePlaybackRate(1);
  };

  return (
    <motion.aside
      aria-label="Audio Recitation Dock"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-[105] bg-brand-forest/95 backdrop-blur-2xl border border-white/15 rounded-[2rem] shadow-2xl overflow-hidden bento-card text-white"
    >
      {/* Progress Track */}
      <div 
        className="w-full h-1.5 bg-white/10 cursor-pointer relative group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          onSeek(clickPos * audioDuration);
        }}
      >
        <div 
          className="h-full bg-brand-lime transition-all duration-150 lime-glow"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {/* Main Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-brand-lime/10 border border-brand-lime/20 text-brand-lime flex items-center justify-center shrink-0">
              <Volume2 size={18} strokeWidth={2.5} className={isPlaying ? 'animate-pulse' : ''} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-black truncate">{surahName} {currentVerseKey}</p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 font-bold uppercase tracking-wider text-white/60">
                  Ayah
                </span>
              </div>
              <p className="text-[10px] text-white/50 truncate font-medium">
                {reciterName}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Speed Toggle */}
            <button
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase text-white/70 hover:text-white transition-colors"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            {/* Repeat Mode */}
            <button
              onClick={nextRepeatMode}
              className={cn(
                "p-2 rounded-xl text-xs font-black transition-all",
                repeatMode !== 'off' 
                  ? "bg-brand-lime/20 text-brand-lime border border-brand-lime/30" 
                  : "bg-white/5 text-white/40 hover:text-white"
              )}
              title={`Repeat: ${repeatMode === 'off' ? 'Normal' : repeatMode === '3x' ? 'Repeat 3 Times' : 'Continuous Loop'}`}
            >
              <Repeat size={14} strokeWidth={2.5} />
              {repeatMode !== 'off' && (
                <span className="text-[8px] font-black block leading-none">{repeatMode}</span>
              )}
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlay}
              disabled={isLoading}
              className="w-11 h-11 rounded-full bg-brand-lime text-brand-deep hover:bg-white flex items-center justify-center shadow-lg active:scale-95 transition-all lime-glow"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-brand-deep/30 border-t-brand-deep rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} strokeWidth={3} fill="currentColor" />
              ) : (
                <Play size={18} strokeWidth={3} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            {/* Close Dock */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors"
              title="Close player"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Time and expanded reciter picker */}
        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono pt-1 border-t border-white/5">
          <span>{formatTime(audioProgress)} / {formatTime(audioDuration)}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-bold text-brand-lime hover:underline uppercase tracking-wider font-sans"
          >
            <Mic2 size={12} />
            <span>Change Reciter</span>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>

        {/* Expanded Reciters list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1 bg-brand-deep/50 rounded-xl border border-white/5">
                {reciters.slice(0, 10).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelectReciter(r.id);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-left text-[11px] truncate transition-colors",
                      reciterId === r.id
                        ? "bg-brand-lime text-brand-deep font-black"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
