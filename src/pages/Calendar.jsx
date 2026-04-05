// Calendar page — Monthly calendar with event management
import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/calendarService';
import { EVENT_TYPES, EVENT_COLORS } from '../constants';
import Modal, { ConfirmModal } from '../components/common/Modal';
import { SkeletonList } from '../components/common/Loading';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try { const data = await getEvents(user.uid); setEvents(data); }
    catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSave = async (formData) => {
    try {
      if (editingEvent) { await updateEvent(user.uid, editingEvent.id, formData); toast.success('Event updated!'); }
      else { await createEvent(user.uid, formData); toast.success('Event created! 📅'); }
      setShowForm(false); setEditingEvent(null); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    try { await deleteEvent(user.uid, deleteTarget.id); toast.success('Deleted'); setDeleteTarget(null); load(); }
    catch { toast.error('Failed'); }
  };

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day) => events.filter(e => {
    try { return isSameDay(parseISO(e.start), day); } catch { return false; }
  });

  const selectedDayEvents = getEventsForDay(selectedDate);

  const upcomingEvents = [...events]
    .filter(e => { try { return new Date(e.start) >= new Date(); } catch { return false; } })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 10);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Schedule events and manage your time</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setShowForm(true); }}>
            <Plus size={18} /> New Event
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Left — Calendar grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft size={20} /></button>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight size={20} /></button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      background: isSelected ? 'var(--color-primary)' : isCurrentDay ? 'var(--color-primary-alpha)' : 'transparent',
                      border: isCurrentDay && !isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                      borderRadius: 8,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      minHeight: 52,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isCurrentDay || isSelected ? 700 : 400,
                      color: isSelected ? 'white' : isCurrentDay ? 'var(--color-primary)' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.slice(0, 2).map((e, i) => (
                      <span key={i} style={{
                        width: '80%', height: 4, borderRadius: 2,
                        background: isSelected ? 'rgba(255,255,255,0.7)' : (e.color || 'var(--color-primary)'),
                      }} />
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: '0.6rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>+{dayEvents.length - 2}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day events */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{format(selectedDate, 'EEEE, MMMM d')}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Add
              </button>
            </div>
            {selectedDayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '16px 0' }}>
                No events on this day. <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)} style={{ padding: '2px 6px' }}>Add one →</button>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDayEvents.map(event => (
                  <EventItem key={event.id} event={event} onEdit={() => { setEditingEvent(event); setShowForm(true); }} onDelete={() => setDeleteTarget(event)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Upcoming */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="var(--color-primary)" /> Upcoming
              </h3>
            </div>
            {loading ? <SkeletonList count={4} /> : upcomingEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '16px 0' }}>No upcoming events</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingEvents.map(event => {
                  const d = new Date(event.start);
                  return (
                    <div key={event.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ textAlign: 'center', minWidth: 40, flexShrink: 0 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{format(d, 'MMM')}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{format(d, 'd')}</div>
                      </div>
                      <div style={{ flex: 1, borderLeft: `3px solid ${event.color || 'var(--color-primary)'}`, paddingLeft: 10 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {event.allDay ? 'All day' : format(d, 'h:mm a')}
                          {event.source === 'google' && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: '#e8f0fe', color: '#4285f4', padding: '1px 4px', borderRadius: 3 }}>Google</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingEvent(event); setShowForm(true); }}>✏️</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(event)}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Event type legend */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>Event Types</h3>
            {EVENT_TYPES.map(et => (
              <div key={et.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: et.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{et.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EventFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingEvent(null); }} onSave={handleSave} initialData={editingEvent} selectedDate={selectedDate} />
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Event" message={`Delete "${deleteTarget?.title}"?`} confirmLabel="Delete" />
    </div>
  );
}

function EventItem({ event, onEdit, onDelete }) {
  const d = event.start ? new Date(event.start) : null;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: event.color || 'var(--color-primary)', flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          {d && (event.allDay ? 'All day' : format(d, 'h:mm a'))}
          {event.description && ` · ${event.description}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit}>✏️</button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete}>🗑️</button>
      </div>
    </div>
  );
}

function EventFormModal({ isOpen, onClose, onSave, initialData, selectedDate }) {
  const now = selectedDate || new Date();
  const defStart = format(now, "yyyy-MM-dd'T'HH:mm");
  const defEnd = format(new Date(now.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");

  const [form, setForm] = useState({ title: '', description: '', start: defStart, end: defEnd, allDay: false, color: '#6c63ff', type: 'task' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        title: initialData.title || '', description: initialData.description || '',
        start: initialData.start || defStart, end: initialData.end || defEnd,
        allDay: initialData.allDay || false, color: initialData.color || '#6c63ff', type: initialData.type || 'task',
      } : { title: '', description: '', start: defStart, end: defEnd, allDay: false, color: '#6c63ff', type: 'task' });
    }
  }, [isOpen, initialData, defStart, defEnd]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Event' : 'New Event'} size="md"
      footer={<><button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : initialData ? 'Update' : 'Create'}</button></>}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Event Title *</label>
          <input className="form-input" placeholder="e.g. Team meeting" value={form.title} onChange={e => set('title', e.target.value)} autoFocus required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Optional description..." value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => { set('type', e.target.value); set('color', EVENT_TYPES.find(t => t.value === e.target.value)?.color || '#6c63ff'); }}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {EVENT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} className="form-label">
            <input type="checkbox" checked={form.allDay} onChange={e => set('allDay', e.target.checked)} style={{ width: 16, height: 16 }} />
            All day event
          </label>
        </div>
        {!form.allDay && (
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Start</label>
              <input className="form-input" type="datetime-local" value={form.start} onChange={e => set('start', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End</label>
              <input className="form-input" type="datetime-local" value={form.end} onChange={e => set('end', e.target.value)} />
            </div>
          </div>
        )}
        {form.allDay && (
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.start?.split('T')[0] || ''} onChange={e => { const v = e.target.value; set('start', v); set('end', v); }} />
          </div>
        )}
      </form>
    </Modal>
  );
}
