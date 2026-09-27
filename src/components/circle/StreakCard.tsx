import React from 'react';
import { motion } from 'motion/react';
import { Flame, CheckCircle2, Circle as CircleIcon, Users, Clock, Hourglass, XCircle, Info, Plus, Bell } from 'lucide-react';
import { Circle, Reflection, Participant } from '../../types';
import { getDayProgress } from '../../lib/streakUtils';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Base';
import { DeadlineCountdown } from './DeadlineCountdown';

interface StreakCardProps {
  circle: Circle;
  reflections: Reflection[];
}

export const StreakCard: React.FC<StreakCardProps> = ({ circle, reflections }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const progress = getDayProgress(circle.participants, reflections, today);

  return (
    <div className="bg-brand-forest/20 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 border-2 border-brand-lime/20 space-y-12 bento-card relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-lime/10 rounded-full -mr-40 -mt-40 blur-[100px] pointer-events-none group-hover:bg-brand-lime/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/5 rounded-full -ml-32 -mb-32 blur-[80px] pointer-events-none" />
      
      {/* Hero Header */}
      <div className="text-center space-y-6 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-3 bg-brand-lime/10 border border-brand-lime/20 px-6 py-3 rounded-full lime-glow">
            <Flame className="text-brand-lime" fill="currentColor" size={24} />
            <span className="text-2xl font-black text-brand-lime uppercase tracking-widest">{circle.streak.current} Day Streak</span>
          </div>
          <DeadlineCountdown circle={circle} isComplete={progress.isComplete} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter text-white">Today's Progress</h2>
          <div className="inline-block mt-4 px-6 py-3 bg-brand-accent/20 border-2 border-brand-accent/30 rounded-2xl">
            <p className="text-brand-accent font-black uppercase tracking-[0.2em] text-sm md:text-base">
              Your streak depends on everyone completing today
            </p>
          </div>
        </div>
      </div>

      {/* Member Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {circle.participants.map(p => {
          const isDone = progress.completed.some(cp => cp.id === p.id);
          
          return (
            <div 
              key={p.id}
              className={cn(
                "p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 text-center transition-all duration-500",
                isDone 
                  ? "bg-brand-lime/10 border-brand-lime/30 shadow-[0_0_30px_rgba(163,230,53,0.1)]" 
                  : "bg-white/5 border-white/10"
              )}
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 border-white/10 relative"
                style={{ backgroundColor: p.color || '#A3E635' }}
              >
                {p.avatar || p.name[0]}
                <div className={cn(
                  "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-brand-deep",
                  isDone ? "bg-brand-lime text-brand-deep" : "bg-white/10 text-white/40"
                )}>
                  {isDone ? <CheckCircle2 size={16} strokeWidth={4} /> : <Hourglass size={14} strokeWidth={3} />}
                </div>
              </div>
              <div className="space-y-1 w-full px-1">
                <p 
                  className={cn("font-black tracking-wide text-sm sm:text-base break-words w-full line-clamp-2 leading-tight", isDone ? "text-white" : "text-white/60")}
                  title={p.name}
                >
                  {p.name}
                </p>
                <Badge variant="outline" className={cn("text-[9px] border-white/10 mt-1 inline-block", isDone ? "text-brand-lime" : "text-white/40")}>
                  {p.type === 'auth' ? 'Member' : 'Local'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar & Status */}
      <div className="space-y-6 relative z-10 max-w-2xl mx-auto text-center">
        <div className="w-full h-4 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 12 }}
            className="h-full bg-brand-lime rounded-full shadow-[0_0_20px_rgba(163,230,53,0.5)]"
          />
        </div>
        
        <div className={cn(
          "inline-block px-8 py-4 rounded-2xl border-2 font-black uppercase tracking-[0.2em] text-sm md:text-base transition-all duration-500",
          progress.isComplete 
            ? "bg-brand-lime text-brand-deep border-brand-lime shadow-[0_0_30px_rgba(163,230,53,0.3)]" 
            : "bg-white/5 text-white/60 border-white/10"
        )}>
          {progress.isComplete 
            ? "🔥 Everyone showed up! Streak Extended!" 
            : `⏳ ${circle.participants.length - progress.completed.length} more needed to complete today`}
        </div>
      </div>
    </div>
  );
};

interface ProgressSummaryProps {
  participants: Participant[];
  reflections: Reflection[];
  date: string;
  onSelectParticipant?: (id: string) => void;
  activeParticipantId?: string | null;
  selectableIds?: string[];
  onAddLocalParticipant?: (name: string) => void;
  onNudgeParticipant?: (p: Participant) => void;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ 
  participants, 
  reflections, 
  date,
  onSelectParticipant,
  activeParticipantId,
  selectableIds,
  onAddLocalParticipant,
  onNudgeParticipant
}) => {
  const [newMemberName, setNewMemberName] = React.useState('');
  const progress = getDayProgress(participants, reflections, date);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
        <div className="space-y-2">
          <p className="text-[12px] font-black text-brand-forest dark:text-brand-lime uppercase tracking-[0.5em]">Daily Accountability</p>
          <h3 className="text-4xl font-display font-black uppercase tracking-tighter">Member Status</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-paper-accent dark:text-white/40 uppercase tracking-widest">Circle Rule:</span>
          <span className="text-[10px] font-black text-brand-forest dark:text-brand-lime bg-brand-forest/10 dark:bg-brand-lime/10 border border-brand-forest/20 dark:border-brand-lime/20 px-4 py-2 rounded-full uppercase tracking-widest">
            Streak only completes when ALL reflect
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {participants.map(p => {
          const isDone = progress.completed.some(cp => cp.id === p.id);
          const isActive = activeParticipantId === p.id;
          const isSelectable = onSelectParticipant && (!selectableIds || selectableIds.includes(p.id));
          
          return (
            <div 
              key={p.id}
              onClick={() => isSelectable && onSelectParticipant(p.id)}
              className={cn(
                "flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden",
                isSelectable ? "cursor-pointer hover:border-brand-lime/40 hover:bg-white/[0.07] active:scale-[0.99]" : "",
                isActive 
                  ? "bg-brand-lime/15 border-brand-lime shadow-[0_0_20px_rgba(163,230,53,0.15)]" 
                  : isDone 
                    ? "bg-brand-lime/5 border-brand-lime/25" 
                    : "bg-white/5 border-white/10"
              )}
            >
              {(isDone || isActive) && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lime/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              )}
              
              <div className="flex items-center gap-3.5 relative z-10 flex-1 min-w-0 pr-3">
                <div 
                  className={cn(
                    "w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center font-black text-base border-2 shadow-md transition-all",
                    isActive ? "border-brand-lime text-brand-deep bg-brand-lime" : isDone ? "border-brand-lime text-brand-deep" : "border-white/10 text-white/70"
                  )}
                  style={{ backgroundColor: (isActive || isDone) ? (p.color || '#A3E635') : 'rgba(255,255,255,0.06)' }}
                >
                  {p.avatar || p.name[0]}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className={cn(
                        "text-base font-bold tracking-tight truncate block", 
                        (isDone || isActive) ? "text-paper-ink dark:text-white" : "text-paper-ink/80 dark:text-white/80"
                      )} 
                      title={p.name}
                    >
                      {p.name}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-forest/10 dark:bg-brand-lime/20 border border-brand-forest/20 dark:border-brand-lime/30 text-brand-forest dark:text-brand-lime text-[9px] font-black uppercase tracking-wider shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold tracking-wide text-paper-accent dark:text-white/60 truncate">
                    {isActive ? "Today's reader" : isDone ? 'Reflection Posted' : 'Waiting for reflection'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 relative z-10 shrink-0">
                {!isDone && !isActive && onNudgeParticipant && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNudgeParticipant(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-forest/10 dark:bg-brand-lime/10 hover:bg-brand-forest hover:text-white dark:hover:bg-brand-lime dark:hover:text-brand-deep text-brand-forest dark:text-brand-lime text-xs font-black uppercase tracking-wider transition-all duration-200 border border-brand-forest/20 dark:border-brand-lime/30 active:scale-95 shadow-sm cursor-pointer"
                    title={`Send encouragement nudge to ${p.name}`}
                  >
                    <Bell size={13} strokeWidth={2.5} className="shrink-0" />
                    <span>Nudge</span>
                  </button>
                )}
                {isDone && (
                  <div className="w-8 h-8 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center shadow-md shadow-brand-lime/20">
                    <CheckCircle2 size={18} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {onAddLocalParticipant && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newMemberName.trim()) {
                onAddLocalParticipant(newMemberName);
                setNewMemberName('');
              }
            }}
            className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 focus-within:border-brand-lime/50 focus-within:bg-white/[0.08] transition-all duration-300 mt-2"
          >
            <div className="flex-1 min-w-0 pl-3">
              <input 
                type="text" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Add member name..." 
                className="w-full bg-transparent outline-none py-1.5 text-sm font-bold text-white placeholder:text-white/30"
              />
            </div>
            <button 
              type="submit"
              disabled={!newMemberName.trim()}
              className="h-9 px-4 bg-brand-lime text-brand-deep rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:bg-white/10 disabled:text-white font-black text-xs uppercase tracking-wider hover:bg-white active:scale-95"
            >
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
