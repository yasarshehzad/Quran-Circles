import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Bell, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Share2, 
  Flame, 
  Sparkles,
  Heart
} from 'lucide-react';
import { Button } from '../ui/Base';
import { Participant, Circle } from '../../types';
import { toast } from 'sonner';

interface NudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  circle: Circle;
}

export const NudgeModal: React.FC<NudgeModalProps> = ({
  isOpen,
  onClose,
  participant,
  circle
}) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customNote, setCustomNote] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!participant) return null;

  const templates = [
    `Assalamu alaikum ${participant.name}! Don't forget today's reflection in our circle "${circle.name}". Let's keep our ${circle.streak.current}-day streak alive! 🤲🔥`,
    `Hey ${participant.name}! Just reflecting on today's verse and thinking of you. Would love to read your thoughts in our Quran Circle! 💫`,
    `Assalamu alaikum! Gentle reminder: our circle deadline is approaching at ${circle.deadlineConfig.time}. Looking forward to your reflection! ✨`,
    `May Allah bless your day, ${participant.name}! We're only 1 reflection away from completing today's circle streak. Can't wait to see your post! 📖`
  ];

  const currentMessage = customNote.trim() || templates[selectedTemplateIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setIsCopied(true);
    toast.success("Nudge message copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendNudge = () => {
    // Record nudge in local session so we don't spam
    const nudgeKey = `nudged_${circle.id}_${participant.id}_${new Date().toISOString().split('T')[0]}`;
    sessionStorage.setItem(nudgeKey, 'true');
    
    setIsSent(true);
    toast.success(`Nudge sent to ${participant.name}!`);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1200);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(currentMessage);
    const link = document.createElement('a');
    link.href = `https://api.whatsapp.com/send?text=${encoded}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    handleSendNudge();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-deep/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-white dark:bg-brand-forest border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden bento-card z-10 text-paper-ink dark:text-white"
          >
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-forest/10 dark:bg-brand-lime/20 text-brand-forest dark:text-brand-lime flex items-center justify-center">
                    <Bell size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">
                      Send Encouragement
                    </h3>
                    <p className="text-xs text-paper-accent dark:text-white/40 font-bold uppercase tracking-wider">
                      Friendly nudge for {participant.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-paper-accent dark:text-white/50 hover:text-paper-ink dark:hover:text-white transition-colors"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Recipient preview */}
              <div className="p-4 bg-paper-bg/40 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-md shrink-0 text-paper-ink dark:text-white"
                  style={{ backgroundColor: participant.color || '#A3E635' }}
                >
                  {participant.avatar || participant.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-paper-ink dark:text-white text-base truncate">{participant.name}</h4>
                  <p className="text-[11px] text-paper-accent dark:text-white/40 font-medium">
                    Waiting for today's reflection • Circle: {circle.name}
                  </p>
                </div>
              </div>

              {/* Template Choices */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-forest dark:text-brand-lime">
                  Choose a Polite Message
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {templates.map((tpl, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedTemplateIndex(i);
                        setCustomNote('');
                      }}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed font-medium transition-all cursor-pointer ${
                        selectedTemplateIndex === i && !customNote
                          ? 'bg-emerald-50 dark:bg-brand-lime/10 border-emerald-600 dark:border-brand-lime text-emerald-950 dark:text-white font-bold'
                          : 'bg-paper-bg/30 dark:bg-white/5 border-black/5 dark:border-white/5 text-paper-ink/80 dark:text-white/70 hover:text-paper-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      {tpl}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Note input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-paper-accent dark:text-white/40">
                  Or write a personal message
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Can't wait to read your reflections today!"
                  className="w-full px-5 py-3.5 bg-white dark:bg-brand-deep/60 border border-black/15 dark:border-white/10 rounded-xl focus:border-brand-forest dark:focus:border-brand-lime focus:ring-2 focus:ring-brand-forest/20 dark:focus:ring-brand-lime/20 outline-none text-xs text-paper-ink dark:text-white placeholder:text-paper-accent/40 dark:placeholder:text-white/20 font-medium transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleSendNudge}
                  disabled={isSent}
                  className="w-full sm:flex-1 py-4 text-sm font-black uppercase tracking-tight bg-brand-forest dark:bg-brand-lime text-white dark:text-brand-deep hover:bg-emerald-800 dark:hover:bg-white"
                >
                  {isSent ? (
                    <span className="flex items-center gap-2">
                      <Check size={16} strokeWidth={3} />
                      Nudged!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={16} strokeWidth={2.5} />
                      Send In-App Nudge
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleWhatsAppShare}
                  className="w-full sm:w-auto py-4 px-5 text-sm"
                  title="Share via WhatsApp"
                >
                  <Share2 size={16} />
                  <span>WhatsApp</span>
                </Button>

                <button
                  onClick={handleCopy}
                  className="p-3.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-paper-accent dark:text-white/60 hover:text-paper-ink dark:hover:text-white border border-black/10 dark:border-white/10 transition-colors"
                  title="Copy Message"
                >
                  {isCopied ? <Check size={18} className="text-emerald-700 dark:text-brand-lime" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
