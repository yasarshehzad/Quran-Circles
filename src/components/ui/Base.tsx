import React from 'react';
import { cn } from '../../lib/utils';

export const Button = ({ children, onClick, className, variant = 'primary', disabled = false, icon: Icon, size = 'md' }: any) => {
  const variants = {
    primary: 'bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-brand-lime dark:text-brand-deep dark:hover:bg-white lime-glow shadow-sm',
    secondary: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 dark:bg-brand-forest dark:text-white dark:hover:bg-brand-forest/80 dark:border-white/10',
    outline: 'border border-black/15 text-paper-ink hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5',
    ghost: 'text-paper-accent hover:text-paper-ink hover:bg-black/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-full font-bold',
    md: 'px-6 py-3 rounded-full font-bold tracking-tight',
    lg: 'px-8 py-4 text-lg rounded-full font-black uppercase tracking-wide',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 active:scale-95 cursor-pointer',
        variants[variant as keyof typeof variants],
        sizes[size as keyof typeof sizes],
        className
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

export const Card = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      'bento-card', 
      onClick && 'cursor-pointer active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
);

export const GlassCard = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      'bento-card rounded-[2.5rem] p-8 transition-all duration-300', 
      onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
);

export const Input = ({ label, ...props }: any) => (
  <div className="space-y-3 w-full">
    {label && <label className="text-[11px] font-black text-paper-accent dark:text-white/40 uppercase tracking-[0.2em] ml-6">{label}</label>}
    <input 
      {...props}
      className={cn(
        "w-full px-8 py-4 bg-white dark:bg-brand-deep/50 border border-black/10 dark:border-white/10 rounded-full focus:border-emerald-600 dark:focus:border-brand-lime focus:ring-4 focus:ring-emerald-600/10 dark:focus:ring-brand-lime/10 outline-none transition-all placeholder:text-paper-accent/40 dark:placeholder:text-white/20 font-medium text-paper-ink dark:text-white shadow-sm",
        props.className
      )}
    />
  </div>
);

export const Badge = ({ children, variant = 'default', className }: any) => {
  const variants = {
    default: 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-brand-lime dark:text-brand-deep dark:border-transparent',
    lime: 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-brand-lime dark:text-brand-deep lime-glow dark:border-transparent',
    orange: 'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-yellow-400 dark:text-black',
    blue: 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-400 dark:text-black',
    outline: 'border border-black/10 text-paper-accent dark:border-white/10 dark:text-white/60',
  };
  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center", variants[variant as keyof typeof variants] || variants.default, className)}>
      {children}
    </span>
  );
};
