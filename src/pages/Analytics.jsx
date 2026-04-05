// Analytics page — comprehensive insights across all modules
import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, CheckSquare, DollarSign, Clock, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllGoalsWithLogs } from '../services/goalsService';
import { getTransactions, calcMonthSummary, groupByCategory } from '../services/financeService';
import { getTimerSessions } from '../services/timerService';
import { getTodos } from '../services/todosService';
import { calcProgress, formatCurrency, getCurrentMonthKey } from '../utils';
import { CHART_COLORS, EXPENSE_CATEGORIES } from '../constants';
import { SkeletonList } from '../components/common/Loading';
import ProgressBar from '../components/common/ProgressBar';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

export default function Analytics() {
  const { user, profile } = useAuth();
  const currencySymbol = profile?.currencySymbol || '₹';
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAllGoalsWithLogs(user.uid),
      getTransactions(user.uid),
      getTimerSessions(user.uid),
      getTodos(user.uid),
    ]).then(([g, tx, s, t]) => {
      setGoals(g);
      setTransactions(tx);
      setSessions(s);
      setTodos(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Analytics</h1>
          </div>
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  // ─── Computations ─────────────────────────────────────

  // Goal progress overview
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + calcProgress(g.currentValue || 0, g.targetValue), 0) / goals.length)
    : 0;

  // Category breakdown for goals
  const goalsByCategory = goals.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});
  const goalCategoryData = Object.entries(goalsByCategory).map(([name, value]) => ({ name, value }));

  // Finance — last 6 months
  const financeMonths = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthKey = format(d, 'yyyy-MM');
    const monthTxs = transactions.filter(t => {
      try {
        const tx = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return format(tx, 'yyyy-MM') === monthKey;
      } catch { return false; }
    });
    const { income, expense } = calcMonthSummary(monthTxs);
    return { month: format(d, 'MMM yy'), income, expense, balance: income - expense };
  });

  // Current month finance
  const currentMonthTxs = transactions.filter(t => {
    try {
      const tx = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return format(tx, 'yyyy-MM') === getCurrentMonthKey();
    } catch { return false; }
  });
  const { income, expense, balance } = calcMonthSummary(currentMonthTxs);

  // Expense category data
  const expCatRaw = groupByCategory(currentMonthTxs.filter(t => t.type === 'expense'));
  const expCatData = Object.entries(expCatRaw)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Focus sessions — last 7 days
  const focusData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayKey = format(d, 'yyyy-MM-dd');
    const dayMins = sessions
      .filter(s => {
        try {
          const sd = s.startTime ? new Date(s.startTime) : s.createdAt?.toDate();
          return sd && format(sd, 'yyyy-MM-dd') === dayKey;
        } catch { return false; }
      })
      .reduce((sum, s) => sum + Math.round((s.duration || 0) / 60), 0);
    return { day: format(d, 'EEE'), minutes: dayMins };
  });

  const totalFocusMins = sessions.reduce((sum, s) => sum + Math.round((s.duration || 0) / 60), 0);
  const avgFocusMinsPerDay = Math.round(totalFocusMins / 7);

  // Todos stats
  const completedTodos = todos.filter(t => t.status === 'completed').length;
  const todoCompletionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  // Productivity radar
  const radarData = [
    { subject: 'Goals', A: avgGoalProgress },
    { subject: 'Todos', A: todoCompletionRate },
    { subject: 'Focus', A: Math.min(100, Math.round((avgFocusMinsPerDay / 60) * 100)) },
    { subject: 'Finance', A: balance > 0 ? Math.min(100, Math.round((balance / (income || 1)) * 100)) : 0 },
    { subject: 'Streak', A: Math.min(100, activeGoals.length * 10) },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights across all your productivity modules</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: Target, label: 'Goal Progress', value: `${avgGoalProgress}%`, color: 'var(--color-primary)', bg: 'var(--color-primary-alpha)' },
          { icon: CheckSquare, label: 'Task Completion', value: `${todoCompletionRate}%`, color: 'var(--color-accent)', bg: 'var(--color-accent-alpha)' },
          { icon: Clock, label: 'Focus Time', value: `${Math.floor(totalFocusMins / 60)}h ${totalFocusMins % 60}m`, color: 'var(--color-warning)', bg: 'var(--color-warning-alpha)' },
          { icon: DollarSign, label: 'Monthly Balance', value: formatCurrency(balance, currencySymbol), color: balance >= 0 ? 'var(--color-accent)' : 'var(--color-danger)', bg: balance >= 0 ? 'var(--color-accent-alpha)' : 'var(--color-danger-alpha)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-2" style={{ marginBottom: 20, gap: 20 }}>
        {/* Productivity Radar */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="var(--color-primary)" /> Productivity Score
          </h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Radar name="Score" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus sessions trend */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--color-warning)" /> Daily Focus (7 days)
          </h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={focusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
                <Tooltip formatter={v => [`${v} min`, 'Focus']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                <Bar dataKey="minutes" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20, gap: 20 }}>
        {/* Finance trend */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="var(--color-accent)" /> Finance (6 months)
          </h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={financeMonths}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={v => [formatCurrency(v, currencySymbol)]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="var(--color-accent)" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="var(--color-danger)" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goals by category */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="var(--color-primary)" /> Goals by Category
          </h3>
          {goalCategoryData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No goals yet</p>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={goalCategoryData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {goalCategoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Individual goals progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} color="var(--color-primary)" /> Active Goals Progress
        </h3>
        {activeGoals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No active goals to display</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeGoals.map(goal => {
              const pct = calcProgress(goal.currentValue || 0, goal.targetValue);
              return (
                <div key={goal.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{goal.title}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pct >= 100 ? 'var(--color-accent)' : 'var(--color-primary)' }}>{pct}%</span>
                  </div>
                  <ProgressBar current={goal.currentValue || 0} target={goal.targetValue} height={8} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{goal.currentValue || 0} / {goal.targetValue} {goal.unit}</span>
                    <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{goal.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick stats summary */}
      <div className="grid grid-4">
        {[
          { label: 'Total Goals', value: goals.length, icon: '🎯' },
          { label: 'Completed Goals', value: completedGoals.length, icon: '✅' },
          { label: 'Tasks Done', value: completedTodos, icon: '📋' },
          { label: 'Sessions Saved', value: sessions.length, icon: '⏱️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
