import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  Bookmark, 
  BookmarkCheck, 
  BookOpen, 
  Settings2, 
  Type, 
  Languages, 
  Mic2,
  ChevronDown,
  Volume2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Minus,
  Plus,
  Check,
  Share2
} from 'lucide-react';
import { Card } from '../ui/Base';
import { cn } from '../../lib/utils';
import { quranFoundation } from '../../services/quranFoundation';
import { ttsService } from '../../services/ttsService';

interface AyahCardProps {
  verses: any[];
  isPlaying: boolean;
  onToggleAudio: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isLoadingAudio: boolean;
  audioProgress: number;
  audioDuration: number;
  onSeek: (time: number) => void;
  arabicFontSize: number;
  setArabicFontSize: (size: number) => void;
  translationFontSize: number;
  setTranslationFontSize: (size: number) => void;
  translationId: number;
  setTranslationId: (id: number) => void;
  reciterId: number;
  setReciterId: (id: number) => void;
  tafsirId: number;
  setTafsirId: (id: number) => void;
  arabicScript: string;
  setArabicScript: (script: string) => void;
  translations: any[];
  reciters: any[];
  tafsirs: any[];
  chapters: any[];
  currentAudioVerseIndex: number;
  onPlayVerse: (index: number) => void;
  onOpenStudyDrawer?: () => void;
}

export const AyahCard = ({ 
  verses, 
  isPlaying, 
  onToggleAudio, 
  isBookmarked, 
  onToggleBookmark,
  isLoadingAudio,
  audioProgress,
  audioDuration,
  onSeek,
  arabicFontSize,
  setArabicFontSize,
  translationFontSize,
  setTranslationFontSize,
  translationId,
  setTranslationId,
  reciterId,
  setReciterId,
  tafsirId,
  setTafsirId,
  arabicScript,
  setArabicScript,
  translations,
  reciters,
  tafsirs,
  chapters,
  currentAudioVerseIndex,
  onPlayVerse,
  onOpenStudyDrawer
}: AyahCardProps) => {
  const [showTafsir, setShowTafsir] = React.useState(false);
  const [tafsir, setTafsir] = React.useState<string | null>(null);
  const [loadingTafsir, setLoadingTafsir] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState<'display' | 'translation' | 'audio' | 'tafsir'>('display');

  const handleToggleTafsir = async (forceRefresh = false) => {
    if (forceRefresh && verses.length > 0) {
      setLoadingTafsir(true);
      try {
        const text = await quranFoundation.content.getTafsir(verses[0].verse_key, tafsirId);
        setTafsir(text);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTafsir(false);
      }
    } else if (!forceRefresh) {
      setShowTafsir(!showTafsir);
    }
  };

  // Reset tafsir when tafsirId or showTafsir changes
  React.useEffect(() => {
    if (showTafsir && verses.length > 0) {
      setLoadingTafsir(true);
      quranFoundation.content.getTafsir(verses[0].verse_key, tafsirId)
        .then(setTafsir)
        .catch(console.error)
        .finally(() => setLoadingTafsir(false));
    } else {
      setTafsir(null);
    }
  }, [tafsirId, verses[0]?.verse_key, showTafsir]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [tookTooLong, setTookTooLong] = React.useState(false);

  React.useEffect(() => {
    if (!verses || verses.length === 0) {
      const timer = setTimeout(() => {
        setTookTooLong(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setTookTooLong(false);
    }
  }, [verses]);

  if (!verses || verses.length === 0) return (
    <Card className="bg-brand-deep min-h-[22rem] p-8 flex items-center justify-center border-white/5 bento-card text-center">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        <div className="w-16 h-16 border-4 border-brand-lime/10 border-t-brand-lime rounded-full animate-spin" />
        <div className="space-y-2">
          <div className="text-brand-lime font-black tracking-[0.3em] uppercase text-xs">
            {tookTooLong ? "Connecting to Quran API..." : "Loading Today's Verses"}
          </div>
          <p className="text-white/40 text-xs font-medium">
            {tookTooLong 
              ? "Fetching Quran Foundation verses. You can reload if it doesn't appear." 
              : "Preparing today's daily focus..."}
          </p>
        </div>
        {tookTooLong && (
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-brand-lime text-brand-deep rounded-full text-xs font-black uppercase tracking-wider hover:bg-white transition-all flex items-center gap-2 shadow-lg shadow-brand-lime/20"
          >
            <RefreshCw size={14} />
            <span>Refresh Now</span>
          </button>
        )}
      </div>
    </Card>
  );

  const firstVerse = verses[0];
  const lastVerse = verses[verses.length - 1];
  const surahNumber = firstVerse.verse_key.split(':')[0];
  const surah = chapters.find(c => c.id === parseInt(surahNumber));
  const surahName = surah ? surah.name_simple : `Surah ${surahNumber}`;
  const verseRange = verses.length > 1 
    ? `${firstVerse.verse_key.split(':')[1]}-${lastVerse.verse_key.split(':')[1]}`
    : firstVerse.verse_key.split(':')[1];

  const currentTranslation = translations.find(t => t.id === translationId);
  const languageName = currentTranslation?.language_name || 'English';
  const selectedTafsir = tafsirs.find(t => t.id === tafsirId);

  return (
    <Card className="bg-white dark:bg-brand-deep text-stone-900 dark:text-white border-black/10 dark:border-white/5 space-y-12 relative bento-card p-8 md:p-16 shadow-sm dark:shadow-none">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-brand-lime/5 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 dark:bg-brand-forest/20 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />
      
      <div className="space-y-12 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={onToggleBookmark}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 cursor-pointer", 
                isBookmarked 
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-md dark:bg-brand-lime dark:text-brand-deep dark:border-brand-lime lime-glow" 
                  : "bg-black/5 text-stone-800 border-black/10 hover:bg-black/10 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
              )}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Ayah"}
            >
              {isBookmarked ? <BookmarkCheck size={24} strokeWidth={2.5} fill="currentColor" /> : <Bookmark size={24} strokeWidth={2.5} />}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 cursor-pointer", 
                showSettings 
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-md dark:bg-brand-lime dark:text-brand-deep dark:border-brand-lime lime-glow" 
                  : "bg-black/5 text-stone-800 border-black/10 hover:bg-black/10 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
              )}
              title="Settings"
            >
              <Settings2 size={24} strokeWidth={2.5} />
            </button>
            {onOpenStudyDrawer && (
              <button 
                onClick={onOpenStudyDrawer}
                className="h-12 md:h-14 px-4 sm:px-5 rounded-2xl border border-black/10 dark:border-white/10 bg-emerald-50 dark:bg-white/5 hover:bg-emerald-700 hover:text-white dark:hover:bg-brand-lime dark:hover:text-brand-deep flex items-center gap-2.5 transition-all duration-300 text-xs font-black uppercase tracking-wider group text-emerald-900 dark:text-white cursor-pointer shadow-sm"
                title="Open Study Drawer (Tafsir, Comparison, Insights)"
              >
                <BookOpen size={18} strokeWidth={2.5} className="text-emerald-700 dark:text-brand-lime group-hover:text-white dark:group-hover:text-brand-deep transition-colors" />
                <span className="hidden sm:inline">Study & Tafsir</span>
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-emerald-800 dark:text-brand-lime font-black mb-1.5">Today's Focus</p>
            <p className="text-sm md:text-base font-bold text-stone-600 dark:text-white/50 uppercase tracking-widest">{format(new Date(), 'MMMM do, yyyy')}</p>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
                {/* Tabs */}
                <div className="flex p-2 bg-white/5 border-b border-white/5">
                  {[
                    { id: 'display', icon: Type, label: 'Display' },
                    { id: 'translation', icon: Languages, label: 'Translation' },
                    { id: 'tafsir', icon: BookOpen, label: 'Tafsir' },
                    { id: 'audio', icon: Mic2, label: 'Audio' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id as any)}
                      className={cn(
                        "flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all",
                        activeSettingsTab === tab.id 
                          ? "bg-brand-lime text-brand-deep shadow-lg shadow-brand-lime/20" 
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <tab.icon size={20} strokeWidth={activeSettingsTab === tab.id ? 3 : 2} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-8 md:p-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSettingsTab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-8"
                    >
                      {activeSettingsTab === 'display' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lime">Arabic Font Size</label>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <button 
                                onClick={() => setArabicFontSize(Math.max(24, arabicFontSize - 4))}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                              >
                                <Minus size={20} />
                              </button>
                              <span className="text-xl font-display font-black text-white">{arabicFontSize}px</span>
                              <button 
                                onClick={() => setArabicFontSize(Math.min(120, arabicFontSize + 4))}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-brand-lime/20 hover:text-brand-lime flex items-center justify-center transition-all"
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lime">Translation Size</label>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <button 
                                onClick={() => setTranslationFontSize(Math.max(12, translationFontSize - 2))}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                              >
                                <Minus size={20} />
                              </button>
                              <span className="text-xl font-display font-black text-white">{translationFontSize}px</span>
                              <button 
                                onClick={() => setTranslationFontSize(Math.min(60, translationFontSize + 2))}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-brand-lime/20 hover:text-brand-lime flex items-center justify-center transition-all"
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="col-span-full space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lime">Arabic Script Style</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { id: 'uthmani', label: 'Uthmani' },
                                { id: 'uthmani_simple', label: 'Simple' },
                                { id: 'indopak', label: 'IndoPak' },
                                { id: 'imlaei', label: 'Imlaei' }
                              ].map(script => (
                                <button
                                  key={script.id}
                                  onClick={() => setArabicScript(script.id)}
                                  className={cn(
                                    "p-4 rounded-2xl text-left transition-all border flex items-center justify-between",
                                    arabicScript === script.id 
                                      ? "bg-brand-lime/10 border-brand-lime/30 text-brand-lime" 
                                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                  )}
                                >
                                  <span className="font-bold uppercase tracking-widest text-[10px]">{script.label}</span>
                                  {arabicScript === script.id && <Check size={14} strokeWidth={3} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSettingsTab === 'translation' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {translations.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setTranslationId(t.id)}
                              className={cn(
                                "p-5 rounded-2xl text-left transition-all border flex items-center justify-between group",
                                translationId === t.id 
                                  ? "bg-brand-lime/10 border-brand-lime/30 text-brand-lime" 
                                  : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                              )}
                            >
                              <div className="space-y-1">
                                <p className="font-bold text-xs">{t.name}</p>
                                <p className="text-[9px] uppercase tracking-widest opacity-40">{t.language_name}</p>
                              </div>
                              {translationId === t.id && <Check size={16} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeSettingsTab === 'tafsir' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {tafsirs.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setTafsirId(t.id)}
                              className={cn(
                                "p-5 rounded-2xl text-left transition-all border flex items-center justify-between group",
                                tafsirId === t.id 
                                  ? "bg-brand-lime/10 border-brand-lime/30 text-brand-lime" 
                                  : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                              )}
                            >
                              <div className="space-y-1">
                                <p className="font-bold text-xs">{t.name}</p>
                                <p className="text-[9px] uppercase tracking-widest opacity-40">{t.language_name}</p>
                              </div>
                              {tafsirId === t.id && <Check size={16} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeSettingsTab === 'audio' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {reciters.map(r => (
                            <button
                              key={r.id}
                              onClick={() => setReciterId(r.id)}
                              className={cn(
                                "p-5 rounded-2xl text-left transition-all border flex items-center justify-between group",
                                reciterId === r.id 
                                  ? "bg-brand-lime/10 border-brand-lime/30 text-brand-lime" 
                                  : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                  reciterId === r.id ? "bg-brand-lime text-brand-deep" : "bg-white/5 text-white/40"
                                )}>
                                  <Mic2 size={18} />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-xs">{r.reciter_name || r.name}</p>
                                  <p className="text-[9px] uppercase tracking-widest opacity-40">{r.style}</p>
                                </div>
                              </div>
                              {reciterId === r.id && <Volume2 size={18} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-12">
          <div className="space-y-12">
            {verses.map((v, idx) => {
              const isVersePlaying = isPlaying && currentAudioVerseIndex === idx;
              
              return (
                <div 
                  key={v.id} 
                  className={cn(
                    "space-y-8 relative group/verse p-4 sm:p-6 rounded-[2rem] transition-all duration-500",
                    isVersePlaying ? "bg-white/[0.03] shadow-2xl shadow-brand-lime/5 border border-white/5" : "border border-transparent"
                  )}
                >
                  {/* Verse Play Button - Subtle */}
                  <div className={cn(
                    "absolute left-4 top-6 sm:top-8 transition-all duration-300 z-10 flex flex-col items-center gap-2",
                    isVersePlaying ? "opacity-100 scale-110" : "opacity-100 scale-100"
                  )}>
                    <button
                      onClick={() => onPlayVerse(idx)}
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-md",
                        isVersePlaying ? "bg-emerald-700 text-white dark:bg-brand-lime dark:text-brand-deep lime-glow" : "bg-black/5 dark:bg-white/10 text-paper-accent dark:text-white/40 hover:bg-emerald-700 hover:text-white dark:hover:bg-brand-lime dark:hover:text-brand-deep"
                      )}
                      title="Play Quran Recitation"
                    >
                      {isVersePlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <span className="text-[7px] font-black uppercase tracking-tighter text-paper-accent dark:text-white/40 whitespace-nowrap">Recitation</span>
                  </div>

                  <div className="space-y-6">
                    <p 
                      className={cn(
                        "text-right leading-[2.2] tracking-wide text-paper-ink dark:text-white pl-12 sm:pl-16 font-bold",
                        arabicScript === 'indopak' ? "font-indopak" : "font-arabic"
                      )}
                      dir="rtl"
                      style={{ fontSize: `${arabicFontSize}px` }}
                    >
                      {v[`text_${arabicScript}`] || v.text_uthmani || v.text_uthmani_simple || v.text_imlaei}
                    </p>

                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <p 
                          className="text-paper-ink/90 dark:text-white/80 leading-relaxed font-medium italic tracking-tight"
                          style={{ fontSize: `${translationFontSize}px` }}
                        >
                          "{
                            (v.translations?.find((t: any) => (t.resource_id === translationId || t.id === translationId))?.text || 
                             v.translations?.[0]?.text || 
                             'Translation not available.').replace(/<[^>]*>?/gm, '')
                          }"
                        </p>
                      </div>
                    </div>
                  </div>
                  {idx < verses.length - 1 && <div className="border-t border-white/10 w-1/4 mx-auto" />}
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-white/10 w-full" />
          
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span className="px-5 py-2.5 bg-brand-forest/10 dark:bg-brand-lime/10 text-brand-forest dark:text-brand-lime text-[11px] font-black rounded-xl uppercase tracking-[0.25em] border border-brand-forest/20 dark:border-brand-lime/20 shadow-sm">
                {surahName} {surahNumber}:{verseRange}
              </span>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (onOpenStudyDrawer) onOpenStudyDrawer();
                    else handleToggleTafsir();
                  }}
                  className={cn(
                    "text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95",
                    showTafsir 
                      ? "bg-emerald-700 text-white dark:bg-brand-lime dark:text-brand-deep shadow-md" 
                      : "text-emerald-800 dark:text-brand-lime bg-emerald-50 dark:bg-brand-lime/10 hover:bg-emerald-100 dark:hover:bg-brand-lime/20 border border-emerald-200 dark:border-brand-lime/30"
                  )}
                >
                  <BookOpen size={15} strokeWidth={2.5} />
                  <span>Study & Tafsir</span>
                </button>

                <button 
                  onClick={() => {
                    const text = `${surahName} ${surahNumber}:${verseRange}\n\nRead more on Quran Circles.`;
                    navigator.clipboard.writeText(text);
                    toast.success('Verse reference copied!');
                  }}
                  className="text-paper-accent dark:text-white/40 hover:text-brand-forest dark:hover:text-brand-lime hover:bg-black/5 dark:hover:bg-brand-lime/5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 px-3.5 py-2.5 rounded-xl cursor-pointer"
                >
                  <Share2 size={15} strokeWidth={2.5} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showTafsir && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/5 p-6 md:p-10 rounded-[2.5rem] max-h-[60vh] overflow-y-auto custom-scrollbar border border-white/5 backdrop-blur-xl mt-4">
                    {loadingTafsir ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-6 text-brand-lime font-black uppercase tracking-widest text-xs">
                        <div className="w-10 h-10 border-4 border-brand-lime/10 border-t-brand-lime rounded-full animate-spin" />
                        <span>Fetching Deep Tafsir...</span>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lime">Source: {selectedTafsir?.name || 'Tafsir'}</p>
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{selectedTafsir?.language_name} • {surahName} {surahNumber}:{verseRange}</p>
                          </div>
                        </div>
                        
                        <div 
                          className="prose prose-invert prose-sm md:prose-base max-w-none font-medium text-white/70 leading-relaxed tafsir-content space-y-4 md:space-y-6" 
                          dangerouslySetInnerHTML={{ 
                            __html: tafsir 
                              ? (() => {
                                  // First normalize any <br> tags to newlines
                                  let normalized = tafsir.replace(/<br\s*\/?>/gi, '\n');
                                  
                                  if (normalized.includes('<p') || normalized.includes('<div')) {
                                    return normalized;
                                  } 

                                  // Split by one or more newlines and wrap in <p> tags
                                  return normalized.split(/\n+/)
                                    .filter(p => p.trim())
                                    .map(p => `<p>${p.trim()}</p>`)
                                    .join('');
                                })()
                              : '<p className="italic opacity-50">Tafsir not available for this verse.</p>'
                          }} 
                        />
                        
                        {!tafsir && (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <p className="text-xs text-white/20 font-medium">We couldn't load the tafsir for this verse.</p>
                            <button 
                              onClick={() => handleToggleTafsir(true)}
                              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-brand-lime hover:bg-brand-lime/10 transition-all"
                            >
                              <RefreshCw size={14} strokeWidth={3} />
                              <span>Try Refreshing</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
};
