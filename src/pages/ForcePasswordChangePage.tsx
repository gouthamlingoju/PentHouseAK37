import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';

export const ForcePasswordChangePage: React.FC = () => {
  const { currentUser, updatePassword, signOut } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword.trim() === 'AK37@2026') {
      setError('Please choose a new personal password instead of the default temporary password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await updatePassword(newPassword);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* User Identity Header */}
        <div className="text-center space-y-2">
          <Avatar
            name={currentUser.name}
            avatarUrl={currentUser.avatar_url}
            color={currentUser.color}
            size="xl"
            className="mx-auto shadow-xl ring-2 ring-white/15"
          />
          <h1 className="text-xl font-extrabold text-white">
            Welcome, {currentUser.name}!
          </h1>
          <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
        </div>

        {/* Mandatory Password Change Card */}
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          <div className="rounded-xl bg-amber-950/35 border border-amber-500/30 p-3.5 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong className="block text-amber-100 mb-0.5">
                First-Time Login Security Requirement
              </strong>
              For your account security, you must set a new personal password before accessing the PentHouse AK37 ledger.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">New Personal Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoFocus
                  autoComplete="new-password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirm New Password *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving New Password...' : 'Set Password & Enter AK37'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 flex justify-center">
            <button
              type="button"
              onClick={signOut}
              className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out and switch account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
