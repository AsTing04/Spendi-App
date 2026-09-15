import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { User, Lock, Trash2 } from 'lucide-react';

export default function Settings({ session, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState(session?.user?.user_metadata?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName }
    });

    if (error) {
      alert(`Error updating profile: ${error.message}`);
    } else {
      alert('Display name updated successfully!');
      onProfileUpdate(displayName);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validation Check: Passwords must match
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-type to confirm.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      alert('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      '⚠️ WARNING: Are you sure you want to delete your account? All your transaction data will be permanently deleted.'
    );

    if (!confirmation) return;

    setLoading(true);
    const { error: dataError } = await supabase.from('expenses').delete().eq('user_id', session.user.id);
    if (dataError) {
      alert(`Error clearing user data: ${dataError.message}`);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    alert('Account data cleared and logged out.');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Update Profile Name */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Profile Information</h3>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
            Save Display Name
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Change Password</h3>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-xs rounded-lg font-semibold">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
              minLength={6}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
            Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-2xl border border-red-200 dark:border-red-900/50">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-red-600 dark:text-red-300 mb-4">
          Deleting your account will purge all recorded transactions from the database. This action is permanent.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Delete Account & Data
        </button>
      </div>
    </div>
  );
}