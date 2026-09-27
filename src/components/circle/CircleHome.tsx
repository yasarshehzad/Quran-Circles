import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Users, Calendar, Trophy, ArrowRight, MessageSquareQuote, Settings, ArrowLeft, Plus, MessageSquare, Flame, User as UserIcon, RefreshCw, UserCircle, Palette, Check, Clock, Share2, BookOpen, X, Copy } from 'lucide-react';
import { Circle, Reflection, Participant, Bookmark } from '../../types';
import { QURAN_PLANS } from '../../constants';
import { AyahCard } from './AyahCard';
import { StreakCard, ProgressSummary } from './StreakCard';
import { Button, Card, Badge } from '../ui/Base';
import { cn } from '../../lib/utils';
import { ReflectionFeed } from './ReflectionFeed';
import { PREDEFINED_AVATARS, AVATAR_COLORS } from '../../constants/avatars';
import { StudyDrawer } from './StudyDrawer';
import { NudgeModal } from './NudgeModal';
import { DeadlineCountdown } from './DeadlineCountdown';

interface CircleHomeProps {
  circle: Circle;
  currentVerses: any[];
  reflections: Reflection[];
  bookmarks: Bookmark[];
  isPlaying: boolean;
  onToggleAudio: () => void;
  onToggleBookmark: () => void;
  onBack: () => void;
  onSettings: () => void;
  onReact: (reflectionId: string, emoji: string) => void;
  activeParticipantId: string | null;
  setActiveParticipantId: (id: string | null) => void;
  newReflection: string;
  setNewReflection: (val: string) => void;
  submitReflection: () => void;
  isLoadingAudio: boolean;
  // New Quran Settings Props
  audioProgress: number;
  audioDuration: number;
  onSeek: (time: number) => void;
  arabicFontSize: number;
  setArabicFontSize: (size: number) => void;
  translationId: number;
  setTranslationId: (id: number) => void;
  reciterId: number;
  setReciterId: (id: number) => void;
  arabicScript: string;
  setArabicScript: (script: string) => void;
  translations: any[];
  reciters: any[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onUpdateParticipant: (participantId: string, updates: Partial<Participant>) => void;
  onAddLocalParticipant?: (name: string) => void;
  onShowProfile: () => void;
  translationFontSize: number;
  setTranslationFontSize: (size: number) => void;
  tafsirId: number;
  setTafsirId: (id: number) => void;
  tafsirs: any[];
  chapters: any[];
  user: any;
  currentAudioVerseIndex: number;
  onPlayVerse: (index: number) => void;
}

export const CircleHome = ({
  circle,
  currentVerses,
  reflections,
  bookmarks,
  isPlaying,
  onToggleAudio,
  onToggleBookmark,
  onBack,
  onSettings,
  onReact,
  activeParticipantId,
  setActiveParticipantId,
  newReflection,
  setNewReflection,
  submitReflection,
  isLoadingAudio,
  audioProgress,
  audioDuration,
  onSeek,
  arabicFontSize,
  setArabicFontSize,
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
  selectedDate,
  onDateChange,
  onUpdateParticipant,
  onAddLocalParticipant,
  onShowProfile,
  translationFontSize,
  setTranslationFontSize,
  chapters,
  user,
  currentAudioVerseIndex,
  onPlayVerse
}: CircleHomeProps) => {
  const [activeTab, setActiveTab] = React.useState<'reflections' | 'calendar'>('reflections');
  const [currentPromptIndex, setCurrentPromptIndex] = React.useState(0);
  const [calendarMonthOffset, setCalendarMonthOffset] = React.useState(0);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isStudyDrawerOpen, setIsStudyDrawerOpen] = React.useState(false);
  const [nudgingParticipant, setNudgingParticipant] = React.useState<Participant | null>(null);

  const versesPerDay = circle.versesPerDay || 1;
  const isPlural = versesPerDay > 1;

  const prompts = [
    `How do ${isPlural ? 'these verses' : 'this verse'} apply to your life today?`,
    `What is one word from ${isPlural ? 'these verses' : 'this verse'} that stands out to you?`,
    `How can you implement the message of ${isPlural ? 'these verses' : 'this verse'} in your actions?`,
    `What do ${isPlural ? 'these verses' : 'this verse'} teach you about Allah's mercy?`,
    `If you were explaining ${isPlural ? 'these verses' : 'this verse'} to a child, what would you say?`,
    `What feeling do ${isPlural ? 'these verses' : 'this verse'} evoke in your heart?`,
    `How do ${isPlural ? 'these verses' : 'this verse'} change your perspective on a current challenge?`
  ];

  const cyclePrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
  };
  
  const selectableParticipantIds = React.useMemo(() => {
    if (!user) return [];
    return circle.participants
      .filter(p => p.id === user.uid || p.parentUid === user.uid)
      .map(p => p.id);
  }, [user, circle.participants]);
  
  const activeParticipant = circle.participants.find(p => p.id === activeParticipantId);
  const isOwnProfile = activeParticipantId === user?.uid;
  const isBookmarked = bookmarks.some(b => currentVerses.some(v => v.verse_key === b.ayahKey));
  const todayDate = new Date().toISOString().split('T')[0];
  const todayReflections = reflections.filter(r => r.date === todayDate);
  const progressPercent = (todayReflections.length / circle.participants.length) * 100;

  return (
    <div className="space-y-12 md:space-y-16 pb-32 max-w-7xl mx-auto">
      {/* Circle Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 px-4">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
          <button 
            onClick={onBack} 
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
          >
            <ArrowLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="space-y-6">
            <div className="space-y-2">
              {/* Supertitle for Plan Name */}
              {circle.planName && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-brand-lime font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
                  <BookOpen size={16} strokeWidth={3} />
                  <span>Current Plan: {circle.planName}</span>
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tighter text-white">{circle.name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge variant="lime">Code: {circle.inviteCode}</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-3 gap-x-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50 border-t border-white/10 pt-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-lime/20 text-brand-lime"><Trophy size={14} strokeWidth={3} /></span>
                  <span className="text-white">{circle.streak.current} Day Streak</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-white/80"><Users size={14} strokeWidth={3} /></span>
                  <span>{circle.participants.length} Members</span>
                </div>
                <DeadlineCountdown circle={circle} isComplete={progressPercent >= 100} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1 md:flex-none py-4 md:py-6" 
            onClick={() => setIsInviteModalOpen(true)} 
            icon={Share2}
          >
            Invite
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1 md:flex-none py-4 md:py-6" 
            onClick={onShowProfile} 
            icon={UserCircle}
          >
            Profile
          </Button>
          <button 
            onClick={onSettings}
            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
          >
            <Settings size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Today's Ayah Focus & Progress */}
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <section className="lg:col-span-7 space-y-12">
          <div className="flex items-center justify-between px-4">
            <div className="space-y-2">
              <p className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em]">Today's Focus</p>
              <h3 className="text-3xl font-display font-black uppercase tracking-tight">The {isPlural ? 'Verses' : 'Verse'}</h3>
            </div>
            <div className="px-6 py-3 bg-brand-lime text-brand-deep rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] lime-glow">
              Day {Math.floor((Date.now() - new Date(circle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
            </div>
          </div>
          
          <AyahCard 
            verses={currentVerses}
            isPlaying={isPlaying}
            isLoadingAudio={isLoadingAudio}
            onToggleAudio={onToggleAudio}
            isBookmarked={isBookmarked}
            onToggleBookmark={onToggleBookmark}
            audioProgress={audioProgress}
            audioDuration={audioDuration}
            onSeek={onSeek}
            arabicFontSize={arabicFontSize}
            setArabicFontSize={setArabicFontSize}
            translationId={translationId}
            setTranslationId={setTranslationId}
            reciterId={reciterId}
            setReciterId={setReciterId}
            arabicScript={arabicScript}
            setArabicScript={setArabicScript}
            translations={translations}
            reciters={reciters}
            tafsirs={tafsirs}
            translationFontSize={translationFontSize}
            setTranslationFontSize={setTranslationFontSize}
            tafsirId={tafsirId}
            setTafsirId={setTafsirId}
            chapters={chapters}
            currentAudioVerseIndex={currentAudioVerseIndex}
            onPlayVerse={onPlayVerse}
            onOpenStudyDrawer={() => setIsStudyDrawerOpen(true)}
          />

          {activeParticipantId ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em]">Your Reflection</p>
                    {activeParticipant && !isOwnProfile && (
                      <Badge variant="outline" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20 text-[8px]">
                        Writing for {activeParticipant.name}
                      </Badge>
                    )}
                  </div>
                  <button 
                    onClick={cyclePrompt}
                    className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-brand-lime transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={12} /> New Prompt
                  </button>
                </div>
                <div className="relative">
                  <textarea 
                    value={newReflection}
                    onChange={(e) => setNewReflection(e.target.value)}
                    placeholder={prompts[currentPromptIndex]}
                    className="w-full p-6 md:p-10 bg-brand-forest/30 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-brand-lime/20 outline-none transition-all min-h-[180px] md:min-h-[220px] resize-none font-medium text-lg md:text-xl text-white placeholder:text-white/20 backdrop-blur-xl"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg"
                    style={{ backgroundColor: activeParticipant?.color || '#A3E635' }}
                  >
                    {activeParticipant?.avatar || activeParticipant?.name[0] || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Posting as</span>
                    <span className="font-bold text-white">{activeParticipant?.name || 'Select Member'}</span>
                  </div>
                </div>
                <Button 
                  onClick={submitReflection} 
                  size="lg" 
                  className="w-full md:w-auto px-10 py-5 text-base md:text-lg font-black tracking-wide gap-3 shadow-lg shadow-brand-lime/25" 
                  icon={MessageSquare} 
                  disabled={!newReflection.trim() || !activeParticipantId}
                >
                  Post Reflection
                </Button>
              </div>
            </motion.div>
          ) : (
            <Card className="p-10 text-center space-y-6 bg-brand-forest/20 border-white/10 backdrop-blur-xl bento-card">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="text-brand-lime" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-black uppercase tracking-tight">Select a Member</h3>
                <p className="text-white/40 font-medium">Please select your profile from the members list to post a reflection.</p>
              </div>
              {user && circle.participants.some(p => p.id === user.uid) && (
                <Button 
                  variant="lime" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setActiveParticipantId(user.uid)}
                >
                  Select My Profile
                </Button>
              )}
              <p className="text-[10px] font-black text-brand-lime uppercase tracking-[0.2em]">Click on a name in the members list →</p>
            </Card>
          )}
        </section>

        {/* Circle Progress & Participants */}
        <section className="lg:col-span-5 space-y-12">
          <div className="space-y-8">
            <ProgressSummary 
              participants={circle.participants} 
              reflections={reflections} 
              date={todayDate}
              selectableIds={selectableParticipantIds}
              onSelectParticipant={(id) => {
                if (selectableParticipantIds.includes(id)) {
                  setActiveParticipantId(id);
                } else {
                  toast.error("You can only post on behalf of yourself or users you've created.");
                }
              }}
              activeParticipantId={activeParticipantId}
              onAddLocalParticipant={(circle.participationMode === 'shared' || circle.participationMode === 'hybrid') ? onAddLocalParticipant : undefined}
              onNudgeParticipant={(p) => setNudgingParticipant(p)}
            />
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('reflections')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'reflections' ? "bg-brand-lime text-brand-deep shadow-lg shadow-brand-lime/20" : "text-white/40 hover:text-white/60"
                )}
              >
                Reflections
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'calendar' ? "bg-brand-lime text-brand-deep shadow-lg shadow-brand-lime/20" : "text-white/40 hover:text-white/60"
                )}
              >
                Calendar
              </button>
            </div>

            {activeTab === 'reflections' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em]">Feed</p>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tight">Reflections</h3>
                  </div>
                </div>
                <ReflectionFeed 
                  reflections={reflections} 
                  participants={circle.participants}
                  onReact={onReact}
                  currentParticipantId={activeParticipantId}
                />
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em]">Timeline</p>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tight">Plan Calendar</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCalendarMonthOffset(prev => prev - 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setCalendarMonthOffset(0)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => setCalendarMonthOffset(prev => prev + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                <Card className="p-4 md:p-8 bg-brand-forest/20 border-white/10">
                  <div className="grid grid-cols-7 gap-1 md:gap-3">
                    {Array.from({ length: 35 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(1); // Start of current month
                      date.setMonth(date.getMonth() + calendarMonthOffset);
                      
                      // Adjust to start of week (Sunday)
                      const firstDayOfMonth = date.getDay();
                      date.setDate(date.getDate() - firstDayOfMonth + i);
                      
                      const dateStr = date.toISOString().split('T')[0];
                      const isSelected = selectedDate === dateStr;
                      const isPast = date < new Date(new Date().setHours(0,0,0,0));
                      const isToday = dateStr === new Date().toISOString().split('T')[0];
                      
                      // Check if this date is within the circle's plan
                      const start = new Date(circle.startDate);
                      start.setHours(0,0,0,0);
                      const planSize = circle.verses?.length || QURAN_PLANS.find(p => p.id === circle.planId)?.verses.length || 0;
                      const planDays = Math.ceil(planSize / (circle.versesPerDay || 1));
                      const end = new Date(start);
                      end.setDate(end.getDate() + planDays);
                      
                      const isInPlan = date >= start && date < end;
                      const planDayIndex = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <button
                          key={i}
                          onClick={() => isInPlan && onDateChange(dateStr)}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center transition-all border relative overflow-hidden",
                            isSelected ? "bg-brand-lime border-brand-lime text-brand-deep scale-105 z-10 shadow-xl shadow-brand-lime/20" : 
                            isToday ? "bg-white/10 border-brand-lime/50 text-brand-lime" :
                            isInPlan ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" :
                            "bg-transparent border-transparent text-white/5 cursor-default"
                          )}
                        >
                          {isInPlan && (
                            <span className="text-[8px] font-black uppercase opacity-30 absolute top-1 left-2">Day {planDayIndex + 1}</span>
                          )}
                          <span className="text-sm font-bold">{date.getDate()}</span>
                          {date.getMonth() !== (new Date(new Date().setMonth(new Date().getMonth() + calendarMonthOffset)).getMonth()) && (
                            <div className="absolute inset-0 bg-brand-deep/40 pointer-events-none" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand-lime" />
                        <span className="text-[10px] font-black uppercase text-white/40">Selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white/10 border border-brand-lime/50" />
                        <span className="text-[10px] font-black uppercase text-white/40">Today</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" />
                        <span className="text-[10px] font-black uppercase text-white/40">Plan Day</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                        {new Date(new Date().setMonth(new Date().getMonth() + calendarMonthOffset)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <div className="h-4 w-px bg-white/10" />
                      <p className="text-[10px] font-black uppercase text-brand-lime tracking-widest">
                        Viewing: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-deep/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-brand-deep border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-brand-lime/5 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-lime to-transparent opacity-50" />
              
              <div className="p-6 md:p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight">Invite to Circle</h3>
                    <p className="text-white/40 text-sm font-medium leading-relaxed">
                      Share this incredibly powerful invite code with friends or family. They can enter it on their dashboard to instantly join your circle.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-lime/80">Your Unique Code</p>
                  <p className="font-mono text-4xl md:text-5xl font-black text-white tracking-[0.2em]">{circle.inviteCode}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    className="w-full py-4 text-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(circle.inviteCode);
                      toast.success('Invite code copied to clipboard!');
                    }}
                    icon={Copy}
                  >
                    Copy Code
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full py-4 text-sm"
                    onClick={() => setIsInviteModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Over Study Drawer (Tafsir, Translations, Insights) */}
      <StudyDrawer 
        isOpen={isStudyDrawerOpen}
        onClose={() => setIsStudyDrawerOpen(false)}
        verses={currentVerses}
        chapters={chapters}
        tafsirId={tafsirId}
        setTafsirId={setTafsirId}
        tafsirs={tafsirs}
        translations={translations}
        currentTranslationId={translationId}
      />

      {/* Member Encouragement & Nudge Modal */}
      <NudgeModal 
        isOpen={!!nudgingParticipant}
        onClose={() => setNudgingParticipant(null)}
        participant={nudgingParticipant}
        circle={circle}
      />
    </div>
  );
};
