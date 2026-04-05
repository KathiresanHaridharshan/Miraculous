// Mobile bottom navigation
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Timer, CheckSquare, DollarSign } from 'lucide-react';

const MOBILE_NAV = [
  { label: 'Home', to: '/', icon: LayoutDashboard },
  { label: 'Goals', to: '/goals', icon: Target },
  { label: 'Timer', to: '/timer', icon: Timer },
  { label: 'To-Do', to: '/todos', icon: CheckSquare },
  { label: 'Finance', to: '/finance', icon: DollarSign },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {MOBILE_NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
