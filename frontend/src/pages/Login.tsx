import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Users, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (activeTab === 'login' ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#090d16] px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 mb-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-extrabold text-2xl text-white tracking-tight">Staff Portal</h2>
          <p className="text-gray-400 text-sm mt-1">Access the Smart Queue Management Dashboard</p>
        </div>

        <div className="glass overflow-hidden rounded-3xl border border-white/10 backdrop-blur-md">
          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-black/20">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'login'
                  ? 'border-brand-500 text-white bg-white/2'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'register'
                  ? 'border-brand-500 text-white bg-white/2'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-200 text-sm">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'register' && (
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none text-sm transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl px-4 py-3 text-white placeholder-gray-650 outline-none text-sm transition"
                />
              </div>

              {activeTab === 'register' && (
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl px-4 py-3 text-white placeholder-gray-650 outline-none text-sm transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30"
              >
                {activeTab === 'login' ? (
                  <>{submitting ? 'Signing in...' : 'Sign In'} <LogIn className="w-4 h-4" /></>
                ) : (
                  <>{submitting ? 'Creating account...' : 'Create Account'} <UserPlus className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-400 transition"
          >
            ← Back to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};
