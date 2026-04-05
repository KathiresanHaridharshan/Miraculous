// Goals service — CRUD + progress logging
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const userGoalsRef = (uid) => collection(db, 'users', uid, 'goals');
const goalRef = (uid, goalId) => doc(db, 'users', uid, 'goals', goalId);
const progressRef = (uid, goalId) =>
  collection(db, 'users', uid, 'goals', goalId, 'progressLogs');

/** Create a new goal */
export async function createGoal(uid, goalData) {
  const ref = await addDoc(userGoalsRef(uid), {
    ...goalData,
    currentValue: 0,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update goal fields */
export async function updateGoal(uid, goalId, updates) {
  await updateDoc(goalRef(uid, goalId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/** Delete goal and all its progress logs */
export async function deleteGoal(uid, goalId) {
  // Delete progress logs first
  const logs = await getDocs(progressRef(uid, goalId));
  const deletes = logs.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
  await deleteDoc(goalRef(uid, goalId));
}

/** Get all goals for a user */
export async function getGoals(uid, filters = {}) {
  let q = query(userGoalsRef(uid), orderBy('createdAt', 'desc'));

  if (filters.status) {
    q = query(userGoalsRef(uid), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
  }
  if (filters.category) {
    q = query(userGoalsRef(uid), where('category', '==', filters.category), orderBy('createdAt', 'desc'));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get a single goal */
export async function getGoal(uid, goalId) {
  const snap = await getDoc(goalRef(uid, goalId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Add a progress log entry and accumulate to goal's currentValue
 */
export async function addProgressLog(uid, goalId, logData) {
  // Add log entry
  const logRef = await addDoc(progressRef(uid, goalId), {
    ...logData,
    createdAt: serverTimestamp(),
  });

  // Accumulate progress to goal
  const goal = await getGoal(uid, goalId);
  if (!goal) return;

  const newValue = (goal.currentValue || 0) + logData.value;
  const updates = { currentValue: newValue, updatedAt: serverTimestamp() };

  // Auto-complete if target reached
  if (newValue >= goal.targetValue && goal.status === 'active') {
    updates.status = 'completed';
    updates.completedAt = serverTimestamp();
  }

  await updateDoc(goalRef(uid, goalId), updates);
  return logRef.id;
}

/** Get all progress logs for a goal */
export async function getProgressLogs(uid, goalId) {
  const q = query(progressRef(uid, goalId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Delete a progress log and subtract from goal's currentValue */
export async function deleteProgressLog(uid, goalId, logId, logValue) {
  await deleteDoc(doc(progressRef(uid, goalId), logId));
  const goal = await getGoal(uid, goalId);
  if (!goal) return;
  const newValue = Math.max(0, (goal.currentValue || 0) - logValue);
  await updateDoc(goalRef(uid, goalId), {
    currentValue: newValue,
    updatedAt: serverTimestamp(),
  });
}

/** Get goals for analytics (all, for date range filtering in-memory) */
export async function getAllGoalsWithLogs(uid) {
  const goals = await getGoals(uid);
  const result = [];
  for (const goal of goals) {
    const logs = await getProgressLogs(uid, goal.id);
    result.push({ ...goal, progressLogs: logs });
  }
  return result;
}
