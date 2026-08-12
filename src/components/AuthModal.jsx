import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Mail, Lock, User, Briefcase, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetField, setTargetField] = useState('Software Development');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(email, password, name, targetField);
        onClose();
        navigate('/onboarding');
      } else {
        await login(email, password);
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl border border-dark-border shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-dark-muted hover:text-white hover:bg-dark-elevated transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span>Candidate Authentication</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isSignup ? 'Create PlacePrep Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-dark-muted">
            {isSignup ? 'Track your placement readiness and save mock diagnostic reports.' : 'Sign in to access your placement dashboard and active rounds.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-dark-muted my-2">
          <div className="h-px bg-dark-border flex-1" />
          <span>or sign in with email</span>
          <div className="h-px bg-dark-border flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignup && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dark-bg text-xs text-white placeholder:text-dark-muted pl-9 pr-3 py-2.5 rounded-xl border border-dark-border focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Target Career Track</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value)}
                    className="w-full bg-dark-bg text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-dark-border focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Software Development">Software Development (SDE)</option>
                    <option value="Data Science">Data Science & AI Engineering</option>
                    <option value="Cybersecurity">Cybersecurity & SecOps</option>
                    <option value="DevOps & Cloud">DevOps & Cloud Architecture</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg text-xs text-white placeholder:text-dark-muted pl-9 pr-3 py-2.5 rounded-xl border border-dark-border focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg text-xs text-white placeholder:text-dark-muted pl-9 pr-3 py-2.5 rounded-xl border border-dark-border focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-primary via-brand-hover to-brand-purple text-white font-bold text-xs shadow-glow-primary hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{submitting ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}</span>
          </button>

        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-dark-muted pt-2 border-t border-dark-border/40">
          {isSignup ? (
            <span>Already have a PlacePrep account?{' '}
              <button onClick={() => setIsSignup(false)} className="text-brand-accent font-semibold hover:underline">
                Sign In
              </button>
            </span>
          ) : (
            <span>New candidate?{' '}
              <button onClick={() => setIsSignup(true)} className="text-brand-accent font-semibold hover:underline">
                Create Account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
