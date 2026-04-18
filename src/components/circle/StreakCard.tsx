import React from 'react';
import { motion } from 'motion/react';
import { Flame, CheckCircle2, Circle as CircleIcon, Users, Clock, Hourglass, XCircle, Info, Plus } from 'lucide-react';
import { Circle, Reflection, Participant } from '../../types';
import { getDayProgress } from '../../lib/streakUtils';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Base';

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
        <div className="inline-flex items-center gap-3 bg-brand-lime/10 border border-brand-lime/20 px-6 py-3 rounded-full lime-glow">
          <Flame className="text-brand-lime" fill="currentColor" size={24} />
          <span className="text-2xl font-black text-brand-lime uppercase tracking-widest">{circle.streak.current} Day Streak</span>
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
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ 
  participants, 
  reflections, 
  date,
  onSelectParticipant,
  activeParticipantId,
  selectableIds,
  onAddLocalParticipant
}) => {
  const [newMemberName, setNewMemberName] = React.useState('');
  const progress = getDayProgress(participants, reflections, date);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
        <div className="space-y-2">
          <p className="text-[12px] font-black text-brand-lime uppercase tracking-[0.5em]">Daily Accountability</p>
          <h3 className="text-4xl font-display font-black uppercase tracking-tighter">Member Status</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Circle Rule:</span>
          <span className="text-[10px] font-black text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-4 py-2 rounded-full uppercase tracking-widest lime-glow">
            Streak only completes when ALL reflect
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {participants.map(p => {
          const isDone = progress.completed.some(cp => cp.id === p.id);
          const isActive = activeParticipantId === p.id;
          const isSelectable = onSelectParticipant && (!selectableIds || selectableIds.includes(p.id));
          
          return (
            <div 
              key={p.id}
              onClick={() => isSelectable && onSelectParticipant(p.id)}
              className={cn(
                "flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 rounded-[2rem] border-2 transition-all duration-500 group relative overflow-hidden",
                isSelectable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "",
                isActive 
                  ? "bg-brand-lime/20 border-brand-lime lime-glow" 
                  : isDone 
                    ? "bg-brand-lime/5 border-brand-lime/30 text-brand-lime" 
                    : "bg-white/5 border-white/10 text-white/30"
              )}
            >
              {(isDone || isActive) && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-lime/5 rounded-full -mr-12 -mt-12 blur-2xl" />
              )}
              
              <div className="flex items-center gap-4 sm:gap-5 relative z-10 flex-1 min-w-0 pr-2">
                <div 
                  className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-[0.8rem] flex items-center justify-center font-black text-sm sm:text-base border-2 transition-all duration-500 shadow-lg",
                    isActive ? "border-brand-lime text-brand-deep bg-brand-lime" : isDone ? "border-brand-lime text-brand-deep" : "border-white/10 text-white/40"
                  )}
                  style={{ backgroundColor: (isActive || isDone) ? (p.color || '#A3E635') : 'transparent' }}
                >
                  {p.avatar || p.name[0]}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span 
                    className={cn(
                      "text-sm sm:text-base font-bold tracking-tight block line-clamp-2 leading-tight break-words", 
                      (isDone || isActive) ? "text-white" : "text-white/60"
                    )} 
                    title={p.name}
                  >
                    {p.name}
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60 truncate">
                      {isActive ? "Today's reader" : isDone ? 'Reflection Posted' : 'Waiting'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 relative z-10 shrink-0">
                {isActive ? null : isDone ? (
                  <div className="flex flex-col items-end">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-lime text-brand-deep rounded-full flex items-center justify-center shadow-lg shadow-brand-lime/20">
                      <CheckCircle2 size={20} strokeWidth={3} className="sm:w-6 sm:h-6" />
                    </div>
                  </div>
                ) : null}
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
            className="flex items-center gap-2 p-1.5 sm:p-2 bg-black/20 rounded-full border border-white/10 focus-within:border-brand-lime/50 focus-within:ring-2 focus-within:ring-brand-lime/20 transition-all duration-300"
          >
            <div className="flex-1 min-w-0 pl-4 sm:pl-5">
              <input 
                type="text" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Type member's name..." 
                className="w-full bg-transparent outline-none py-2 text-sm sm:text-base font-bold text-white placeholder:text-white/30"
              />
            </div>
            <button 
              type="submit"
              disabled={!newMemberName.trim()}
              className="h-9 sm:h-10 px-4 sm:px-6 bg-brand-lime text-brand-deep rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white font-black text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-95"
            >
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
