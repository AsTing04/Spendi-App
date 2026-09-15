import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { UserPlus } from 'lucide-react';

export default function Signup({ onSwitchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
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
    }

    setFullName('');
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950/20 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-emerald-500/20">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Join Spendi</h2>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{error}</div>}
        {message && <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 text-sm rounded-lg">{message}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name / Display Name</label>
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email</label>
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20"
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