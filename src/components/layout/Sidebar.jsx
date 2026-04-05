// Sidebar navigation component
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Target, Timer, Calendar, CheckSquare,
  DollarSign, BarChart2, Settings, Zap, ChevronLeft, ChevronRight,
  LogOut, Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { signOut } from '../../services/auth';
import { getInitials } from '../../utils';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Goals', to: '/goals', icon: Target },
  { label: 'Timer', to: '/timer', icon: Timer },
  { label: 'Calendar', to: '/calendar', icon: Calendar },
  { label: 'To-Do', to: '/todos', icon: CheckSquare },
  { label: 'Finance', to: '/finance', icon: DollarSign },
  { label: 'Analytics', to: '/analytics', icon: BarChart2 },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onToggle, onMobileClose }) {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.displayName || user?.displayName || 'User';
  const photoURL = profile?.photoURL || user?.photoURL;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} color="white" fill="white" />
          </div>
          <span className="sidebar-logo-text">Miraculous</span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              flexShrink: 0,
            }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">MENU</span>
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onMobileClose}
            >
              <Icon className="nav-item-icon" size={20} />
              <span className="nav-item-label">{label}</span>
              {label === 'Dashboard' && unreadCount > 0 && (
                <span
                  className="notif-dot"
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                />
              )}
            </NavLink>
          ))}

          <div className="divider" />

          {/* Theme toggle */}
          <button
            className="nav-item"
            onClick={toggleTheme}
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <span className="nav-item-icon" style={{ fontSize: '1.1rem' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            <span className="nav-item-label">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/settings')}>
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="user-avatar" />
            ) : (
              <div className="user-avatar">{getInitials(displayName)}</div>
            )}
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>

          <button
            className="nav-item"
            onClick={handleSignOut}
            style={{
              width: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              marginTop: 4,
              color: 'var(--color-danger)',
            }}
          >
            <LogOut className="nav-item-icon" size={20} />
            <span className="nav-item-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
