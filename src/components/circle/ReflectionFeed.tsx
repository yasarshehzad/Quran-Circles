import React from 'react';
import { motion } from 'motion/react';
import { MessageSquareQuote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card } from '../ui/Base';
import { Reflection, Participant } from '../../types';
import { cn } from '../../lib/utils';

interface ReflectionFeedProps {
  reflections: Reflection[];
  participants: Participant[];
  onReact: (reflectionId: string, emoji: string) => void;
  currentParticipantId: string | null;
}

export const ReflectionFeed = ({ reflections, participants, onReact, currentParticipantId }: ReflectionFeedProps) => {
  const emojis = ['❤️', '🤲', '✨', '💭'];

  // Group reflections by date and then by verse
  const groupedReflections = reflections.reduce((acc, r) => {
    const date = r.date;
    if (!acc[date]) acc[date] = {};
    const verse = r.ayahKey || 'General';
    if (!acc[date][verse]) acc[date][verse] = [];
    acc[date][verse].push(r);
    return acc;
  }, {} as Record<string, Record<string, Reflection[]>>);

  const sortedDates = Object.keys(groupedReflections).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-12">
      {reflections.length === 0 ? (
        <div className="text-center py-32 space-y-8 bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-brand-forest rounded-3xl flex items-center justify-center text-white/10 border border-white/5">
            <MessageSquareQuote size={40} />
          </div>
          <div className="space-y-2">
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.4em]">Quiet in the circle</p>
            <p className="text-white/20 text-sm font-medium italic">"Be the first to share your heart's reflection."</p>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-8">
              <div className="flex items-center gap-4 px-4">
                <div className="border-t border-white/10 flex-1" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                  {format(parseISO(date), 'MMMM do, yyyy')}
                </span>
                <div className="border-t border-white/10 flex-1" />
              </div>

              {Object.entries(groupedReflections[date]).map(([verse, verseReflections]) => (
                <div key={verse} className="space-y-6">
                  <div className="flex items-center gap-3 px-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-brand-lime/60">
                      {verse.includes('-') || verse.includes('to') ? 'Verses' : 'Verse'} {verse}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {verseReflections.map((r, idx) => {
                      const participant = participants.find(p => p.id === r.participantId);
                      const avatarColor = participant?.color || '#D9F99D';
                      
                      return (
                        <motion.div 
                          key={r.id} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className="space-y-6 p-6 md:p-10 bg-brand-forest/20 border-white/10 backdrop-blur-xl bento-card relative overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 w-1 h-full opacity-50"
                              style={{ backgroundColor: avatarColor }}
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div 
                                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-2 border-white/10 shadow-lg"
                                  style={{ backgroundColor: `${avatarColor}20`, color: avatarColor, borderColor: `${avatarColor}40` }}
                                >
                                  {participant?.avatar || r.participantName[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-white text-base uppercase tracking-[0.2em]">{r.participantName}</span>
                                  <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">
                                    {format(parseISO(r.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-white/80 text-xl leading-relaxed whitespace-pre-wrap font-medium">{r.text}</p>
                            
                            {/* Reactions */}
                            <div className="flex flex-wrap gap-4 pt-4">
                              {emojis.map(emoji => {
                                const reactors = r.reactions?.[emoji] || [];
                                const hasReacted = currentParticipantId && reactors.includes(currentParticipantId);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => onReact(r.id, emoji)}
                                    className={cn(
                                      "group px-5 py-2.5 rounded-2xl text-base flex items-center gap-3 transition-all duration-300 border",
                                      hasReacted 
                                        ? 'bg-brand-lime border-brand-lime text-brand-deep lime-glow scale-105' 
                                        : 'bg-white/5 border-white/10 hover:border-brand-lime/30 hover:bg-white/10'
                                    )}
                                  >
                                    <span className={cn("text-xl transition-all duration-300", !hasReacted && "opacity-90 group-hover:opacity-100 group-hover:scale-110")}>{emoji}</span>
                                    {reactors.length > 0 && <span className={cn("font-black", !hasReacted && "text-white/40 group-hover:text-white/80")}>{reactors.length}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
