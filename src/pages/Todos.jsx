// Todos page — full task manager with priorities, due dates, subtasks
import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Search, X, Trash2, ChevronDown, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getTodos, createTodo, updateTodo, deleteTodo, toggleTodoStatus, updateSubtask } from '../services/todosService';
import { PRIORITIES } from '../constants';
import { formatDate, getStatusBadgeClass } from '../utils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Loading';
import { isToday, isPast, format } from 'date-fns';

export default function Todos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [expandedTodos, setExpandedTodos] = useState({});

  const load = async () => {
    try { const data = await getTodos(user.uid); setTodos(data); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSave = async (formData) => {
    const optimisticId = editingTodo ? editingTodo.id : `temp-${Date.now()}`;
    const optimisticTask = {
      id: optimisticId,
      ...formData,
      status: formData.status || 'pending',
      createdAt: editingTodo ? editingTodo.createdAt : new Date(),
    };

    setTodos(prev => {
      if (editingTodo) return prev.map(t => t.id === optimisticId ? optimisticTask : t);
      return [optimisticTask, ...prev];
    });

    toast.success(editingTodo ? 'Task updated!' : 'Task created! ✅');
    setShowForm(false);
    setEditingTodo(null);

    try {
      if (editingTodo) {
        await updateTodo(user.uid, optimisticId, formData);
      } else {
        await createTodo(user.uid, formData);
      }
      load(); // Silently sync server state
    } catch { 
      toast.error('Failed to sync to server');
      load(); // Revert on failure
    }
  };

  const handleToggle = async (todo) => {
    try {
      const newStatus = await toggleTodoStatus(user.uid, todo.id, todo.status);
      setTodos(ts => ts.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
      if (newStatus === 'completed') toast.success('Task completed! 🎉');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    try { await deleteTodo(user.uid, deleteTarget.id); toast.success('Deleted'); setDeleteTarget(null); load(); }
    catch { toast.error('Failed'); }
  };

  const handleSubtask = async (todo, idx) => {
    const updated = todo.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s);
    await updateSubtask(user.uid, todo.id, updated);
    setTodos(ts => ts.map(t => t.id === todo.id ? { ...t, subtasks: updated } : t));
  };

  const filtered = todos.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  const stats = { total: todos.length, pending: todos.filter(t => t.status === 'pending').length, completed: todos.filter(t => t.status === 'completed').length };

  const getDueStyle = (dueDate) => {
    if (!dueDate) return {};
    const d = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
    if (isPast(d) && !isToday(d)) return { color: 'var(--color-danger)' };
    if (isToday(d)) return { color: 'var(--color-warning)' };
    return {};
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">To-Do List</h1>
          <p className="page-subtitle">Manage tasks, priorities, and deadlines</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingTodo(null); setShowForm(true); }}>
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--color-primary)' },
          { label: 'Pending', value: stats.pending, color: 'var(--color-warning)' },
          { label: 'Completed', value: stats.completed, color: 'var(--color-accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option>
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {(search || filterPriority !== 'all' || filterStatus !== 'pending') && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterPriority('all'); setFilterStatus('pending'); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks found" text="Create your first task to get started."
          action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> New Task</button>} />
      ) : (
        <div className="card">
          {filtered.map((todo, i) => {
            const isExpanded = expandedTodos[todo.id];
            const subtasksDone = (todo.subtasks || []).filter(s => s.done).length;
            return (
              <div key={todo.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0' }}>
                  <button onClick={() => handleToggle(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginTop: 2 }}>
                    {todo.status === 'completed'
                      ? <CheckCircle2 size={20} color="var(--color-accent)" />
                      : <Circle size={20} color="var(--text-muted)" />
                    }
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: todo.status === 'completed' ? 'line-through' : 'none', opacity: todo.status === 'completed' ? 0.6 : 1 }}>
                        {todo.title}
                      </span>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITIES.find(p => p.value === todo.priority)?.color || '#ccc', flexShrink: 0 }} />
                    </div>
                    {todo.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{todo.description}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {todo.dueDate && (
                        <span style={{ fontSize: '0.76rem', ...getDueStyle(todo.dueDate) }}>
                          📅 {formatDate(todo.dueDate?.toDate ? todo.dueDate.toDate() : todo.dueDate, 'MMM d')}
                        </span>
                      )}
                      {todo.tags?.map(tag => <span key={tag} className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{tag}</span>)}
                      {todo.subtasks?.length > 0 && (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{subtasksDone}/{todo.subtasks.length} subtasks</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {todo.subtasks?.length > 0 && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setExpandedTodos(e => ({ ...e, [todo.id]: !isExpanded }))}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingTodo(todo); setShowForm(true); }}>✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(todo)}>🗑️</button>
                  </div>
                </div>
                {isExpanded && todo.subtasks?.length > 0 && (
                  <div style={{ paddingLeft: 32, paddingBottom: 12 }}>
                    {todo.subtasks.map((sub, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <button onClick={() => handleSubtask(todo, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {sub.done ? <CheckCircle2 size={16} color="var(--color-accent)" /> : <Circle size={16} color="var(--text-muted)" />}
                        </button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: sub.done ? 'line-through' : 'none', opacity: sub.done ? 0.6 : 1 }}>{sub.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TodoFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingTodo(null); }} onSave={handleSave} initialData={editingTodo} />
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Task" message={`Delete "${deleteTarget?.title}"?`} confirmLabel="Delete" />
    </div>
  );
}

function TodoFormModal({ isOpen, onClose, onSave, initialData }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', tags: '', subtasks: [] });
  const [subtaskInput, setSubtaskInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        title: initialData.title || '', description: initialData.description || '',
        priority: initialData.priority || 'medium',
        dueDate: initialData.dueDate ? (initialData.dueDate?.toDate ? format(initialData.dueDate.toDate(), 'yyyy-MM-dd') : initialData.dueDate) : '',
        tags: (initialData.tags || []).join(', '),
        subtasks: initialData.subtasks || [],
      } : { title: '', description: '', priority: 'medium', dueDate: today, tags: '', subtasks: [] });
    }
  }, [isOpen, initialData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    set('subtasks', [...form.subtasks, { title: subtaskInput.trim(), done: false }]);
    setSubtaskInput('');
  };

  const removeSubtask = (i) => set('subtasks', form.subtasks.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    setSaving(true);
    try {
      await onSave({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] });
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Task' : 'New Task'} size="lg"
      footer={<><button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : initialData ? 'Update' : 'Create'}</button></>}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" placeholder="Task title..." value={form.title} onChange={e => set('title', e.target.value)} autoFocus required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Optional description..." value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input className="form-input" placeholder="e.g. work, personal, urgent" value={form.tags} onChange={e => set('tags', e.target.value)} />
        </div>

        {/* Subtasks */}
        <div className="form-group">
          <label className="form-label">Subtasks</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" placeholder="Add subtask..." value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addSubtask}><Plus size={14} /></button>
          </div>
          {form.subtasks.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {form.subtasks.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {s.title}</span>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeSubtask(i)}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
