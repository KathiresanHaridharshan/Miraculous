// Login page — branded Google Sign-In
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BarChart2, Calendar, DollarSign, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../services/auth';

const FEATURES = [
  { icon: Target, label: 'Smart Goal Tracking', desc: 'Set, track, and crush your goals with intelligent progress monitoring' },
  { icon: BarChart2, label: 'Finance Dashboard', desc: 'Budget, track expenses, and visualize spending patterns' },
  { icon: Calendar, label: 'Calendar & Reminders', desc: 'Sync with Google Calendar and never miss important events' },
  { icon: DollarSign, label: 'Analytics Insights', desc: 'Deep analytics across productivity, goals, and finances' },
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to Miraculous! 🎉');
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled.');
      } else {
        toast.error('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left hero panel */}
      <div className="login-left">
        <div className="login-hero animate-fade-in">
          <div className="login-brand">
            <div className="login-brand-icon">
              <Zap size={26} color="white" fill="white" />
            </div>
            <span className="login-brand-name">Miraculous</span>
          </div>

          <h1 className="login-hero-title">
            Your entire life,<br />
            <span>beautifully organized.</span>
          </h1>

          <p className="login-hero-subtitle">
            Goals, habits, finances, calendar, and focus — all in one place.
            Built for the person who demands more from every day.
          </p>

          <div className="feature-list">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="feature-item">
                <div className="feature-icon">
                  <Icon size={16} />
                </div>
                <div>
                  <strong style={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.9rem' }}>{label}</strong>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: '2px 0 0' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className="login-right">
        <div className="login-form-container animate-slide-up">
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div className="login-brand-icon" style={{ margin: '0 auto 16px' }}>
              <Zap size={26} color="white" fill="white" />
            </div>
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">Sign in to continue your journey</p>
          </div>

          <button
            id="google-signin-btn"
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {/* Google logo SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div style={{
            textAlign: 'center',
            padding: '16px 0 0',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Your data is securely stored and only accessible to you.
            </p>
          </div>

          {/* Feature bullets */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['🔒 Your data is private and encrypted', '🆓 Free to use, no credit card needed', '🔄 Syncs across all your devices'].map((f) => (
              <p key={f} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                {f}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
