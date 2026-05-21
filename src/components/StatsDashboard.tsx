import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, Calendar, Target, Activity, Link as LinkIcon, BookOpen, Clock } from 'lucide-react';
import { format, subDays, startOfDay, parseISO, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Reflection, Circle } from '../types';
import { Card, GlassCard, Button } from './ui/Base';

interface StatsDashboardProps {
  user: any;
  reflections: Reflection[];
  circles: Circle[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ user, reflections, circles }) => {
  const stats = useMemo(() => {
    if (!user) return null;

    // Filter to only the current user's reflections
    const myReflections = reflections.filter(r => r.participantId === user.uid);

    // Get unique dates the user has reflected
    const activeDates = new Set(myReflections.map(r => r.date));
    
    // Sort dates descending
    const sortedDates = Array.from(activeDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Calculate current streak
    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    let checkDate = new Date();
    
    // If they haven't reflected today, maybe they reflected yesterday
    if (activeDates.has(today)) {
      currentStreak = 1;
      checkDate = subDays(checkDate, 1);
    } else if (activeDates.has(yesterday)) {
      currentStreak = 1;
      checkDate = subDays(checkDate, 2);
    } else {
      // Streak broken
      currentStreak = 0;
    }

    if (currentStreak > 0) {
      while (activeDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDateStr: string | null = null;
    
    // sortedDates are descending (newest first). Let's go ascending for streak calculation.
    const ascendingDates = [...sortedDates].reverse();
    
    for (let i = 0; i < ascendingDates.length; i++) {
      const d = ascendingDates[i];
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = differenceInDays(parseISO(d), parseISO(prevDateStr!));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      prevDateStr = d;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // 14-day activity chart data
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const count = myReflections.filter(r => r.date === dateStr).length;
      chartData.push({
        name: format(d, 'MMM d'),
        fullDate: dateStr,
        reflections: count
      });
    }

    // Reflections by circle
    const circleStats = circles.map(c => {
      const count = myReflections.filter(r => r.circleId === c.id).length;
      return { ...c, myReflectionsCount: count };
    }).sort((a, b) => b.myReflectionsCount - a.myReflectionsCount);

    // Total Reactions received
    let totalReactions = 0;
    myReflections.forEach(r => {
      if (r.reactions) {
        Object.values(r.reactions).forEach(reactors => {
          totalReactions += reactors.length;
        });
      }
    });

    // Favorite Surah
    const surahCounts: Record<string, number> = {};
    let favoriteSurahInfo = "None yet";
    myReflections.forEach(r => {
      if (r.ayahKey) {
        const surah = r.ayahKey.split(':')[0];
        surahCounts[surah] = (surahCounts[surah] || 0) + 1;
      }
    });
    const mostReflectedSurahNum = Object.keys(surahCounts).sort((a, b) => surahCounts[b] - surahCounts[a])[0];
    if (mostReflectedSurahNum) {
      favoriteSurahInfo = `Surah ${mostReflectedSurahNum}`;
    }

    // Time of Day
    let timeLabel = "Balanced";
    const hours = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    myReflections.forEach(r => {
      const hour = new Date(r.createdAt).getHours();
      if (hour >= 5 && hour < 12) hours.morning++;
      else if (hour >= 12 && hour < 17) hours.afternoon++;
      else if (hour >= 17 && hour < 22) hours.evening++;
      else hours.night++;
    });
    const maxHour = Math.max(hours.morning, hours.afternoon, hours.evening, hours.night);
    if (maxHour > 0) {
      if (maxHour === hours.morning) timeLabel = "Morning Reader";
      else if (maxHour === hours.afternoon) timeLabel = "Afternoon Reader";
      else if (maxHour === hours.evening) timeLabel = "Evening Reader";
      else timeLabel = "Night Reader";
    }

    return {
      totalReflections: myReflections.length,
      currentStreak,
      longestStreak,
      chartData,
      circleStats,
      totalReactions,
      favoriteSurah: favoriteSurahInfo,
      timeLabel
    };
  }, [user, reflections, circles]);

  if (!stats) return null;

  return (
    <div className="space-y-12 pb-32 max-w-7xl mx-auto">
      <div className="px-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter">Your Analytics</h1>
          <p className="opacity-50 text-lg md:text-xl font-medium max-w-2xl">Track your personal progress and consistency across all your circles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        <GlassCard className="p-8 space-y-6">
          <div className="w-14 h-14 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime">
            <Flame size={28} />
          </div>
          <div>
            <p className="text-5xl font-display font-black tracking-tighter">{stats.currentStreak}</p>
            <p className="text-xs font-black opacity-50 uppercase tracking-widest mt-2">Day Streak</p>
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-6">
          <div className="w-14 h-14 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-5xl font-display font-black tracking-tighter">{stats.totalReflections}</p>
            <p className="text-xs font-black opacity-50 uppercase tracking-widest mt-2">Total Reflections</p>
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-6">
          <div className="w-14 h-14 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-5xl font-display font-black tracking-tighter">{stats.longestStreak}</p>
            <p className="text-xs font-black opacity-50 uppercase tracking-widest mt-2">Longest Streak</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        <GlassCard className="p-8 space-y-4 col-span-1 md:col-span-1 border-current/5">
          <div className="text-brand-lime opacity-80 mb-2"><BookOpen size={24}/></div>
          <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Most Reflected</p>
          <p className="text-3xl font-display font-black tracking-tighter">{stats.favoriteSurah}</p>
        </GlassCard>

        <GlassCard className="p-8 space-y-4 col-span-1 md:col-span-1 border-current/5">
          <div className="text-brand-lime opacity-80 mb-2"><Flame size={24}/></div>
          <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Community Love</p>
          <p className="text-3xl font-display font-black tracking-tighter">{stats.totalReactions} <span className="text-lg opacity-50 font-sans font-medium mix-blend-luminosity">reactions</span></p>
        </GlassCard>

        <GlassCard className="p-8 space-y-4 col-span-1 md:col-span-1 border-current/5">
          <div className="text-brand-lime opacity-80 mb-2"><Clock size={24}/></div>
          <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Prime Time</p>
          <p className="text-3xl font-display font-black tracking-tighter">{stats.timeLabel}</p>
        </GlassCard>
      </div>

      <div className="px-4">
        <GlassCard className="p-8 md:p-12 space-y-8 border-current/5">
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-black uppercase tracking-tight">14-Day Activity</h3>
            <p className="text-sm font-medium opacity-50">Number of reflections you've made over the last two weeks.</p>
          </div>
          
          <div className="h-64 md:h-80 w-full mt-8 opacity-80 mix-blend-luminosity">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12, fontWeight: 700 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ backgroundColor: 'var(--color-brand-deep)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#A3E635' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="reflections" 
                  fill="#A3E635" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="px-4">
        <h3 className="text-2xl font-display font-black uppercase tracking-tight mb-6">Activity by Circle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.circleStats.map(circle => (
            <Card key={circle.id} className="p-6 border-current/10 flex flex-col justify-between items-start gap-6">
              <div className="space-y-2">
                <h4 className="text-xl font-black">{circle.name}</h4>
                <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{circle.planName || 'Custom Plan'}</p>
              </div>
              <div className="bg-brand-lime/10 px-4 py-2 rounded-xl text-brand-lime mix-blend-luminosity font-black">
                {circle.myReflectionsCount} <span className="opacity-60 text-xs ml-1 uppercase tracking-widest">Reflections</span>
              </div>
            </Card>
          ))}
          {stats.circleStats.length === 0 && (
            <div className="col-span-full py-12 text-center opacity-50 font-bold border border-dashed border-current/20 rounded-3xl">
              No circles joined yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
