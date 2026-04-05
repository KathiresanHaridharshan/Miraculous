// App.jsx — Router, layout shell, and provider composition
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import TopBar from './components/layout/TopBar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import Timer from './pages/Timer';
import Calendar from './pages/Calendar';
import Todos from './pages/Todos';
import Finance from './pages/Finance';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/goals': 'Goals',
  '/timer': 'Timer',
  '/calendar': 'Calendar',
  '/todos': 'To-Do List',
  '/finance': 'Finance',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = PATH_TITLE(location.pathname);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="app-main">
        <TopBar
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          title={pageTitle}
        />
        <div className="page-content animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/:id" element={<GoalDetail />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <MobileNav />
      </main>
    </div>
  );
}

function PATH_TITLE(path) {
  if (path.startsWith('/goals/')) return 'Goal Detail';
  return PAGE_TITLES[path] || 'Miraculous';
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-lg)',
                },
                success: {
                  iconTheme: { primary: '#06d6a0', secondary: 'white' },
                },
                error: {
                  iconTheme: { primary: '#ef476f', secondary: 'white' },
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
