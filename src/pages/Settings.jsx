// Settings page — profile, preferences, theme, and data management
import React, { useState, useEffect } from 'react';
import { User, Palette, Bell, Database, LogOut, Save, Moon, Sun, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ConfirmModal } from '../components/common/Modal';

const CURRENCIES = [
  { symbol: 'Rs', label: 'Sri Lankan Rupee (Rs)' },
  { symbol: '₹', label: 'Indian Rupee (₹)' },
  { symbol: '$', label: 'US Dollar ($)' },
  { symbol: '€', label: 'Euro (€)' },
  { symbol: '£', label: 'British Pound (£)' },
  { symbol: '¥', label: 'Japanese Yen (¥)' },
  { symbol: '₩', label: 'Korean Won (₩)' },
  { symbol: 'AUD$', label: 'Australian Dollar (AUD$)' },
  { symbol: 'CAD$', label: 'Canadian Dollar (CAD$)' },
];

const ACCENT_COLORS = [
  { name: 'Purple', value: '#6c63ff' },
  { name: 'Blue', value: '#4cc9f0' },
  { name: 'Green', value: '#06d6a0' },
  { name: 'Orange', value: '#f8961e' },
  { name: 'Pink', value: '#f72585' },
  { name: 'Red', value: '#ef476f' },
  { name: 'Teal', value: '#4ecdc4' },
  { name: 'Indigo', value: '#7209b7' },
];

export default function Settings() {
  const { user, profile, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    currencySymbol: '₹',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekStartsOn: '0',
    notifications: true,
    accentColor: '#6c63ff',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm(prev => ({
        ...prev,
        displayName: profile.displayName || user?.displayName || '',
        currencySymbol: profile.currencySymbol || '₹',
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekStartsOn: profile.weekStartsOn || '0',
        notifications: profile.notifications !== false,
        accentColor: profile.accentColor || '#6c63ff',
      }));
    }
  }, [profile, user]);

  const setField = (k, v) => setProfileForm(f => ({ ...f, [k]: v }));

  const handleSaveProfile = async () => {
    if (!profileForm.displayName.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Settings saved! ⚙️');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch { toast.error('Failed to log out'); }
  };

  const SECTIONS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your Miraculous experience</p>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Sidebar nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="card" style={{ padding: 8 }}>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`btn ${activeSection === id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 2, gap: 10 }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* User card */}
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--color-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white',
              margin: '0 auto 10px',
            }}>
              {(profileForm.displayName || user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {profileForm.displayName || user?.displayName || 'User'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
            <button
              className="btn btn-danger btn-sm"
              style={{ marginTop: 14, width: '100%' }}
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Main settings panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeSection === 'profile' && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--color-primary)" /> Profile Settings
              </h3>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" placeholder="Your name" value={profileForm.displayName} onChange={e => setField('displayName', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed here. Use Google account settings.</p>
              </div>

              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={profileForm.currencySymbol} onChange={e => setField('currencySymbol', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Week Starts On</label>
                  <select className="form-select" value={profileForm.weekStartsOn} onChange={e => setField('weekStartsOn', e.target.value)}>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                  </select>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ marginTop: 8 }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={18} color="var(--color-primary)" /> Appearance
              </h3>

              {/* Theme toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Theme Mode</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Currently: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</div>
                </div>
                <button className="btn btn-secondary" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
                </button>
              </div>

              {/* Accent color */}
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 12 }}>Accent Color</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ACCENT_COLORS.map(({ name, value }) => (
                    <button
                      key={value}
                      onClick={() => setField('accentColor', value)}
                      title={name}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', background: value,
                        border: profileForm.accentColor === value ? '3px solid white' : '2px solid transparent',
                        outline: profileForm.accentColor === value ? `2px solid ${value}` : 'none',
                        cursor: 'pointer', transition: 'transform 0.15s',
                        transform: profileForm.accentColor === value ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Selected: {ACCENT_COLORS.find(c => c.value === profileForm.accentColor)?.name}
                </p>
              </div>

              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Appearance'}
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color="var(--color-primary)" /> Notifications
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>In-App Notifications</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reminders for deadlines and goals</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={profileForm.notifications} onChange={e => setField('notifications', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24,
                    background: profileForm.notifications ? 'var(--color-primary)' : 'var(--border-color)',
                    transition: '0.3s',
                  }}>
                    <span style={{
                      position: 'absolute', top: 2, left: profileForm.notifications ? 22 : 2,
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 8px' }}>📱 Push notifications require browser permission.</p>
                <p style={{ margin: 0 }}>⏰ Goal deadline reminders are sent 24 hours before due dates.</p>
              </div>

              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={18} color="var(--color-primary)" /> Data Management
              </h3>

              <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Your Data</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  All your data is securely stored in Firebase Firestore, isolated per user account.
                </div>
              </div>

              <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Sync Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-accent)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)' }} />
                  Connected to Firebase — real-time sync active
                </div>
              </div>

              <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Account</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Signed in as <strong>{user?.email}</strong> via Google
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowLogoutConfirm(true)}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>

              <div style={{ padding: 16, background: 'var(--color-danger-alpha)', borderRadius: 10, marginTop: 8 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>⚠️ Danger Zone</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Deleting your account will permanently remove all data including goals, tasks, and transactions.
                </div>
                <button className="btn btn-danger btn-sm" disabled style={{ opacity: 0.6 }}>
                  <Trash2 size={14} /> Delete Account (Contact support)
                </button>
              </div>
            </div>
          )}

          {/* About card */}
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✨</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Miraculous</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>v1.0.0 · Built for productivity excellence</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              🔥 Firebase · ⚡ React · 💜 Built with love
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of Miraculous?"
        confirmLabel="Sign Out"
      />
    </div>
  );
}
