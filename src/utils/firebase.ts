import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { EventPlan, EventCollaborator, CollaborationActivity } from '../types/event';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isAnonymous?: boolean;
  provider: 'google' | 'co_host_profile';
}

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const FIREBASE_CONFIG_STORAGE_KEY = 'veyora_firebase_config';
const LEGACY_FIREBASE_CONFIG_STORAGE_KEY = 'eventpilot_firebase_config';
const USER_PROFILE_STORAGE_KEY = 'veyora_user_profile';
const LEGACY_USER_PROFILE_STORAGE_KEY = 'eventpilot_user_profile';

// Get active Firebase configuration from environment or localStorage
export function getFirebaseConfig(): FirebaseConfigOptions | null {
  try {
    const custom = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY) || localStorage.getItem(LEGACY_FIREBASE_CONFIG_STORAGE_KEY);
    if (custom) {
      return JSON.parse(custom);
    }
  } catch {}

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envKey) {
    return {
      apiKey: envKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfigOptions): void {
  localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

let firebaseAppInstance: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseAppInstance) return firebaseAppInstance;
  if (getApps().length > 0) {
    firebaseAppInstance = getApp();
    return firebaseAppInstance;
  }

  const config = getFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      firebaseAppInstance = initializeApp(config);
      return firebaseAppInstance;
    } catch (err) {
      console.warn('[Firebase] Initialization error:', err);
      return null;
    }
  }
  return null;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch {
    return null;
  }
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return null;
  }
}

// Stored / Active Local Profile helper
export function getStoredUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY) || localStorage.getItem(LEGACY_USER_PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setStoredUserProfile(profile: UserProfile | null): void {
  if (profile) {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
  }
}

// One-Click Google Sign In (Firebase Auth or Co-Host Profile)
export async function signInWithGoogleAuth(): Promise<UserProfile> {
  const auth = getFirebaseAuth();

  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Event Co-Host',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        provider: 'google',
      };
      setStoredUserProfile(profile);
      return profile;
    } catch (err: any) {
      console.warn('[Firebase Auth] Popup error, falling back to profile auth:', err);
    }
  }

  // Fallback Google Identity / Co-Host Profile
  const existing = getStoredUserProfile();
  if (existing) return existing;

  const defaultProfile: UserProfile = {
    uid: `user-${Date.now()}`,
    displayName: 'Lead Event Planner',
    email: 'planner@veyora.ai',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=Veyora`,
    provider: 'co_host_profile',
  };
  setStoredUserProfile(defaultProfile);
  return defaultProfile;
}

export async function signOutAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch {}
  }
  setStoredUserProfile(null);
}

// Sync Event Plan to Firestore (if configured) or Server Cloud Sync
export async function syncPlanToCloud(
  plan: EventPlan,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; cloudSyncedAt: string; shareUrl: string }> {
  const now = new Date().toISOString();
  const db = getFirebaseDb();

  // Try writing to Firestore if enabled
  if (db) {
    try {
      const planRef = doc(db, 'event_plans', plan.id);
      await setDoc(
        planRef,
        {
          ...plan,
          cloudSyncedAt: now,
          cloudOwnerEmail: userProfile?.email || plan.cloudOwnerEmail,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('[Firestore] Sync warning:', e);
    }
  }

  // Always sync to server cloud store for multi-device cross-platform sync
  const response = await fetch('/api/cloud/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: {
        ...plan,
        cloudSyncedAt: now,
      },
      user: userProfile,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloud sync error: ${response.status}`);
  }

  const data = await response.json();
  return {
    success: true,
    cloudSyncedAt: now,
    shareUrl: data.shareUrl || `${window.location.origin}?share=${data.shareCode || plan.id}`,
  };
}

// Load Plan from Cloud (Firestore or Server Cloud API)
export async function loadPlanFromCloud(planId: string): Promise<EventPlan | null> {
  const db = getFirebaseDb();
  if (db) {
    try {
      const planRef = doc(db, 'event_plans', planId);
      const snap = await getDoc(planRef);
      if (snap.exists()) {
        return snap.data() as EventPlan;
      }
    } catch {}
  }

  try {
    const res = await fetch(`/api/cloud/plans/${planId}`);
    if (res.ok) {
      const data = await res.json();
      return data.plan || null;
    }
  } catch {}

  return null;
}

// Realtime Firestore Subscription
export function subscribeToCloudPlan(
  planId: string,
  onUpdate: (plan: EventPlan) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) return () => {};

  try {
    const planRef = doc(db, 'event_plans', planId);
    return onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as EventPlan);
      }
    });
  } catch {
    return () => {};
  }
}
