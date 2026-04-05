// Calendar service — app events + Google Calendar sync
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const eventsRef = (uid) => collection(db, 'users', uid, 'calendarEvents');
const eventRef = (uid, id) => doc(db, 'users', uid, 'calendarEvents', id);

// ─── App Events ───────────────────────────────────────────────

export async function createEvent(uid, data) {
  const ref = await addDoc(eventsRef(uid), {
    title: data.title,
    description: data.description || '',
    start: data.start, // ISO string
    end: data.end,     // ISO string
    allDay: data.allDay || false,
    color: data.color || '#6c63ff',
    type: data.type || 'task', // 'task' | 'meeting' | 'reminder' | 'deadline'
    source: 'app',
    googleEventId: null,
    reminder: data.reminder || null, // minutes before
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(uid, id, updates) {
  await updateDoc(eventRef(uid, id), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteEvent(uid, id) {
  await deleteDoc(eventRef(uid, id));
}

export async function getEvents(uid) {
  const q = query(eventsRef(uid), orderBy('start', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Google Calendar Sync ──────────────────────────────────────

/**
 * Fetch events from Google Calendar API and upsert into Firestore.
 * Requires the user's Google OAuth access token (from signInWithPopup credential).
 */
export async function syncGoogleCalendar(uid, accessToken) {
  if (!accessToken) throw new Error('No access token available');

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${threeMonthsAgo}&timeMax=${threeMonthsAhead}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  const googleEvents = data.items || [];

  // Get existing synced events to avoid duplicates
  const existing = await getEvents(uid);
  const existingGoogleIds = new Set(
    existing.filter((e) => e.source === 'google').map((e) => e.googleEventId)
  );

  const toSync = googleEvents.filter(
    (e) => !existingGoogleIds.has(e.id) && e.status !== 'cancelled'
  );

  // Upsert new events
  const promises = toSync.map((gEvent) =>
    addDoc(eventsRef(uid), {
      title: gEvent.summary || 'Untitled',
      description: gEvent.description || '',
      start: gEvent.start?.dateTime || gEvent.start?.date || '',
      end: gEvent.end?.dateTime || gEvent.end?.date || '',
      allDay: !gEvent.start?.dateTime,
      color: '#4285f4', // Google blue for synced events
      type: 'meeting',
      source: 'google',
      googleEventId: gEvent.id,
      htmlLink: gEvent.htmlLink || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  await Promise.all(promises);
  return toSync.length;
}

/** Remove all Google-synced events for this user */
export async function clearGoogleEvents(uid) {
  const events = await getEvents(uid);
  const googleEvents = events.filter((e) => e.source === 'google');
  await Promise.all(googleEvents.map((e) => deleteEvent(uid, e.id)));
}

/** Format events for react-big-calendar */
export function formatEventsForCalendar(events) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
    allDay: e.allDay,
    resource: { color: e.color, type: e.type, source: e.source, ...e },
  }));
}
