import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { Circle } from '../../types';

interface DeadlineCountdownProps {
  circle: Circle;
  isComplete: boolean;
}

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ circle, isComplete }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; isPast: boolean }>({
    hours: 0,
    minutes: 0,
    isPast: false
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadlineTimeStr = circle.deadlineConfig?.time || '23:59';
      const [deadHours, deadMinutes] = deadlineTimeStr.split(':').map(Number);

      const target = new Date();
      target.setHours(deadHours, deadMinutes, 0, 0);

      // If the target time has passed for today, deadline is for tomorrow
      let diffMs = target.getTime() - now.getTime();
      if (diffMs < 0) {
        target.setDate(target.getDate() + 1);
        diffMs = target.getTime() - now.getTime();
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setTimeLeft({ hours, minutes, isPast: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [circle.deadlineConfig?.time]);

  if (isComplete) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-brand-lime/10 dark:border-brand-lime/30 dark:text-brand-lime text-xs font-black uppercase tracking-wider lime-glow">
        <CheckCircle2 size={14} strokeWidth={3} />
        <span>Today's Goal Met</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 2;
  const isWarning = timeLeft.hours < 6 && !isUrgent;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider transition-all ${
        isUrgent
          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/40 dark:text-rose-400 animate-pulse'
          : isWarning
          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-300'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-white/5 dark:border-white/10 dark:text-white/70'
      }`}
      title={`Circle deadline is ${circle.deadlineConfig?.time || '23:59'} (${circle.deadlineConfig?.timezone || 'Local'})`}
    >
      <Clock size={14} strokeWidth={2.5} className={isUrgent ? 'text-rose-700 dark:text-rose-400' : isWarning ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-brand-lime'} />
      <span>
        {timeLeft.hours}h {timeLeft.minutes}m until deadline
      </span>
    </div>
  );
};
