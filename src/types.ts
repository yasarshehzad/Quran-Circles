export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export type ParticipantType = 'auth' | 'lightweight';

export interface Participant {
  id: string;
  name: string;
  type: ParticipantType;
  parentUid?: string;
  avatar?: string;
  color?: string;
  label?: string;
  reminderSettings?: {
    enabled: boolean;
    timeBeforeDeadline: number; // minutes
    type: 'browser' | 'email' | 'both';
  };
}

export interface ChatMessage {
  id: string;
  circleId: string;
  participantId: string;
  participantName: string;
  text: string;
  createdAt: string;
  avatar?: string;
  color?: string;
}

export type ParticipationMode = 'shared' | 'individual' | 'hybrid';
export type DeadlineType = 'local' | 'shared';

export interface Circle {
  id: string;
  isPending?: boolean;
  name: string;
  inviteCode: string;
  adminUid: string;
  planId: string;
  planName?: string;
  verses?: string[];
  startDate: string;
  members: string[];
  participants: Participant[];
  participationMode: ParticipationMode;
  frequency: 'daily' | 'weekly';
  versesPerDay: number;
  planType?: 'juz' | 'surah' | 'entire' | 'custom';
  deadlineConfig: {
    type: DeadlineType;
    timezone: string;
    time: string; // HH:mm
  };
  streak: {
    current: number;
    lastDate: string;
  };
}

export interface Reaction {
  id: string;
  reflectionId: string;
  participantId: string;
  emoji: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  uid: string;
  ayahKey: string;
  note?: string;
  createdAt: string;
}

export interface Reflection {
  id: string;
  circleId: string;
  ayahKey: string;
  participantId: string;
  participantName: string;
  text: string;
  createdAt: string;
  date: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of participantIds
}

export interface QuranPlan {
  id: string;
  name: string;
  description: string;
  verses: string[]; // Array of ayah keys: ["1:1", "1:2", ...]
}
