// Authentication service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', result.user.uid, 'profile', 'data');
    await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
    return result;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Register with Email and Password
 * Creates new user and sets up default profile in Firestore
 */
export async function registerWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Create user profile in Firestore
    const userRef = doc(db, 'users', user.uid, 'profile', 'data');
    await setDoc(userRef, {
      displayName: displayName || email.split('@')[0],
      email: user.email,
      photoURL: null,
      currency: 'LKR',
      currencySymbol: 'Rs',
      theme: 'light',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Default settings
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'data');
    await setDoc(settingsRef, {
      notifications: {
        goals: true, calendar: true, finance: true, timer: true, inactivity: false,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekStart: 'monday',
      pomodoro: {
        workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4,
      },
      dateFormat: 'dd/MM/yyyy',
      firstDayOfWeek: 1,
      updatedAt: serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Sign in with Google popup
 * Creates user profile in Firestore if first time
 */
export async function signInWithGoogle() {
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const { googleProvider } = await import('./firebase');
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
        currency: 'LKR',
        currencySymbol: 'Rs',
        theme: 'light',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Default settings
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'data');
      await setDoc(settingsRef, {
        notifications: {
          goals: true, calendar: true, finance: true, timer: true, inactivity: false,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekStart: 'monday',
        pomodoro: {
          workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4,
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
