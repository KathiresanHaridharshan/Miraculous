// Top header bar with hamburger (mobile), breadcrumb, and notification bell
import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function TopBar({ onMenuToggle, title }) {
  const { unreadCount } = useNotifications();

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 12,
      background: 'var(--bg-secondary)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuToggle}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: 4,
        }}
        className="mobile-menu-btn"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        flex: 1,
      }}>
        {title}
      </h1>

      {/* Notification bell */}
      <button
        style={{
          position: 'relative',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-sm)',
          padding: 8,
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--color-danger)',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 700,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
