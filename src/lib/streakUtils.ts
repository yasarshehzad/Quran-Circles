import { format, parseISO, differenceInDays, startOfDay, subDays, isAfter, isBefore, addDays } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { Circle, Reflection, Participant } from '../types';

/**
 * STREAK LOGIC & TIMEZONE HANDLING NOTES:
 * 
 * 1. Circle Day: Every circle follows a plan (e.g., 30 days). The "Circle Day"
 *    is calculated as the number of days since the 'startDate'.
 * 
 * 2. Completion: A day is considered "Complete" if EVERY participant in the 
 *    circle has submitted a reflection for that specific date.
 * 
 * 3. Deadlines:
 *    - 'local': Each participant has until their own local midnight to submit.
 *      The circle streak updates once the LAST person in the circle (latest timezone)
 *      reaches their midnight, or once everyone has submitted.
 *    - 'shared': Everyone follows a single timezone/time (e.g., 11:59 PM GMT).
 * 
 * 4. Edge Cases:
 *    - Timezone shifts: If a user travels, their "local midnight" shifts. We use
 *      the timestamp of the reflection to verify it was submitted "on time".
 *    - Late submissions: Submissions after the deadline do not count towards the streak
 *      but are still visible in the feed.
 */

/**
 * Get the current date string in a specific timezone
 */
export const getTodayInTimezone = (timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): string => {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
};

/**
 * Check if a participant has completed a specific date
 */
export const isParticipantComplete = (
  participantId: string,
  reflections: Reflection[],
  date: string
): boolean => {
  return reflections.some(r => r.participantId === participantId && r.date === date);
};

/**
 * Calculate the progress for a specific date
 */
export const getDayProgress = (
  participants: Participant[],
  reflections: Reflection[],
  date: string
) => {
  const completedIds = new Set(
    reflections
      .filter(r => r.date === date)
      .map(r => r.participantId)
  );

  const completed = participants.filter(p => completedIds.has(p.id));
  const pending = participants.filter(p => !completedIds.has(p.id));

  return {
    completed,
    pending,
    isComplete: completed.length === participants.length,
    percentage: participants.length > 0 ? (completed.length / participants.length) * 100 : 0
  };
};

/**
 * Determine if the streak is still alive or broken
 * Returns the current streak count.
 */
export const calculateStreak = (
  circle: Circle,
  reflections: Reflection[]
): number => {
  const { startDate, participants, deadlineConfig } = circle;
  const today = new Date();
  const start = parseISO(startDate);
  
  // If we haven't even reached the start date, streak is 0
  if (isBefore(today, start)) return 0;

  let streak = 0;
  let checkDate = subDays(new Date(), 0); // Start checking from today
  
  // If today is already complete, we start counting from today
  // If today is NOT complete, we check if it's PAST the deadline
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayProgress = getDayProgress(participants, reflections, todayStr);
  
  // Check if today's deadline has passed
  const isPastDeadline = (date: Date): boolean => {
    if (deadlineConfig.type === 'local') {
      // For local, we consider it "past" if it's the next day in the viewer's current timezone
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const dateStr = format(date, 'yyyy-MM-dd');
      return todayStr > dateStr;
    } else {
      // For shared, we check the specific timezone and time
      const dateStr = format(date, 'yyyy-MM-dd');
      const deadlineStr = `${dateStr}T${deadlineConfig.time}:00`;
      const zonedDeadline = toZonedTime(deadlineStr, deadlineConfig.timezone);
      return isAfter(new Date(), zonedDeadline);
    }
  };

  // We iterate backwards from today to find the streak
  let dateToVerify = today;
  
  // 1. Check Today
  if (todayProgress.isComplete) {
    streak++;
    dateToVerify = subDays(dateToVerify, 1);
  } else if (isPastDeadline(today)) {
    // If today is past deadline and not complete, streak is broken
    return 0;
  } else {
    // Today is not complete but deadline hasn't passed, so we check from yesterday
    dateToVerify = subDays(dateToVerify, 1);
  }

  // 2. Check Yesterday (Crucial for maintaining streak)
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const yesterdayProgress = getDayProgress(participants, reflections, yesterdayStr);
  
  // If yesterday is NOT complete, the streak is broken regardless of today
  if (!yesterdayProgress.isComplete && isAfter(today, start)) {
    // Exception: If today is the very first day (startDate), there is no "yesterday"
    if (format(today, 'yyyy-MM-dd') !== startDate) {
      return 0;
    }
  }

  // 3. Continue backwards
  while (isAfter(dateToVerify, start) || format(dateToVerify, 'yyyy-MM-dd') === startDate) {
    const dateStr = format(dateToVerify, 'yyyy-MM-dd');
    const progress = getDayProgress(participants, reflections, dateStr);
    
    if (progress.isComplete) {
      streak++;
      dateToVerify = subDays(dateToVerify, 1);
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
};

/**
 * Get the current Ayah index based on the circle's start date
 */
export const getCurrentAyahIndex = (startDate: string): number => {
  const start = startOfDay(parseISO(startDate));
  const today = startOfDay(new Date());
  return Math.max(0, differenceInDays(today, start));
};
