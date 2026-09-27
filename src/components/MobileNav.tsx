import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquareQuote, 
  Bookmark, 
  UserCircle,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: any) => void;
  hasActiveCircle: boolean;
  onOpenCreateModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  hasActiveCircle,
  onOpenCreateModal
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    ...(hasActiveCircle ? [{ id: 'circle', label: 'Circle', icon: BookOpen }] : []),
    { id: 'reflections', label: 'Reflect', icon: MessageSquareQuote },
    { id: 'bookmarks', label: 'Saved', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-3 pt-2 bg-brand-deep/90 backdrop-blur-xl border-t border-white/10"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all relative",
                isActive ? "text-brand-lime font-black" : "text-white/40 hover:text-white"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.8 : 2} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-lime absolute -bottom-1" />
              )}
            </button>
          );
        })}

        {/* Floating Quick Action */}
        <button
          onClick={onOpenCreateModal}
          className="w-10 h-10 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center shadow-lg active:scale-90 transition-transform lime-glow -mt-4 border-2 border-brand-deep"
          title="Create or Join Circle"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </nav>
  );
};
