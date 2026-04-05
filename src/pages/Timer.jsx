// Timer page — Stopwatch, Focus timer, Pomodoro with session saving
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Save, Timer as TimerIcon, Coffee, Brain, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { saveTimerSession, getTimerSessions, deleteTimerSession, formatDuration, formatDurationHuman } from '../services/timerService';
import { getGoals, addProgressLog } from '../services/goalsService';
import { SkeletonList } from '../components/common/Loading';
import { ConfirmModal } from '../components/common/Modal';
import { format } from 'date-fns';

const MODES = [
  { id: 'stopwatch', label: 'Stopwatch', icon: Clock },
  { id: 'focus', label: 'Focus', icon: Brain },
  { id: 'pomodoro', label: 'Pomodoro', icon: Coffee },
];
const POMODORO = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };

export default function Timer() {
  const { user } = useAuth();
  const [mode, setMode] = useState('stopwatch');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(25 * 60);
  const [pomPhase, setPomPhase] = useState('work');
  const [pomCount, setPomCount] = useState(0);
  const [focusTarget, setFocusTarget] = useState(25);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activityName, setActivityName] = useState('Deep Work');
  const [linkedGoal, setLinkedGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getTimerSessions(user.uid), getGoals(user.uid)]).then(([s, g]) => {
      setSessions(s);
      setGoals(g.filter(g => g.status === 'active'));
      setSessionsLoading(false);
    });
  }, [user]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const startTimer = () => {
    if (running) return;
    setStartTime(new Date());
    intervalRef.current = setInterval(() => {
      if (mode === 'stopwatch') {
        setElapsed(e => e + 1);
      } else {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'focus') toast.success('⏰ Focus session complete!');
            else {
              if (pomPhase === 'work') {
                setPomCount(n => n + 1);
                setPomPhase('shortBreak');
                toast.success('☕ Short break time!');
                return POMODORO.shortBreak;
              } else {
                setPomPhase('work');
                toast.success('💪 Back to work!');
                return POMODORO.work;
              }
            }
            return 0;
          }
          return c - 1;
        });
      }
    }, 1000);
    setRunning(true);
  };

  const pause = () => { clearInterval(intervalRef.current); setRunning(false); };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setPomPhase('work');
    setPomCount(0);
    setCountdown(mode === 'focus' ? focusTarget * 60 : POMODORO.work);
  };

  const changeMode = (m) => { reset(); setMode(m); if (m === 'focus') setCountdown(focusTarget * 60); else if (m === 'pomodoro') setCountdown(POMODORO.work); };

  const handleSave = async () => {
    const duration = mode === 'stopwatch' ? elapsed : (mode === 'focus' ? focusTarget * 60 - countdown : pomCount * POMODORO.work);
    if (duration < 5) return toast.error('Session too short to save');
    try {
      await saveTimerSession(user.uid, { goalId: linkedGoal || null, activityName: activityName || 'General', startTime: startTime?.toISOString() || new Date().toISOString(), endTime: new Date().toISOString(), duration, notes, mode });
      
      // Submit progress to goal if linked
      if (linkedGoal) {
        const goal = goals.find(g => g.id === linkedGoal);
        if (goal) {
          let valueToAdd = 0;
          if (goal.unit === 'hours') valueToAdd = Number((duration / 3600).toFixed(2));
          else if (goal.unit === 'minutes') valueToAdd = Math.round(duration / 60);
          else if (goal.unit === 'times') valueToAdd = 1;
          else valueToAdd = Number((duration / 3600).toFixed(2));

          if (valueToAdd > 0) {
            await addProgressLog(user.uid, linkedGoal, {
              value: valueToAdd,
              notes: `Focus Session: ${activityName || 'General'}`,
            });
            toast.success(`Logged ${valueToAdd} ${goal.unit} to goal!`);
          }
        }
      }

      toast.success('Session saved! 💾');
      reset(); setNotes('');
      const updated = await getTimerSessions(user.uid);
      setSessions(updated);
    } catch { toast.error('Failed to save'); }
  };

  const handleDeleteSession = async () => {
    try {
      await deleteTimerSession(user.uid, deleteTarget.id);
      toast.success('Deleted');
      setDeleteTarget(null);
      setSessions(s => s.filter(x => x.id !== deleteTarget.id));
    } catch { toast.error('Failed'); }
  };

  const displayTime = mode === 'stopwatch' ? elapsed : countdown;
  const totalForMode = mode === 'focus' ? focusTarget * 60 : mode === 'pomodoro' ? POMODORO.work : null;
  const progressPct = totalForMode ? Math.max(0, ((totalForMode - countdown) / totalForMode) * 100) : 0;
  const totalSeconds = sessions.reduce((s, x) => s + (x.duration || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Timer</h1>
          <p className="page-subtitle">Track your focus sessions and build deep work habits</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {[
          { icon: '⏱️', label: 'Total Focus', value: formatDurationHuman(totalSeconds), color: 'var(--color-primary)' },
          { icon: '📅', label: "Today's", value: sessions.filter(s => { try { return format(new Date(s.startTime || s.createdAt?.toDate()), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'); } catch { return false; } }).length, color: 'var(--color-accent)' },
          { icon: '🍅', label: 'Pomodoros', value: pomCount, color: 'var(--color-warning)' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            {/* Mode selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {MODES.map((m) => (
                <button key={m.id} className={`btn ${mode === m.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1, flexDirection: 'column', height: 'auto', padding: '10px 4px', gap: 3 }}
                  onClick={() => changeMode(m.id)} disabled={running}>
                  <m.icon size={16} />
                  <span style={{ fontSize: '0.75rem' }}>{m.label}</span>
                </button>
              ))}
            </div>

            {mode === 'focus' && !running && (
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Focus Duration (minutes)</label>
                <input className="form-input" type="number" min={1} max={120} value={focusTarget}
                  onChange={(e) => { setFocusTarget(Number(e.target.value)); setCountdown(Number(e.target.value) * 60); }} />
              </div>
            )}

            {mode === 'pomodoro' && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span className={`badge ${pomPhase === 'work' ? 'badge-primary' : 'badge-success'}`}>
                  {pomPhase === 'work' ? '🎯 Focus' : '☕ Break'} #{pomCount + 1}
                </span>
              </div>
            )}

            {/* Timer display */}
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {mode !== 'stopwatch' ? (
                <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
                  <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="100" cy="100" r="88" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                    <circle cx="100" cy="100" r="88" fill="none" stroke="var(--color-primary)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPct / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatDuration(displayTime)}
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-2px', marginBottom: 20 }}>
                  {formatDuration(elapsed)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-icon" onClick={reset} style={{ width: 44, height: 44 }}><RotateCcw size={18} /></button>
                <button className={`btn ${running ? 'btn-warning' : 'btn-primary'}`} onClick={running ? pause : startTimer}
                  style={{ minWidth: 120, height: 48, fontSize: '1rem', fontWeight: 700 }}>
                  {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
                </button>
                <button className="btn btn-secondary btn-icon" onClick={handleSave} style={{ width: 44, height: 44 }}><Save size={18} /></button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Activity Name</label>
                <input className="form-input" placeholder="What are you working on?" value={activityName} onChange={(e) => setActivityName(e.target.value)} />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Link Goal</label>
                  <select className="form-select" value={linkedGoal} onChange={(e) => setLinkedGoal(e.target.value)}>
                    <option value="">None</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" placeholder="Optional..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="var(--color-primary)" /> Session History
              </h3>
            </div>
            {sessionsLoading ? <SkeletonList count={4} /> : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <TimerIcon size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No sessions yet. Start your first session!</p>
              </div>
            ) : (
              <div>
                {sessions.slice(0, 15).map((session, i) => (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < sessions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: session.mode === 'pomodoro' ? '#ef476f22' : 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {session.mode === 'pomodoro' ? '🍅' : session.mode === 'focus' ? '🧠' : '⏱️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.activityName || 'General'}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{formatDurationHuman(session.duration)}{session.startTime && ` · ${format(new Date(session.startTime), 'MMM d')}`}</div>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(session)} style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="motivation-card" style={{ padding: 20 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💡</div>
            <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Pomodoro Technique</p>
            <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
              <li>Work for 25 minutes</li>
              <li>Take a 5-minute break</li>
              <li>After 4 sessions: long break</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteSession}
        title="Delete Session" message={`Delete "${deleteTarget?.activityName}" session?`} confirmLabel="Delete" />
    </div>
  );
}
