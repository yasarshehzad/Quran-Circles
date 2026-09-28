import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  Languages, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Check, 
  Copy, 
  ExternalLink,
  BookMarked,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../ui/Base';
import { quranFoundation } from '../../services/quranFoundation';
import { toast } from 'sonner';

interface StudyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  verses: any[];
  chapters: any[];
  tafsirId: number;
  setTafsirId: (id: number) => void;
  tafsirs: any[];
  translations: any[];
  currentTranslationId: number;
}

export const StudyDrawer: React.FC<StudyDrawerProps> = ({
  isOpen,
  onClose,
  verses,
  chapters,
  tafsirId,
  setTafsirId,
  tafsirs,
  translations,
  currentTranslationId
}) => {
  const [activeTab, setActiveTab] = useState<'tafsir' | 'compare' | 'surah' | 'notes'>('tafsir');
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [multiTranslations, setMultiTranslations] = useState<any[]>([]);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [scratchNotes, setScratchNotes] = useState<string>(() => {
    return localStorage.getItem('study_scratch_notes') || '';
  });
  const [isCopied, setIsCopied] = useState(false);

  const firstVerse = verses?.[0];
  const verseKey = firstVerse?.verse_key || '1:1';
  const surahNumber = parseInt(verseKey.split(':')[0], 10);
  const currentChapter = chapters?.find(c => c.id === surahNumber);

  // Load Tafsir
  useEffect(() => {
    if (isOpen && verseKey) {
      setIsLoadingTafsir(true);
      quranFoundation.content.getTafsir(verseKey, tafsirId)
        .then(setTafsirText)
        .catch(err => {
          console.error("Failed to load tafsir:", err);
          setTafsirText("Tafsir content is currently unavailable for this verse. Please select another source.");
        })
        .finally(() => setIsLoadingTafsir(false));
    }
  }, [isOpen, verseKey, tafsirId]);

  // Load Compare Translations (Clear Quran, Sahih International, Pickthall, Yusuf Ali)
  useEffect(() => {
    if (isOpen && activeTab === 'compare' && verseKey) {
      setIsLoadingTranslations(true);
      // Fetch popular English translation resources: 85 (M.A.S. Abdel Haleem), 20 (Sahih Int.), 19 (Pickthall), 84 (Mufti Taqi Usmani)
      const targetResourceIds = [85, 20, 19, 84];
      
      Promise.all(
        targetResourceIds.map(async (resId) => {
          try {
            const vData = await quranFoundation.content.getVerse(verseKey, resId);
            const text = vData?.translations?.[0]?.text?.replace(/<[^>]*>?/gm, '') || '';
            if (!text) return null;
            const meta = translations.find(t => t.id === resId) || {
              author_name: resId === 85 ? 'M.A.S. Abdel Haleem' : resId === 20 ? 'Saheeh International' : resId === 19 ? 'Mohammed Marmaduke Pickthall' : 'Mufti Taqi Usmani',
              name: resId === 85 ? 'Abdel Haleem (Oxford)' : resId === 20 ? 'Sahih International' : resId === 19 ? 'Pickthall Translation' : 'Taqi Usmani'
            };
            return { id: resId, meta, text };
          } catch {
            return null;
          }
        })
      )
      .then(res => setMultiTranslations(res.filter(Boolean)))
      .catch(console.error)
      .finally(() => setIsLoadingTranslations(false));
    }
  }, [isOpen, activeTab, verseKey, translations]);

  // Save notes to localStorage
  const handleSaveNotes = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem('study_scratch_notes', val);
  };

  const handleCopyAyah = () => {
    if (!firstVerse) return;
    const arabic = firstVerse.text_uthmani || firstVerse.text_imlaei || '';
    const trans = firstVerse.translations?.[0]?.text?.replace(/<[^>]*>?/gm, '') || '';
    const shareText = `${arabic}\n\n"${trans}"\n— Surah ${currentChapter?.name_simple || ''} (${verseKey})`;
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    toast.success("Ayah & translation copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-deep/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl h-full bg-paper-bg dark:bg-brand-forest/95 backdrop-blur-2xl border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col z-20 text-paper-ink dark:text-white"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-brand-deep/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-brand-lime dark:text-brand-deep text-[10px] font-black rounded-lg uppercase tracking-widest lime-glow">
                    Study Center
                  </span>
                  <span className="text-paper-accent dark:text-white/40 text-xs font-bold uppercase tracking-wider">
                    Ayah {verseKey}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">
                  {currentChapter ? `Surah ${currentChapter.name_simple}` : `Ayah ${verseKey}`}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAyah}
                  className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-paper-accent dark:text-white/60 hover:text-emerald-800 dark:hover:text-brand-lime transition-all border border-black/5 dark:border-white/5 cursor-pointer"
                  title="Copy Ayah"
                >
                  {isCopied ? <Check size={18} className="text-emerald-700 dark:text-brand-lime" /> : <Copy size={18} />}
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-paper-accent dark:text-white/60 hover:text-paper-ink dark:hover:text-white transition-all border border-black/5 dark:border-white/5 cursor-pointer"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-black/10 dark:border-white/10 px-6 bg-black/[0.02] dark:bg-white/[0.02] overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'tafsir', label: 'Tafsir & Meaning', icon: BookOpen },
                { id: 'compare', label: 'Compare Translations', icon: Languages },
                { id: 'surah', label: 'Surah Insights', icon: Lightbulb },
                { id: 'notes', label: 'My Notes', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-emerald-700 text-emerald-800 dark:border-brand-lime dark:text-brand-lime'
                        : 'border-transparent text-paper-accent dark:text-white/40 hover:text-paper-ink dark:hover:text-white hover:border-black/20 dark:hover:border-white/20'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar text-paper-ink dark:text-white">
              {/* TAB 1: TAFSIR */}
              {activeTab === 'tafsir' && (
                <div className="space-y-6">
                  {/* Tafsir Source Selector */}
                  <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-brand-lime">
                        Tafsir Scholarly Commentary
                      </label>
                      <span className="text-[10px] text-paper-accent dark:text-white/50 font-bold">
                        3 English • 2 Arabic Sources
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        { id: 169, name: 'Ibn Kathir', author: 'Hafiz Ibn Kathir', lang: 'English' },
                        { id: 168, name: "Ma'arif al-Qur'an", author: 'Mufti Muhammad Shafi', lang: 'English' },
                        { id: 817, name: 'Tazkirul Quran', author: 'Maulana Wahiduddin Khan', lang: 'English' },
                        { id: 16, name: 'Tafsir Muyassar', author: 'المیسر', lang: 'Arabic' },
                        { id: 91, name: "Al-Sa'di", author: 'السعدي', lang: 'Arabic' }
                      ].map(src => (
                        <button
                          key={src.id}
                          onClick={() => setTafsirId(src.id)}
                          className={`py-2.5 px-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                            tafsirId === src.id
                              ? 'bg-emerald-700 text-white dark:bg-brand-lime dark:text-brand-deep border-emerald-700 dark:border-brand-lime font-black shadow-md'
                              : 'bg-black/5 dark:bg-white/5 text-paper-accent dark:text-white/70 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 hover:text-paper-ink dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="text-xs font-bold truncate">{src.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider shrink-0 uppercase ${
                              tafsirId === src.id
                                ? 'bg-white/20 text-white dark:bg-brand-deep/20 dark:text-brand-deep'
                                : 'bg-black/10 dark:bg-white/10 text-paper-accent dark:text-white/60'
                            }`}>{src.lang === 'English' ? 'EN' : 'AR'}</span>
                          </div>
                          <span className={`text-[10px] truncate ${
                            tafsirId === src.id ? 'opacity-80' : 'opacity-50'
                          }`}>{src.author}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Ayah Arabic & Translation summary */}
                  {firstVerse && (
                    <div className="p-5 bg-white dark:bg-brand-deep/50 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                      <p className="text-right font-arabic text-xl leading-loose text-paper-ink dark:text-white/90" dir="rtl">
                        {firstVerse.text_uthmani || firstVerse.text_imlaei}
                      </p>
                      <p className="text-sm text-paper-accent dark:text-white/70 italic leading-relaxed border-t border-black/5 dark:border-white/5 pt-3">
                        "{firstVerse.translations?.[0]?.text?.replace(/<[^>]*>?/gm, '')}"
                      </p>
                    </div>
                  )}

                  {/* Tafsir Body */}
                  <div className="p-6 bg-white dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 space-y-4">
                    {isLoadingTafsir ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-3 border-emerald-700/20 dark:border-brand-lime/20 border-t-emerald-700 dark:border-t-brand-lime rounded-full animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-brand-lime">Loading commentary...</span>
                      </div>
                    ) : tafsirText ? (
                      <div 
                        className="prose dark:prose-invert max-w-none text-stone-900 dark:text-white/90 leading-relaxed font-medium text-sm sm:text-base space-y-4 break-words"
                        dangerouslySetInnerHTML={{ __html: tafsirText }}
                      />
                    ) : (
                      <p className="text-stone-500 dark:text-white/40 italic text-center py-8">
                        No tafsir found for this selection. Try choosing another commentary source above.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MULTI TRANSLATIONS COMPARISON */}
              {activeTab === 'compare' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-lg font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">Translation Comparisons</h4>
                    <p className="text-xs text-paper-accent dark:text-white/40 font-medium">
                      Examine nuanced translations across renowned scholars and translators.
                    </p>
                  </div>

                  {isLoadingTranslations ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-3 border-emerald-700/20 dark:border-brand-lime/20 border-t-emerald-700 dark:border-t-brand-lime rounded-full animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-brand-lime">Gathering translations...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {multiTranslations.map((item, idx) => (
                        <div key={idx} className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 space-y-2 hover:border-emerald-700/30 dark:hover:border-brand-lime/30 transition-colors shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-brand-lime">
                              {item.meta?.name || item.meta?.author_name}
                            </span>
                            <span className="text-[10px] text-paper-accent dark:text-white/40 uppercase tracking-widest font-bold">
                              {item.meta?.author_name}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base text-paper-ink dark:text-white/90 leading-relaxed font-serif italic pt-1">
                            "{item.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SURAH INSIGHTS */}
              {activeTab === 'surah' && currentChapter && (
                <div className="space-y-6">
                  <div className="p-6 bg-white dark:bg-gradient-to-br dark:from-brand-lime/10 dark:to-transparent rounded-3xl border border-black/10 dark:border-brand-lime/20 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-brand-lime dark:text-brand-deep text-[10px] font-black uppercase tracking-widest">
                        Surah #{currentChapter.id}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-paper-accent dark:text-white/60">
                        {currentChapter.revelation_place === 'makkah' ? '🕋 Meccan' : '🕌 Medinan'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-2xl font-display font-black text-paper-ink dark:text-white">
                        {currentChapter.name_simple} ({currentChapter.name_arabic})
                      </h4>
                      <p className="text-emerald-800 dark:text-brand-lime font-bold text-sm">
                        "{currentChapter.translated_name?.name || 'The Chapter'}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="text-[9px] uppercase tracking-wider text-paper-accent dark:text-white/40 block font-black">Verses</span>
                        <span className="text-lg font-black text-paper-ink dark:text-white">{currentChapter.verses_count} Ayahs</span>
                      </div>
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="text-[9px] uppercase tracking-wider text-paper-accent dark:text-white/40 block font-black">Revelation Order</span>
                        <span className="text-lg font-black text-paper-ink dark:text-white">#{currentChapter.revelation_order}</span>
                      </div>
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 col-span-2 sm:col-span-1">
                        <span className="text-[9px] uppercase tracking-wider text-paper-accent dark:text-white/40 block font-black">Bismillah</span>
                        <span className="text-sm font-bold text-paper-ink/80 dark:text-white/80">{currentChapter.bismillah_pre ? 'Preceded' : 'No pre-bismillah'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 space-y-3 shadow-sm">
                    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-brand-lime">Core Themes & Context</h5>
                    <p className="text-sm text-paper-ink/80 dark:text-white/70 leading-relaxed font-medium">
                      {currentChapter.id === 1 && "Al-Fatihah ('The Opening') encapsulates the essence of the entire Quran: divine praise, acknowledgement of the Day of Judgment, sincere worship, and supplication for guidance upon the straight path."}
                      {currentChapter.id === 2 && "Al-Baqarah ('The Cow') provides foundational guidance across creed, legal ordinances, family ethics, worship, financial conduct, and trust in divine sovereignty."}
                      {currentChapter.id > 2 && `Revealed in ${currentChapter.revelation_place === 'makkah' ? 'Mecca focusing primarily on creed, the afterlife, and spiritual steadfastness' : 'Medina focusing on community building, societal laws, and righteous brotherhood'}.`}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: MY NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4 flex flex-col h-full">
                  <div className="space-y-1">
                    <h4 className="text-lg font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">Study Scratchpad</h4>
                    <p className="text-xs text-paper-accent dark:text-white/40 font-medium">
                      Jot down insights, vocabulary notes, and reflections as you read. Saved automatically.
                    </p>
                  </div>

                  <textarea
                    value={scratchNotes}
                    onChange={(e) => handleSaveNotes(e.target.value)}
                    placeholder="Write your study notes, reflections, or questions here..."
                    className="w-full h-64 p-5 bg-white dark:bg-brand-deep/70 border border-black/10 dark:border-white/10 rounded-2xl outline-none focus:border-emerald-700 dark:focus:border-brand-lime focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-brand-lime/20 text-paper-ink dark:text-white placeholder:text-paper-accent/40 dark:placeholder:text-white/20 font-medium text-sm leading-relaxed resize-none shadow-sm"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-brand-lime font-black">
                      ✓ Auto-saved locally
                    </span>
                    <button
                      onClick={() => handleSaveNotes('')}
                      className="text-[10px] text-paper-accent dark:text-white/30 hover:text-rose-600 dark:hover:text-rose-400 uppercase tracking-widest font-black transition-colors cursor-pointer"
                    >
                      Clear Notes
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-black/10 dark:border-white/10 bg-white dark:bg-brand-deep/50 shrink-0 flex items-center justify-between">
              <span className="text-xs text-paper-accent dark:text-white/40 font-medium">
                Quran Circles Study Companion
              </span>
              <Button size="sm" onClick={onClose} className="px-6">
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
