// Notification service — in-app + browser notifications
import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const notifsRef = (uid) => collection(db, 'users', uid, 'notifications');
const notifRef = (uid, id) => doc(db, 'users', uid, 'notifications', id);

export async function createNotification(uid, data) {
  const ref = await addDoc(notifsRef(uid), {
    type: data.type, // 'goal' | 'calendar' | 'finance' | 'timer' | 'system'
    title: data.title,
    message: data.message,
    read: false,
    link: data.link || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getNotifications(uid) {
  const q = query(notifsRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markRead(uid, id) {
  await updateDoc(notifRef(uid, id), { read: true });
}

export async function markAllRead(uid) {
  const notifs = await getNotifications(uid);
  const unread = notifs.filter((n) => !n.read);
  await Promise.all(unread.map((n) => markRead(uid, n.id)));
}

// ─── Browser Notifications ─────────────────────────────────────

export async function requestBrowserPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const permission = await Notification.requestPermission();
  return permission;
}

export function showBrowserNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;
  const notif = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options,
  });
  setTimeout(() => notif.close(), 8000);
  return notif;
}

// ─── Reminder Checking ────────────────────────────────────────

/** Check for upcoming events and fire browser reminders */
export function setupEventReminders(events) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  events.forEach((event) => {
    if (!event.reminder) return;
    const eventStart = new Date(event.start).getTime();
    const reminderTime = eventStart - event.reminder * 60 * 1000;
    const delay = reminderTime - now;

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        showBrowserNotification(
          `⏰ Upcoming: ${event.title}`,
          `Starting in ${event.reminder} minutes`
        );
      }, delay);
    }
  });
}
