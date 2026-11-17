import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, getInitials } from '../lib/format';
import { Crown, ArrowUpRight, ArrowDownLeft, ShieldCheck, Wallet, Handshake } from 'lucide-react';
import { Profile } from '../types';

interface StandingCardsProps {
  onSettleWithUser?: (targetUser: Profile, suggestedAmount: number) => void;
}

export const StandingCards: React.FC<StandingCardsProps> = ({ onSettleWithUser }) => {
  const { standings, currentUser, activeAdmin, isCurrentCycleActive } = useApp();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Roommate Standings</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {standings.length} Members
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time balance equation: <code className="text-slate-300 font-mono text-[11px]">Paid - Consumed - Treasury Held</code>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {standings.map((s) => {
          const isMe = s.profile.id === currentUser.id;
          const isAdmin = s.profile.id === activeAdmin?.id || s.profile.is_admin;
          const isCreditor = s.netBalance > 0.01;
          const isDebtor = s.netBalance < -0.01;
          const isBalanced = Math.abs(s.netBalance) <= 0.01;

          return (
            <div
              key={s.profile.id}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between ${
                isMe
                  ? 'bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              {/* Top Row: Avatar & Profile Info */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm ring-1 ring-white/10"
                        style={{ backgroundColor: s.profile.color || '#6366f1' }}
                      >
                        {getInitials(s.profile.name)}
                      </div>
                      {isAdmin && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow" title="Cycle Admin">
                          <Crown className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-100">{s.profile.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {s.profile.upi_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Balance Display */}
                <div
                  className={`rounded-xl p-3 mb-3 border ${
                    isCreditor
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : isDebtor
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-medium mb-0.5">
                    <span className="text-slate-400">Net Standing</span>
                    {isCreditor && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold text-[10px]">
                        <ArrowDownLeft className="w-3 h-3" /> Get Back
                      </span>
                    )}
                    {isDebtor && (
                      <span className="inline-flex items-center gap-0.5 text-rose-400 font-semibold text-[10px]">
                        <ArrowUpRight className="w-3 h-3" /> Owes Room
                      </span>
                    )}
                    {isBalanced && <span className="text-slate-400 text-[10px]">Settled</span>}
                  </div>
                  <div className="text-xl font-extrabold font-mono-num tracking-tight">
                    {formatINR(s.netBalance)}
                  </div>
                </div>

                {/* Granular Breakdown */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-3 font-mono-num">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Total Paid:</span>
                    <span className="font-semibold text-slate-200">{formatINR(s.totalPayments)}</span>
                  </div>
                  {s.totalAdminTreasuryPaid > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-indigo-300 pl-2">
                      <span>↳ To Admin:</span>
                      <span>{formatINR(s.totalAdminTreasuryPaid)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Consumed Share:</span>
                    <span className="font-semibold text-slate-200">{formatINR(s.totalExpenseShare)}</span>
                  </div>

                  {s.adminTreasuryHeld > 0 && (
                    <div className="flex justify-between items-center text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                      <span>Admin Cash Held:</span>
                      <span className="font-bold">-{formatINR(s.adminTreasuryHeld)}</span>
                    </div>
                  )}

                  {s.closedSettlementsPaid > 0 && (
                    <div className="flex justify-between items-center text-emerald-400 text-[11px] pl-2">
                      <span>Closed Settlements:</span>
                      <span>+{formatINR(s.closedSettlementsPaid)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action if applicable */}
              {isDebtor && onSettleWithUser && isCurrentCycleActive && !isMe && (
                <button
                  onClick={() => onSettleWithUser(s.profile, Math.abs(s.netBalance))}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <Handshake className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Settle Balance</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
