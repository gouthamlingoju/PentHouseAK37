import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  Lock,
  UserCheck,
  Database,
  RefreshCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  UserPlus,
  Users,
  KeyRound,
  LogOut,
  Phone,
  Loader2,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';

interface SettingsPageProps {
  onOpenProfile: () => void;
  onOpenCreateRoommate: () => void;
  onOpenAdminTransfer: () => void;
  onOpenCloseCycle: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenProfile,
  onOpenCreateRoommate,
  onOpenAdminTransfer,
  onOpenCloseCycle,
}) => {
  const {
    isLiveSupabase,
    profiles,
    currentUser,
    activeAdmin,
    selectedCycle,
    isCurrentUserAdmin,
    isCurrentCycleActive,
    adminResetRoommatePassword,
    refreshData,
    resetData,
    signOut,
  } = useApp();

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await refreshData();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdminResetPassword = async (profileId: string, name: string) => {
    const newPwd = window.prompt(`Enter a new password (min 6 chars) for ${name}:`);
    if (!newPwd) return;
    if (newPwd.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }
    setResettingId(profileId);
    const res = await adminResetRoommatePassword(profileId, newPwd);
    setResettingId(null);
    if (res.error) {
      window.alert(res.error);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white">Settings & Admin Treasury Controls</h2>
          <p className="text-xs text-slate-400">
            Self profile updation, roommate onboarding, monthly cycle archiving, and live Supabase sync
          </p>
        </div>
        {isLiveSupabase && (
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* 1. Self Profile Updation Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            name={currentUser.name}
            avatarUrl={currentUser.avatar_url}
            color={currentUser.color}
            size="xl"
            className="shadow-lg"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded">
                @{currentUser.username}
              </span>
              {currentUser.is_admin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Crown className="w-3 h-3" /> Active Admin
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{currentUser.upi_id || 'No UPI set'}</span>
              </p>
              {currentUser.phone && (
                <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{currentUser.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenProfile}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          <UserCheck className="w-4 h-4" />
          <span>Edit Profile & Password</span>
        </button>
      </div>

      {/* 2. Roommates Directory & Admin Onboarding */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                PentHouse AK37 Roommates ({profiles.length})
              </h3>
              <p className="text-xs text-slate-400">
                Active members with authenticated ledger access
              </p>
            </div>
          </div>

          {isCurrentUserAdmin && (
            <button
              onClick={onOpenCreateRoommate}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Roommate</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  color={p.color}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">{p.name}</span>
                    {p.is_admin && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    @{p.username} • {p.upi_id}
                  </div>
                </div>
              </div>

              {isCurrentUserAdmin && p.id !== currentUser.id && (
                <button
                  onClick={() => handleAdminResetPassword(p.id, p.name)}
                  disabled={resettingId === p.id}
                  title={`Reset password for ${p.name}`}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors shrink-0 flex items-center justify-center"
                >
                  {resettingId === p.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Admin Treasury Controls */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-200">Admin Treasury Controls</h3>
              <p className="text-xs text-slate-400">
                Current Admin Custodian: <strong className="text-amber-300">{activeAdmin?.name}</strong>
              </p>
            </div>
          </div>

          {!isCurrentUserAdmin && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Admin Only
            </span>
          )}
        </div>

        {!isCurrentUserAdmin && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Only the active Admin (<strong>{activeAdmin?.name}</strong>) can add roommates, transfer the Admin role, or close monthly cycles.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Transfer Admin Role */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Transfer Admin Role</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Hand over active treasury collection & cycle archiving rights to another roommate. Historical Admin entries remain intact for audit.
              </p>
            </div>
            <button
              onClick={onOpenAdminTransfer}
              disabled={!isCurrentUserAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-40 disabled:pointer-events-none text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              Transfer Admin Role
            </button>
          </div>

          {/* Close & Archive Monthly Cycle */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Close & Archive Cycle</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Lock <strong>{selectedCycle?.name}</strong> as permanently read-only, optionally carry unpaid balances forward, and start next month's cycle.
              </p>
            </div>
            <button
              onClick={onOpenCloseCycle}
              disabled={!isCurrentUserAdmin || !isCurrentCycleActive}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-600 hover:text-white disabled:opacity-40 disabled:pointer-events-none text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
            >
              {isCurrentCycleActive ? 'Close Monthly Cycle' : 'Cycle Already Archived'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Database & Supabase Sync Status */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Supabase Live Backend & Realtime</h3>
              <p className="text-xs text-slate-400">PostgreSQL + Auth + Row-Level Security (RLS) + Realtime</p>
            </div>
          </div>
          {isLiveSupabase ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Local Baseline Mode
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {isLiveSupabase ? (
            <>
              <span className="text-xs text-slate-400">
                Realtime sync active across all logged-in devices.
              </span>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCcw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400">
                Restores Cycle 1 PRD seed baseline in local mode.
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Reset local data back to Cycle 1 PRD seed baseline?')) {
                    resetData();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reset Seed Baseline</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
