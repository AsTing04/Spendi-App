import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import Settings from './Settings';
import { LayoutDashboard, Settings as SettingsIcon, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'settings'
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      updateUserData(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      updateUserData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserData = (session) => {
    if (session?.user) {
      const name = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
      setDisplayName(name);
    }
  };

  if (!session) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            Spendi
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
              Hi, <strong className="capitalize">{displayName}</strong>
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2 text-slate-400 hover:text-red-500 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <Dashboard session={session} />
        ) : (
          <Settings session={session} onProfileUpdate={(name) => setDisplayName(name)} />
        )}
      </main>
    </div>
  );
}