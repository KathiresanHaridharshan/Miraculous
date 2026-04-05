// Timer sessions service
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const sessionsRef = (uid) => collection(db, 'users', uid, 'timerSessions');
const sessionRef = (uid, id) => doc(db, 'users', uid, 'timerSessions', id);

export async function saveTimerSession(uid, sessionData) {
  const ref = await addDoc(sessionsRef(uid), {
    goalId: sessionData.goalId || null,
    activityName: sessionData.activityName || 'General',
    startTime: sessionData.startTime,
    endTime: sessionData.endTime,
    duration: sessionData.duration, // in seconds
    notes: sessionData.notes || '',
    mode: sessionData.mode || 'stopwatch', // 'stopwatch' | 'focus' | 'pomodoro'
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTimerSessions(uid) {
  const q = query(sessionsRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateTimerSession(uid, id, updates) {
  await updateDoc(sessionRef(uid, id), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTimerSession(uid, id) {
  await deleteDoc(sessionRef(uid, id));
}

/** Format seconds into HH:MM:SS */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format seconds into human-readable string */
export function formatDurationHuman(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
