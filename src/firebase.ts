import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional custom parameters to prompt account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

// Helper to sync user profile to Firestore
export const syncUserProfileToFirestore = async (user: FirebaseUser, displayNameOverride?: string) => {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email || '',
      displayName: displayNameOverride || user.displayName || (user.email ? user.email.split('@')[0] : 'Member'),
      photoURL: user.photoURL || '',
      isAnonymous: user.isAnonymous || false,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not sync user profile to firestore:", err);
  }
};

export const loginWithGoogle = async () => {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred?.user) {
      await syncUserProfileToFirestore(cred.user);
    }
    return cred;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.log("Login popup was closed by the user.");
      return null;
    }
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  if (cred?.user) {
    await syncUserProfileToFirestore(cred.user);
  }
  return cred;
};

export const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (cred?.user) {
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    await syncUserProfileToFirestore(cred.user, displayName?.trim());
  }
  return cred;
};

export const loginAnonymously = async () => {
  const cred = await signInAnonymously(auth);
  if (cred?.user) {
    await syncUserProfileToFirestore(cred.user, 'Guest Explorer');
  }
  return cred;
};

export const logout = () => auth.signOut();

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/admin-restricted-operation':
      return 'This authentication method is restricted in Firebase settings.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few moments.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}
