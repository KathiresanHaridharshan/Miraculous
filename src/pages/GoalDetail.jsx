// GoalDetail page — individual goal view with progress logging
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, TrendingUp, Calendar,
  Target, Edit3, ChevronRight, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import {
  getGoal, updateGoal, deleteGoal,
  addProgressLog, getProgressLogs, deleteProgressLog,
} from '../services/goalsService';
import { calcProgress, formatDate, getStatusBadgeClass } from '../utils';
import ProgressBar from '../components/common/ProgressBar';
import Modal, { ConfirmModal } from '../components/common/Modal';
import { SkeletonList } from '../components/common/Loading';
import { GOAL_UNITS } from '../constants';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showDeleteGoal, setShowDeleteGoal] = useState(false);
  const [deleteLog, setDeleteLog] = useState(null);
  const [logForm, setLogForm] = useState({ value: '', notes: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [g, l] = await Promise.all([getGoal(user.uid, id), getProgressLogs(user.uid, id)]);
      if (!g) { navigate('/goals'); return; }
      setGoal(g);
      setLogs(l);
    } catch {
      toast.error('Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user && id) load(); }, [user, id]);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logForm.value) return toast.error('Enter a value');
    setSaving(true);
    try {
      await addProgressLog(user.uid, id, {
        value: Number(logForm.value),
        notes: logForm.notes,
        date: logForm.date,
      });
      toast.success('Progress logged! 🎯');
      setShowLogForm(false);
      setLogForm({ value: '', notes: '', date: new Date().toISOString().split('T')[0] });
      load();
    } catch {
      toast.error('Failed to log progress');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async () => {
    try {
      await deleteProgressLog(user.uid, id, deleteLog.id, deleteLog.value);
      toast.success('Log removed');
      setDeleteLog(null);
      load();
    } catch {
      toast.error('Failed to delete log');
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await deleteGoal(user.uid, id);
      toast.success('Goal deleted');
      navigate('/goals');
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 24, width: 120, borderRadius: 8, marginBottom: 24 }} />
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!goal) return null;

  const pct = calcProgress(goal.currentValue || 0, goal.targetValue);

  // Build chart data from logs
  const chartData = [...logs]
    .reverse()
    .slice(-14)
    .map((l) => ({
      date: l.date ? format(new Date(l.date), 'dd MMM') : 'N/A',
      value: l.value,
    }));

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <Link to="/goals" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Back to Goals
      </Link>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${getStatusBadgeClass(goal.status)}`}>{goal.status}</span>
              <span className="badge badge-muted">{goal.category}</span>
              <span className="badge badge-muted">{goal.frequency}</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>{goal.title}</h1>
            {goal.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{goal.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/goals')}>
              <Edit3 size={14} /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteGoal(true)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress section */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
            </span>
            <span style={{
              fontSize: '1.2rem', fontWeight: 800,
              color: pct >= 100 ? 'var(--color-accent)' : 'var(--color-primary)',
            }}>
              {pct}%
            </span>
          </div>
          <ProgressBar current={goal.currentValue || 0} target={goal.targetValue} height={12} />
          {pct >= 100 && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-accent)', fontWeight: 600 }}>
              <CheckCircle size={16} /> Goal achieved! 🎉
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          <MetaItem label="Start" value={formatDate(goal.startDate)} icon="📅" />
          <MetaItem label="End" value={formatDate(goal.endDate)} icon="🏁" />
          <MetaItem label="Logs" value={logs.length} icon="📊" />
          <MetaItem label="Unit" value={goal.unit} icon="📏" />
        </div>
      </div>

      {/* Two column layout */}
      <div className="dashboard-main">
        {/* Left — progress chart + log list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color="var(--color-primary)" />
                  Progress History
                </h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#goalGrad)"
                      dot={{ fill: 'var(--color-primary)', r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} color="var(--color-accent)" />
                Progress Logs
              </h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogForm(true)}>
                <Plus size={14} /> Log Progress
              </button>
            </div>

            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <Target size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: '0.9rem' }}>No progress logged yet. Start tracking!</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowLogForm(true)}>
                  <Plus size={14} /> Log Your First Entry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {logs.map((log, i) => (
                  <div key={log.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < logs.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--color-primary-alpha)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem',
                      flexShrink: 0,
                    }}>
                      +{log.value}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.value} {goal.unit}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {log.date ? format(new Date(log.date), 'EEE, MMM d') : 'No date'}
                        {log.notes && ` · ${log.notes}`}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setDeleteLog(log)}
                      style={{ color: 'var(--color-danger)', opacity: 0.6 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Milestones */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏆 Milestones
            </h3>
            {[25, 50, 75, 100].map((milestone) => {
              const reached = pct >= milestone;
              return (
                <div key={milestone} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--border-color)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: reached ? 'var(--color-accent-alpha)' : 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                  }}>
                    {reached ? '✅' : '⭕'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: reached ? 'var(--color-accent)' : 'var(--text-muted)' }}>
                      {milestone}% Complete
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {Math.round(goal.targetValue * milestone / 100)} {goal.unit}
                    </div>
                  </div>
                  {reached && <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>Achieved!</span>}
                </div>
              );
            })}
          </div>

          {/* Stats card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📈 Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatRow label="Total Logged" value={`${logs.reduce((s, l) => s + (l.value || 0), 0)} ${goal.unit}`} />
              <StatRow label="Avg per Entry" value={logs.length > 0 ? `${Math.round(logs.reduce((s, l) => s + l.value, 0) / logs.length * 10) / 10} ${goal.unit}` : '—'} />
              <StatRow label="Best Entry" value={logs.length > 0 ? `${Math.max(...logs.map(l => l.value))} ${goal.unit}` : '—'} />
              <StatRow label="Total Entries" value={logs.length} />
              <StatRow label="Remaining" value={`${Math.max(0, goal.targetValue - (goal.currentValue || 0))} ${goal.unit}`} />
            </div>
          </div>

          {/* Notes */}
          {goal.notes && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>📝 Notes</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{goal.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Log progress modal */}
      <Modal
        isOpen={showLogForm}
        onClose={() => setShowLogForm(false)}
        title="Log Progress"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowLogForm(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddLog} disabled={saving}>
              {saving ? 'Saving...' : 'Add Log'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddLog}>
          <div className="form-group">
            <label className="form-label">Value ({goal.unit}) *</label>
            <input
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder={`How many ${goal.unit}?`}
              value={logForm.value}
              onChange={(e) => setLogForm((f) => ({ ...f, value: e.target.value }))}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={logForm.date}
              onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input
              className="form-input"
              placeholder="e.g. Morning session, felt great!"
              value={logForm.notes}
              onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm delete log */}
      <ConfirmModal
        isOpen={!!deleteLog}
        onClose={() => setDeleteLog(null)}
        onConfirm={handleDeleteLog}
        title="Remove Log Entry"
        message={`Remove this entry of ${deleteLog?.value} ${goal.unit}? This will subtract it from your progress.`}
        confirmLabel="Remove"
      />

      {/* Confirm delete goal */}
      <ConfirmModal
        isOpen={showDeleteGoal}
        onClose={() => setShowDeleteGoal(false)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal"
        message={`Delete "${goal.title}" and all its progress logs? This cannot be undone.`}
        confirmLabel="Delete Goal"
      />
    </div>
  );
}

function MetaItem({ label, value, icon }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
