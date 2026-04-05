// Dashboard page — the main home page combining all modules
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, CheckSquare, Timer, Calendar, DollarSign,
  TrendingUp, ArrowRight, Flame, Trophy, Plus,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getGoals } from '../services/goalsService';
import { getTodos } from '../services/todosService';
import { getTransactions, calcMonthSummary } from '../services/financeService';
import { getEvents } from '../services/calendarService';
import { calcProgress, formatCurrency, formatDate, getCurrentMonthKey } from '../utils';
import { getDailyQuote } from '../constants/quotes';
import ProgressBar from '../components/common/ProgressBar';
import { SkeletonList } from '../components/common/Loading';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format as fnsFormat, subDays } from 'date-fns';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [goals, setGoals] = useState([]);
  const [todos, setTodos] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const quote = getDailyQuote();
  const greeting = getGreeting();
  const displayName = profile?.displayName || user?.displayName || 'there';

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getGoals(user.uid),
      getTodos(user.uid),
      getTransactions(user.uid, { month: getCurrentMonthKey() }),
      getEvents(user.uid),
    ]).then(([g, t, tx, ev]) => {
      setGoals(g);
      setTodos(t);
      setTransactions(tx);
      setEvents(ev);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  // Computed stats
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const todayTodos = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
    return isToday(d);
  });
  const pendingTodos = todos.filter((t) => t.status === 'pending');
  const { income, expense, balance } = calcMonthSummary(transactions);

  // Upcoming events (next 3)
  const upcomingEvents = events
    .filter((e) => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 3);

  // Weekly productivity chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = fnsFormat(d, 'yyyy-MM-dd');
    const dayProgress = goals.reduce((sum, g) => {
      // Count progress on this day from any goal — simplified
      return sum + calcProgress(g.currentValue, g.targetValue);
    }, 0);
    return {
      day: fnsFormat(d, 'EEE'),
      progress: Math.min(100, Math.round(dayProgress / Math.max(goals.length, 1))),
    };
  });

  // Overall completion %
  const avgCompletion = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + calcProgress(g.currentValue, g.targetValue), 0) / goals.length)
    : 0;

  const currencySymbol = profile?.currencySymbol || '₹';

  if (loading) {
    return (
      <div>
        <div className="dashboard-greeting">
          <div className="skeleton" style={{ height: 32, width: 280, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 18, width: 200, borderRadius: 8 }} />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <h1 style={{ margin: 0 }}>{greeting}, {displayName.split(' ')[0]}! 👋</h1>
        <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — Let's make today count.
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Active Goals"
          value={activeGoals.length}
          icon={Target}
          color="var(--color-primary)"
          bg="var(--color-primary-alpha)"
          sub={`${completedGoals.length} completed`}
          to="/goals"
        />
        <StatCard
          label="Tasks Pending"
          value={pendingTodos.length}
          icon={CheckSquare}
          color="var(--color-accent)"
          bg="var(--color-accent-alpha)"
          sub={`${todayTodos.length} due today`}
          to="/todos"
        />
        <StatCard
          label="Monthly Balance"
          value={formatCurrency(balance, currencySymbol)}
          icon={DollarSign}
          color={balance >= 0 ? 'var(--color-accent)' : 'var(--color-danger)'}
          bg={balance >= 0 ? 'var(--color-accent-alpha)' : 'var(--color-danger-alpha)'}
          sub={`Income: ${formatCurrency(income, currencySymbol)}`}
          to="/finance"
        />
        <StatCard
          label="Goal Progress"
          value={`${avgCompletion}%`}
          icon={TrendingUp}
          color="var(--color-warning)"
          bg="var(--color-warning-alpha)"
          sub={`${goals.length} total goals`}
          to="/analytics"
        />
      </div>

      {/* Main content grid */}
      <div className="dashboard-main">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Goals */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} color="var(--color-primary)" />
                Active Goals
              </h3>
              <Link to="/goals" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {activeGoals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <Target size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: '0.9rem' }}>No active goals. <Link to="/goals">Add a goal →</Link></p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeGoals.slice(0, 4).map((goal) => {
                  const pct = calcProgress(goal.currentValue || 0, goal.targetValue);
                  return (
                    <Link key={goal.id} to={`/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{goal.title}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: pct >= 100 ? 'var(--color-accent)' : 'var(--color-primary)' }}>{pct}%</span>
                        </div>
                        <ProgressBar current={goal.currentValue || 0} target={goal.targetValue} height={6} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>{goal.currentValue || 0} / {goal.targetValue} {goal.unit}</span>
                          <span className="badge badge-muted" style={{ padding: '1px 8px', fontSize: '0.72rem' }}>{goal.category}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Progress Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="var(--color-accent)" />
                Weekly Productivity
              </h3>
              <Link to="/analytics" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }}>
                Analytics <ArrowRight size={14} />
              </Link>
            </div>
            <div className="chart-container">
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Avg Progress']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progress"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#progressGrad)"
                    dot={{ fill: 'var(--color-primary)', r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={18} color="var(--color-accent)" />
                Pending Tasks
              </h3>
              <Link to="/todos" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {pendingTodos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                🎉 All tasks done! <Link to="/todos">Add more →</Link>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingTodos.slice(0, 5).map((todo) => (
                  <div key={todo.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: todo.priority === 'high' ? 'var(--color-danger)' : todo.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-accent)',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', flex: 1 }}>{todo.title}</span>
                    {todo.dueDate && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {formatDate(todo.dueDate, 'dd MMM')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Motivation Card */}
          <div className="motivation-card animate-bounce-in">
            <div style={{ fontSize: '24px', marginBottom: 8 }}>💡</div>
            <p className="motivation-quote">"{quote.text}"</p>
            <p className="motivation-author">— {quote.author}</p>
          </div>

          {/* Streak card */}
          <div className="streak-widget">
            <div>
              <Flame size={28} color="#f8961e" />
            </div>
            <div>
              <div className="streak-count">{activeGoals.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Active Goals
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Keep the momentum going! 🔥
              </div>
            </div>
          </div>

          {/* Monthly Finance Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} color="var(--color-accent)" />
                This Month
              </h3>
              <Link to="/finance" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }}>
                Details <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FinanceRow label="Income" value={formatCurrency(income, currencySymbol)} color="var(--color-accent)" />
              <FinanceRow label="Expenses" value={formatCurrency(expense, currencySymbol)} color="var(--color-danger)" />
              <div style={{ height: 1, background: 'var(--border-color)' }} />
              <FinanceRow
                label="Balance"
                value={formatCurrency(balance, currencySymbol)}
                color={balance >= 0 ? 'var(--color-accent)' : 'var(--color-danger)'}
                bold
              />
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="var(--color-primary)" />
                Upcoming
              </h3>
              <Link to="/calendar" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }}>
                Calendar <ArrowRight size={14} />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '12px 0' }}>
                No upcoming events. <Link to="/calendar">Add one →</Link>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingEvents.map((event) => (
                  <div key={event.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: event.color || 'var(--color-primary)',
                      flexShrink: 0,
                      marginTop: 5,
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{event.title}</p>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {formatDate(event.start, 'EEE, MMM d · h:mm a')}
                      </p>
                    </div>
                    {event.source === 'google' && (
                      <span style={{ fontSize: '0.7rem', background: '#e8f0fe', color: '#4285f4', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        Google
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievement / Score */}
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <Trophy size={32} color="var(--color-warning)" style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {avgCompletion}%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 12 }}>
              Overall Goal Completion
            </div>
            <ProgressBar current={avgCompletion} target={100} height={10} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
              {avgCompletion >= 80 ? '🔥 Exceptional performance!' :
               avgCompletion >= 50 ? '💪 Great progress, keep it up!' :
               '🚀 Keep pushing towards your goals!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, sub, to }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
        <div className="stat-icon">
          <Icon size={22} />
        </div>
        <div className="stat-info">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {sub && <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
        </div>
      </div>
    </Link>
  );
}

function FinanceRow({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? '1.1rem' : '0.95rem', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
