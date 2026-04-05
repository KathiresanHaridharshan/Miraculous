// Finance service
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, setDoc, getDoc, query, orderBy, where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

const txRef = (uid) => collection(db, 'users', uid, 'transactions');
const txDocRef = (uid, id) => doc(db, 'users', uid, 'transactions', id);
const budgetRef = (uid, monthKey) => doc(db, 'users', uid, 'budgets', monthKey);

// ─── Transactions ────────────────────────────────────────────

export async function addTransaction(uid, data) {
  const ref = await addDoc(txRef(uid), {
    type: data.type, // 'income' | 'expense'
    amount: Number(data.amount),
    category: data.category,
    date: data.date,
    notes: data.notes || '',
    paymentMethod: data.paymentMethod || 'cash',
    isRecurring: data.isRecurring || false,
    recurringFrequency: data.recurringFrequency || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransaction(uid, id, updates) {
  await updateDoc(txDocRef(uid, id), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(uid, id) {
  await deleteDoc(txDocRef(uid, id));
}

export async function getTransactions(uid, filters = {}) {
  let q = query(txRef(uid), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  let txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Client-side filtering
  if (filters.type) txs = txs.filter((t) => t.type === filters.type);
  if (filters.category) txs = txs.filter((t) => t.category === filters.category);
  if (filters.month) {
    txs = txs.filter((t) => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return format(d, 'yyyy-MM') === filters.month;
    });
  }
  return txs;
}

// ─── Budgets ─────────────────────────────────────────────────

export async function setBudget(uid, monthKey, budgetData) {
  await setDoc(
    budgetRef(uid, monthKey),
    { ...budgetData, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getBudget(uid, monthKey) {
  const snap = await getDoc(budgetRef(uid, monthKey));
  return snap.exists() ? snap.data() : null;
}

// ─── Aggregations ─────────────────────────────────────────────

export function calcMonthSummary(transactions) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function groupByCategory(transactions) {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
}

export function groupByDate(transactions) {
  return transactions.reduce((acc, t) => {
    const date = t.date?.toDate
      ? format(t.date.toDate(), 'yyyy-MM-dd')
      : format(new Date(t.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[date].income += t.amount;
    else acc[date].expense += t.amount;
    return acc;
  }, {});
}
