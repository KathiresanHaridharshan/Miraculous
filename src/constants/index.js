// App constants — categories, goal types, finance categories, colors

export const GOAL_TYPES = [
  { value: 'numeric', label: 'Numeric', example: 'Read 100 pages', icon: '🔢' },
  { value: 'time', label: 'Time-based', example: 'Workout 5 hours', icon: '⏱️' },
  { value: 'count', label: 'Count-based', example: 'Meditate 4 times', icon: '🔄' },
  { value: 'custom', label: 'Custom Unit', example: 'Save ₹5000', icon: '✏️' },
];

export const GOAL_CATEGORIES = [
  'Health', 'Fitness', 'Learning', 'Career', 'Finance',
  'Wellness', 'Relationships', 'Creativity', 'Personal', 'Other',
];

export const GOAL_STATUSES = [
  { value: 'active', label: 'Active', color: '#6c63ff' },
  { value: 'completed', label: 'Completed', color: '#06d6a0' },
  { value: 'paused', label: 'Paused', color: '#ffd166' },
  { value: 'missed', label: 'Missed', color: '#ef476f' },
];

export const GOAL_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export const GOAL_UNITS = [
  'pages', 'hours', 'minutes', 'times', 'rupees', 'km', 'steps',
  'calories', 'glasses', 'chapters', 'lessons', 'calls', 'tasks', 'custom',
];

export const GOAL_TEMPLATES = [
  {
    title: 'Read 100 pages per week',
    category: 'Learning',
    type: 'numeric',
    unit: 'pages',
    targetValue: 100,
    frequency: 'weekly',
  },
  {
    title: 'Exercise 5 hours per week',
    category: 'Health',
    type: 'time',
    unit: 'hours',
    targetValue: 5,
    frequency: 'weekly',
  },
  {
    title: 'Meditate 4 times per week',
    category: 'Wellness',
    type: 'count',
    unit: 'times',
    targetValue: 4,
    frequency: 'weekly',
  },
  {
    title: 'Walk 10,000 steps daily',
    category: 'Fitness',
    type: 'numeric',
    unit: 'steps',
    targetValue: 10000,
    frequency: 'daily',
  },
  {
    title: 'Save ₹10,000 per month',
    category: 'Finance',
    type: 'custom',
    unit: 'rupees',
    targetValue: 10000,
    frequency: 'monthly',
  },
  {
    title: 'Learn 1 lesson daily',
    category: 'Learning',
    type: 'count',
    unit: 'lessons',
    targetValue: 1,
    frequency: 'daily',
  },
];

// ─── Finance ────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { label: 'Food & Dining', value: 'Food', icon: '🍽️', color: '#ef476f' },
  { label: 'Transport', value: 'Transport', icon: '🚌', color: '#f8961e' },
  { label: 'Shopping', value: 'Shopping', icon: '🛍️', color: '#f3722c' },
  { label: 'Entertainment', value: 'Entertainment', icon: '🎬', color: '#9b2226' },
  { label: 'Health', value: 'Health', icon: '🏥', color: '#06d6a0' },
  { label: 'Utilities', value: 'Utilities', icon: '⚡', color: '#4cc9f0' },
  { label: 'Education', value: 'Education', icon: '📚', color: '#7209b7' },
  { label: 'Rent', value: 'Rent', icon: '🏠', color: '#560bad' },
  { label: 'Travel', value: 'Travel', icon: '✈️', color: '#480ca8' },
  { label: 'Fitness', value: 'Fitness', icon: '💪', color: '#3a0ca3' },
  { label: 'Subscriptions', value: 'Subscriptions', icon: '📱', color: '#3f37c9' },
  { label: 'Other', value: 'Other', icon: '📦', color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
  { label: 'Salary', value: 'Salary', icon: '💼', color: '#06d6a0' },
  { label: 'Freelance', value: 'Freelance', icon: '💻', color: '#4cc9f0' },
  { label: 'Business', value: 'Business', icon: '🏢', color: '#7209b7' },
  { label: 'Investment', value: 'Investment', icon: '📈', color: '#f8961e' },
  { label: 'Gift', value: 'Gift', icon: '🎁', color: '#ef476f' },
  { label: 'Other', value: 'Other', icon: '💰', color: '#6b7280' },
];

export const PAYMENT_METHODS = ['cash', 'card', 'UPI', 'bank transfer', 'cheque', 'other'];

// ─── Calendar ───────────────────────────────────────────────

export const EVENT_TYPES = [
  { value: 'task', label: 'Task', color: '#6c63ff' },
  { value: 'meeting', label: 'Meeting', color: '#4285f4' },
  { value: 'reminder', label: 'Reminder', color: '#ffd166' },
  { value: 'deadline', label: 'Deadline', color: '#ef476f' },
  { value: 'personal', label: 'Personal', color: '#06d6a0' },
];

export const EVENT_COLORS = [
  '#6c63ff', '#ef476f', '#06d6a0', '#ffd166',
  '#4285f4', '#f8961e', '#7209b7', '#4cc9f0',
];

export const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
];

// ─── Priority ───────────────────────────────────────────────

export const PRIORITIES = [
  { value: 'high', label: 'High', color: '#ef476f' },
  { value: 'medium', label: 'Medium', color: '#ffd166' },
  { value: 'low', label: 'Low', color: '#06d6a0' },
];

// ─── Chart colors ───────────────────────────────────────────

export const CHART_COLORS = [
  '#6c63ff', '#06d6a0', '#f8961e', '#ef476f',
  '#4cc9f0', '#f72585', '#7209b7', '#ffd166',
];
