// Goals page — full goal management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Target, Filter, Search, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getGoals, createGoal, updateGoal, deleteGoal,
} from '../services/goalsService';
import {
  GOAL_CATEGORIES, GOAL_STATUSES, GOAL_TYPES, GOAL_UNITS,
  GOAL_FREQUENCIES, GOAL_TEMPLATES,
} from '../constants';
import { calcProgress, formatDate, getStatusBadgeClass } from '../utils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Loading';

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const loadGoals = async () => {
    try {
      const data = await getGoals(user.uid);
      setGoals(data);
    } catch (e) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadGoals(); }, [user]);

  const handleSave = async (formData) => {
    // Generate a temporary ID so we can insert instantly into UI
    const optimisticId = editingGoal ? editingGoal.id : `temp-${Date.now()}`;
    const optimisticGoal = {
      id: optimisticId,
      ...formData,
      currentValue: editingGoal ? editingGoal.currentValue : 0,
      status: formData.status || 'active',
      createdAt: editingGoal ? editingGoal.createdAt : new Date(),
    };

    // Optimistically update UI
    setGoals((prev) => {
      if (editingGoal) return prev.map(g => g.id === optimisticId ? optimisticGoal : g);
      return [optimisticGoal, ...prev];
    });

    toast.success(editingGoal ? 'Goal updated!' : 'Goal created! 🎯');
    setShowForm(false);
    setEditingGoal(null);

    // Save in background
    try {
      if (editingGoal) {
        await updateGoal(user.uid, optimisticId, formData);
      } else {
        await createGoal(user.uid, formData);
      }
      loadGoals(); // Reload silently once confirmed
    } catch (e) {
      toast.error('Failed to sync goal to server');
      // Revert optimistic updates on failure
      loadGoals();
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGoal(user.uid, deleteTarget.id);
      toast.success('Goal deleted');
      setDeleteTarget(null);
      loadGoals();
    } catch (e) {
      toast.error('Failed to delete goal');
    }
  };

  // Filter and search
  const filtered = goals.filter((g) => {
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || g.status === filterStatus;
    const matchCategory = filterCategory === 'all' || g.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  // Stats
  const stats = {
    total: goals.length,
    active: goals.filter((g) => g.status === 'active').length,
    completed: goals.filter((g) => g.status === 'completed').length,
    missed: goals.filter((g) => g.status === 'missed').length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Track your weekly, monthly, and long-term goals</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingGoal(null); setShowForm(true); }}>
            <Plus size={18} /> New Goal
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Goals', value: stats.total, color: 'var(--color-primary)' },
          { label: 'Active', value: stats.active, color: 'var(--color-primary)' },
          { label: 'Completed', value: stats.completed, color: 'var(--color-accent)' },
          { label: 'Missed', value: stats.missed, color: 'var(--color-danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          {/* Status filter */}
          <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {GOAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Category filter */}
          <select className="form-select" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {(search || filterStatus !== 'all' || filterCategory !== 'all') && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCategory('all'); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Goals grid */}
      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title={search || filterStatus !== 'all' ? 'No matching goals' : 'No goals yet'}
          text={search ? `No goals match "${search}". Try a different search.` : 'Set your first goal and start making progress today.'}
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Create Goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-auto">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => { setEditingGoal(goal); setShowForm(true); }}
              onDelete={() => setDeleteTarget(goal)}
            />
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingGoal(null); }}
        onSave={handleSave}
        initialData={editingGoal}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All progress logs will also be deleted. This cannot be undone.`}
        confirmLabel="Delete Goal"
      />
    </div>
  );
}

// ─── Goal Card ───────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete }) {
  const pct = calcProgress(goal.currentValue || 0, goal.targetValue);
  const type = GOAL_TYPES.find((t) => t.value === goal.type);

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <div style={{ flex: 1 }}>
          <div className="goal-card-meta">
            <span className={`badge ${getStatusBadgeClass(goal.status)}`}>{goal.status}</span>
            <span className="badge badge-muted">{goal.category}</span>
            <span style={{ fontSize: '0.85rem' }}>{type?.icon}</span>
          </div>
          <div className="goal-card-title">{goal.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.preventDefault(); onEdit(); }} title="Edit">
            ✏️
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.preventDefault(); onDelete(); }} title="Delete">
            🗑️
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
          <span>{goal.currentValue || 0} / {goal.targetValue} {goal.unit}</span>
          <span style={{ fontWeight: 700, color: pct >= 100 ? 'var(--color-accent)' : 'var(--color-primary)' }}>{pct}%</span>
        </div>
        <ProgressBar current={goal.currentValue || 0} target={goal.targetValue} height={7} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          📅 {formatDate(goal.endDate)}
        </span>
        <Link to={`/goals/${goal.id}`} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)', padding: '4px 8px' }}>
          Details <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─── Goal Form Modal ──────────────────────────────────────────

function GoalFormModal({ isOpen, onClose, onSave, initialData }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState(defaultForm(today));
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'Personal',
        type: initialData.type || 'numeric',
        unit: initialData.unit || 'times',
        targetValue: initialData.targetValue || '',
        frequency: initialData.frequency || 'weekly',
        startDate: initialData.startDate || today,
        endDate: initialData.endDate || '',
        notes: initialData.notes || '',
        status: initialData.status || 'active',
      } : defaultForm(today));
    }
  }, [isOpen, initialData]);

  function defaultForm(today) {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return {
      title: '', description: '', category: 'Personal', type: 'numeric',
      unit: 'times', targetValue: '', frequency: 'weekly',
      startDate: today, endDate: end.toISOString().split('T')[0],
      notes: '', status: 'active',
    };
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter a goal title');
    if (!form.targetValue) return toast.error('Please enter a target value');
    setSaving(true);
    try {
      await onSave({ ...form, targetValue: Number(form.targetValue) });
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tpl) => {
    setForm((f) => ({ ...f, ...tpl, targetValue: String(tpl.targetValue) }));
    setShowTemplates(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Goal' : 'New Goal'}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
          </button>
        </>
      }
    >
      {/* Templates */}
      {!initialData && (
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowTemplates((v) => !v)}
            style={{ width: '100%' }}
          >
            {showTemplates ? 'Hide' : '⚡ Use a Goal Template'}
          </button>
          {showTemplates && (
            <div className="grid grid-2" style={{ marginTop: 10, gap: 8 }}>
              {GOAL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  onClick={() => applyTemplate(tpl)}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Goal Title *</label>
          <input className="form-input" placeholder="e.g. Read 100 pages this week" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="What's your goal about?" value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        </div>

        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Goal Type</label>
            <select className="form-select" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row cols-3">
          <div className="form-group">
            <label className="form-label">Target Value *</label>
            <input className="form-input" type="number" min="0" step="0.01" placeholder="e.g. 100" value={form.targetValue} onChange={(e) => set('targetValue', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-select" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {GOAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select className="form-select" value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
              {GOAL_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>
        </div>

        {initialData && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {GOAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" placeholder="Any extra notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </div>
      </form>
    </Modal>
  );
}
