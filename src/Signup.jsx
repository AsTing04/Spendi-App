import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Signup({ onSwitchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false); // 👈 Track checkbox agreement state
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    // Secondary guard check
    if (!agreedToTerms) {
      setError('You must agree to the Terms and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Account created successfully! Check your email to verify.');
      setFullName('');
      setEmail('');
      setPassword('');
      setAgreedToTerms(false);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950/20 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-emerald-500/20">
        <div className="flex items-center gap-3 justify-center mb-6">
          <img src="/logo.png" alt="Spendi Logo" className="w-10 h-10 object-contain" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Join Spendi</h2>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{error}</div>}
        {message && <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 text-sm rounded-lg">{message}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Full Name / Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border rounded-xl text-sm dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms & Privacy Policy Checkbox */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <label htmlFor="terms" className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight cursor-pointer">
              I agree to the collection of my email address for authentication and securing my records, and accept the{' '}
              <a href="/privacy.html" target="_blank" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                Privacy Policy
              </a>.
            </label>
          </div>

          {/* Submit Button (Disabled unless agreedToTerms is true) */}
          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className={`w-full py-2.5 text-white text-sm font-semibold rounded-xl transition shadow-lg ${
              loading || !agreedToTerms
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <button onClick={onSwitchToLogin} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
