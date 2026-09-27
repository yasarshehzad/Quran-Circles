import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AuthCard } from './AuthCard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedDemo?: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSeedDemo,
  title,
  subtitle
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md bg-brand-forest border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden bento-card z-10"
          >
            <div className="p-6 sm:p-8 relative">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white cursor-pointer z-10"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              <AuthCard 
                onSuccess={onClose}
                onSeedDemo={() => {
                  onClose();
                  onSeedDemo?.();
                }}
                title={title || "Sign in to Quran Circles"}
                subtitle={subtitle || "Choose your preferred sign-in method to continue."}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
