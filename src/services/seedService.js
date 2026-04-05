// Demo seed data — loads sample data for testing
import { createGoal, addProgressLog } from './goalsService';
import { createTodo } from './todosService';
import { addTransaction, setBudget } from './financeService';
import { createEvent } from './calendarService';
import { format, addDays, subDays, startOfMonth } from 'date-fns';

export async function seedDemoData(uid) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // ──── Goals ────────────────────────────────────────────────
  const g1 = await createGoal(uid, {
    title: 'Read 100 pages this week',
    description: 'Finish the current book by end of week',
    category: 'Learning',
    type: 'numeric',
    unit: 'pages',
    targetValue: 100,
    frequency: 'weekly',
    startDate: format(subDays(today, 3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 4), 'yyyy-MM-dd'),
    notes: '',
    status: 'active',
  });

  await addProgressLog(uid, g1, { value: 35, notes: 'Reading session 1', date: todayStr, source: 'manual' });
  await addProgressLog(uid, g1, { value: 20, notes: 'Reading session 2', date: format(subDays(today, 1), 'yyyy-MM-dd'), source: 'manual' });

  const g2 = await createGoal(uid, {
    title: 'Workout 5 hours this week',
    description: 'Mix of gym + running',
    category: 'Health',
    type: 'time',
    unit: 'hours',
    targetValue: 5,
    frequency: 'weekly',
    startDate: format(subDays(today, 3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 4), 'yyyy-MM-dd'),
    notes: '',
    status: 'active',
  });
  await addProgressLog(uid, g2, { value: 1.5, notes: 'Gym session', date: todayStr, source: 'timer' });
  await addProgressLog(uid, g2, { value: 0.75, notes: 'Morning run', date: format(subDays(today, 2), 'yyyy-MM-dd'), source: 'manual' });

  const g3 = await createGoal(uid, {
    title: 'Meditate 4 times this week',
    description: '10-minute mindfulness sessions',
    category: 'Wellness',
    type: 'count',
    unit: 'times',
    targetValue: 4,
    frequency: 'weekly',
    startDate: format(subDays(today, 3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 4), 'yyyy-MM-dd'),
    status: 'active',
  });
  await addProgressLog(uid, g3, { value: 1, notes: '', date: todayStr, source: 'manual' });
  await addProgressLog(uid, g3, { value: 1, notes: '', date: format(subDays(today, 1), 'yyyy-MM-dd'), source: 'manual' });

  const g4 = await createGoal(uid, {
    title: 'Save ₹5000 this month',
    description: 'Cut unnecessary expenses',
    category: 'Finance',
    type: 'custom',
    unit: 'rupees',
    targetValue: 5000,
    frequency: 'monthly',
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'),
    status: 'active',
  });
  await addProgressLog(uid, g4, { value: 1800, notes: 'Avoided eating out', date: todayStr, source: 'manual' });

  // ──── Todos ────────────────────────────────────────────────
  await createTodo(uid, {
    title: 'Review Q1 goals and set Q2 targets',
    description: 'Quarterly planning session',
    dueDate: format(addDays(today, 2), 'yyyy-MM-dd'),
    priority: 'high',
    tags: ['planning', 'productivity'],
    goalId: null,
    subtasks: [
      { id: '1', title: 'Gather Q1 data', done: true },
      { id: '2', title: 'Write review notes', done: false },
      { id: '3', title: 'Set new targets', done: false },
    ],
  });

  await createTodo(uid, {
    title: 'Buy new running shoes',
    dueDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    priority: 'medium',
    tags: ['health'],
  });

  await createTodo(uid, {
    title: 'Call internet provider about bill',
    priority: 'low',
    tags: ['admin'],
  });

  // ──── Finance ─────────────────────────────────────────────
  const monthKey = format(today, 'yyyy-MM');
  await setBudget(uid, monthKey, {
    total: 50000,
    categories: {
      Food: 12000,
      Transport: 5000,
      Shopping: 8000,
      Entertainment: 4000,
      Health: 3000,
      Utilities: 5000,
      Other: 13000,
    },
  });

  const sampleTxs = [
    { type: 'income', amount: 45000, category: 'Salary', date: format(startOfMonth(today), 'yyyy-MM-dd'), notes: 'Monthly salary', paymentMethod: 'bank transfer' },
    { type: 'income', amount: 8500, category: 'Freelance', date: format(subDays(today, 5), 'yyyy-MM-dd'), notes: 'Design project', paymentMethod: 'UPI' },
    { type: 'expense', amount: 2200, category: 'Food', date: format(subDays(today, 1), 'yyyy-MM-dd'), notes: 'Swiggy + groceries', paymentMethod: 'UPI' },
    { type: 'expense', amount: 850, category: 'Transport', date: todayStr, notes: 'Uber + metro', paymentMethod: 'UPI' },
    { type: 'expense', amount: 3500, category: 'Shopping', date: format(subDays(today, 3), 'yyyy-MM-dd'), notes: 'Clothes', paymentMethod: 'card' },
    { type: 'expense', amount: 1200, category: 'Entertainment', date: format(subDays(today, 2), 'yyyy-MM-dd'), notes: 'Movies + OTT', paymentMethod: 'card' },
    { type: 'expense', amount: 650, category: 'Health', date: format(subDays(today, 4), 'yyyy-MM-dd'), notes: 'Gym membership', paymentMethod: 'UPI' },
  ];

  for (const tx of sampleTxs) {
    await addTransaction(uid, tx);
  }

  // ──── Calendar Events ─────────────────────────────────────
  const events = [
    {
      title: 'Weekly Team Standup',
      description: 'Quick sync with the team',
      start: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
      end: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
      color: '#6c63ff',
      type: 'meeting',
      reminder: 15,
    },
    {
      title: 'Doctor Appointment',
      description: 'Annual check-up',
      start: addDays(new Date(), 3).toISOString(),
      end: addDays(new Date(), 3).toISOString(),
      color: '#ef476f',
      type: 'reminder',
      reminder: 60,
    },
    {
      title: 'Project Deadline',
      description: 'Submit final deliverables',
      start: addDays(new Date(), 7).toISOString(),
      end: addDays(new Date(), 7).toISOString(),
      color: '#ffd166',
      type: 'deadline',
      reminder: 120,
    },
  ];

  for (const event of events) {
    await createEvent(uid, event);
  }

  return { message: 'Demo data loaded successfully!' };
}
