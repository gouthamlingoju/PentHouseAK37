import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  ChevronDown,
  Lock,
  Layers,
  UserCheck,
  LogOut,
  Wifi,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenAdminTransfer: () => void;
  onOpenCloseCycle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenProfile }) => {
  const {
    isLiveSupabase,
    profiles,
    currentUser,
    switchUser,
    signOut,
    cycles,
    selectedCycle,
    selectCycle,
    isCurrentCycleActive,
    activeAdmin,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      {/* Top Banner if Cycle is Closed */}
      {!isCurrentCycleActive && selectedCycle && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          <span>Viewing Archived Cycle ({selectedCycle.name}). Ledger is strictly Read-Only (RLS Protected).</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-white text-sm sm:text-base">
              AK<span className="text-amber-400 text-[11px] ml-0.5">37</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-white truncate">
                PentHouse <span className="text-indigo-400 font-medium">AK37</span>
              </h1>
              {isLiveSupabase && (
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Wifi className="w-2.5 h-2.5" /> Live Sync
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
              <span>Admin:</span>
              <strong className="text-amber-300 font-semibold">{activeAdmin?.name || '...'}</strong>
            </p>
          </div>
        </div>

        {/* Center: Cycle Switcher */}
        <div className="flex items-center">
          <div className="relative">
            <select
              value={selectedCycle?.id || ''}
              onChange={(e) => selectCycle(e.target.value)}
              aria-label="Select Monthly Cycle"
              className="appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl pl-7 sm:pl-8 pr-7 sm:pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-inner max-w-[155px] sm:max-w-none truncate"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status === 'active' ? '🟢' : '🔒'}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: User Profile + Sign Out */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 px-2.5 py-1.5 rounded-xl transition-all shadow-sm"
            title="Update your profile, UPI ID, or password"
          >
            <Avatar
              name={currentUser.name}
              avatarUrl={currentUser.avatar_url}
              color={currentUser.color}
              size="xs"
            />
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-100">{currentUser.name}</span>
                {currentUser.is_admin && <Crown className="w-3 h-3 text-amber-400" />}
              </div>
              <div className="text-[10px] text-slate-400 leading-none font-mono">
                @{currentUser.username}
              </div>
            </div>
            <UserCheck className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Local Mode User Switcher (only shown if NOT live Supabase Auth) */}
          {!isLiveSupabase && (
            <select
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              aria-label="Switch logged-in roommate persona"
              className="text-xs bg-slate-800 text-slate-300 font-medium rounded-lg px-2 py-1.5 border border-slate-700 focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_admin ? '👑' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Live Mode Sign Out Button */}
          {isLiveSupabase && (
            <button
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
