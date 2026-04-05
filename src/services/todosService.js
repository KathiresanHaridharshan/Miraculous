// Todos service
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const todosRef = (uid) => collection(db, 'users', uid, 'todos');
const todoRef = (uid, id) => doc(db, 'users', uid, 'todos', id);

export async function createTodo(uid, data) {
  const ref = await addDoc(todosRef(uid), {
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate || null,
    priority: data.priority || 'medium',
    status: 'pending',
    tags: data.tags || [],
    goalId: data.goalId || null,
    subtasks: data.subtasks || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTodo(uid, id, updates) {
  await updateDoc(todoRef(uid, id), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTodo(uid, id) {
  await deleteDoc(todoRef(uid, id));
}

export async function getTodos(uid) {
  const q = query(todosRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function toggleTodoStatus(uid, id, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  await updateDoc(todoRef(uid, id), {
    status: newStatus,
    completedAt: newStatus === 'completed' ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
  return newStatus;
}

export async function updateSubtask(uid, todoId, subtasks) {
  await updateDoc(todoRef(uid, todoId), { subtasks, updatedAt: serverTimestamp() });
}
