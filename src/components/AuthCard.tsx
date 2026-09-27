import React, { useState } from 'react';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  loginAnonymously,
  getFriendlyAuthErrorMessage 
} from '../firebase';
import { Button, Input } from './ui/Base';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuthCardProps {
  onSuccess?: () => void;
  onSeedDemo?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onSuccess,
  onSeedDemo,
  title = "Welcome to Quran Circles",
  subtitle = "Sign in to join private reading circles, reflect together, and maintain daily Quran habits.",
  compact = false
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | 'guest' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setAuthMethod('google');
    try {
      const res = await loginWithGoogle();
      if (res?.user) {
        toast.success(`Welcome back, ${res.user.displayName || 'friend'}!`);
        onSuccess?.();
      }
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      const msg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setAuthMethod(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setAuthMethod('email');

    try {
      if (mode === 'signin') {
        const res = await loginWithEmail(email, password);
        if (res?.user) {
          toast.success(`Welcome back!`);
          onSuccess?.();
        }
      } else {
        const res = await registerWithEmail(email, password, name);
        if (res?.user) {
          toast.success(`Account created! Welcome to Quran Circles.`);
          onSuccess?.();
        }
      }
    } catch (err: any) {
      console.error("Email auth failed:", err);
      const msg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setAuthMethod(null);
    }
  };

  return (
    <div className={`w-full ${compact ? 'space-y-4' : 'space-y-6'}`}>
      {/* Header */}
      {!compact && (
        <div className="space-y-2 text-center">
          <h3 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter text-white">
            {title}
          </h3>
          <p className="text-white/40 font-medium text-sm sm:text-base max-w-md mx-auto">
            {subtitle}
          </p>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Google One-Click Login */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-full bg-white hover:bg-white/95 text-slate-900 font-black text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isLoading && authMethod === 'google' ? (
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">or with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      {/* 2. Email Auth Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {/* Sign In vs Register Tabs */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-full border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(null); }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all ${
              mode === 'signin'
                ? 'bg-brand-lime text-brand-deep shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all ${
              mode === 'register'
                ? 'bg-brand-lime text-brand-deep shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === 'register' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">
              Your Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zaid"
                className="w-full pl-11 pr-5 py-3.5 bg-brand-deep/60 border border-white/10 rounded-full focus:border-brand-lime focus:ring-2 focus:ring-brand-lime/20 outline-none text-sm text-white placeholder:text-white/20 transition-all font-medium"
              />
              <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-11 pr-5 py-3.5 bg-brand-deep/60 border border-white/10 rounded-full focus:border-brand-lime focus:ring-2 focus:ring-brand-lime/20 outline-none text-sm text-white placeholder:text-white/20 transition-all font-medium"
            />
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
              className="w-full pl-11 pr-12 py-3.5 bg-brand-deep/60 border border-white/10 rounded-full focus:border-brand-lime focus:ring-2 focus:ring-brand-lime/20 outline-none text-sm text-white placeholder:text-white/20 transition-all font-medium"
            />
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 text-base font-black uppercase tracking-tight bg-brand-lime text-brand-deep hover:bg-white transition-all shadow-md active:scale-[0.98]"
        >
          {isLoading && authMethod === 'email' ? (
            <div className="w-5 h-5 border-2 border-brand-deep/30 border-t-brand-deep rounded-full animate-spin" />
          ) : mode === 'signin' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* 3. Try Demo Scenarios (Main preview option) */}
      {onSeedDemo && (
        <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-2 text-center">
          <button
            type="button"
            onClick={onSeedDemo}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-full bg-brand-forest/10 dark:bg-white/10 hover:bg-brand-forest hover:text-white dark:hover:bg-brand-lime dark:hover:text-brand-deep text-brand-forest dark:text-brand-lime border border-brand-forest/20 dark:border-white/15 transition-all font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 group cursor-pointer active:scale-98 shadow-sm"
          >
            <Sparkles size={16} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span>Try Demo Scenarios (Instant Preview)</span>
          </button>
          <p className="text-[10px] text-paper-accent dark:text-white/40 font-medium">
            Explore ready-made Family & Global circles without signing in first
          </p>
        </div>
      )}
    </div>
  );
};
