// Authentication service
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

/**
 * Sign in with Google popup
 * Creates user profile in Firestore if first time
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create/update user profile in Firestore
    const userRef = doc(db, 'users', user.uid, 'profile', 'data');
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // First time login — set up profile and default settings
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        currency: 'INR',
        currencySymbol: '₹',
        theme: 'light',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Default settings
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'data');
      await setDoc(settingsRef, {
        notifications: {
          goals: true,
          calendar: true,
          finance: true,
          timer: true,
          inactivity: false,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekStart: 'monday',
        pomodoro: {
          workMinutes: 25,
          breakMinutes: 5,
          longBreakMinutes: 15,
          sessionsBeforeLongBreak: 4,
        },
        dateFormat: 'dd/MM/yyyy',
        firstDayOfWeek: 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update last seen
      await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
    }

    return { user, credential: result };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser;
}
