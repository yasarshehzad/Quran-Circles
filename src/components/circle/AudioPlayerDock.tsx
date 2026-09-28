import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Repeat, 
  Volume2, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Mic2,
  Search,
  Check,
  Minimize2
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
  isMinimized?: boolean;
  onToggleMinimize?: (minimized: boolean) => void;
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
  reciters = [],
  reciterId,
  onSelectReciter,
  playbackRate,
  onChangePlaybackRate,
  repeatMode,
  onChangeRepeatMode,
  isVisible,
  onClose,
  isMinimized: controlledMinimized,
  onToggleMinimize
}) => {
  const [internalMinimized, setInternalMinimized] = useState(false);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [reciterSearch, setReciterSearch] = useState('');

  // Filter reciters (MUST be declared before any conditional return)
  const filteredReciters = useMemo(() => {
    if (!reciters || !Array.isArray(reciters)) return [];
    if (!reciterSearch.trim()) return reciters;
    const q = reciterSearch.toLowerCase();
    return reciters.filter(r => {
      const name = (r.reciter_name || r.name || r.translated_name?.name || '').toLowerCase();
      const style = (r.style || '').toLowerCase();
      return name.includes(q) || style.includes(q);
    });
  }, [reciters, reciterSearch]);

  const isMinimized = controlledMinimized !== undefined ? controlledMinimized : internalMinimized;

  const setMinimized = (val: boolean) => {
    if (onToggleMinimize) {
      onToggleMinimize(val);
    } else {
      setInternalMinimized(val);
    }
  };

  if (!isVisible) return null;

  const currentReciter = reciters?.find(r => r.id === reciterId);
  const reciterName = currentReciter?.reciter_name || currentReciter?.name || currentReciter?.translated_name?.name || 'Mishari Rashid al-`Afasy';
  const reciterStyle = currentReciter?.style || '';

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
    else if (playbackRate === 1.25) onChangePlaybackRate(1.5);
    else if (playbackRate === 1.5) onChangePlaybackRate(0.75);
    else onChangePlaybackRate(1);
  };

  // Mini Floating Pill when minimized/hidden
  if (isMinimized) {
    return (
      <motion.div
        aria-label="Audio Reciter Bar Mini"
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-[105] flex items-center gap-2.5 px-3 py-2 bg-white/95 dark:bg-brand-forest/95 backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-full shadow-2xl text-paper-ink dark:text-white cursor-pointer hover:border-emerald-600/40 dark:hover:border-brand-lime/40 transition-all group"
        onClick={() => setMinimized(false)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          disabled={isLoading}
          className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-brand-lime dark:text-brand-deep flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={14} strokeWidth={3} fill="currentColor" />
          ) : (
            <Play size={14} strokeWidth={3} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black truncate max-w-[130px] sm:max-w-[180px]">
              {surahName} {currentVerseKey}
            </span>
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-brand-lime animate-pulse shrink-0" />
            )}
          </div>
          <span className="text-[10px] text-paper-accent dark:text-white/60 truncate max-w-[130px] sm:max-w-[180px]">
            {reciterName}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(false);
          }}
          className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full bg-emerald-100 dark:bg-brand-lime/20 text-emerald-800 dark:text-brand-lime text-[10px] font-black uppercase tracking-wider hover:bg-emerald-200 dark:hover:bg-brand-lime/30 transition-colors cursor-pointer"
          title="Re-appear audio player"
        >
          <ChevronUp size={12} strokeWidth={3} />
          <span>Show</span>
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.aside
        aria-label="Audio Recitation Dock"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[460px] z-[105] bg-white/95 dark:bg-brand-forest/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden bento-card text-paper-ink dark:text-white"
      >
        {/* Slim Interactive Progress Track */}
        <div 
          className="w-full h-1.5 bg-black/10 dark:bg-white/10 cursor-pointer relative group hover:h-2 transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            onSeek(clickPos * audioDuration);
          }}
          title="Seek playback"
        >
          <div 
            className="h-full bg-emerald-600 dark:bg-brand-lime transition-all duration-150 relative"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-700 dark:bg-brand-lime shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Compact Player Content */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 space-y-2">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Play Button + Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onTogglePlay}
                disabled={isLoading}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-brand-lime dark:text-brand-deep dark:hover:bg-white flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer lime-glow"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-brand-deep/30 border-t-white dark:border-t-brand-deep rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause size={17} strokeWidth={3} fill="currentColor" />
                ) : (
                  <Play size={17} strokeWidth={3} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black truncate">{surahName} {currentVerseKey}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold uppercase tracking-wider text-paper-accent dark:text-white/60 shrink-0">
                    Ayah
                  </span>
                </div>
                
                {/* Clickable Reciter Name to open picker */}
                <button
                  type="button"
                  onClick={() => setShowReciterModal(true)}
                  className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-brand-lime hover:underline font-bold truncate max-w-full cursor-pointer group mt-0.5 text-left"
                  title="Change reciter"
                >
                  <Mic2 size={11} className="shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{reciterName}</span>
                  {reciterStyle && (
                    <span className="text-[9px] opacity-75 font-normal">({reciterStyle})</span>
                  )}
                  <ChevronDown size={11} className="shrink-0" />
                </button>
              </div>
            </div>

            {/* Quick Actions (Speed, Repeat, Hide, Close) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Speed Button */}
              <button
                onClick={cycleSpeed}
                className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-black uppercase text-paper-ink dark:text-white/80 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {/* Repeat Mode */}
              <button
                onClick={nextRepeatMode}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-0.5",
                  repeatMode !== 'off' 
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-brand-lime/20 dark:text-brand-lime dark:border-brand-lime/30" 
                    : "bg-black/5 dark:bg-white/5 text-paper-accent dark:text-white/50 hover:text-paper-ink dark:hover:text-white"
                )}
                title={`Repeat: ${repeatMode === 'off' ? 'Normal' : repeatMode === '3x' ? 'Repeat 3 Times' : 'Continuous Loop'}`}
              >
                <Repeat size={13} strokeWidth={2.5} />
                {repeatMode !== 'off' && (
                  <span className="text-[8px] font-black block leading-none">{repeatMode === 'infinite' ? '∞' : '3x'}</span>
                )}
              </button>

              {/* Change Reciter Button */}
              <button
                onClick={() => setShowReciterModal(true)}
                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-brand-lime/10 text-emerald-800 dark:text-brand-lime hover:bg-emerald-100 dark:hover:bg-brand-lime/20 transition-colors cursor-pointer"
                title="Change Reciter"
              >
                <Mic2 size={14} strokeWidth={2.5} />
              </button>

              {/* Hide / Minimize Player Button */}
              <button
                onClick={() => setMinimized(true)}
                className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-paper-accent dark:text-white/50 hover:text-paper-ink dark:hover:text-white transition-colors cursor-pointer"
                title="Hide / Minimize Player"
              >
                <ChevronDown size={14} strokeWidth={2.5} />
              </button>

              {/* Close Dock Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-paper-accent dark:text-white/50 hover:text-paper-ink dark:hover:text-white transition-colors cursor-pointer"
                title="Close Audio Player"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Time & Quick Footer Row */}
          <div className="flex items-center justify-between text-[10px] text-paper-accent dark:text-white/50 font-mono pt-1 border-t border-black/5 dark:border-white/5">
            <span>{formatTime(audioProgress)} / {formatTime(audioDuration)}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMinimized(true)}
                className="flex items-center gap-1 text-[10px] text-paper-accent dark:text-white/60 hover:text-paper-ink dark:hover:text-white font-sans font-bold cursor-pointer"
              >
                <Minimize2 size={10} />
                <span>Hide</span>
              </button>
              <button
                onClick={() => setShowReciterModal(true)}
                className="flex items-center gap-1 text-[10px] text-emerald-800 dark:text-brand-lime hover:underline font-sans font-bold uppercase tracking-wider cursor-pointer"
              >
                <span>Change Reciter</span>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Reciter Selector Modal */}
      <AnimatePresence>
        {showReciterModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReciterModal(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-brand-forest border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 text-paper-ink dark:text-white"
            >
              {/* Header */}
              <div className="p-5 pb-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-brand-lime/20 dark:text-brand-lime flex items-center justify-center">
                    <Mic2 size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-wider">Select Reciter</h3>
                    <p className="text-[10px] text-paper-accent dark:text-white/50">
                      {reciters.length} World-Class Quran Reciters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReciterModal(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-paper-accent dark:text-white/60 hover:text-paper-ink dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search input */}
              <div className="p-3 bg-stone-50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-accent dark:text-white/40" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder="Search reciter by name..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-paper-ink dark:text-white placeholder:text-paper-accent dark:placeholder:text-white/30 focus:outline-none focus:border-emerald-600 dark:focus:border-brand-lime"
                  />
                  {reciterSearch && (
                    <button
                      onClick={() => setReciterSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-paper-accent dark:text-white/40 hover:text-paper-ink dark:hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Reciters List */}
              <div className="p-3 max-h-72 overflow-y-auto custom-scrollbar space-y-1.5">
                {filteredReciters.length === 0 ? (
                  <div className="py-8 text-center text-xs text-paper-accent dark:text-white/40">
                    No reciters found matching "{reciterSearch}"
                  </div>
                ) : (
                  filteredReciters.map((r) => {
                    const name = r.reciter_name || r.name || r.translated_name?.name || `Reciter ${r.id}`;
                    const isSelected = reciterId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onSelectReciter(r.id);
                          setShowReciterModal(false);
                        }}
                        className={cn(
                          "w-full p-3 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer group",
                          isSelected
                            ? "bg-emerald-700 text-white dark:bg-brand-lime dark:text-brand-deep border-emerald-700 dark:border-brand-lime font-black shadow-sm"
                            : "bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 text-paper-ink dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/15 dark:hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                            isSelected 
                              ? "bg-white/20 text-white dark:bg-brand-deep/20 dark:text-brand-deep" 
                              : "bg-black/5 dark:bg-white/5 text-paper-accent dark:text-white/40"
                          )}>
                            <Mic2 size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-snug">{name}</p>
                            {r.style && (
                              <p className={cn(
                                "text-[10px] uppercase tracking-wider font-semibold",
                                isSelected ? "opacity-80" : "text-paper-accent dark:text-white/40"
                              )}>
                                {r.style}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-brand-deep text-emerald-800 dark:text-brand-lime flex items-center justify-center shrink-0 shadow-sm ml-2">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
