import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Database, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../ui/Base';

interface QFInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QFInfoPanel = ({ isOpen, onClose }: QFInfoPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-deep/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-brand-forest border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden bento-card"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-lime/10 rounded-xl flex items-center justify-center text-brand-lime lime-glow">
                    <Database size={20} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">How it works</h3>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">Integration Details</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-brand-lime font-black text-[10px] uppercase tracking-widest">
                    <Zap size={16} strokeWidth={2.5} />
                    <span>Quran.com API</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    We fetch Uthmani text, translations, and Tafsir for every daily ayah.
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-brand-lime font-black text-[10px] uppercase tracking-widest">
                    <ShieldCheck size={16} strokeWidth={2.5} />
                    <span>Circle Sync</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    Circles only progress when all members complete their reflection.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Technical Highlights:</h4>
                <ul className="space-y-3">
                  {[
                    "Global Timezone Sync: Shared UTC deadlines.",
                    "Real-time Reflections: Instant updates via Firestore.",
                    "Lightweight Participants: Shared device support."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/50 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-lime mt-1.5 shrink-0 lime-glow" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-between py-4 px-6 text-sm"
                  onClick={() => window.open('https://api.quran.com', '_blank')}
                >
                  <span>API Documentation</span>
                  <ExternalLink size={16} strokeWidth={2.5} />
                </Button>
                <Button 
                  size="lg"
                  className="w-full py-4 text-lg"
                  onClick={onClose}
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
