// Auth context — wraps the entire app
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, signOut as authSignOut } from '../services/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BYPASS AUTH FOR LOCAL TESTING
    setUser({ uid: 'local-tester-123', email: 'test@miraculous.app', displayName: 'Test User' });
    setProfile({ displayName: 'Test User', currencySymbol: '$', theme: 'light' });
    setLoading(false);
    
    // UNCOMMENT LATER TO RESTORE FIREBASE AUTH
    /*
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid, 'profile', 'data'));
          if (snap.exists()) setProfile(snap.data());
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
    */
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'));
    if (snap.exists()) setProfile(snap.data());
  };

  /** Save profile fields to Firestore and update local state */
  const updateProfile = async (data) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'profile', 'data');
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    setProfile((prev) => ({ ...prev, ...data }));
  };

  /** Sign out the current user */
  const logout = async () => {
    await authSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
