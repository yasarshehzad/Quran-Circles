import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  Users, 
  Flame, 
  Plus, 
  ChevronRight, 
  LogOut, 
  MessageSquare, 
  UserPlus, 
  Settings,
  ArrowLeft,
  Info,
  Play,
  Pause,
  Volume2,
  Trophy,
  BookOpen,
  Bookmark as BookmarkIcon,
  Calendar,
  Clock,
  Globe,
  User as UserIcon,
  Mail,
  Shield,
  Award,
  RefreshCw,
  LayoutDashboard,
  Check,
  UserCircle,
  Palette,
  Zap,
  Sparkles,
  Heart,
  Github,
  Twitter,
  ArrowRight,
  Mic2,
  Quote,
  Search,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { format, parseISO, differenceInDays, startOfDay, subDays } from 'date-fns';

import { auth, db, loginAnonymously, logout, loginWithEmail, registerWithEmail, loginWithGoogle } from './firebase';
import { handleFirestoreError, OperationType } from './services/firestoreService';
import { quranFoundation } from './services/quranFoundation';
import { ProgressSummary } from './components/circle/StreakCard';
import { calculateStreak, getCurrentAyahIndex, getDayProgress } from './lib/streakUtils';
import { PREDEFINED_AVATARS, AVATAR_COLORS } from './constants/avatars';
import { Circle, Reflection, Participant, Bookmark, ChatMessage } from './types';
import { QURAN_PLANS } from './constants';
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';

// UI Components
import { Button, Card, Input, Badge, GlassCard } from './components/ui/Base';
import { AyahCard } from './components/circle/AyahCard';
import { ReflectionFeed } from './components/circle/ReflectionFeed';
import { CircleHome } from './components/circle/CircleHome';
import { QFInfoPanel } from './components/circle/QFInfoPanel';
import { StatsDashboard } from './components/StatsDashboard';
import { AuthCard } from './components/AuthCard';
import { AuthModal } from './components/AuthModal';
import { AudioPlayerDock } from './components/circle/AudioPlayerDock';
import { MobileNav } from './components/MobileNav';
import { Lock, LogIn, PieChart } from 'lucide-react';
import { trackPageView, trackEvent } from './lib/analytics';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView] = useState<'landing' | 'dashboard' | 'circle' | 'reflections' | 'create-circle' | 'join-circle' | 'bookmarks' | 'circle-settings' | 'profile' | 'stats' | 'how-it-works' | 'features' | 'help-center' | 'contact-us'>('landing');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  const [circles, setCircles] = useState<Circle[]>([]);
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const [currentVerses, setCurrentVerses] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audio] = useState(() => {
    const a = new Audio();
    a.preload = "auto";
    return a;
  });
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentAudioVerseIndex, setCurrentAudioVerseIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState<'off' | '3x' | 'infinite'>('off');
  const [repeatCount, setRepeatCount] = useState(0);
  const [isAudioDockVisible, setIsAudioDockVisible] = useState(false);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newReflection, setNewReflection] = useState('');
  const [showQFInfo, setShowQFInfo] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [juzs, setJuzs] = useState<any[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return false;
    return true; // Default mode is light mode for all users
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // Track page views in Google Analytics
  useEffect(() => {
    trackPageView(`/${view}`, `Quran Circles - ${view.charAt(0).toUpperCase() + view.slice(1)}`);
  }, [view]);

  // Quran Settings State
  const [translationId, setTranslationId] = useState(131); // Default: Clear Quran
  const [reciterId, setReciterId] = useState(7); // Default: Alafasy
  const [tafsirId, setTafsirId] = useState(169); // Default: Tafsir Ibn Kathir (English)
  const [arabicScript, setArabicScript] = useState('uthmani');
  const [arabicFontSize, setArabicFontSize] = useState(38); // Default font size (reduced from 48)
  const [translationFontSize, setTranslationFontSize] = useState(18); // Default font size
  const [translations, setTranslations] = useState<any[]>([]);
  const [reciters, setReciters] = useState<any[]>([]);
  const [tafsirs, setTafsirs] = useState<any[]>([]);

  // Create Circle Multi-step State
  const [createStep, setCreateStep] = useState(1);
  const [createdCircleId, setCreatedCircleId] = useState<string | null>(null);
  const [newLocalMemberName, setNewLocalMemberName] = useState('');
  const [newLocalMemberAvatar, setNewLocalMemberAvatar] = useState('🌙');
  const [newLocalMemberColor, setNewLocalMemberColor] = useState('#A3E635');
  const [circleForm, setCircleForm] = useState({
    name: '',
    planId: 'custom',
    customVerses: '',
    participationMode: 'individual',
    deadlineType: 'local',
    deadlineTime: '23:59',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    frequency: 'daily' as 'daily' | 'weekly',
    versesPerDay: 1,
    planType: 'juz' as 'juz' | 'surah',
    selectedJuz: [1],
    selectedSurah: [1],
  });

  // Scroll to top on view or circle change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, activeCircle?.id]);

  // App State
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);



  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmittingContact(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Message sent successfully!');
        setContactForm({ name: '', email: '', message: '' });
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Sync activeCircle with circles list to get updates
  useEffect(() => {
    if (activeCircle) {
      const updated = circles.find(c => c.id === activeCircle.id);
      if (updated) setActiveCircle(updated);
    }
  }, [circles]);

  // Chapters Listener
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
    quranFoundation.content.getChapters().then(setChapters).catch(console.error);
    quranFoundation.content.getJuzs().then(setJuzs).catch(console.error);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) setView('dashboard');
      else setView('landing');
    });
    return unsubscribe;
  }, []);

  // Circles Listener
  useEffect(() => {
    if (!user) return;
    const unsubscribe = quranFoundation.user.onRoomsUpdate((updatedCircles) => {
      setCircles(updatedCircles);
    });
    return unsubscribe;
  }, [user]);

  // Bookmarks Listener
  useEffect(() => {
    if (!user) return;
    const unsubscribe = quranFoundation.user.onBookmarksUpdate((updatedBookmarks) => {
      setBookmarks(updatedBookmarks);
    });
    return unsubscribe;
  }, [user]);

  // Active Circle Listener
  useEffect(() => {
    if (!activeCircle) return;
    const unsubscribe = quranFoundation.user.onRoomUpdate(activeCircle.id, (updatedCircle) => {
      if (updatedCircle) {
        setActiveCircle(updatedCircle);
      }
    });
    return unsubscribe;
  }, [activeCircle?.id]);

  // All Circles Reflections Listener
  useEffect(() => {
    if (circles.length === 0) return;
    
    // Do not create subcollection listeners for circles that are still pending write to the server.
    // If we do, the server's security rules will evaluates `get(/circles/...)` and fail 
    // because the circle hasn't sync'd yet, throwing a Permission Denied error that kills the listener.
    const syncedCircles = circles.filter(c => !c.isPending);

    const unsubscribes = syncedCircles.map(circle => {
      return quranFoundation.user.onPostsUpdate(circle.id, (updatedReflections) => {
        setReflections(prev => {
          // Filter out old reflections for this circle and add new ones
          const otherReflections = prev.filter(r => r.circleId !== circle.id);
          return [...otherReflections, ...updatedReflections];
        });
      });
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [circles.map(c => c.id).join(',')]);

  // Daily Reminders Logic
  useEffect(() => {
    if (!user || circles.length === 0) return;
    
    const checkReminders = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      
      circles.forEach(circle => {
        circle.participants.forEach(p => {
          // Only check for the current user or their lightweight participants
          if (p.id === user.uid || p.parentUid === user.uid) {
            if (p.reminderSettings?.enabled) {
              // Check if already reflected today
              const hasReflected = reflections.some(r => r.circleId === circle.id && r.participantId === p.id && r.date === todayStr);
              if (hasReflected) return;
              
              // Calculate deadline time
              const [hours, minutes] = circle.deadlineConfig.time.split(':').map(Number);
              const deadline = new Date();
              deadline.setHours(hours, minutes, 0, 0);
              
              // If deadline is in the past, we don't remind for today anymore
              if (deadline < now) return;
              
              const minutesUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60);
              const reminderTime = p.reminderSettings.timeBeforeDeadline || 60;
              
              // Trigger if we are within the reminder window (e.g. 60 mins before)
              // We check if we are in the 1-minute window of the reminder time
              if (minutesUntilDeadline <= reminderTime && minutesUntilDeadline > reminderTime - 1) {
                if (p.reminderSettings.type === 'browser' || p.reminderSettings.type === 'both') {
                  if (Notification.permission === 'granted') {
                    new Notification(`Reflection Reminder: ${circle.name}`, {
                      body: `Assalamu alaikum ${p.label || p.name}, it's time for your daily reflection!`,
                      icon: '/favicon.ico'
                    });
                  } else {
                    toast.info(`Reminder: Time for your reflection in ${circle.name}!`, {
                      description: `Assalamu alaikum ${p.label || p.name}, don't forget to share your thoughts today.`
                    });
                  }
                }
                
                // Email reminder would be triggered here via a backend service
                if (p.reminderSettings.type === 'email' || p.reminderSettings.type === 'both') {
                  console.log(`Email reminder would be sent to ${user.email} for circle ${circle.name}`);
                }
              }
            }
          }
        });
      });
    };
    
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, circles, reflections]);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success("Notifications enabled!");
      }
    }
  };
  // Auto-select participant for individual circles
  useEffect(() => {
    if (activeCircle && user && !activeParticipantId) {
      if (activeCircle.participationMode === 'individual') {
        const myParticipant = activeCircle.participants.find(p => p.id === user.uid);
        if (myParticipant) {
          setActiveParticipantId(myParticipant.id);
        }
      } else if (activeCircle.participants.length === 1) {
        // If there's only one participant, select them regardless of mode
        setActiveParticipantId(activeCircle.participants[0].id);
      }
    }
  }, [activeCircle?.id, user?.uid, activeParticipantId]);

  // Fetch Verses based on selected date
  useEffect(() => {
    if (!activeCircle) {
      setCurrentVerses([]);
      return;
    }
    
    // Get verses from either the predefined plan or the custom circle data
    let verses: string[] = [];
    if (activeCircle.verses && activeCircle.verses.length > 0) {
      verses = activeCircle.verses;
    } else {
      const plan = QURAN_PLANS.find(p => p.id === activeCircle.planId) || QURAN_PLANS[1]; // fallback to daily-wisdom
      if (plan) {
        verses = plan.verses;
      }
    }

    if (verses.length === 0) {
      console.warn("No verses found for circle:", activeCircle.id);
      return;
    }

    let dayIndex = 0;
    try {
      dayIndex = differenceInDays(startOfDay(parseISO(selectedDate)), startOfDay(parseISO(activeCircle.startDate)));
      if (isNaN(dayIndex) || dayIndex < 0) {
        dayIndex = 0;
      }
    } catch {
      dayIndex = 0;
    }
    
    let index = dayIndex;
    if (activeCircle.frequency === 'weekly') {
      index = Math.floor(dayIndex / 7);
    }
    
    const versesPerDay = activeCircle.versesPerDay || 1;
    // Modulo so that if the circle reaches or exceeds plan length, it cycles cleanly rather than returning an empty array
    const totalPlanDays = Math.ceil(verses.length / versesPerDay);
    const effectiveDay = totalPlanDays > 0 ? (index % totalPlanDays) : 0;
    const startIndex = effectiveDay * versesPerDay;
    let ayahKeys = verses.slice(startIndex, startIndex + versesPerDay);
    
    if (ayahKeys.length === 0 && verses.length > 0) {
      ayahKeys = [verses[0]];
    }
    
    if (ayahKeys.length === 0) {
      ayahKeys = ["110:1"];
    }

    Promise.all(ayahKeys.map(key => quranFoundation.content.getVerse(key, translationId, arabicScript)))
      .then(fetched => {
        if (fetched && fetched.length > 0) {
          setCurrentVerses(fetched);
        }
      })
      .catch(err => {
        console.error("Error fetching verses:", err);
        // Fallback to initial verse to ensure UI is never stuck in infinite loading
        quranFoundation.content.getVerse(ayahKeys[0] || "110:1", translationId, arabicScript)
          .then(v => setCurrentVerses([v]))
          .catch(() => {});
      });
  }, [activeCircle?.id, activeCircle?.planId, activeCircle?.verses, activeCircle?.versesPerDay, activeCircle?.startDate, selectedDate, translationId, arabicScript]);

  // Fetch Translations, Reciters and Tafsirs
  useEffect(() => {
    quranFoundation.content.getTranslations().then(data => {
      setTranslations(data);
      // If the default translation (131) isn't in the list, pick the first available one
      if (data.length > 0 && !data.find(t => t.id === translationId)) {
        setTranslationId(data[0].id);
      }
    }).catch(console.error);
    quranFoundation.content.getReciters().then(setReciters).catch(console.error);
    quranFoundation.content.getTafsirs().then(setTafsirs).catch(console.error);
  }, []);

  // Seed Demo Data
  const seedDemoData = async () => {
    let currentUser = user;
    
    if (!currentUser) {
      try {
        const result = await loginAnonymously();
        currentUser = result.user as any;
      } catch (err: any) {
        console.error("Anonymous login failed:", err);
        if (err.code === 'auth/admin-restricted-operation') {
          toast.error("Demo Mode requires 'Anonymous Authentication' to be enabled in your Firebase Console (Authentication > Sign-in method). Please enable it or sign in with Google first.");
        } else {
          toast.error("Failed to start demo. Please check your internet connection.");
        }
        return;
      }
    }

    if (!currentUser) return;
    
    const uid = currentUser.uid;
    
    // 1. Family Circle (Shared Device, Local Midnight)
    const familyCircle: Partial<Circle> = {
      name: "The Rahmans (Family)",
      inviteCode: "FAM999",
      adminUid: uid,
      planId: "daily-wisdom",
      startDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
      members: [uid],
      participants: [
        { id: uid, name: "Baba", type: 'auth' },
        { id: 'p1', name: "Mama", type: 'lightweight', parentUid: uid },
        { id: 'p2', name: "Zaid", type: 'lightweight', parentUid: uid }
      ],
      versesPerDay: 1,
      frequency: 'daily',
      participationMode: 'shared',
      deadlineConfig: { type: 'local', timezone: 'Europe/London', time: '23:59' },
      streak: { current: 5, lastDate: format(subDays(new Date(), 1), 'yyyy-MM-dd') }
    };

    // 2. Global Friends (Individual, Shared Deadline)
    const globalCircle: Partial<Circle> = {
      name: "Global Hifz Friends",
      inviteCode: "GLOB88",
      adminUid: uid,
      planId: "last-10-surahs",
      startDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
      members: [uid, 'user2', 'user3'],
      participants: [
        { id: uid, name: "Me (London)", type: 'auth' },
        { id: 'user2', name: "Omar (Dubai)", type: 'auth' },
        { id: 'user3', name: "Sara (NYC)", type: 'auth' }
      ],
      versesPerDay: 1,
      frequency: 'daily',
      participationMode: 'individual',
      deadlineConfig: { type: 'shared', timezone: 'UTC', time: '22:00' },
      streak: { current: 10, lastDate: format(subDays(new Date(), 1), 'yyyy-MM-dd') }
    };

    try {
      const c1 = await quranFoundation.user.createRoom(familyCircle);
      const c2 = await quranFoundation.user.createRoom(globalCircle);
      
      // Add some reflections for yesterday to justify the streak
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const dayBefore = format(subDays(new Date(), 2), 'yyyy-MM-dd');
      
      for (const p of familyCircle.participants!) {
        // Yesterday
        await quranFoundation.user.createPost(c1.id, {
          circleId: c1.id,
          ayahKey: "1:1",
          participantId: p.id,
          participantName: p.name,
          text: `Reflection from ${p.name} for yesterday. This ayah really touched my heart.`,
          createdAt: subDays(new Date(), 1).toISOString(),
          date: yesterday,
          reactions: { '❤️': [uid] }
        });
        
        // Day Before
        await quranFoundation.user.createPost(c1.id, {
          circleId: c1.id,
          ayahKey: "1:2",
          participantId: p.id,
          participantName: p.name,
          text: `Day before yesterday reflection. SubhanAllah.`,
          createdAt: subDays(new Date(), 2).toISOString(),
          date: dayBefore
        });
      }
      
      setView('dashboard');
    } catch (err) {
      console.error("Seeding error:", err);
      toast.error("Failed to seed demo data. Please try again.");
    }
  };

  // Auto-select active participant if not set
  useEffect(() => {
    if (activeCircle && user && !activeParticipantId) {
      const me = activeCircle.participants.find(p => p.id === user.uid);
      if (me) {
        setActiveParticipantId(me.id);
      } else if (activeCircle.participants.length > 0) {
        // If it's a shared device and I'm not a participant, maybe don't auto-select
        // But for convenience, if there's only one, select it
        if (activeCircle.participants.length === 1) {
          setActiveParticipantId(activeCircle.participants[0].id);
        }
      }
    }
  }, [activeCircle, user, activeParticipantId]);

  // Reset audio index when verses change
  useEffect(() => {
    setCurrentAudioVerseIndex(0);
    setAudioProgress(0);
  }, [currentVerses]);

   // Audio Logic initialization
  useEffect(() => {
    audio.preload = "auto";
    audio.volume = 1;
    audio.muted = false;
  }, [audio]);

  // 1. Effect to handle source loading when verse or reciter changes
  useEffect(() => {
    let isMounted = true;
    if (!currentVerses || currentVerses.length === 0) return;

    const verseToLoad = currentVerses[currentAudioVerseIndex];
    if (!verseToLoad) return;

    setIsLoadingAudio(true);
    quranFoundation.content.getAudioUrl(reciterId, verseToLoad.verse_key)
      .then(url => {
        if (!isMounted) return;
        if (url && audio.src !== url) {
          const wasPlaying = isPlaying;
          audio.pause();
          audio.src = url;
          audio.load();
          if (wasPlaying) {
            audio.play().catch(e => {
              if (e.name !== 'AbortError') console.error("Audio transition play failed:", e);
              setIsPlaying(false);
            });
          }
        }
        setIsLoadingAudio(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error("Failed to load audio source:", err);
        setIsLoadingAudio(false);
        if (isPlaying) setIsPlaying(false);
      });

    return () => { isMounted = false; };
  }, [currentVerses, currentAudioVerseIndex, reciterId, audio]);

  // 2. Effect to handle play/pause sync with state
  useEffect(() => {
    if (isPlaying && audio.paused && audio.src) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Sync play failed:", e, "Source:", audio.src);
            
            // If it failed with no supported sources and isn't already the fallback
            if (!audio.src.includes('everyayah.com')) {
              console.log("Attempting switch to reliable fallback due to play failure...");
              const verseToLoad = currentVerses[currentAudioVerseIndex];
              if (verseToLoad) {
                const [surah, ayah] = verseToLoad.verse_key.split(':');
                const pS = surah.padStart(3, '0');
                const pA = ayah.padStart(3, '0');
                audio.src = `https://everyayah.com/data/Alafasy_128kbps/${pS}${pA}.mp3`;
                audio.load();
                audio.play().catch(err => console.error("Fallback audio failed as well:", err));
              }
            } else {
              setIsPlaying(false);
            }
          }
        });
      }
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, audio, currentVerses, currentAudioVerseIndex]);

  // 3. Effect to handle listeners
  useEffect(() => {
    const updateProgress = () => {
      setAudioProgress(audio.currentTime);
      setAudioDuration(audio.duration || 0);
    };

    const handleError = () => {
      if (audio.error) {
        console.error("Audio Media Error:", audio.error.code, audio.error.message, audio.src);
        if (isPlaying) setIsPlaying(false);
      }
      setIsLoadingAudio(false);
    };

    const onEnded = () => {
      if (repeatMode === '3x' && repeatCount < 2) {
        setRepeatCount(prev => prev + 1);
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      if (repeatMode === 'infinite') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }

      setRepeatCount(0);
      setCurrentAudioVerseIndex(prev => {
        if (prev < currentVerses.length - 1) return prev + 1;
        setIsPlaying(false);
        setAudioProgress(0);
        return 0;
      });
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audio, currentVerses, repeatMode, repeatCount]);

  const handleSeek = (time: number) => {
    if (audio.duration) {
      audio.currentTime = time;
      setAudioProgress(time);
    }
  };

  const toggleAudio = () => {
    setIsAudioDockVisible(true);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      setIsPlaying(true);
      // Synchronous play to bless the audio element on iOS/Safari
      const p = audio.play();
      if (p !== undefined) p.catch(() => {});

      if (!audio.src || audio.src === window.location.href || audio.error) {
        setCurrentAudioVerseIndex(0);
      }
    }
  };

  const toggleBookmark = async () => {
    if (!user || currentVerses.length === 0) return;
    try {
      // Toggle bookmark for the first verse of the day
      await quranFoundation.user.toggleBookmark(currentVerses[0].verse_key);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleCreateCircle = async () => {
    if (!user) return;
    
    if (!circleForm.name || circleForm.name.trim().length === 0) {
      toast.error("Please enter a name for your circle.");
      setCreateStep(1);
      return;
    }
    
    if (circleForm.planId === 'custom' && (chapters.length === 0 || juzs.length === 0)) {
      toast.error("Quran data is still loading. Please wait a moment and try again.");
      return;
    }

    if (circleForm.planId === 'custom') {
      if (circleForm.planType === 'juz' && circleForm.selectedJuz.length === 0) {
        toast.error("Please select at least one Juz.");
        return;
      }
      if (circleForm.planType === 'surah' && circleForm.selectedSurah.length === 0) {
        toast.error("Please select at least one Surah.");
        return;
      }
    }

    const inviteCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 36])
      .join('');
    
    let verses: string[] = [];
    let planName = '';

    if (circleForm.planId === 'custom') {
      if (circleForm.planType === 'juz') {
        planName = `Juz ${circleForm.selectedJuz.join(', ')}`;
        circleForm.selectedJuz.forEach(juzNum => {
          const juz = juzs.find(j => j.juz_number === juzNum);
          if (juz) {
            Object.entries(juz.verse_mapping).forEach(([surahId, range]) => {
              const [start, end] = (range as string).split('-');
              const startAyah = parseInt(start);
              const endAyah = parseInt(end);
              for (let i = startAyah; i <= endAyah; i++) {
                verses.push(`${surahId}:${i}`);
              }
            });
          }
        });
      } else if (circleForm.planType === 'surah') {
        const selectedChapters = chapters.filter(c => circleForm.selectedSurah.includes(c.id));
        planName = selectedChapters.map(c => c.name_simple).join(', ');
        selectedChapters.forEach(surah => {
          for (let i = 1; i <= surah.verses_count; i++) {
            verses.push(`${surah.id}:${i}`);
          }
        });
      }
    } else {
      const plan = QURAN_PLANS.find(p => p.id === circleForm.planId);
      verses = plan?.verses || [];
      planName = plan?.name || 'Custom';
    }

    const newCircle: Partial<Circle> = {
      name: circleForm.name,
      inviteCode,
      adminUid: user.uid,
      planId: circleForm.planId,
      planName,
      verses,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      members: [user.uid],
      participants: [{ 
        id: user.uid, 
        name: user.displayName || 'You', 
        label: user.displayName || 'You',
        type: 'auth', 
        color: '#A3E635', 
        avatar: '🌙' 
      }],
      participationMode: circleForm.participationMode as any,
      frequency: circleForm.frequency,
      versesPerDay: circleForm.versesPerDay,
      planType: circleForm.planType,
      deadlineConfig: { 
        type: circleForm.deadlineType as 'local' | 'shared', 
        timezone: circleForm.timezone, 
        time: circleForm.deadlineTime 
      },
      streak: { current: 0, lastDate: '' }
    };

    try {
      const createdCircle = await quranFoundation.user.createRoom(newCircle);
      setCreatedCircleId(createdCircle.id);
      setCreateStep(4);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create circle. Please try again later.');
    }
  };

  const handleJoinCircle = async (code: string) => {
    if (!user) {
      toast.error("Please sign in to join a circle.");
      return;
    }
    try {
      await quranFoundation.user.joinRoom(code);
      setView('dashboard');
      toast.success("Successfully joined circle!");
    } catch (err) {
      console.error('Error joining circle:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join circle');
    }
  };

  const submitReflection = async () => {
    if (!activeCircle || !activeParticipantId || !newReflection.trim() || currentVerses.length === 0) return;

    const participant = activeCircle.participants.find(p => p.id === activeParticipantId);
    const firstVerse = currentVerses[0];
    const lastVerse = currentVerses[currentVerses.length - 1];
    const verseRange = currentVerses.length > 1 
      ? `${firstVerse.verse_key}${firstVerse.verse_key.split(':')[0] === lastVerse.verse_key.split(':')[0] ? `-${lastVerse.verse_key.split(':')[1]}` : ` to ${lastVerse.verse_key}`}`
      : firstVerse.verse_key;

    const reflection: Partial<Reflection> = {
      circleId: activeCircle.id,
      ayahKey: verseRange,
      participantId: activeParticipantId,
      participantName: participant?.name || 'Unknown',
      text: newReflection,
      createdAt: new Date().toISOString(),
      date: selectedDate,
      reactions: {}
    };

    try {
      await quranFoundation.user.createPost(activeCircle.id, reflection);
      setNewReflection('');
      checkAndUpdateStreak(activeCircle);

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D9F99D', '#10B981']
      });

      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `circles/${activeCircle.id}/reflections`);
    }
  };

  const handleUpdateParticipant = async (participantId: string, updates: Partial<Participant>) => {
    if (!activeCircle) return;
    try {
      await quranFoundation.user.updateParticipant(activeCircle.id, participantId, updates);
    } catch (err) {
      console.error("Update participant failed:", err);
    }
  };

  const handleAddLocalParticipant = async (name: string) => {
    if (!activeCircle || !user || !name.trim()) return;
    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      type: 'lightweight',
      parentUid: user.uid,
      avatar: PREDEFINED_AVATARS[0],
      color: AVATAR_COLORS[0]
    };

    try {
      await quranFoundation.user.updateRoom(activeCircle.id, {
        participants: [...activeCircle.participants, newParticipant]
      });
      toast.success("User added successfully!");
    } catch (err) {
      console.error("Error adding local member:", err);
      toast.error("Failed to add user.");
    }
  };

  const handleReact = async (reflectionId: string, emoji: string) => {
    if (!activeCircle || !activeParticipantId) return;
    try {
      await quranFoundation.user.reactToPost(activeCircle.id, reflectionId, emoji, activeParticipantId);
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  const checkAndUpdateStreak = async (circle: Circle) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const circleReflections = reflections.filter(r => r.circleId === circle.id);
    const progress = getDayProgress(circle.participants, circleReflections, today);

    // We check if it's complete. Note: reflections might be one behind if called immediately after createPost
    // But since we use onSnapshot, it will trigger again.
    // However, for immediate feedback, we can check if (progress.completed.length + 1) === circle.participants.length
    if (progress.isComplete && circle.streak.lastDate !== today) {
      try {
        const newStreak = calculateStreak(circle, circleReflections);
        await quranFoundation.user.updateRoom(circle.id, {
          streak: {
            current: newStreak,
            lastDate: today
          }
        });
      } catch (err) {
        console.error('Error updating streak:', err);
      }
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!activeCircle || !user || activeCircle.adminUid !== user.uid) return;
    if (participantId === user.uid) {
      toast.error("Cannot remove the admin. Use 'Delete Circle' instead.");
      return;
    }

    try {
      await quranFoundation.user.updateRoom(activeCircle.id, {
        participants: activeCircle.participants.filter(p => p.id !== participantId),
        members: activeCircle.members.filter(m => m !== participantId)
      });
      toast.success("Participant removed");
    } catch (err) {
      console.error('Error removing participant:', err);
      toast.error("Failed to remove participant");
    }
  };

  const leaveCircle = async () => {
    if (!activeCircle || !user) return;
    if (activeCircle.adminUid === user.uid) {
      toast.error("Admins cannot leave. Delete the circle instead.");
      return;
    }

    try {
      await quranFoundation.user.updateRoom(activeCircle.id, {
        participants: activeCircle.participants.filter(p => p.id !== user.uid),
        members: activeCircle.members.filter(m => m !== user.uid)
      });
      setView('dashboard');
      setActiveCircle(null);
      toast.success("You have left the circle");
    } catch (err) {
      console.error('Error leaving circle:', err);
      toast.error("Failed to leave circle");
    }
  };

  const deleteCircle = async () => {
    if (!activeCircle || !user || activeCircle.adminUid !== user.uid) return;
    
    if (!window.confirm("Are you absolutely sure you want to delete this circle? This will remove all reflections and data for all members.")) return;

    try {
      await quranFoundation.user.deleteRoom(activeCircle.id);
      setView('dashboard');
      setActiveCircle(null);
      toast.success("Circle deleted successfully");
    } catch (err) {
      console.error('Error deleting circle:', err);
      toast.error("Failed to delete circle");
    }
  };

  const updateCircleSettings = async (updates: Partial<Circle>) => {
    if (!activeCircle || !user || activeCircle.adminUid !== user.uid) return;
    try {
      await quranFoundation.user.updateRoom(activeCircle.id, updates);
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const openAuthModal = () => setShowAuthModal(true);

  const handleExplore = async () => {
    try {
      await loginAnonymously();
    } catch (err: any) {
      console.error("Explore mode failed:", err);
      toast.error("Failed to enter explore mode. Please try again.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-emerald-600 font-black animate-pulse uppercase tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5F8F7] text-stone-900 dark:bg-brand-deep dark:text-white font-sans selection:bg-emerald-700 selection:text-white dark:selection:bg-brand-lime dark:selection:text-brand-deep transition-colors duration-300">
      <div className="min-h-screen flex flex-col md:flex-row">
        
        {/* Mobile Header */}
        {user && (
          <header className="md:hidden flex items-center justify-between p-6 bg-white/95 dark:bg-brand-deep/80 backdrop-blur-xl border-b border-black/10 dark:border-white/10 sticky top-0 z-50 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-white/5 border border-emerald-200/50 dark:border-white/10 p-1">
                <img src="/favicon.svg" className="w-full h-full object-contain" alt="Quran Circles Logo" />
              </div>
              <h1 className="font-display font-black text-lg tracking-tighter uppercase text-emerald-950 dark:text-white">Quran</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsLightMode(!isLightMode)} 
                className="text-stone-700 dark:text-white/60 hover:text-emerald-800 dark:hover:text-white p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                onClick={() => setShowQFInfo(true)} 
                className="text-stone-700 dark:text-white/60 hover:text-emerald-800 dark:hover:text-white p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="How it works"
              >
                <Info size={20} />
              </button>
              {view === 'circle' && activeCircle && (
                <button 
                  onClick={() => setView('circle-settings')} 
                  className="text-stone-700 dark:text-white/60 hover:text-emerald-800 dark:hover:text-white p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
              )}
              <div 
                className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden transition-all cursor-pointer",
                  view === 'profile' 
                    ? "bg-emerald-700 border-emerald-700 text-white dark:bg-brand-lime dark:border-brand-lime dark:text-brand-deep" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-brand-forest dark:border-white/10 dark:text-brand-lime"
                )} 
                onClick={() => setView('profile')}
              >
                {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <UserIcon size={20} />}
              </div>
            </div>
          </header>
        )}

        {/* Sidebar for Desktop */}
        {user && (
          <aside 
            className={cn(
              "hidden md:flex md:h-screen md:sticky md:top-0 flex-col justify-between border-r border-black/10 dark:border-white/10 bg-white/95 dark:bg-brand-deep/80 backdrop-blur-xl z-50 transition-all duration-500",
              isSidebarOpen ? "lg:w-80 md:w-64 p-8" : "md:w-24 p-4"
            )}
          >
            <div className="space-y-12">
              <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('dashboard')}>
                <div className={cn(
                  "rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shrink-0 bg-emerald-50 dark:bg-white/5 border border-emerald-200/50 dark:border-white/10 p-1",
                  isSidebarOpen ? "w-14 h-14" : "w-12 h-12"
                )}>
                  <img src="/favicon.svg" className="w-full h-full object-contain" alt="Quran Circles Logo" />
                </div>
                {isSidebarOpen && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="font-display font-black text-2xl tracking-tighter leading-none text-emerald-950 dark:text-white">QURAN</h1>
                    <p className="text-[10px] font-black text-emerald-700 dark:text-brand-lime uppercase tracking-[0.3em] mt-1">Circles</p>
                  </motion.div>
                )}
              </div>

              <nav className="space-y-2">
                <button 
                  onClick={() => setView('dashboard')}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer",
                    isSidebarOpen ? "px-6 py-4" : "p-4 justify-center",
                    view === 'dashboard' 
                      ? "bg-emerald-700 text-white shadow-md dark:bg-brand-lime dark:text-brand-deep dark:lime-glow" 
                      : "text-stone-700 dark:text-white/60 hover:text-emerald-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  title="Dashboard"
                >
                  <LayoutDashboard size={22} /> {isSidebarOpen && "Dashboard"}
                </button>
                <button 
                  onClick={() => setView('bookmarks')}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer",
                    isSidebarOpen ? "px-6 py-4" : "p-4 justify-center",
                    view === 'bookmarks' 
                      ? "bg-emerald-700 text-white shadow-md dark:bg-brand-lime dark:text-brand-deep dark:lime-glow" 
                      : "text-stone-700 dark:text-white/60 hover:text-emerald-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  title="Bookmarks"
                >
                  <BookmarkIcon size={22} /> {isSidebarOpen && "Bookmarks"}
                </button>
                <button 
                  onClick={() => setView('stats')}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer",
                    isSidebarOpen ? "px-6 py-4" : "p-4 justify-center",
                    view === 'stats' 
                      ? "bg-emerald-700 text-white shadow-md dark:bg-brand-lime dark:text-brand-deep dark:lime-glow" 
                      : "text-stone-700 dark:text-white/60 hover:text-emerald-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  title="Analytics"
                >
                  <PieChart size={22} /> {isSidebarOpen && "Analytics"}
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl font-bold text-stone-500 dark:text-white/40 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer",
                    isSidebarOpen ? "px-6 py-4" : "p-4 justify-center"
                  )}
                  title={isSidebarOpen ? "Collapse" : "Expand"}
                >
                  <ChevronRight size={22} className={cn("transition-transform duration-500", isSidebarOpen && "rotate-180")} /> {isSidebarOpen && "Collapse"}
                </button>

                {isSidebarOpen && circles.length > 0 && (
                  <div className="pt-4 border-t border-black/10 dark:border-white/5 space-y-2">
                    <p className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-emerald-800 dark:text-brand-lime">Your Circles</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                      {circles.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveCircle(c);
                            setView('circle');
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold truncate flex items-center justify-between transition-colors cursor-pointer",
                            activeCircle?.id === c.id 
                              ? "bg-emerald-100 text-emerald-900 font-black border border-emerald-300 dark:bg-brand-lime/20 dark:text-brand-lime dark:border-brand-lime/30" 
                              : "text-stone-700 dark:text-white/60 hover:text-stone-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] font-bold opacity-75 ml-1 shrink-0">🔥{c.streak.current}d</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </nav>
            </div>

            <div className={cn("pt-8 border-t border-black/10 dark:border-white/5", !isSidebarOpen && "flex flex-col items-center gap-4")}>
              <div className="space-y-2 mb-4 w-full">
                <button 
                  onClick={() => setShowQFInfo(true)} 
                  className={cn(
                    "w-full flex items-center gap-3 rounded-2xl font-bold text-stone-700 dark:text-white/50 hover:text-stone-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer",
                    isSidebarOpen ? "px-6 py-4" : "p-4 justify-center"
                  )}
                  title="How it works"
                >
                  <Info size={20} /> {isSidebarOpen && "How it works"}
                </button>
                <button 
                  onClick={() => setIsLightMode(!isLightMode)} 
                  className={cn(
                    "w-full flex items-center gap-3 rounded-2xl font-bold text-stone-700 dark:text-white/50 hover:text-stone-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer",
                    isSidebarOpen ? "px-6 py-4" : "p-4 justify-center"
                  )} 
                  title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                  {isSidebarOpen && (isLightMode ? "Dark Mode" : "Light Mode")}
                </button>
              </div>

              <div 
                className={cn(
                  "flex items-center gap-4 px-2 cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-2xl transition-all border border-transparent", 
                  view === 'profile' && "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                )}
                onClick={() => setView('profile')}
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 dark:bg-brand-forest dark:text-brand-lime rounded-2xl border border-emerald-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <UserIcon size={24} />}
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate text-stone-900 dark:text-white">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-stone-500 dark:text-white/40 font-bold uppercase tracking-widest">Active Member</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto">
          {/* Big Constant Banner for Demo Mode */}
          {user && user.isAnonymous && view !== 'landing' && (
            <div className="sticky top-0 z-40 mb-8 -mt-2 md:-mt-6">
              <div className="bg-white dark:bg-gradient-to-r dark:from-brand-forest dark:via-emerald-950 dark:to-brand-deep border-2 border-emerald-600/25 dark:border-brand-lime/30 rounded-3xl p-5 md:p-6 shadow-xl text-paper-ink dark:text-white flex flex-col lg:flex-row items-center justify-between gap-6 backdrop-blur-xl">
                <div className="flex items-center gap-4 text-center lg:text-left">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-700 text-white dark:bg-brand-lime dark:text-brand-deep flex items-center justify-center shrink-0 shadow-lg lime-glow">
                    <Sparkles size={26} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-brand-lime text-emerald-800 dark:text-brand-deep text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-transparent">
                        Demo Mode Active
                      </span>
                      <span className="text-paper-accent dark:text-white/60 text-xs hidden sm:inline">• Previewing Experience</span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-paper-ink dark:text-white leading-snug">
                      Create an account or sign in to begin your Quran Circles journey and save your daily habit!
                    </p>
                    <p className="text-xs text-paper-accent dark:text-white/50 hidden md:block">
                      Your demo data and reflections will not be preserved permanently unless you connect an account.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 sm:flex-none px-7 py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-brand-lime dark:text-brand-deep font-black text-xs uppercase tracking-wider dark:hover:bg-white transition-all shadow-xl active:scale-95 cursor-pointer"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs uppercase tracking-wider transition-all dark:border-white/20 active:scale-95 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {view === 'landing' && (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[85vh] flex flex-col items-center justify-center py-12 relative">
                
                <div className="absolute top-0 right-4 sm:right-8 flex items-center gap-3 z-50">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowAuthModal(true)} 
                    className="text-xs font-bold uppercase tracking-wider py-2.5 px-5 border-black/20 hover:border-emerald-700 hover:text-emerald-800 dark:border-white/20 dark:hover:border-brand-lime dark:hover:text-brand-lime text-stone-900 dark:text-white"
                  >
                    Sign In
                  </Button>
                  <button 
                    onClick={() => setIsLightMode(!isLightMode)} 
                    className="p-3 rounded-full bg-black/5 hover:bg-black/10 text-stone-800 border border-black/15 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 transition-all backdrop-blur-md cursor-pointer"
                    title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
                  >
                    {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
                </div>

                <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                  <div className="space-y-12 text-center lg:text-left">
                    <div className="space-y-6">
                      <h2 className="text-5xl sm:text-7xl md:text-8xl font-display font-black tracking-tighter leading-[0.85] uppercase text-emerald-950 dark:text-white">
                        Quran <br />
                        <span className="text-emerald-700 dark:text-brand-lime">Circles</span>
                      </h2>
                    </div>
                    
                    <p className="text-xl md:text-3xl text-stone-700 dark:text-white/60 font-medium max-w-xl leading-relaxed">
                      Private Quran habit circles for families and friends.
                    </p>
                  </div>

                  <GlassCard className="p-8 md:p-10 space-y-6 relative overflow-visible shadow-2xl">
                    <div className="absolute -top-6 -right-6 md:-top-8 md:-right-8 w-20 h-20 md:w-28 md:h-28 bg-brand-lime text-brand-deep rounded-full flex items-center justify-center rotate-12 lime-glow border-4 border-brand-deep pointer-events-none z-10">
                      <p className="text-[9px] md:text-xs font-black uppercase tracking-tighter text-center leading-none">Join the <br/> Circle</p>
                    </div>

                    <AuthCard onSeedDemo={seedDemoData} />
                  </GlassCard>
                </div>

                {/* Additional Landing Content */}
                <div className="w-full max-w-7xl mt-48 space-y-48">
                  {/* Live Preview Section */}
                  <div className="space-y-24">
                    <div className="text-center space-y-6">
                      <h3 className="text-5xl md:text-8xl font-display font-black uppercase tracking-tighter">The Experience</h3>
                      <p className="text-white/40 text-xl md:text-3xl font-medium">Beautiful, focused, and distraction-free.</p>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-brand-lime/10 rounded-[4rem] blur-3xl group-hover:bg-brand-lime/20 transition-all duration-700" />
                      <GlassCard className="relative p-0 overflow-hidden border-white/10 shadow-2xl">
                        <div className="grid lg:grid-cols-5 min-h-[600px]">
                          <div className="lg:col-span-2 p-12 bg-brand-forest/40 border-r border-white/5 space-y-12">
                            <div className="space-y-4">
                              <Badge variant="lime">Daily Verse</Badge>
                              <h4 className="text-4xl font-display font-black uppercase tracking-tight">Surah Al-Baqarah</h4>
                              <p className="text-white/40 font-medium">Verse 255 • Ayat al-Kursi</p>
                            </div>
                            
                            <div className="space-y-8">
                              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-brand-lime/20 flex items-center justify-center text-brand-lime">
                                    <MessageSquare size={14} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Circle Reflection</span>
                                </div>
                                <p className="text-white/80 italic font-medium">"This verse reminds me of the absolute sovereignty of Allah. It brings such peace to the heart..."</p>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                  {[1,2,3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-xl bg-brand-forest border-2 border-brand-deep flex items-center justify-center text-xs font-black">
                                      {String.fromCharCode(64 + i)}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">+ 5 others reflecting</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="lg:col-span-3 p-12 flex flex-col justify-center items-center space-y-12 bg-brand-deep/50">
                            <p className="text-5xl md:text-7xl font-arabic text-right leading-[1.8] text-white/90 drop-shadow-2xl" dir="rtl">
                              اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                            </p>
                            <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <p className="text-xl md:text-2xl text-center text-white/60 font-medium italic max-w-xl leading-relaxed">
                              "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence."
                            </p>
                            <div className="flex items-center gap-8">
                              <button className="w-16 h-16 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center shadow-2xl lime-glow hover:scale-110 transition-transform">
                                <Play size={24} fill="currentColor" />
                              </button>
                              <div className="flex items-center gap-4">
                                <button className="p-4 rounded-2xl bg-white/5 text-white/40 hover:text-white transition-colors border border-white/10">
                                  <BookOpen size={20} />
                                </button>
                                <button className="p-4 rounded-2xl bg-white/5 text-white/40 hover:text-white transition-colors border border-white/10">
                                  <BookmarkIcon size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  </div>

                  {/* How it Works */}
                  <div className="space-y-24">
                    <div className="text-center space-y-6">
                      <h3 className="text-5xl md:text-8xl font-display font-black uppercase tracking-tighter">How it Works</h3>
                      <p className="text-white/40 text-xl md:text-3xl font-medium">Three simple steps to start your journey.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                      {[
                        { step: '01', title: 'Create a Circle', desc: 'Invite your friends or family to a private, secure space.' },
                        { step: '02', title: 'Daily Verse', desc: 'Receive a curated verse every day based on your chosen plan.' },
                        { step: '03', title: 'Reflect & Grow', desc: 'Share your thoughts and read reflections from your circle.' }
                      ].map((item, i) => (
                        <GlassCard key={i} className="p-12 space-y-8 hover:border-brand-lime/30 transition-all duration-500 group">
                          <span className="text-7xl font-display font-black text-brand-lime/10 group-hover:text-brand-lime/20 transition-colors">{item.step}</span>
                          <div className="space-y-4">
                            <h4 className="text-3xl font-display font-black uppercase tracking-tight">{item.title}</h4>
                            <p className="text-white/40 text-lg leading-relaxed font-medium">{item.desc}</p>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>

                  {/* Problem/Solution */}
                  <div className="grid lg:grid-cols-2 gap-24 items-center">
                    <div className="space-y-8">
                      <h3 className="text-4xl md:text-7xl font-display font-black uppercase tracking-tighter leading-[0.9]">
                        Build a <span className="text-brand-lime">Private Circle</span> with Family
                      </h3>
                      <p className="text-xl md:text-2xl text-white/40 leading-relaxed font-medium">
                        Most people struggle to maintain a consistent connection with the Quran in isolation. Busy schedules and lack of accountability make it hard to stay on track.
                      </p>
                      <p className="text-xl md:text-2xl text-white/40 leading-relaxed font-medium">
                        Quran Circles provides a calm, private space where you and your close friends or family can grow together, one verse at a time. No public feeds, just your circle.
                      </p>
                    </div>
                    <div className="relative">
                      <div className="aspect-square bg-brand-forest rounded-[4rem] border border-white/10 flex items-center justify-center overflow-hidden relative group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
                        <span className="text-[140px] relative z-10 drop-shadow-2xl filter grayscale opacity-10 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-125">🤲</span>
                      </div>
                      <motion.div 
                        initial={{ rotate: 0 }}
                        whileInView={{ rotate: 3 }}
                        className="absolute -bottom-10 -left-10 bg-brand-lime text-brand-deep p-10 rounded-[2.5rem] shadow-2xl lime-glow border-4 border-brand-deep"
                      >
                        <p className="text-3xl font-display font-black uppercase tracking-tighter leading-none">Spiritual <br/>Growth Together</p>
                      </motion.div>
                    </div>
                  </div>

                  {/* Features Bento */}
                  <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    <GlassCard className="md:col-span-2 p-12 flex flex-col justify-between min-h-[400px] relative overflow-hidden group border-brand-lime/5">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:bg-brand-lime/10 transition-all duration-700" />
                      <div className="space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-lime/10 rounded-full border border-brand-lime/20 mb-4">
                          <Zap size={14} className="text-brand-lime" />
                          <span className="text-[10px] font-black text-brand-lime uppercase tracking-widest">Premium Experience</span>
                        </div>
                        <h4 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tight leading-none">Immersive <br/> Recitation</h4>
                        <p className="text-white/40 text-xl md:text-2xl font-medium max-w-md">Listen to world-class reciters while you reflect on the divine meanings.</p>
                      </div>
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center lime-glow shadow-2xl">
                          <Play size={32} fill="currentColor" />
                        </div>
                        <div className="h-3 flex-1 bg-white/5 rounded-full border border-white/10 overflow-hidden p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: '75%' }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="h-full bg-brand-lime rounded-full"
                          />
                        </div>
                      </div>
                    </GlassCard>
                    
                    <GlassCard className="p-12 space-y-8 group border-white/5">
                      <div className="w-20 h-20 rounded-[2rem] bg-brand-lime/10 flex items-center justify-center text-brand-lime mb-8 group-hover:scale-110 transition-all duration-500 shadow-xl border border-brand-lime/20">
                        <BookOpen size={36} />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-3xl font-display font-black uppercase tracking-tight">Deep Tafsir</h4>
                        <p className="text-white/40 text-lg font-medium leading-relaxed">Access multiple translations and detailed explanations for every single verse.</p>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-12 space-y-8 group border-white/5">
                      <div className="w-20 h-20 rounded-[2rem] bg-brand-lime/10 flex items-center justify-center text-brand-lime mb-8 group-hover:scale-110 transition-all duration-500 shadow-xl border border-brand-lime/20">
                        <Trophy size={36} />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-3xl font-display font-black uppercase tracking-tight">Track Growth</h4>
                        <p className="text-white/40 text-lg font-medium leading-relaxed">Maintain your streak and visualize your spiritual progress over weeks and months.</p>
                      </div>
                    </GlassCard>

                    <GlassCard className="md:col-span-2 p-12 flex flex-col md:flex-row items-center gap-16 group border-white/5">
                      <div className="flex -space-x-8">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-24 h-24 rounded-[2rem] bg-brand-forest border-4 border-brand-deep flex items-center justify-center text-3xl font-black shadow-2xl group-hover:-translate-y-4 transition-all duration-500 relative" style={{ transitionDelay: `${i * 100}ms` }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[2rem]" />
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4 text-center md:text-left flex-1">
                        <h4 className="text-4xl font-display font-black uppercase tracking-tight">Private Community</h4>
                        <p className="text-white/40 text-xl font-medium leading-relaxed">No public feeds, no ads, no distractions. Just a sacred space for you and your circle.</p>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Testimonials */}
                  <div className="space-y-24">
                    <div className="text-center space-y-6">
                      <h3 className="text-5xl md:text-8xl font-display font-black uppercase tracking-tighter">Community Voice</h3>
                      <p className="text-white/40 text-xl md:text-3xl font-medium">What our early users are saying.</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
                      {[
                        { text: "Very useful", name: "Faisal", size: "small" },
                        { text: "Love it mashAllah", name: "Fayaz", size: "medium" },
                        { text: "This looks so good Allahumma barik", name: "Rafill", size: "large" },
                        { text: "Looks beautiful", name: "Ahtisham", size: "small" },
                        { text: "Looks absolutely amazing", name: "Sadiqur", size: "medium" },
                        { text: "Good idea", name: "Anonymous", size: "small" },
                        { text: "This is an amazing idea", name: "AR", size: "large" },
                        { text: "I think it's a brilliant idea", name: "Adil", size: "medium" },
                        { text: "It's good and the idea is unique and effective", name: "Wasif", size: "large" }
                      ].map((item, i) => {
                        const rotations = [-2, 2, -1, 1, -3, 3];
                        const rotation = rotations[i % rotations.length];
                        
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                            style={{ rotate: rotation }}
                            className="flex-shrink-0"
                          >
                            <GlassCard className="p-5 sm:p-6 flex flex-col gap-4 border-white/5 hover:border-brand-lime/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand-lime/10 group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-lime/10 flex items-center justify-center font-black text-brand-lime text-xs border border-brand-lime/20">
                                  {item.name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white">{item.name}</span>
                                  <span className="text-[7px] font-black uppercase tracking-widest text-white/20">Early User</span>
                                </div>
                              </div>
                              
                              <p className={cn(
                                "font-medium italic text-white/80 leading-tight",
                                item.size === "large" ? "text-lg sm:text-xl" : "text-sm sm:text-base"
                              )}>
                                "{item.text}"
                              </p>
                            </GlassCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Final CTA */}
                  <div className="flex flex-col items-center text-center py-32 space-y-12 bg-brand-lime/5 rounded-[4rem] border border-brand-lime/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-lime/5" />
                    <h3 className="text-6xl md:text-9xl font-display font-black uppercase tracking-tighter leading-[0.85] relative z-10">
                      Ready to build a <br/><span className="text-brand-lime">Quran Habit?</span>
                    </h3>
                    <div className="relative z-10">
                      <Button size="lg" className="px-16 py-8 text-3xl shadow-2xl shadow-brand-lime/20" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Get Started Now
                      </Button>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className="pt-24 pb-12 border-t border-white/5 space-y-16">
                    <div className="grid md:grid-cols-4 gap-12">
                      <div className="md:col-span-2 space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-lime rounded-2xl flex items-center justify-center text-brand-deep shadow-lg lime-glow">
                            <Sparkles size={24} strokeWidth={3} />
                          </div>
                          <h2 className="text-3xl font-display font-black uppercase tracking-tighter">Quran Circles</h2>
                        </div>
                        <p className="text-white/40 text-lg font-medium max-w-sm leading-relaxed">
                          A private, small-group space to grow together through the Quran. Built for meaningful connection and reflection habit building.
                        </p>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Platform</h4>
                        <ul className="space-y-4">
                          <li><button onClick={() => setView('how-it-works')} className="text-white/40 hover:text-white font-bold transition-colors">How it Works</button></li>
                          <li><button onClick={() => setView('features')} className="text-white/40 hover:text-white font-bold transition-colors">Features</button></li>
                        </ul>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Support</h4>
                        <ul className="space-y-4">
                          <li><button onClick={() => setView('help-center')} className="text-white/40 hover:text-white font-bold transition-colors">Help Center</button></li>
                          <li><button onClick={() => setView('contact-us')} className="text-white/40 hover:text-white font-bold transition-colors">Contact Us</button></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">© 2026 Quran Circles. All rights reserved.</p>
                      <div className="flex items-center gap-6">
                        <button onClick={() => setShowAboutModal(true)} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors">About</button>
                        <button onClick={() => setShowPrivacyModal(true)} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors">Privacy</button>
                        <button onClick={() => setShowTermsModal(true)} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors">Terms</button>
                      </div>
                    </div>
                  </footer>
                </div>
              </motion.div>
            )}

            {view === 'how-it-works' && (
              <motion.div key="how-it-works" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto py-20 space-y-32">
                <div className="space-y-8 text-center">
                  <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-brand-lime font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
                    <ArrowLeft size={16} /> Back to Home
                  </button>
                  <h2 className="text-7xl md:text-9xl font-display font-black uppercase tracking-tighter leading-none">The <span className="text-brand-lime">Process</span></h2>
                  <p className="text-2xl text-white/40 font-medium max-w-2xl mx-auto">A simple, intentional workflow designed to keep you connected to the Quran every single day.</p>
                </div>

                <div className="relative space-y-12">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-lime/50 via-brand-lime/10 to-transparent hidden md:block" />
                  {[
                    { step: '01', title: 'Create a Circle', desc: 'Start a private group for your family or friends. Choose a reading plan that fits your pace—from a few verses a day to a full Juz. Set a daily deadline to keep everyone accountable.', icon: Users },
                    { step: '02', title: 'Daily Verse', desc: 'Every day, the circle focuses on the same verses. Read the translation, listen to the recitation, and post your personal reflection. The streak only advances when everyone has participated.', icon: BookOpen },
                    { step: '03', title: 'Grow Together', desc: 'Read what your loved ones shared. React to their insights and maintain a collective streak. Visualize your progress over weeks and months as you complete your chosen plan.', icon: Trophy }
                  ].map((s, i) => (
                    <div key={i} className={cn("flex flex-col md:flex-row gap-12 items-center relative z-10", i % 2 === 1 ? "md:flex-row-reverse" : "")}>
                      <div className="flex-1">
                        <GlassCard className="p-12 space-y-6 border-white/5 hover:border-brand-lime/30 transition-all group">
                          <div className="w-16 h-16 rounded-2xl bg-brand-lime/10 flex items-center justify-center text-brand-lime group-hover:scale-110 transition-all">
                            <s.icon size={32} />
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-4xl font-display font-black uppercase tracking-tight">{s.title}</h4>
                            <p className="text-white/40 text-xl font-medium leading-relaxed">{s.desc}</p>
                          </div>
                        </GlassCard>
                      </div>
                      <div className="flex w-20 h-20 rounded-full bg-brand-deep border-4 border-brand-lime items-center justify-center text-2xl font-display font-black text-brand-lime shadow-2xl shadow-brand-lime/30 order-first md:order-none shrink-0 -mb-6 md:mb-0 z-20">
                        {s.step}
                      </div>
                      <div className="flex-1 hidden md:block" />
                    </div>
                  ))}
                </div>

                <div className="bg-brand-lime/5 p-16 rounded-[4rem] border border-brand-lime/10 text-center space-y-8">
                  <h3 className="text-4xl font-display font-black uppercase tracking-tight">Ready to start?</h3>
                  <p className="text-white/40 text-xl font-medium max-w-xl mx-auto">Join thousands of others building a more meaningful relationship with the Quran.</p>
                  <Button size="lg" className="px-12 py-6 text-2xl" onClick={() => setView('landing')}>Create Your Circle</Button>
                </div>
              </motion.div>
            )}

            {view === 'features' && (
              <motion.div key="features" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto py-20 space-y-32">
                <div className="space-y-8 text-center">
                  <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-brand-lime font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
                    <ArrowLeft size={16} /> Back to Home
                  </button>
                  <h2 className="text-7xl md:text-9xl font-display font-black uppercase tracking-tighter leading-none">Platform <span className="text-brand-lime">Features</span></h2>
                  <p className="text-2xl text-white/40 font-medium max-w-3xl mx-auto">Everything you need for a deep, distraction-free experience designed for spiritual growth.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { icon: Mic2, title: 'Audio Recitation', desc: 'Listen to world-class reciters with synchronized verse highlighting. Control playback speed and repeat verses for memorization.' },
                    { icon: BookOpen, title: 'Deep Tafsir', desc: 'Access multiple translations and detailed explanations for every verse. Understand the context and wisdom behind the words.' },
                    { icon: Flame, title: 'Streak System', desc: 'A collective streak that only advances when every member completes their daily reflection. Accountability built into the core.' },
                    { icon: Shield, title: 'Total Privacy', desc: 'No public feeds, no ads, no data tracking. Your reflections stay within your circle. Your spiritual journey is private.' },
                    { icon: Palette, title: 'Customizable UI', desc: 'Adjust font sizes, scripts, and themes to make the reading experience yours. Optimized for both day and night reading.' },
                    { icon: Calendar, title: 'Flexible Plans', desc: 'Choose from predefined plans or create a custom journey through specific Surahs. Set your own pace and goals.' },
                    { icon: MessageSquare, title: 'Circle Chat', desc: 'Discuss verses in real-time with your circle members. Share insights and ask questions in a safe, private environment.' },
                    { icon: BookmarkIcon, title: 'Personal Bookmarks', desc: 'Save verses that resonate with you for quick access later. Build your own library of meaningful Quranic insights.' },
                    { icon: Zap, title: 'Smart Reminders', desc: 'Receive gentle notifications before your circle deadline. Never miss a day and keep the collective streak alive.' }
                  ].map((f, i) => (
                    <GlassCard key={i} className="p-12 space-y-8 border-white/5 group hover:bg-white/[0.02] transition-all">
                      <div className="w-20 h-20 bg-brand-lime/10 rounded-[2rem] flex items-center justify-center text-brand-lime group-hover:scale-110 transition-all shadow-xl border border-brand-lime/10">
                        <f.icon size={36} />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-3xl font-display font-black uppercase tracking-tight leading-tight">{f.title}</h4>
                        <p className="text-white/40 text-lg font-medium leading-relaxed">{f.desc}</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                  <GlassCard className="p-16 space-y-8 border-brand-lime/10 bg-brand-lime/[0.02]">
                    <h3 className="text-4xl font-display font-black uppercase tracking-tight">Built for <span className="text-brand-lime">Focus</span></h3>
                    <p className="text-white/40 text-xl font-medium leading-relaxed">
                      We removed everything that doesn't belong in a sacred space. No likes, no follower counts, no algorithmic feeds. Just you, your circle, and the Quran.
                    </p>
                  </GlassCard>
                  <GlassCard className="p-16 space-y-8 border-white/5">
                    <h3 className="text-4xl font-display font-black uppercase tracking-tight">Always <span className="text-brand-lime">Free</span></h3>
                    <p className="text-white/40 text-xl font-medium leading-relaxed">
                      Our mission is to make Quranic reflection accessible to everyone. The core features of Quran Circles will always be free to use for families and small groups.
                    </p>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {view === 'help-center' && (
              <motion.div key="help-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto py-20 space-y-24">
                <div className="space-y-8 text-center">
                  <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-brand-lime font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
                    <ArrowLeft size={16} /> Back to Home
                  </button>
                  <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter">Help <span className="text-brand-lime">Center</span></h2>
                  <p className="text-xl text-white/40 font-medium">Common questions and guides.</p>
                </div>

                <div className="space-y-6">
                  {[
                    { q: 'How do I invite others?', a: 'Once you create a circle, you will get a unique invite code. Share this code with your friends or family, and they can join via the "Join Circle" button on their dashboard.' },
                    { q: 'What happens if someone misses a day?', a: 'The collective streak will reset to zero. This encourages everyone to support each other and stay consistent.' },
                    { q: 'Can I change my reading plan later?', a: 'Yes, circle admins can update the reading plan, participation mode, and daily deadlines at any time from the circle settings.' },
                    { q: 'Is my data private?', a: 'Absolutely. Reflections are only visible to members of the specific circle they were posted in. We do not share your data with third parties.' }
                  ].map((faq, i) => (
                    <GlassCard key={i} className="p-8 space-y-4 border-white/5">
                      <h4 className="text-xl font-black uppercase tracking-tight text-brand-lime">{faq.q}</h4>
                      <p className="text-white/60 font-medium leading-relaxed">{faq.a}</p>
                    </GlassCard>
                  ))}
                </div>

                <div className="pt-12 border-t border-white/5 space-y-12">
                  <h3 className="text-4xl font-display font-black uppercase tracking-tight text-center">Quick Start <span className="text-brand-lime">Guide</span></h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center font-black">1</div>
                        <h4 className="text-xl font-bold uppercase tracking-tight">Create your Circle</h4>
                      </div>
                      <p className="text-white/40 font-medium leading-relaxed pl-14">Go to your dashboard and click "New Circle". Give it a name and choose a reading plan (e.g., 1 Juz per day or custom Surahs).</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center font-black">2</div>
                        <h4 className="text-xl font-bold uppercase tracking-tight">Invite your Family</h4>
                      </div>
                      <p className="text-white/40 font-medium leading-relaxed pl-14">Copy the invite code from the circle settings and send it to your loved ones. They'll join and appear in your circle instantly.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center font-black">3</div>
                        <h4 className="text-xl font-bold uppercase tracking-tight">Post your Reflection</h4>
                      </div>
                      <p className="text-white/40 font-medium leading-relaxed pl-14">Read the daily verses, listen to the recitation, and share what you've learned. Your reflection keeps the circle's streak alive!</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-lime text-brand-deep flex items-center justify-center font-black">4</div>
                        <h4 className="text-xl font-bold uppercase tracking-tight">Maintain the Streak</h4>
                      </div>
                      <p className="text-white/40 font-medium leading-relaxed pl-14">The streak only advances if EVERYONE in the circle posts their reflection before the daily deadline. Support each other!</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'contact-us' && (
              <motion.div key="contact-us" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto py-20 space-y-24">
                <div className="space-y-8 text-center">
                  <button onClick={() => setView('landing')} className="inline-flex items-center gap-2 text-brand-lime font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
                    <ArrowLeft size={16} /> Back to Home
                  </button>
                  <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter">Contact <span className="text-brand-lime">Us</span></h2>
                  <p className="text-xl text-white/40 font-medium">We'd love to hear from you.</p>
                </div>

                <GlassCard className="p-12 space-y-12 border-white/5">
                  <div className="space-y-8">
                    <h4 className="text-2xl font-display font-black uppercase tracking-tight text-center">Send us a message</h4>
                    <form onSubmit={handleContactSubmit} className="grid gap-6">
                      <Input 
                        label="Your Name" 
                        placeholder="John Doe" 
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                      <Input 
                        label="Email Address" 
                        placeholder="john@example.com" 
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-6">Message</label>
                        <textarea 
                          className="w-full px-8 py-6 bg-brand-deep/50 border border-white/10 rounded-[2rem] focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/10 outline-none transition-all placeholder:text-white/20 font-medium text-white min-h-[150px] resize-none" 
                          placeholder="How can we help?" 
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        />
                      </div>
                      <Button className="w-full py-6 text-xl" disabled={isSubmittingContact}>
                        {isSubmittingContact ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {view === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 md:space-y-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <p className="text-[11px] font-black text-emerald-800 dark:text-brand-lime uppercase tracking-[0.4em]">Overview</p>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-emerald-950 dark:text-white">Your Circles</h2>
                    <p className="text-stone-600 dark:text-white/40 text-sm font-medium italic">"Building a shared Quran habit, one verse at a time."</p>
                  </div>
                  <div className="flex gap-4 md:gap-6">
                    <Button variant="outline" size="lg" className="flex-1 md:flex-none" onClick={() => setView('join-circle')} icon={UserPlus}>Join</Button>
                    <Button size="lg" className="flex-1 md:flex-none" onClick={() => setView('create-circle')} icon={Plus}>New Circle</Button>
                  </div>
                </div>

                {circles.length === 0 ? (
                  <Card className="text-center py-32 space-y-10 bg-white/5 border-dashed border-white/10">
                    <div className="w-28 h-28 bg-brand-forest rounded-[2rem] flex items-center justify-center mx-auto border border-white/10">
                      <Users size={48} className="text-white/20" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-3xl font-display font-black uppercase tracking-tight">No Circles Yet</p>
                      <p className="text-white/40 text-lg font-medium">Start your journey by creating or joining a circle.</p>
                    </div>
                    <Button variant="primary" size="lg" onClick={() => setView('create-circle')}>Create your first circle</Button>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {circles.map((circle, idx) => {
                      const circleReflections = reflections.filter(r => r.circleId === circle.id);
                      const today = format(new Date(), 'yyyy-MM-dd');
                      const progress = getDayProgress(circle.participants, circleReflections, today);
                      
                      return (
                        <Card 
                          key={circle.id} 
                          onClick={() => { setActiveCircle(circle); setView('circle'); }} 
                          className="group relative overflow-hidden p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[350px] sm:min-h-[400px] hover:border-brand-lime/40 transition-all duration-500"
                        >
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-lime/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150 -z-10 blur-3xl" />
                          
                          <div className="space-y-6 sm:space-y-8">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] sm:text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">0{idx + 1}</span>
                              <Badge variant={circle.streak.current > 0 ? 'default' : 'orange'} className="text-[9px] sm:text-[10px]">
                                {circle.streak.current} Day Streak
                              </Badge>
                            </div>
                            
                            <div className="space-y-3 sm:space-y-4">
                              <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight group-hover:text-brand-lime transition-colors duration-300 leading-tight truncate">{circle.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/5"><Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5}/> {circle.participants.length}</span>
                                <span className="flex flex-1 min-w-0 items-center gap-1.5 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/5">
                                  <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2.5}/> 
                                  <span className="truncate">
                                    {circle.planName || QURAN_PLANS.find(p => p.id === circle.planId)?.name || 'Custom Plan'}
                                    {circle.versesPerDay ? ` (${circle.versesPerDay} v/day)` : ''}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Integrated Progress Section */}
                            <div className="space-y-4 pt-4">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className={progress.isComplete ? "text-brand-lime" : "text-white/40"}>
                                  {progress.completed.length} / {circle.participants.length} Today
                                </span>
                                <span className="text-white/20">{Math.round(progress.percentage)}%</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress.percentage}%` }}
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    progress.isComplete ? "bg-brand-lime shadow-[0_0_15px_rgba(163,230,53,0.5)]" : "bg-white/20"
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-8 flex items-center justify-between border-t border-white/5 mt-8">
                            <div className="flex -space-x-3">
                              {circle.participants.map((p, i) => {
                                const isDone = progress.completed.some(cp => cp.id === p.id);
                                return (
                                  <div 
                                    key={p.id} 
                                    className={cn(
                                      "w-10 h-10 rounded-xl border-2 flex items-center justify-center text-[11px] font-black uppercase transition-all duration-300",
                                      isDone ? "border-brand-lime z-10 scale-110 shadow-lg" : "border-brand-deep bg-brand-forest text-white/20"
                                    )}
                                    style={{ 
                                      backgroundColor: isDone ? p.color || '#A3E635' : undefined,
                                      color: isDone ? '#000' : undefined
                                    }}
                                  >
                                    {p.avatar || p.name[0]}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center group-hover:bg-brand-lime group-hover:text-brand-deep transition-all duration-300">
                              <ChevronRight size={24} strokeWidth={2.5} />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {view === 'create-circle' && (
              <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto w-full space-y-12">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                      if (createStep > 1) setCreateStep(createStep - 1);
                      else setView('dashboard');
                    }} 
                    className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
                  >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                  </button>
                  <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Create Circle</h2>
                    <p className="text-[10px] text-brand-lime font-black uppercase tracking-[0.3em]">Step {createStep} of 4</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(createStep / 4) * 100}%` }}
                    className="h-full bg-brand-lime lime-glow"
                  />
                </div>

                <div className="space-y-12">
                  {createStep === 1 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-display font-black uppercase tracking-tight">Basic Information</h3>
                        <p className="text-white/40 font-medium">Give your circle a name and choose a reflection plan.</p>
                      </div>
                      
                      <div className="space-y-8">
                        <Input 
                          label="Circle Name" 
                          value={circleForm.name}
                          onChange={(e: any) => setCircleForm({...circleForm, name: e.target.value})}
                          placeholder="e.g. Family Reflection, Hifz Buddies"
                          required
                        />
                        
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-6">Select Reflection Plan</label>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => setCircleForm({...circleForm, planId: 'custom'})}
                              className={cn(
                                "text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden group",
                                circleForm.planId === 'custom' 
                                  ? "bg-brand-lime text-brand-deep lime-glow border-brand-lime" 
                                  : "bg-white/5 border-white/10 hover:border-white/20"
                              )}
                            >
                              <p className={cn("font-display font-black text-xl uppercase tracking-tight", circleForm.planId === 'custom' ? "text-brand-deep" : "text-white")}>Custom Plan</p>
                              <p className={cn("text-xs mt-2 font-medium leading-relaxed", circleForm.planId === 'custom' ? "text-brand-deep/60" : "text-white/40")}>Select specific Surahs or Juzs for your circle.</p>
                            </button>

                            {QURAN_PLANS.map(plan => (
                              <button
                                key={plan.id}
                                onClick={() => setCircleForm({...circleForm, planId: plan.id})}
                                className={cn(
                                  "text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden group",
                                  circleForm.planId === plan.id 
                                    ? "bg-brand-lime text-brand-deep lime-glow border-brand-lime" 
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                                )}
                              >
                                <p className={cn("font-display font-black text-xl uppercase tracking-tight", circleForm.planId === plan.id ? "text-brand-deep" : "text-white")}>{plan.name}</p>
                                <p className={cn("text-xs mt-2 font-medium leading-relaxed", circleForm.planId === plan.id ? "text-brand-deep/60" : "text-white/40")}>{plan.description}</p>
                                <div className="mt-4 flex items-center gap-2">
                                  <span className={cn("px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest", circleForm.planId === plan.id ? "bg-brand-deep text-white" : "bg-white/10 text-white/60")}>{plan.verses.length} Verses</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {circleForm.planId === 'custom' && (
                          <div className="space-y-8 p-8 bg-white/5 rounded-[2rem] border border-white/10">
                            <div className="space-y-4">
                              <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-6">Plan Type</label>
                              <div className="grid grid-cols-2 gap-3">
                                {['juz', 'surah'].map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setCircleForm({...circleForm, planType: type as any})}
                                    className={cn(
                                      "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                      circleForm.planType === type 
                                        ? "bg-brand-lime text-brand-deep border-brand-lime" 
                                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                                    )}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {circleForm.planType === 'juz' && (
                              <div className="space-y-4">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-6">Select Juzs</label>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                  {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                                    <button
                                      key={j}
                                      type="button"
                                      onClick={() => {
                                        const current = circleForm.selectedJuz;
                                        const next = current.includes(j)
                                          ? current.filter(id => id !== j)
                                          : [...current, j];
                                        if (next.length === 0) return;
                                        setCircleForm({...circleForm, selectedJuz: next});
                                      }}
                                      className={cn(
                                        "aspect-square rounded-xl flex items-center justify-center text-xs font-black border transition-all",
                                        circleForm.selectedJuz.includes(j)
                                          ? "bg-brand-lime text-brand-deep border-brand-lime" 
                                          : "bg-white/5 border-white/10 text-white/40"
                                      )}
                                    >
                                      {j}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {circleForm.planType === 'surah' && (
                              <div className="space-y-4">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-6">Select Surahs</label>
                                {chapters.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-white/20">
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Loading Surahs...</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                    {chapters.map(c => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                          const current = circleForm.selectedSurah;
                                          const next = current.includes(c.id)
                                            ? current.filter(id => id !== c.id)
                                            : [...current, c.id];
                                          if (next.length === 0) return;
                                          setCircleForm({...circleForm, selectedSurah: next});
                                        }}
                                        className={cn(
                                          "p-3 rounded-xl text-left border transition-all",
                                          circleForm.selectedSurah.includes(c.id)
                                            ? "bg-brand-lime text-brand-deep border-brand-lime" 
                                            : "bg-white/5 border-white/10 text-white/40"
                                        )}
                                      >
                                        <p className="text-[10px] font-black opacity-50">{c.id}</p>
                                        <p className="text-xs font-bold truncate">{c.name_simple}</p>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Button 
                        size="lg"
                        className="w-full py-5 text-xl" 
                        disabled={!circleForm.name.trim()}
                        onClick={() => setCreateStep(2)}
                      >
                        Next Step
                      </Button>
                    </motion.div>
                  )}

                  {createStep === 2 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-2xl font-display font-black uppercase tracking-tight">Reflection Frequency</h3>
                          <p className="text-white/40 font-medium">How often should your circle receive a new verse?</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                          <button
                            onClick={() => setCircleForm({...circleForm, frequency: 'daily'})}
                            className={cn(
                              "text-left p-8 rounded-[2rem] border transition-all space-y-4",
                              circleForm.frequency === 'daily' 
                                ? "bg-brand-lime text-brand-deep lime-glow border-brand-lime" 
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", circleForm.frequency === 'daily' ? "bg-brand-deep text-brand-lime" : "bg-white/5 text-white/40")}>
                              <Calendar size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                              <p className="font-display font-black text-2xl uppercase tracking-tight">Daily</p>
                              <p className={cn("text-sm font-medium leading-relaxed", circleForm.frequency === 'daily' ? "text-brand-deep/60" : "text-white/40")}>A new verse every single day. Best for deep, consistent growth.</p>
                            </div>
                          </button>

                          <button
                            onClick={() => setCircleForm({...circleForm, frequency: 'weekly'})}
                            className={cn(
                              "text-left p-8 rounded-[2rem] border transition-all space-y-4",
                              circleForm.frequency === 'weekly' 
                                ? "bg-brand-lime text-brand-deep lime-glow border-brand-lime" 
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", circleForm.frequency === 'weekly' ? "bg-brand-deep text-brand-lime" : "bg-white/5 text-white/40")}>
                              <Clock size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                              <p className="font-display font-black text-2xl uppercase tracking-tight">Weekly</p>
                              <p className={cn("text-sm font-medium leading-relaxed", circleForm.frequency === 'weekly' ? "text-brand-deep/60" : "text-white/40")}>One verse per week. Perfect for busy groups or deep study circles.</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-2xl font-display font-black uppercase tracking-tight">Verses per Reflection</h3>
                          <p className="text-white/40 font-medium">How many verses should be assigned at once? (1-10)</p>
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                          {Array.from({length: 10}, (_, i) => i + 1).map(num => (
                            <button
                              key={num}
                              onClick={() => setCircleForm({...circleForm, versesPerDay: num})}
                              className={cn(
                                "aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all border",
                                circleForm.versesPerDay === num 
                                  ? "bg-brand-lime text-brand-deep border-brand-lime lime-glow scale-110" 
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                              )}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest text-center">
                          Recommended: 1-3 {circleForm.versesPerDay > 1 ? 'verses' : 'verse'} for deep reflection
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" size="lg" className="flex-1 py-5" onClick={() => setCreateStep(1)}>Back</Button>
                        <Button size="lg" className="flex-[2] py-5 text-xl" onClick={() => setCreateStep(3)}>Next Step</Button>
                      </div>
                    </motion.div>
                  )}

                  {createStep === 3 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-display font-black uppercase tracking-tight">Participation Mode</h3>
                          <span className="px-3 py-1 bg-brand-lime/10 text-brand-lime text-[9px] font-black rounded-full uppercase tracking-widest border border-brand-lime/20">Required</span>
                        </div>
                        <p className="text-white/40 font-medium">How will your circle participate? This is our core innovation.</p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6">
                        <button
                          onClick={() => setCircleForm({...circleForm, participationMode: 'individual'})}
                          className={cn(
                            "text-left p-6 rounded-[2rem] border transition-all space-y-4 flex flex-col justify-between",
                            circleForm.participationMode === 'individual' 
                              ? "bg-brand-lime text-brand-deep lime-glow border-brand-lime" 
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <div className="space-y-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", circleForm.participationMode === 'individual' ? "bg-brand-deep text-brand-lime" : "bg-white/5 text-white/40")}>
                              <Users size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                              <p className="font-display font-black text-xl uppercase tracking-tight">Individual</p>
                              <p className={cn("text-[11px] font-medium leading-relaxed", circleForm.participationMode === 'individual' ? "text-brand-deep/60" : "text-white/40")}>Everyone separate. Best for friends or remote groups.</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setCircleForm({...circleForm, participationMode: 'shared'})}
                          className={cn(
                            "text-left p-6 rounded-[2rem] border transition-all space-y-4 flex flex-col justify-between",
                            circleForm.participationMode === 'shared' 
                              ? "bg-brand-accent text-white border-brand-accent shadow-xl shadow-brand-accent/20" 
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <div className="space-y-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", circleForm.participationMode === 'shared' ? "bg-white text-brand-accent" : "bg-white/5 text-white/40")}>
                              <UserIcon size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                              <p className="font-display font-black text-xl uppercase tracking-tight">Family</p>
                              <p className={cn("text-[11px] font-medium leading-relaxed", circleForm.participationMode === 'shared' ? "text-white/60" : "text-white/40")}>One device. Perfect for households sharing a tablet.</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setCircleForm({...circleForm, participationMode: 'hybrid'})}
                          className={cn(
                            "text-left p-6 rounded-[2rem] border transition-all space-y-4 flex flex-col justify-between",
                            circleForm.participationMode === 'hybrid' 
                              ? "bg-brand-forest text-brand-lime border-brand-lime/30" 
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <div className="space-y-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", circleForm.participationMode === 'hybrid' ? "bg-brand-lime text-brand-deep" : "bg-white/5 text-white/40")}>
                              <RefreshCw size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                              <p className="font-display font-black text-xl uppercase tracking-tight">Hybrid</p>
                              <p className={cn("text-[11px] font-medium leading-relaxed", circleForm.participationMode === 'hybrid' ? "text-brand-lime/60" : "text-white/40")}>Mixed access. Some share, some use their own devices.</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" size="lg" className="flex-1 py-5" onClick={() => setCreateStep(2)}>Back</Button>
                        <Button size="lg" className="flex-[2] py-5 text-xl" onClick={handleCreateCircle}>Create Circle</Button>
                      </div>
                    </motion.div>
                  )}

                  {createStep === 4 && createdCircleId && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-brand-lime text-brand-deep rounded-[2rem] flex items-center justify-center mx-auto lime-glow mb-8">
                          <Check size={48} strokeWidth={3} />
                        </div>
                        <h3 className="text-4xl font-display font-black uppercase tracking-tighter">Circle Created!</h3>
                        <p className="text-white/40 font-medium max-w-sm mx-auto">Your shared Quran habit starts now. Let's add your members.</p>
                      </div>

                      <div className="grid gap-8">
                        {/* Current Participants Section */}
                        <Card className="p-8 space-y-6 bg-white/5 border-white/10">
                          <div className="space-y-2">
                            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Current Members</p>
                            <p className="text-sm text-white/60">Manage who's in this circle. You can edit your own profile too.</p>
                          </div>
                          
                          <div className="space-y-4">
                            {circles.find(c => c.id === createdCircleId)?.participants.map((p, idx) => (
                              <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                  <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg"
                                    style={{ backgroundColor: p.color }}
                                  >
                                    {p.avatar}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white">{p.name} {p.id === user?.uid && <span className="text-[10px] text-brand-lime uppercase ml-2">(Admin)</span>}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{p.type === 'auth' ? 'Real User' : 'Local Member'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setActiveParticipantId(p.id);
                                      setActiveCircle(circles.find(c => c.id === createdCircleId) || null);
                                      setShowProfileModal(true);
                                    }}
                                    className="p-2 text-white/40 hover:text-brand-lime transition-colors"
                                    title="Edit Profile"
                                  >
                                    <Settings size={18} />
                                  </button>
                                  {p.id !== user?.uid && (
                                    <button 
                                      onClick={() => removeParticipant(p.id)}
                                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                      title="Remove Member"
                                    >
                                      <Plus className="rotate-45" size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>

                        {/* Invite Code Section */}
                        {(circleForm.participationMode === 'individual' || circleForm.participationMode === 'hybrid') && (
                          <Card className="p-8 space-y-6 bg-brand-forest/30 border-brand-lime/20">
                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-brand-lime uppercase tracking-[0.2em]">Invite Others</p>
                              <p className="text-sm text-white/60">Share this code with friends or family who have their own devices.</p>
                            </div>
                            <div className="flex items-center gap-4 p-6 bg-brand-deep rounded-2xl border border-white/10">
                              <span className="text-4xl font-display font-black tracking-[0.4em] text-brand-lime flex-1 text-center">
                                {circles.find(c => c.id === createdCircleId)?.inviteCode}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const code = circles.find(c => c.id === createdCircleId)?.inviteCode;
                                  if (code) navigator.clipboard.writeText(code);
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          </Card>
                        )}

                        {/* Local Members Section */}
                        {(circleForm.participationMode === 'shared' || circleForm.participationMode === 'hybrid') && (
                          <Card className="p-8 space-y-8 bg-white/5 border-white/10">
                            <div className="space-y-2">
                              <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Add Local Members</p>
                              <p className="text-sm text-white/60">Perfect for family members sharing this device (kids, elders, etc.)</p>
                            </div>

                            <div className="flex gap-4">
                              <Input 
                                value={newLocalMemberName}
                                onChange={(e: any) => setNewLocalMemberName(e.target.value)}
                                placeholder="Member Name (e.g. Aisha, Dad)"
                                className="flex-1"
                              />
                              <Button 
                                onClick={async () => {
                                  if (!newLocalMemberName.trim()) return;
                                  const circle = circles.find(c => c.id === createdCircleId);
                                  if (!circle || !user) return;
                                  
                                  const newParticipant: Participant = {
                                    id: Math.random().toString(36).substring(2, 9),
                                    name: newLocalMemberName.trim(),
                                    type: 'lightweight',
                                    parentUid: user.uid,
                                    avatar: newLocalMemberAvatar,
                                    color: newLocalMemberColor
                                  };

                                  try {
                                    await quranFoundation.user.updateRoom(circle.id, {
                                      participants: [...circle.participants, newParticipant]
                                    });
                                    setNewLocalMemberName('');
                                  } catch (err) {
                                    console.error("Error adding local member:", err);
                                  }
                                }}
                                disabled={!newLocalMemberName.trim()}
                              >
                                Add
                              </Button>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-3">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Choose Avatar</p>
                                <div className="flex flex-wrap gap-2">
                                  {['🌙', '⭐', '📖', '🕌', '🤲', '✨', '🌿', '🕊️'].map(avatar => (
                                    <button
                                      key={avatar}
                                      onClick={() => setNewLocalMemberAvatar(avatar)}
                                      className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border-2",
                                        newLocalMemberAvatar === avatar ? "bg-brand-lime border-brand-lime shadow-lg" : "bg-white/5 border-white/5 hover:border-white/20"
                                      )}
                                    >
                                      {avatar}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Choose Color</p>
                                <div className="flex flex-wrap gap-2">
                                  {['#A3E635', '#F27D26', '#4ECDC4', '#FF6B6B', '#45B7D1'].map(color => (
                                    <button
                                      key={color}
                                      onClick={() => setNewLocalMemberColor(color)}
                                      className={cn(
                                        "w-8 h-8 rounded-full transition-all border-2",
                                        newLocalMemberColor === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                                      )}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {circles.find(c => c.id === createdCircleId)?.participants
                                .map(p => (
                                  <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black uppercase" style={{ backgroundColor: p.color || '#333' }}>
                                        {p.avatar || p.name[0]}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold">{p.label || p.name}</span>
                                        <span className="text-[8px] text-white/40 uppercase tracking-widest">{p.type === 'auth' ? 'You (Admin)' : 'Local Member'}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {p.id === user?.uid ? (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-8 text-[9px]"
                                          onClick={() => {
                                            setActiveCircle(circles.find(c => c.id === createdCircleId) || null);
                                            setActiveParticipantId(p.id);
                                            setShowProfileModal(true);
                                          }}
                                        >
                                          Edit Profile
                                        </Button>
                                      ) : (
                                        <Badge variant="outline">Member</Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </Card>
                        )}
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <Button 
                          size="lg" 
                          className="w-full py-6 text-xl" 
                          onClick={() => {
                            const circle = circles.find(c => c.id === createdCircleId);
                            if (circle) {
                              setActiveCircle(circle);
                              setView('circle');
                            } else {
                              setView('dashboard');
                            }
                            setCreateStep(1);
                            setCreatedCircleId(null);
                          }}
                        >
                          Finish & Start Reflecting
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'join-circle' && (
              <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mx-auto w-full space-y-12">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setView('dashboard')} 
                    className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
                  >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Join Circle</h2>
                </div>
                {!user ? (
                  <Card className="p-8 space-y-6 bg-white/5 border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Lock className="text-brand-lime" size={32} />
                    </div>
                    <AuthCard 
                      title="Account Required"
                      subtitle="Sign in with Google or Email to join your circle and record reflections."
                      onSeedDemo={seedDemoData}
                      compact={true}
                    />
                    <div className="pt-2 text-center">
                      <Button variant="ghost" onClick={() => setView('landing')} className="text-xs text-white/50 hover:text-white">
                        Back to Home
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <form className="space-y-10" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleJoinCircle(fd.get('code') as string);
                  }}>
                    <Input name="code" label="Invite Code" required className="text-center text-4xl font-black uppercase tracking-[0.3em] py-8" placeholder="ABCDEF" />
                    <Button className="w-full py-6 text-xl">Join Circle</Button>
                  </form>
                )}
              </motion.div>
            )}

            {view === 'circle' && activeCircle && (
              <motion.div key="circle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CircleHome 
                  circle={activeCircle}
                  currentVerses={currentVerses}
                  reflections={reflections.filter(r => r.circleId === activeCircle.id)}
                  bookmarks={bookmarks}
                  isPlaying={isPlaying}
                  onToggleAudio={toggleAudio}
                  onToggleBookmark={toggleBookmark}
                  onBack={() => setView('dashboard')}
                  onSettings={() => setView('circle-settings')}
                  onReact={handleReact}
                  activeParticipantId={activeParticipantId}
                  setActiveParticipantId={setActiveParticipantId}
                  newReflection={newReflection}
                  setNewReflection={setNewReflection}
                  submitReflection={submitReflection}
                  isLoadingAudio={isLoadingAudio}
                  audioProgress={audioProgress}
                  audioDuration={audioDuration}
                  onSeek={handleSeek}
                  arabicFontSize={arabicFontSize}
                  setArabicFontSize={setArabicFontSize}
                  translationId={translationId}
                  setTranslationId={setTranslationId}
                  reciterId={reciterId}
                  setReciterId={setReciterId}
                  arabicScript={arabicScript}
                  setArabicScript={setArabicScript}
                  translations={translations}
                  reciters={reciters}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onUpdateParticipant={handleUpdateParticipant}
                  onAddLocalParticipant={handleAddLocalParticipant}
                  onShowProfile={() => setShowProfileModal(true)}
                  translationFontSize={translationFontSize}
                  setTranslationFontSize={setTranslationFontSize}
                  tafsirId={tafsirId}
                  setTafsirId={setTafsirId}
                  tafsirs={tafsirs}
                  chapters={chapters}
                  user={user}
                  currentAudioVerseIndex={currentAudioVerseIndex}
                  onPlayVerse={(index) => {
                    setIsAudioDockVisible(true);
                    if (currentAudioVerseIndex === index) {
                      toggleAudio();
                    } else {
                      audio.playbackRate = playbackRate;
                      const p = audio.play();
                      if (p !== undefined) p.catch(() => {});
                      
                      setCurrentAudioVerseIndex(index);
                      setIsPlaying(true);
                    }
                  }}
                />
              </motion.div>
            )}

            {view === 'circle-settings' && activeCircle && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 max-w-3xl mx-auto pb-32">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setView('circle')} 
                    className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
                  >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight text-white">Circle Settings</h2>
                </div>

                <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em] ml-2">General</h3>
                  <Card className="space-y-8 p-6 md:p-10 bg-brand-forest/20 border-white/10 backdrop-blur-xl bento-card">
                    <Input 
                      label="Circle Name" 
                      defaultValue={activeCircle.name} 
                      onBlur={(e: any) => updateCircleSettings({ name: e.target.value })}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Participation Mode</label>
                        <select 
                          className="w-full p-5 bg-brand-deep/50 border border-white/10 rounded-2xl text-base text-white focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all appearance-none"
                          defaultValue={activeCircle.participationMode}
                          onChange={(e) => updateCircleSettings({ participationMode: e.target.value as any })}
                        >
                          <option value="shared">Shared Device</option>
                          <option value="individual">Individual</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Deadline Type (Daily)</label>
                        <select 
                          className="w-full p-5 bg-brand-deep/50 border border-white/10 rounded-2xl text-base text-white focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all appearance-none"
                          defaultValue={activeCircle.deadlineConfig?.type || 'local'}
                          onChange={(e) => updateCircleSettings({ 
                            deadlineConfig: { 
                              ...(activeCircle.deadlineConfig || { time: '23:59', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }), 
                              type: e.target.value as any 
                            } 
                          })}
                        >
                          <option value="local">Local Time</option>
                          <option value="shared">Shared Timezone</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Deadline Time</label>
                        <input 
                          type="time" 
                          defaultValue={activeCircle.deadlineConfig?.time || '23:59'}
                          className="w-full p-5 bg-brand-deep/50 border border-white/10 rounded-2xl text-base text-white focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all"
                          onBlur={(e) => updateCircleSettings({ 
                            deadlineConfig: { 
                              ...(activeCircle.deadlineConfig || { type: 'local', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }), 
                              time: e.target.value 
                            } 
                          })}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Circle Timezone</label>
                        <select 
                          className="w-full p-5 bg-brand-deep/50 border border-white/10 rounded-2xl text-base text-white focus:ring-2 focus:ring-brand-lime/20 outline-none transition-all appearance-none"
                          defaultValue={activeCircle.deadlineConfig?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                          onChange={(e) => updateCircleSettings({ 
                            deadlineConfig: { 
                              ...(activeCircle.deadlineConfig || { type: 'local', time: '23:59' }), 
                              timezone: e.target.value 
                            } 
                          })}
                        >
                          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>My Timezone</option>
                          <option value="UTC">UTC</option>
                          <option value="Europe/London">London</option>
                          <option value="America/New_York">New York</option>
                          <option value="Asia/Dubai">Dubai</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em]">Participants</h3>
                  </div>
                  <div className="space-y-4">
                    {activeCircle.participants.map(p => (
                      <Card key={p.id} className="flex items-center justify-between py-4 px-6 md:py-5 md:px-8 bg-white/5 border-white/10 bento-card">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={cn("w-2 h-2 md:w-2.5 md:h-2.5 rounded-full", p.type === 'auth' ? "bg-blue-400" : "bg-brand-lime lime-glow")} />
                          <span className="font-black text-white uppercase tracking-widest text-sm md:text-base">{p.name}</span>
                          <Badge variant={p.type === 'auth' ? 'blue' : 'lime'}>{p.type}</Badge>
                        </div>
                        {p.id !== user?.uid && activeCircle.adminUid === user?.uid && (
                          <button onClick={() => removeParticipant(p.id)} className="text-white/20 hover:text-rose-400 p-2 transition-colors">
                            <LogOut size={20} strokeWidth={2.5} />
                          </button>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em] ml-2">Invite Others</h3>
                  <Card className="bg-brand-lime text-brand-deep text-center py-8 md:py-10 space-y-4 rounded-[2.5rem] lime-glow">
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] opacity-60">Your Invite Code</p>
                    <p className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase">{activeCircle.inviteCode}</p>
                    <p className="text-xs md:text-sm font-bold opacity-40 uppercase tracking-widest">Share this code with friends or family</p>
                  </Card>
                </section>

                <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.4em] ml-2">Danger Zone</h3>
                  <Card className="p-6 md:p-10 bg-rose-500/5 border-rose-500/20 space-y-8 rounded-[2.5rem]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <h4 className="text-xl font-display font-black uppercase tracking-tight text-rose-400">Leave Circle</h4>
                        <p className="text-sm text-white/40 font-medium">You will no longer be able to see reflections or contribute to this circle.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white"
                        onClick={leaveCircle}
                        disabled={activeCircle.adminUid === user?.uid}
                      >
                        Leave Circle
                      </Button>
                    </div>
                    
                    {activeCircle.adminUid === user?.uid && (
                      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <h4 className="text-xl font-display font-black uppercase tracking-tight text-rose-400">Delete Circle</h4>
                          <p className="text-sm text-white/40 font-medium">Permanently delete this circle and all its data. This action cannot be undone.</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="bg-rose-500 text-white hover:bg-rose-600"
                          onClick={deleteCircle}
                        >
                          Delete Circle
                        </Button>
                      </div>
                    )}
                  </Card>
                </section>
              </motion.div>
            )}

            {view === 'bookmarks' && (
              <motion.div key="bookmarks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 max-w-3xl mx-auto pb-32">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setView('dashboard')} 
                    className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
                  >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight text-white">Your Bookmarks</h2>
                </div>
                {bookmarks.length === 0 ? (
                  <div className="text-center py-24 text-white/20 text-[11px] font-black uppercase tracking-[0.4em] bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 backdrop-blur-xl">
                    No bookmarks yet.
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {bookmarks.map(b => (
                      <Card 
                        key={b.id} 
                        onClick={async () => {
                          // Try to find a circle that uses this ayah or just show it
                          const verse = await quranFoundation.content.getVerse(b.ayahKey, translationId, arabicScript);
                          setCurrentVerses([verse]);
                          // If we have an active circle, we might want to stay in it but show this ayah
                          // For now, let's just show the ayah in the circle view if one is active, 
                          // or maybe we need a dedicated 'ayah-detail' view.
                          // Let's assume we can just switch to 'circle' view if activeCircle exists
                          if (activeCircle) {
                            setView('circle');
                          } else if (circles.length > 0) {
                            setActiveCircle(circles[0]);
                            setView('circle');
                          } else {
                            toast.error("Join a circle to view reflections for this ayah.");
                          }
                        }}
                        className="flex justify-between items-center p-8 bg-white/5 border-white/10 bento-card cursor-pointer group hover:border-brand-lime/30 transition-all"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-brand-lime/10 text-brand-lime rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookmarkIcon size={24} fill="currentColor" />
                          </div>
                          <div className="space-y-1">
                            <span className="font-black text-white uppercase tracking-widest text-xl group-hover:text-brand-lime transition-colors">Ayah {b.ayahKey}</span>
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Saved from Reflection Circle</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-white/30 font-black uppercase tracking-[0.3em]">{format(parseISO(b.createdAt), 'MMM d, yyyy')}</span>
                          <ChevronRight size={20} className="text-white/20 group-hover:text-brand-lime group-hover:translate-x-1 transition-all" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <StatsDashboard user={user} reflections={reflections} circles={circles} />
              </motion.div>
            )}

            {view === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto w-full space-y-12 pb-32">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setView('dashboard')} 
                    className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-lime hover:text-brand-deep transition-all duration-300"
                  >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                  </button>
                  <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Your Profile</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="md:col-span-1 p-8 flex flex-col items-center text-center space-y-6 bg-brand-forest/20 border-white/10">
                    <div className="w-32 h-32 bg-brand-forest rounded-[2.5rem] border-4 border-brand-lime/20 flex items-center justify-center overflow-hidden lime-glow">
                      {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <UserIcon size={64} className="text-brand-lime" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-display font-black uppercase tracking-tight">{user.displayName || 'Spiritual Traveler'}</h3>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{user.email}</p>
                    </div>
                    <div className="pt-4 w-full">
                      <Button variant="outline" className="w-full" onClick={logout} icon={LogOut}>Sign Out</Button>
                    </div>
                  </Card>

                  <div className="md:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="p-8 bg-white/5 border-white/10 space-y-4">
                        <div className="w-12 h-12 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime">
                          <Users size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black uppercase tracking-tight">{circles.length}</p>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Circles</p>
                        </div>
                      </Card>
                      <Card className="p-8 bg-white/5 border-white/10 space-y-4">
                        <div className="w-12 h-12 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime">
                          <Award size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black uppercase tracking-tight">{reflections.length}</p>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Reflections</p>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-10 bg-brand-forest/20 border-white/10 space-y-8">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-brand-lime uppercase tracking-[0.4em]">Account Details</h4>
                        <Shield size={18} className="text-brand-lime" />
                      </div>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                          <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Member Since</span>
                          <span className="font-black uppercase tracking-widest text-sm">{format(new Date(user.metadata.creationTime || Date.now()), 'MMMM yyyy')}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                          <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Auth Provider</span>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-brand-lime" />
                            <span className="font-black uppercase tracking-widest text-sm">{user.providerData[0]?.providerId || 'Email'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-4">
                          <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Account Status</span>
                          <Badge variant="default">Verified</Badge>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfileModal && activeParticipantId && activeCircle && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowProfileModal(false)}
                className="absolute inset-0 bg-brand-deep/95 backdrop-blur-2xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] bg-white dark:bg-brand-forest border border-black/10 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden text-paper-ink dark:text-white"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-brand-lime/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />
                
                {/* Header - Fixed */}
                <div className="p-4 sm:p-6 md:p-10 border-b border-black/10 dark:border-white/5 flex items-center justify-between relative z-10 bg-white/80 dark:bg-brand-forest/50 backdrop-blur-md">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-800 dark:text-brand-lime uppercase tracking-[0.4em]">Personalize</p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-black uppercase tracking-tighter text-paper-ink dark:text-white">Your Profile</h3>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl md:rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 text-paper-accent dark:text-white/40 hover:text-paper-ink dark:hover:text-white transition-all"
                  >
                    <ArrowLeft size={20} strokeWidth={2.5} className="rotate-90" />
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 custom-scrollbar relative z-10">
                  {(() => {
                    const p = activeCircle.participants.find(part => part.id === activeParticipantId);
                    if (!p) return null;
                    return (
                      <div className="space-y-8 sm:space-y-12">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center sm:items-start text-center sm:text-left">
                          <div 
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-3xl sm:text-4xl md:text-6xl shadow-2xl border-4 border-black/10 dark:border-white/10 shrink-0 text-paper-ink dark:text-white"
                            style={{ backgroundColor: p.color || '#A3E635' }}
                          >
                            {p.avatar || p.name[0]}
                          </div>
                          <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                            <p className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-widest leading-tight text-paper-ink dark:text-white">{p.label || p.name}</p>
                            <Badge variant="outline" className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-paper-accent dark:text-white/80">{p.type === 'auth' ? 'Member' : 'Local Member'}</Badge>
                            <p className="text-[10px] text-paper-accent dark:text-white/40 font-black uppercase tracking-widest">Joined {format(new Date(activeCircle.startDate), 'MMM yyyy')}</p>
                          </div>
                        </div>

                        <div className="grid gap-8 sm:gap-10">
                          <div className="space-y-3 sm:space-y-4">
                            <p className="text-[11px] font-black text-paper-accent dark:text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                              <UserCircle size={14} /> Nickname / Label
                            </p>
                            <input 
                              type="text"
                              value={p.name || ''}
                              onChange={(e) => handleUpdateParticipant(p.id, { 
                                name: e.target.value,
                                label: e.target.value 
                              })}
                              placeholder="e.g. Dad, Sister, Study Buddy"
                              className="w-full p-3 sm:p-4 bg-paper-bg/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl outline-none font-medium focus:border-emerald-700 dark:focus:border-brand-lime text-paper-ink dark:text-white transition-all placeholder:text-paper-accent/40"
                            />
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <p className="text-[11px] font-black text-paper-accent dark:text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Clock size={14} /> Daily Reminders
                            </p>
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-paper-bg/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl">
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-bold text-paper-ink dark:text-white">Enable Notifications</p>
                                <p className="text-[9px] sm:text-[10px] text-paper-accent dark:text-white/40 font-medium">Get reminded before the circle deadline</p>
                              </div>
                              <button 
                                onClick={() => {
                                  const isEnabled = !p.reminderSettings?.enabled;
                                  if (isEnabled && Notification.permission !== 'granted') {
                                    Notification.requestPermission();
                                  }
                                  handleUpdateParticipant(p.id, { 
                                    reminderSettings: { 
                                      enabled: isEnabled,
                                      timeBeforeDeadline: 60,
                                      type: 'browser'
                                    } 
                                  });
                                }}
                                className={cn(
                                  "w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-all relative",
                                  p.reminderSettings?.enabled ? "bg-emerald-700 dark:bg-brand-lime" : "bg-black/10 dark:bg-white/10"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                  p.reminderSettings?.enabled ? "right-0.5 sm:right-1" : "left-0.5 sm:left-1"
                                )} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <p className="text-[11px] font-black text-paper-accent dark:text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                              <UserCircle size={14} /> Choose Avatar
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                              {PREDEFINED_AVATARS.map(avatar => (
                                <button
                                  key={avatar}
                                  onClick={() => handleUpdateParticipant(p.id, { avatar })}
                                  className={cn(
                                    "aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all border-2",
                                    p.avatar === avatar ? "bg-emerald-100 border-emerald-700 dark:bg-brand-lime dark:border-brand-lime shadow-md scale-105" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20"
                                  )}
                                >
                                  {avatar}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <p className="text-[11px] font-black text-paper-accent dark:text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Palette size={14} /> Choose Color
                            </p>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              {AVATAR_COLORS.map(color => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateParticipant(p.id, { color })}
                                  className={cn(
                                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all border-2 sm:border-4 flex items-center justify-center",
                                    p.color === color ? "border-emerald-800 dark:border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                                  )}
                                  style={{ backgroundColor: color }}
                                >
                                  {p.color === color && <Check size={14} className="text-white drop-shadow" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer - Fixed */}
                <div className="p-4 sm:p-6 md:p-10 border-t border-black/10 dark:border-white/5 bg-white/80 dark:bg-brand-forest/50 backdrop-blur-md relative z-10">
                  <Button 
                    size="lg" 
                    className="w-full py-4 sm:py-6 text-lg sm:text-xl" 
                    onClick={() => setShowProfileModal(false)}
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <QFInfoPanel isOpen={showQFInfo} onClose={() => setShowQFInfo(false)} />
        <Toaster position="bottom-right" theme={isLightMode ? 'light' : 'dark'} richColors />

        {/* About Modal */}
        <AnimatePresence>
          {showAboutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowAboutModal(false)}
                className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-brand-forest border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden text-paper-ink dark:text-white"
              >
                <div className="p-8 md:p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">About This <span className="text-emerald-700 dark:text-brand-lime">Project</span></h2>
                      <p className="text-emerald-800 dark:text-brand-lime font-bold uppercase tracking-widest text-xs">Consistency through gentle accountability</p>
                    </div>
                    <button onClick={() => setShowAboutModal(false)} className="w-10 h-10 shrink-0 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-paper-accent dark:text-white/40 hover:text-paper-ink dark:hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none space-y-8 text-paper-ink/85 dark:text-white/70 font-medium leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                    
                    <div className="space-y-4">
                      <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        The Problem
                      </h4>
                      <p>Many people want to stay consistent with the Qur'an beyond Ramadan, but maintaining that habit alone can be difficult.</p>
                      <p>Most tools are either built for solo use or feel too public and social. There is less support for small, private groups trying to stay consistent together.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 mt-8">
                        <div className="w-2 h-2 rounded-full bg-emerald-700 dark:bg-brand-lime"></div>
                        The Solution
                      </h4>
                      <p className="text-paper-ink dark:text-white"><strong>Quran Reflection Circles is a private small-group Quran habit app for families, friends, spouses, and halaqah groups.</strong></p>
                      <p>Each circle can:</p>
                      <ul className="list-disc pl-5 space-y-2 text-paper-ink/90 dark:text-white/80">
                        <li>Follow one shared ayah each day</li>
                        <li>Reflect independently, in their own time</li>
                        <li>Share takeaways privately</li>
                        <li>Build a shared streak together</li>
                      </ul>
                      <p className="border-l-2 border-emerald-600 dark:border-brand-lime pl-4 italic text-paper-ink/90 dark:text-white/80 py-2">The core idea is simple: Consistency through gentle group accountability.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm mt-8">Participation Modes</h4>
                      <p>Designed for real-life use:</p>
                      <div className="space-y-4 bg-paper-bg/40 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/5">
                        <div>
                          <strong className="text-paper-ink dark:text-white block mb-1">Shared-Device Mode</strong>
                          <p className="text-sm">For families using one phone or tablet together.</p>
                        </div>
                        <div className="pt-4 border-t border-black/10 dark:border-white/5">
                          <strong className="text-paper-ink dark:text-white block mb-1">Individual Mode</strong>
                          <p className="text-sm">Each member participates from their own device.</p>
                        </div>
                        <div className="pt-4 border-t border-black/10 dark:border-white/5">
                          <strong className="text-paper-ink dark:text-white block mb-1">Hybrid Mode</strong>
                          <p className="text-sm">Supports both in-person and remote participation.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 mt-8">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        Core Mechanic
                      </h4>
                      <div className="bg-emerald-50 dark:bg-brand-deep/30 p-6 rounded-2xl border border-emerald-200 dark:border-brand-lime/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Flame size={100} /></div>
                        <p className="text-paper-ink dark:text-white font-bold text-lg relative z-10">A circle's streak only continues when all members complete the day.</p>
                        <p className="relative z-10 mt-2 text-paper-accent dark:text-white/70">This makes the group habit collaborative, not individual.</p>
                      </div>
                    </div>

                  </div>
                  <Button className="w-full py-4 text-white dark:text-brand-deep font-black" onClick={() => setShowAboutModal(false)}>Close</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Privacy Modal */}
        <AnimatePresence>
          {showPrivacyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowPrivacyModal(false)}
                className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-brand-forest border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden text-paper-ink dark:text-white"
              >
                <div className="p-8 md:p-12 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">Privacy <span className="text-emerald-700 dark:text-brand-lime">Policy</span></h2>
                    <button onClick={() => setShowPrivacyModal(false)} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-paper-accent dark:text-white/40 hover:text-paper-ink dark:hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none space-y-6 text-paper-ink/85 dark:text-white/70 font-medium leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                    <p className="text-paper-accent dark:text-white/50">Last updated: April 16, 2026</p>
                    <p>At Quran Circles, we take your privacy seriously. Our platform is built on the principle of private, sacred spaces.</p>
                    <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm">1. Data Collection</h4>
                    <p>We collect only the information necessary to provide our service: your email for authentication, and the reflections you choose to share within your private circles.</p>
                    <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm">2. Data Usage</h4>
                    <p>Your reflections are only visible to members of the specific circle they were posted in. We do not use your personal reflections for advertising or any third-party services.</p>
                    <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm">3. Security</h4>
                    <p>We use industry-standard encryption to protect your data both in transit and at rest. Our authentication is handled securely via Firebase.</p>
                  </div>
                  <Button className="w-full py-4" onClick={() => setShowPrivacyModal(false)}>Close</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Terms Modal */}
        <AnimatePresence>
          {showTermsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowTermsModal(false)}
                className="absolute inset-0 bg-brand-deep/80 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-brand-forest border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden text-paper-ink dark:text-white"
              >
                <div className="p-8 md:p-12 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-display font-black uppercase tracking-tight text-paper-ink dark:text-white">Terms of <span className="text-emerald-700 dark:text-brand-lime">Service</span></h2>
                    <button onClick={() => setShowTermsModal(false)} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-paper-accent dark:text-white/40 hover:text-paper-ink dark:hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none space-y-6 text-paper-ink/85 dark:text-white/70 font-medium leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                    <p className="text-paper-accent dark:text-white/50">Last updated: April 16, 2026</p>
                    <p>By using Quran Circles, you agree to the following terms:</p>
                    <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm">1. Respectful Conduct</h4>
                    <p>This is a sacred space for reflection. Users are expected to maintain a respectful and supportive environment within their circles.</p>
                    <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm">2. Account Responsibility</h4>
                    <p>You are responsible for maintaining the security of your account and for all activities that occur under your account.</p>
                    <h4 className="text-paper-ink dark:text-white font-black uppercase tracking-widest text-sm">3. Service Availability</h4>
                    <p>We strive to provide a reliable service but do not guarantee uninterrupted access. We reserve the right to modify or discontinue features as needed to improve the platform.</p>
                  </div>
                  <Button className="w-full py-4" onClick={() => setShowTermsModal(false)}>Close</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Firebase Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onSeedDemo={seedDemoData} 
        />

        {/* Docked Recitation Player */}
        <AudioPlayerDock
          isPlaying={isPlaying}
          isLoading={isLoadingAudio}
          onTogglePlay={toggleAudio}
          audioProgress={audioProgress}
          audioDuration={audioDuration}
          onSeek={handleSeek}
          currentVerseKey={currentVerses[currentAudioVerseIndex]?.verse_key || currentVerses[0]?.verse_key || '1:1'}
          surahName={chapters.find(c => c.id === parseInt((currentVerses[0]?.verse_key || '1:1').split(':')[0], 10))?.name_simple || 'Surah'}
          reciters={reciters}
          reciterId={reciterId}
          onSelectReciter={(id) => setReciterId(id)}
          playbackRate={playbackRate}
          onChangePlaybackRate={(rate) => {
            setPlaybackRate(rate);
            audio.playbackRate = rate;
          }}
          repeatMode={repeatMode}
          onChangeRepeatMode={(mode) => setRepeatMode(mode)}
          isVisible={isAudioDockVisible && currentVerses.length > 0}
          onClose={() => {
            setIsAudioDockVisible(false);
            if (isPlaying) {
              audio.pause();
              setIsPlaying(false);
            }
          }}
        />

        {/* Mobile Thumb Navigation */}
        {user && view !== 'landing' && (
          <MobileNav
            currentView={view}
            onNavigate={(newView) => setView(newView)}
            hasActiveCircle={!!activeCircle}
            onOpenCreateModal={() => setView('create-circle')}
          />
        )}
      </div>
    </div>
  );
}
