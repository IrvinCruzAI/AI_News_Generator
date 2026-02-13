import React, { useState } from 'react';
import { LogIn, UserPlus, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  darkMode: boolean;
}

export const Auth: React.FC<AuthProps> = ({ darkMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-panel rounded-2xl shadow-2 ring-1 ring-black/5 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/10 rounded-full mb-4">
              {isSignUp ? (
                <UserPlus className="w-8 h-8 text-brand" />
              ) : (
                <LogIn className="w-8 h-8 text-brand" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted">
              {isSignUp
                ? 'Sign up to start generating articles'
                : 'Sign in to continue to NewsGen AI'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/60 focus:border-transparent transition-all duration-150"
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/60 focus:border-transparent transition-all duration-150"
                placeholder="••••••••"
                disabled={loading}
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-muted">At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-brand hover:bg-brand-light text-white rounded-xl font-semibold shadow-1 hover:shadow-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm text-muted hover:text-ink transition-colors duration-150"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-brand font-medium">Sign in</span></>
              ) : (
                <>Don't have an account? <span className="text-brand font-medium">Sign up</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
