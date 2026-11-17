import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDateTime } from '../lib/format';
import { Avatar } from './Avatar';
import { generateUpiUrl } from '../lib/upi';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Smartphone,
  Handshake,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { PairwiseDebt } from '../types';

interface SettlementActionQueueProps {
  onInitiateSettlement: (debt?: PairwiseDebt) => void;
}

export const SettlementActionQueue: React.FC<SettlementActionQueueProps> = ({
  onInitiateSettlement,
}) => {
  const {
    profiles,
    currentUser,
    pairwiseDebts,
    pendingApprovalsForMe,
    pendingInitiatedByMe,
    confirmSettlement,
    rejectSettlement,
    isCurrentCycleActive,
    isCurrentUserAdmin,
  } = useApp();

  const getProfile = (id: string) => profiles.find((p) => p.id === id);

  // Privacy: Non-admin members only see dues involving themselves
  const visibleDebts = isCurrentUserAdmin
    ? pairwiseDebts
    : pairwiseDebts.filter(
        (d) => d.fromUser.id === currentUser.id || d.toUser.id === currentUser.id
      );

  return (
    <div className="space-y-6">
      {/* 1. ACTION REQUIRED: Pending Settlements Awaiting Your Confirmation */}
      {pendingApprovalsForMe.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 sm:p-5 shadow-xl shadow-amber-950/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-amber-200">
                  Awaiting Your Confirmation ({pendingApprovalsForMe.length})
                </h3>
                <p className="text-xs text-amber-300/70">
                  Two-party consent required before closing pending dues
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingApprovalsForMe.map((set) => {
              const fromUser = getProfile(set.from_user_id);
              const toUser = getProfile(set.to_user_id);
              const initiator = getProfile(set.initiated_by);

              return (
                <div
                  key={set.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="text-rose-300">{fromUser?.name}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <span className="text-emerald-300">{toUser?.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        1/2 Confirmed
                      </span>
                    </div>
                    <div className="text-xl font-extrabold font-mono-num text-white">
                      {formatINR(set.amount)}
                    </div>
                    <p className="text-xs text-slate-400">
                      Initiated by <strong className="text-slate-200">{initiator?.name}</strong> •{' '}
                      {formatDateTime(set.created_at)}
                    </p>
                    {set.upi_ref && (
                      <p className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded inline-block">
                        UPI Ref: {set.upi_ref}
                      </p>
                    )}
                    {set.notes && <p className="text-xs text-slate-400 italic">"{set.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => confirmSettlement(set.id)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Close</span>
                    </button>
                    <button
                      onClick={() => rejectSettlement(set.id)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. PENDING VERIFICATION: Initiated by Current User */}
      {pendingInitiatedByMe.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-200">
              Pending Counterparty Verification ({pendingInitiatedByMe.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {pendingInitiatedByMe.map((set) => {
              const fromUser = getProfile(set.from_user_id);
              const toUser = getProfile(set.to_user_id);
              const counterparty =
                set.from_user_id === currentUser.id ? toUser : fromUser;

              return (
                <div
                  key={set.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                      <span>{fromUser?.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>{toUser?.name}</span>
                      <span className="font-mono-num font-bold text-white ml-2">
                        {formatINR(set.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Waiting for <strong className="text-indigo-300">{counterparty?.name}</strong> to click Confirm & Close.
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    1/2 Confirmed
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACTIVE NET DUES BREAKDOWN (Pairwise Settlement Queue) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-indigo-400" />
              <span>{isCurrentUserAdmin ? 'Net Settlement Queue' : 'Your Pending Dues'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isCurrentUserAdmin
                ? 'Simplified pairwise dues remaining to close this cycle cleanly'
                : 'Your remaining balance to settle for this cycle'}
            </p>
          </div>
          {isCurrentCycleActive && (
            <button
              onClick={() => onInitiateSettlement()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Handshake className="w-4 h-4" />
              <span>Log Settlement</span>
            </button>
          )}
        </div>

        {visibleDebts.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-950/10">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-300">
              {isCurrentUserAdmin
                ? 'All Room Dues Are Completely Settled!'
                : 'Your Dues Are Completely Settled!'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Zero remaining balances for this cycle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleDebts.map((debt, idx) => {
              const isInvolvingMe =
                debt.fromUser.id === currentUser.id || debt.toUser.id === currentUser.id;
              const isMeDebtor = debt.fromUser.id === currentUser.id;
              const upiUrl = generateUpiUrl({
                payeeUpiId: debt.toUser.upi_id,
                payeeName: debt.toUser.name,
                amount: debt.amount,
                transactionNote: `PentHouse AK37 Settlement (${debt.fromUser.name})`,
              });

              return (
                <div
                  key={`${debt.fromUser.id}_${debt.toUser.id}_${idx}`}
                  className={`rounded-xl p-4 border flex flex-col justify-between gap-3 transition-all ${
                    isInvolvingMe
                      ? 'bg-slate-900 border-indigo-500/40 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={debt.fromUser.name}
                        avatarUrl={debt.fromUser.avatar_url}
                        color={debt.fromUser.color || '#f43f5e'}
                        size="sm"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-100">{debt.fromUser.name}</span>
                        <span className="text-slate-500 mx-1.5">owes</span>
                        <span className="font-bold text-emerald-400">{debt.toUser.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold font-mono-num text-white">
                        {formatINR(debt.amount)}
                      </div>
                    </div>
                  </div>

                  {isCurrentCycleActive && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => onInitiateSettlement(debt)}
                        className="flex-1 py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        <span>Settle / Partial Close</span>
                      </button>

                      {isMeDebtor && (
                        <a
                          href={upiUrl}
                          className="py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title={`Pay ${debt.toUser.name} directly via UPI app`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>UPI Pay</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
