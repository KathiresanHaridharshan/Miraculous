// Finance page — income/expense tracker with charts and budgets
import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Trash2, Search, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import {
  getTransactions, addTransaction, updateTransaction, deleteTransaction,
  calcMonthSummary, groupByCategory,
} from '../services/financeService';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, CHART_COLORS,
} from '../constants';
import { formatCurrency, getCurrentMonthKey } from '../utils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Loading';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

export default function Finance() {
  const { user, profile } = useAuth();
  const currencySymbol = profile?.currencySymbol || '₹';
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonthKey());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'analytics'

  const load = async () => {
    try { const data = await getTransactions(user.uid); setTransactions(data); }
    catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSave = async (formData) => {
    const optimisticId = editingTx ? editingTx.id : `temp-${Date.now()}`;
    const optimisticTx = {
      id: optimisticId,
      ...formData,
      amount: Number(formData.amount),
      createdAt: editingTx ? editingTx.createdAt : new Date(),
    };

    setTransactions(prev => {
      if (editingTx) return prev.map(t => t.id === optimisticId ? optimisticTx : t);
      return [optimisticTx, ...prev];
    });

    toast.success(editingTx ? 'Updated!' : 'Added! 💰');
    setShowForm(false);
    setEditingTx(null);

    try {
      if (editingTx) {
        await updateTransaction(user.uid, optimisticId, formData);
      } else {
        await addTransaction(user.uid, formData);
      }
      load(); // Silently sync server state
    } catch {
      toast.error('Failed to sync to server');
      load(); // Revert on failure
    }
  };

  const handleDelete = async () => {
    try { await deleteTransaction(user.uid, deleteTarget.id); toast.success('Deleted'); setDeleteTarget(null); load(); }
    catch { toast.error('Failed'); }
  };

  // Filter
  const filtered = transactions.filter(t => {
    const matchType = filterType === 'all' || t.type === filterType;
    const matchSearch = !search || t.category.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchMonth = !filterMonth || (() => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return format(d, 'yyyy-MM') === filterMonth;
    })();
    return matchType && matchSearch && matchMonth;
  });

  const monthTxs = transactions.filter(t => {
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return format(d, 'yyyy-MM') === filterMonth;
  });

  const { income, expense, balance } = calcMonthSummary(monthTxs);

  // Category chart data
  const categoryData = Object.entries(groupByCategory(monthTxs.filter(t => t.type === 'expense')))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Monthly trend (last 6 months)
  const trendData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthKey = format(d, 'yyyy-MM');
    const monthTxs2 = transactions.filter(t => {
      const tx = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return format(tx, 'yyyy-MM') === monthKey;
    });
    const { income: inc, expense: exp } = calcMonthSummary(monthTxs2);
    return { month: format(d, 'MMM'), income: inc, expense: exp };
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle">Track income, expenses, and manage your budget</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingTx(null); setShowForm(true); }}>
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Income', value: formatCurrency(income, currencySymbol), color: 'var(--color-accent)', icon: TrendingUp, bg: 'var(--color-accent-alpha)' },
          { label: 'Expenses', value: formatCurrency(expense, currencySymbol), color: 'var(--color-danger)', icon: TrendingDown, bg: 'var(--color-danger-alpha)' },
          { label: 'Balance', value: formatCurrency(balance, currencySymbol), color: balance >= 0 ? 'var(--color-accent)' : 'var(--color-danger)', icon: DollarSign, bg: balance >= 0 ? 'var(--color-accent-alpha)' : 'var(--color-danger-alpha)' },
          { label: 'Transactions', value: monthTxs.length, color: 'var(--color-primary)', icon: DollarSign, bg: 'var(--color-primary-alpha)' },
        ].map(({ label, value, color, icon: Icon, bg }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['transactions', 'analytics'].map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Filters */}
          <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
              </div>
              <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input className="form-input" type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 'auto' }} />
              {(search || filterType !== 'all') && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterType('all'); }}><X size={14} /> Clear</button>
              )}
            </div>
          </div>

          {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
            <EmptyState icon={DollarSign} title="No transactions" text="Add your first transaction to start tracking finances."
              action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Add Transaction</button>} />
          ) : (
            <div className="card">
              {filtered.map((tx, i) => {
                const cats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
                const cat = cats.find(c => c.value === tx.category);
                const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: tx.type === 'income' ? 'var(--color-accent-alpha)' : 'var(--color-danger-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {cat?.icon || (tx.type === 'income' ? '💰' : '💸')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.category}{tx.notes && ` · `}{tx.notes && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{tx.notes}</span>}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{format(d, 'EEE, MMM d yyyy')} · {tx.paymentMethod}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: tx.type === 'income' ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount, currencySymbol)}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingTx(tx); setShowForm(true); }}>✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(tx)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Analytics tab */
        <div className="grid grid-2" style={{ gap: 20 }}>
          {/* Expense by category */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 20 }}>Expenses by Category</h3>
            {categoryData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No expense data</p>
            ) : (
              <>
                <div className="chart-container">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => [formatCurrency(v, currencySymbol), 'Amount']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: 16 }}>
                  {categoryData.slice(0, 5).map(({ name, value }, idx) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length], display: 'inline-block' }} />
                        {name}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatCurrency(value, currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Monthly trend */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 20 }}>6-Month Trend</h3>
            <div className="chart-container">
              <ResponsiveContainer>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [formatCurrency(v, currencySymbol)]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <TransactionFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingTx(null); }} onSave={handleSave} initialData={editingTx} />
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Transaction" message={`Delete this ${deleteTarget?.type} of ${formatCurrency(deleteTarget?.amount, currencySymbol)}?`} confirmLabel="Delete" />
    </div>
  );
}

function TransactionFormModal({ isOpen, onClose, onSave, initialData }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food', date: today, notes: '', paymentMethod: 'cash', isRecurring: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        type: initialData.type || 'expense', amount: String(initialData.amount || ''),
        category: initialData.category || 'Food',
        date: initialData.date?.toDate ? format(initialData.date.toDate(), 'yyyy-MM-dd') : (initialData.date || today),
        notes: initialData.notes || '', paymentMethod: initialData.paymentMethod || 'cash', isRecurring: initialData.isRecurring || false,
      } : { type: 'expense', amount: '', category: 'Food', date: today, notes: '', paymentMethod: 'cash', isRecurring: false });
    }
  }, [isOpen, initialData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return toast.error('Enter an amount');
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Transaction' : 'Add Transaction'} size="md"
      footer={<><button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : initialData ? 'Update' : 'Add'}</button></>}>
      <form onSubmit={handleSubmit}>
        {/* Type toggle */}
        <div className="form-group">
          <label className="form-label">Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['expense', 'income'].map(t => (
              <button key={t} type="button" className={`btn ${form.type === t ? (t === 'income' ? 'btn-accent' : 'btn-danger') : 'btn-secondary'} btn-sm`}
                style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => { set('type', t); set('category', t === 'income' ? 'Salary' : 'Food'); }}>
                {t === 'income' ? '💰' : '💸'} {t}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Optional description..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}
