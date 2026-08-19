import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import Logo from '../components/Logo';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || '/dashboard';
  const { currentUser, login, signup, loginWithGoogle } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetField, setTargetField] = useState('Software Development');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate(fromPath, { replace: true });
    }
  }, [currentUser, navigate, fromPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(email, password, name, targetField);
        navigate('/onboarding');
      } else {
        await login(email, password);
        navigate(fromPath, { replace: true });
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
      navigate(fromPath, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-peach-50/70 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Logo size="lg" />
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rust-100 border border-rust-200 text-rust-700 text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-rust-500" />
            <span>Placement Diagnostic Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-warmtext-900 font-heading tracking-tight">
            {isSignup ? 'Create Your Account' : 'Sign In to PlacePrep'}
          </h1>
          <p className="text-xs text-warmtext-600 max-w-sm">
            {isSignup
              ? 'Join PlacePrep to analyze your resume, practice live AI interviews, and generate diagnostic reports.'
              : 'Access your placement benchmarks, AI practice rounds, and diagnostic reports.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5 shadow-warm-sm">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-warmborder shadow-warm-lg space-y-6">
          <button
            onClick={handleGoogleAuth}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-white hover:bg-peach-50 text-warmtext-900 font-bold text-xs border border-warmborder shadow-warm-sm hover:shadow-warm-md transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-warmborder w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-warmtext-400 uppercase tracking-wider font-mono">or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-warmtext-700 mb-1.5 font-heading">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-warmtext-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanmay Patil"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-peach-50/50 border border-warmborder focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20 text-xs font-medium text-warmtext-900 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-warmtext-700 mb-1.5 font-heading">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-warmtext-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-peach-50/50 border border-warmborder focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20 text-xs font-medium text-warmtext-900 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-warmtext-700 mb-1.5 font-heading">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-warmtext-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-peach-50/50 border border-warmborder focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20 text-xs font-medium text-warmtext-900 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{submitting ? 'Authenticating...' : isSignup ? 'Create Account & Continue' : 'Sign In'}</span>
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-rust-600 hover:text-rust-700 font-semibold transition-colors cursor-pointer"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
