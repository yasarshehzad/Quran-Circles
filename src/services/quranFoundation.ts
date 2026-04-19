/**
 * Quran Foundation API Integration Layer
 * 
 * This module provides a unified client for interacting with the Quran Foundation APIs.
 * It separates read-only content from authenticated user data and includes mock fallbacks
 * for hackathon demo purposes.
 * 
 * ASSUMPTIONS:
 * - Base URL for content: https://api.quran.com/api/v4 (Standard Quran.com API)
 * - Base URL for user data: https://api.quranfoundation.org/v1 (Placeholder for QF User API)
 * - Auth: Bearer Token or OAuth2
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Circle, Reflection, Bookmark, Participant, ChatMessage } from '../types';

// --- Configuration ---

const CONTENT_BASE_URL = 'https://api.quran.com/api/v4';
const USER_API_BASE_URL = import.meta.env.VITE_QF_USER_API_URL || 'https://api.quran.foundation/v1'; 
const API_KEY = import.meta.env.VITE_QF_API_KEY || '';

// Toggle for Demo Mode (uses mock data/Firebase instead of real QF User API)
// We are in demo mode if NO user API URL is provided
const IS_DEMO_MODE = !import.meta.env.VITE_QF_USER_API_URL;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (IS_DEMO_MODE) return 'demo-token';

  // Check cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const response = await fetch('/api/qf/token', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to fetch QF access token');
    
    const data = await response.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // Buffer of 1 minute
    };
    return cachedToken.token;
  } catch (error) {
    console.error("Error getting QF access token:", error);
    throw error;
  }
}

// --- Types ---

export interface QuranVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations?: { text: string; resource_id: number }[];
  audio?: { url: string; format: string };
  tafsir?: { text: string; resource_id: number };
}

// --- Internal Helpers ---

async function qfFetch(endpoint: string, options: RequestInit & { silent?: boolean } = {}) {
  const { silent, ...fetchOptions } = options;
  let url = endpoint.startsWith('http') ? endpoint : `${CONTENT_BASE_URL}${endpoint}`;
  
  // If it's a Quran.com API call, use the local proxy to avoid CORS and network issues
  if (url.startsWith(CONTENT_BASE_URL)) {
    const relativeEndpoint = url.replace(CONTENT_BASE_URL, '');
    
    // Parse existing query params from the endpoint if any
    const [path, query] = relativeEndpoint.split('?');
    
    // Construct relative proxy URL
    let proxyPath = `/api/quran/proxy?endpoint=${encodeURIComponent(path)}`;
    
    if (query) {
      const params = new URLSearchParams(query);
      params.forEach((value, key) => {
        proxyPath += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      });
    }
    
    url = proxyPath;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      if (!silent) {
        const errorText = await response.text().catch(() => 'No error body');
        console.error(`Quran Foundation API Error (${response.status}): ${response.statusText}`, errorText);
      }
      throw new Error(`Quran Foundation API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (!silent) {
      console.error(`Fetch failed for ${url}:`, error);
    }
    // If it's a "Failed to fetch" error, it's likely a network or CORS issue
    if (error instanceof Error && error.message === 'Failed to fetch') {
      if (!silent) {
        throw new Error(`Network error: Could not reach ${url}. This may be due to a CORS issue or being offline.`);
      }
    }
    throw error;
  }
}

/**
 * Authenticated Fetch Wrapper
 * Prepares for Token-based or OAuth-based auth.
 */
async function qfAuthFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  return qfFetch(`${USER_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

// --- 1. Read-Only Content API (Quran.com v4) ---
// These endpoints are public and do not require user authentication.
// They use the standard Quran.com v4 API structure.

export const contentApi = {
  /**
   * Fetch a specific verse with translation
   * @param verseKey e.g., "1:1"
   * @param translationId e.g., 131 for Clear Quran
   * @param script e.g., "uthmani"
   */
  getVerse: async (verseKey: string, translationId: number = 131, script: string = 'uthmani'): Promise<QuranVerse> => {
    // Use the standard v4 endpoint for verses by key
    // Request multiple script fields to ensure we have fallbacks and the specific requested script
    const fields = ['text_uthmani', 'text_uthmani_simple', 'text_imlaei', 'text_indopak', 'text_indopak_15_lines'];
    const fieldsParam = fields.join(',');
    
    const data = await qfFetch(`/verses/by_key/${verseKey}?language=en&words=false&translations=${translationId}&fields=${fieldsParam}`);
    const verse = data.verse;
    
    if (!verse) {
      throw new Error("Verse not found");
    }

    // Normalize the text field based on script
    // If the requested script is indopak, try both variants
    if (script === 'indopak') {
      const indopakText = verse.text_indopak || verse.text_indopak_15_lines;
      if (indopakText) {
        verse.text_indopak = indopakText;
        verse.text_uthmani = indopakText; // Also set as primary fallback
      }
    } else if (verse[`text_${script}`]) {
      verse.text_uthmani = verse[`text_${script}`];
    }
    
    // Ensure the requested script field is definitely present for the UI
    if (!verse[`text_${script}`]) {
      verse[`text_${script}`] = verse.text_uthmani || verse.text_uthmani_simple || verse.text_imlaei;
    }
    
    // Ensure translations are mapped correctly
    let translations = verse.translations || [];
    
    // If translations are missing or don't include the requested one, try a different endpoint
    const hasRequestedTranslation = translations.some((t: any) => (t.resource_id || t.id) === translationId);
    
    if (!hasRequestedTranslation) {
      try {
        // Try the dedicated translations endpoint
        const transData = await qfFetch(`/quran/translations/${translationId}?verse_key=${verseKey}`);
        if (transData.translations && Array.isArray(transData.translations)) {
          translations = [...translations, ...transData.translations];
        } else if (transData.translation) {
          translations = [...translations, transData.translation];
        }
      } catch (e) {
        // Try another fallback: fetch all translations for this verse key
        try {
          const allTransData = await qfFetch(`/verses/by_key/${verseKey}?translations=${translationId}`);
          if (allTransData.verse?.translations) {
            translations = allTransData.verse.translations;
          }
        } catch (e2) {
          console.error("Failed to fetch translations:", e2);
        }
      }
    }

    // Normalize translation objects to have both id and resource_id if possible
    verse.translations = translations.map((t: any) => ({
      ...t,
      resource_id: t.resource_id || t.id,
      id: t.id || t.resource_id
    }));
    
    return verse;
  },

  /**
   * Get audio URL for a specific verse
   * @param reciterId Reciter ID from Quran.com API
   * @param verseKey e.g., "1:1"
   */
  getAudioUrl: async (reciterId: number, verseKey: string): Promise<string> => {
    const [surah, ayah] = verseKey.split(':');
    const paddedSurah = surah.padStart(3, '0');
    const paddedAyah = ayah.padStart(3, '0');

    try {
      // Try the standard v4 ayah endpoint first
      // GET /recitations/{recitation_id}/by_ayah/{verse_key}
      const data = await qfFetch(`/recitations/${reciterId}/by_ayah/${verseKey}`);
      let audioFile = data.audio_file || (data.audio_files && data.audio_files[0]);
      
      // If not found, try the other common v4 endpoint
      if (!audioFile) {
        try {
          const altData = await qfFetch(`/quran/recitations/${reciterId}?verse_key=${verseKey}`);
          audioFile = altData.audio_file || (altData.audio_files && altData.audio_files[0]);
        } catch (e) {
          // Ignore error from second attempt
        }
      }

      if (!audioFile || !audioFile.url) {
        throw new Error("No audio file found in API response");
      }

      let url = audioFile.url.trim();

      // If it is a relative path (e.g., Alafasy/mp3/001001.mp3)
      if (!url.startsWith('http') && !url.startsWith('//')) {
        const cleanPath = url.startsWith('/') ? url.slice(1) : url;
        // Prefix with audio.qurancdn.com for official paths
        url = `https://audio.qurancdn.com/${cleanPath}`;
      } else {
        // If it starts with //
        if (url.startsWith('//')) {
          url = `https:${url}`;
        }
        // Force replace outdated subdomains with audio.qurancdn.com
        if (url.includes('audio.quran.com') || url.includes('verses.quran.com')) {
          url = url.replace('audio.quran.com', 'audio.qurancdn.com').replace('verses.quran.com', 'audio.qurancdn.com');
        }
      }

      // Force HTTPS
      if (url.startsWith('http:')) {
        url = url.replace('http:', 'https:');
      }
      
      // Final cleanup: ensure no double slashes after protocol
      url = url.replace(/([^:])\/\//g, '$1/');
      
      // 3. Robust validation
      if (!url || url.length < 15 || url.includes('undefined') || url.includes('null')) {
        throw new Error("Invalid or malformed audio URL from API");
      }
      
      return url;
    } catch (error) {
      console.error(`Error fetching audio for reciter ${reciterId}, verse ${verseKey}:`, error);
      
      // Fallback to Alafasy on everyayah.com as a reliable last resort
      // This ensures SOMETHING always plays even if the specific reciter fails
      return `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedAyah}.mp3`;
    }
  },

  /**
   * Fetch available translations
   */
  getTranslations: async (): Promise<{ id: number; name: string; language_name: string }[]> => {
    const data = await qfFetch('/resources/translations');
    return data.translations || [];
  },

  /**
   * Fetch available reciters
   */
  getReciters: async (): Promise<{ id: number; name: string; style: string }[]> => {
    const data = await qfFetch('/resources/recitations');
    return data.recitations || [];
  },

  /**
   * Fetch available Tafsirs
   */
  getTafsirs: async (): Promise<{ id: number; name: string; language_name: string }[]> => {
    const data = await qfFetch('/resources/tafsirs');
    return data.tafsirs || [];
  },

  /**
   * Fetch all chapters (surahs)
   */
  getChapters: async (): Promise<{ id: number; name_simple: string; name_arabic: string; verses_count: number }[]> => {
    const data = await qfFetch('/chapters');
    return data.chapters || [];
  },

  /**
   * Fetch all Juzs
   */
  getJuzs: async (): Promise<{ id: number; juz_number: number; verse_mapping: { [key: string]: string } }[]> => {
    const data = await qfFetch('/juzs');
    return data.juzs || [];
  },

  /**
   * Fetch Tafsir for a verse
   * @param verseKey e.g., "1:1"
   * @param tafsirId e.g., 169 for Tafsir Ibn Kathir (English)
   */
  getTafsir: async (verseKey: string, tafsirId: number = 169): Promise<string> => {
    const [surah, ayah] = verseKey.split(':');
    const id = tafsirId || 169;
    
    // List of endpoints to try in order of preference
    // v4 standard is /tafsirs/{id}/by_ayah/{verse_key}
    const endpoints = [
      `/tafsirs/${id}/by_ayah/${verseKey}`,
      `/quran/tafsirs/${id}?verse_key=${verseKey}`,
      `/quran/tafsirs/${id}?chapter_number=${surah}&verse_number=${ayah}`,
      `/verses/by_key/${verseKey}?tafsirs=${id}`,
      `/verses/${surah}:${ayah}?tafsirs=${id}`
    ];

    for (const endpoint of endpoints) {
      try {
        const data = await qfFetch(endpoint, { silent: true });
        
        // Check all possible locations for the tafsir text
        const possibleText = 
          data.tafsir?.text || 
          data.tafsir?.text_html ||
          data.tafsir?.content ||
          data.tafsirs?.[0]?.text || 
          data.tafsirs?.[0]?.text_html ||
          data.tafsirs?.[0]?.content ||
          data.verse?.tafsirs?.[0]?.text ||
          data.verse?.tafsirs?.[0]?.text_html ||
          (data.tafsirs && Array.isArray(data.tafsirs) && data.tafsirs.find((t: any) => (t.resource_id === id || t.id === id))?.text) ||
          (data.verses && data.verses[0]?.tafsirs?.[0]?.text) ||
          (data.verses && data.verses[0]?.tafsir?.text) ||
          (data.verses && data.verses[0]?.tafsir?.content) ||
          (typeof data.text === 'string' ? data.text : null) ||
          (typeof data.content === 'string' ? data.content : null);

        if (possibleText && possibleText.trim().length > 0) {
          return possibleText;
        }
      } catch (error) {
        // Silent fail for individual endpoints
      }
    }

    // If the requested one failed, try specifically for common English Tafsirs
    // 169: Ibn Kathir (English), 171: Ibn Kathir (English), 158: Jalalayn (English), 91: Maariful Quran (English)
    const fallbacks = [169, 171, 158, 91, 16, 131]; 
    for (const fallbackId of fallbacks) {
      if (fallbackId === id) continue; // Already tried
      try {
        const fallbackData = await qfFetch(`/tafsirs/${fallbackId}/by_ayah/${verseKey}`, { silent: true });
        const text = fallbackData.tafsir?.text || 
                     fallbackData.tafsir?.text_html ||
                     fallbackData.tafsir?.content ||
                     fallbackData.tafsirs?.[0]?.text || 
                     fallbackData.tafsirs?.[0]?.text_html ||
                     fallbackData.tafsirs?.[0]?.content ||
                     fallbackData.verse?.tafsirs?.[0]?.text ||
                     fallbackData.verse?.tafsirs?.[0]?.text_html ||
                     (fallbackData.tafsirs && Array.isArray(fallbackData.tafsirs) && fallbackData.tafsirs[0]?.text) ||
                     (typeof fallbackData.text === 'string' ? fallbackData.text : null) ||
                     (typeof fallbackData.content === 'string' ? fallbackData.content : null);
                     
        if (text && text.trim().length > 0) return text;
      } catch (e) {
        // Ignore fallback error
      }
    }

    return 'Tafsir content currently unavailable for this verse. Please try another tafsir source in settings.';
  }
};

// --- 2. Authenticated User API (Quran Foundation User Services) ---
// These endpoints require a user token (OAuth2 or Bearer).
// HACKATHON NOTE: In Demo Mode (IS_DEMO_MODE=true), these fall back to Firebase Firestore
// to allow immediate testing without real QF API credentials.
// This preserves a clean upgrade path: simply provide QF_USER_API_URL to switch to real endpoints.

export const userApi = {
  /**
   * Rooms / Circles API
   */
  getRooms: async (): Promise<Circle[]> => {
    if (IS_DEMO_MODE) {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, 'circles'), where('members', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Circle));
    }
    return qfAuthFetch('/rooms');
  },

  /**
   * Real-time listener for Rooms
   */
  onRoomsUpdate: (callback: (circles: Circle[]) => void) => {
    if (IS_DEMO_MODE) {
      const user = auth.currentUser;
      if (!user) return () => {};
      const q = query(collection(db, 'circles'), where('members', 'array-contains', user.uid));
      return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        callback(snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          isPending: d.metadata.hasPendingWrites
        } as Circle)));
      });
    }
    // Real API would likely use WebSockets or polling
    console.warn("Real-time rooms not implemented for QF API yet");
    return () => {};
  },

  onRoomUpdate: (roomId: string, callback: (circle: Circle | null) => void) => {
    if (IS_DEMO_MODE) {
      return onSnapshot(doc(db, 'circles', roomId), (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as Circle);
        } else {
          callback(null);
        }
      });
    }
    return () => {};
  },

  createRoom: async (circle: Partial<Circle>): Promise<Circle> => {
    if (IS_DEMO_MODE) {
      const docRef = await addDoc(collection(db, 'circles'), circle);
      return { id: docRef.id, ...circle } as Circle;
    }
    return qfAuthFetch('/rooms', { method: 'POST', body: JSON.stringify(circle) });
  },

  joinRoom: async (code: string): Promise<Circle> => {
    if (IS_DEMO_MODE) {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      
      const q = query(collection(db, 'circles'), where('inviteCode', '==', code));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error("Invalid code");
      
      const circleDoc = snapshot.docs[0];
      const circleData = circleDoc.data() as Circle;
      
      if (!circleData.members.includes(user.uid)) {
        await updateDoc(circleDoc.ref, {
          members: [...circleData.members, user.uid],
          participants: [...circleData.participants, { id: user.uid, name: user.displayName || 'Me', type: 'auth' }]
        });
      }
      return { id: circleDoc.id, ...circleData } as Circle;
    }
    return qfAuthFetch(`/rooms/join`, { method: 'POST', body: JSON.stringify({ code }) });
  },

  updateRoom: async (roomId: string, updates: Partial<Circle>): Promise<void> => {
    if (IS_DEMO_MODE) {
      await updateDoc(doc(db, 'circles', roomId), updates);
      return;
    }
    return qfAuthFetch(`/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(updates) });
  },

  /**
   * Posts / Reflections API
   */
  getPosts: async (roomId: string): Promise<Reflection[]> => {
    if (IS_DEMO_MODE) {
      const q = query(
        collection(db, `circles/${roomId}/reflections`),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reflection));
    }
    return qfAuthFetch(`/rooms/${roomId}/posts`);
  },

  onPostsUpdate: (roomId: string, callback: (posts: Reflection[]) => void) => {
    if (IS_DEMO_MODE) {
      const q = query(
        collection(db, `circles/${roomId}/reflections`),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reflection)));
      });
    }
    return () => {};
  },

  createPost: async (roomId: string, post: Partial<Reflection>): Promise<Reflection> => {
    if (IS_DEMO_MODE) {
      const docRef = await addDoc(collection(db, `circles/${roomId}/reflections`), post);
      return { id: docRef.id, ...post } as Reflection;
    }
    return qfAuthFetch(`/rooms/${roomId}/posts`, { method: 'POST', body: JSON.stringify(post) });
  },

  reactToPost: async (roomId: string, postId: string, emoji: string, participantId: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      const docRef = doc(db, `circles/${roomId}/reflections`, postId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data() as Reflection;
      const currentReactions = data.reactions || {};
      const reactors = currentReactions[emoji] || [];
      
      let newReactors;
      if (reactors.includes(participantId)) {
        newReactors = reactors.filter(id => id !== participantId);
      } else {
        newReactors = [...reactors, participantId];
      }
      
      await updateDoc(docRef, {
        [`reactions.${emoji}`]: newReactors
      });
      return;
    }
    return qfAuthFetch(`/rooms/${roomId}/posts/${postId}/react`, { method: 'POST', body: JSON.stringify({ emoji, participantId }) });
  },

  /**
   * Bookmarks API
   */
  getBookmarks: async (): Promise<Bookmark[]> => {
    if (IS_DEMO_MODE) {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, 'bookmarks'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bookmark));
    }
    return qfAuthFetch('/bookmarks');
  },

  onBookmarksUpdate: (callback: (bookmarks: Bookmark[]) => void) => {
    if (IS_DEMO_MODE) {
      const user = auth.currentUser;
      if (!user) return () => {};
      const q = query(collection(db, 'bookmarks'), where('uid', '==', user.uid));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bookmark)));
      });
    }
    return () => {};
  },

  toggleBookmark: async (ayahKey: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      const user = auth.currentUser;
      if (!user) return;
      
      const q = query(collection(db, 'bookmarks'), 
        where('uid', '==', user.uid),
        where('ayahKey', '==', ayahKey)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await deleteDoc(doc(db, 'bookmarks', snapshot.docs[0].id));
      } else {
        await addDoc(collection(db, 'bookmarks'), {
          uid: user.uid,
          ayahKey,
          createdAt: new Date().toISOString()
        });
      }
      return;
    }
    return qfAuthFetch('/bookmarks/toggle', { method: 'POST', body: JSON.stringify({ ayahKey }) });
  },

  /**
   * Streak & Progress Tracking API
   */
  getStreak: async (roomId: string): Promise<{ current: number; lastDate: string }> => {
    if (IS_DEMO_MODE) {
      // Simple mock streak for demo
      return { current: 5, lastDate: new Date().toISOString() };
    }
    return qfAuthFetch(`/rooms/${roomId}/streak`);
  },

  updateProgress: async (ayahKey: string, roomId: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      // In demo mode, progress is often tracked via reflections or a separate collection
      // For now, we'll just mock it
      console.log(`Demo: Progress updated for ${ayahKey} in room ${roomId}`);
      return;
    }
    return qfAuthFetch('/progress', { method: 'POST', body: JSON.stringify({ ayahKey, roomId, completed: true }) });
  },

  /**
   * Participant Customization
   */
  updateParticipant: async (roomId: string, participantId: string, updates: Partial<Participant>): Promise<void> => {
    if (IS_DEMO_MODE) {
      const docRef = doc(db, 'circles', roomId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data() as Circle;
      const updatedParticipants = data.participants.map(p => 
        p.id === participantId ? { ...p, ...updates } : p
      );
      
      await updateDoc(docRef, { participants: updatedParticipants });
      return;
    }
    return qfAuthFetch(`/rooms/${roomId}/participants/${participantId}`, { method: 'PATCH', body: JSON.stringify(updates) });
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      await deleteDoc(doc(db, 'circles', roomId));
      return;
    }
    return qfAuthFetch(`/rooms/${roomId}`, { method: 'DELETE' });
  }
};

// --- 3. Integration Layer Export ---

export const quranFoundation = {
  content: contentApi,
  user: userApi,
  isDemo: IS_DEMO_MODE
};
