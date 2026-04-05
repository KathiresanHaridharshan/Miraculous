import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BarChart2, Calendar, DollarSign, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { signInWithEmail, registerWithEmail } from '../services/auth';

const FEATURES = [
  { icon: Target, label: 'Smart Goal Tracking', desc: 'Set, track, and crush your goals with intelligent progress monitoring' },
  { icon: BarChart2, label: 'Finance Dashboard', desc: 'Budget, track expenses, and visualize spending patterns' },
  { icon: Calendar, label: 'Calendar & Reminders', desc: 'Manage your time, schedule strictly, and never miss important events' },
  { icon: DollarSign, label: 'Analytics Insights', desc: 'Deep analytics across productivity, goals, and finances' },
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter both email and password.');
    if (isRegister && !name) return toast.error('Please enter your full name.');
    
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
        toast.success('Account created! Welcome to Miraculous 🎉');
      } else {
        await signInWithEmail(email, password);
        toast.success('Welcome back! 🎉');
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password must be at least 6 characters.');
      } else {
        toast.error(isRegister ? 'Registration failed. Please try again.' : 'Sign-in failed. Please try again.');
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
            <h2 className="login-form-title">{isRegister ? 'Create Account' : 'Welcome back'}</h2>
            <p className="login-form-subtitle">{isRegister ? 'Start your organized journey today' : 'Sign in to continue your journey'}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  autoFocus={isRegister}
                />
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                autoFocus={!isRegister}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setIsRegister(!isRegister)}
              style={{ color: 'var(--text-secondary)' }}
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '16px 0 0',
            marginTop: '16px',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Your data is securely stored and only accessible to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
