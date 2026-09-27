import React from 'react';
import { cn } from '../../lib/utils';

export const Button = ({ children, onClick, className, variant = 'primary', disabled = false, icon: Icon, size = 'md' }: any) => {
  const variants = {
    primary: 'bg-brand-lime text-brand-deep hover:bg-white lime-glow',
    secondary: 'bg-brand-forest text-white hover:bg-brand-forest/80 border border-white/10',
    outline: 'border border-white/20 text-white hover:bg-white/5',
    ghost: 'text-white/60 hover:text-white hover:bg-white/5',
    danger: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20',
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
        'inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 active:scale-95',
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
      'bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 transition-all duration-300', 
      onClick && 'cursor-pointer hover:bg-white/10 active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
);

export const Input = ({ label, ...props }: any) => (
  <div className="space-y-3 w-full">
    {label && <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-6">{label}</label>}
    <input 
      {...props}
      className={cn(
        "w-full px-8 py-4 bg-brand-deep/50 border border-white/10 rounded-full focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/10 outline-none transition-all placeholder:text-white/20 font-medium text-white",
        props.className
      )}
    />
  </div>
);

export const Badge = ({ children, variant = 'default' }: any) => {
  const variants = {
    default: 'bg-brand-lime text-brand-deep',
    lime: 'bg-brand-lime text-brand-deep lime-glow',
    orange: 'bg-yellow-400 text-black',
    blue: 'bg-blue-400 text-black',
  };
  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", variants[variant as keyof typeof variants])}>
      {children}
    </span>
  );
};
