import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SettlementActionQueue } from '../components/SettlementActionQueue';
import { formatINR, formatDateTime, getInitials } from '../lib/format';
import {
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { PairwiseDebt } from '../types';

interface SettlementsPageProps {
  onOpenSettlementModal: (debt?: PairwiseDebt) => void;
}

export const SettlementsPage: React.FC<SettlementsPageProps> = ({
  onOpenSettlementModal,
}) => {
  const { profiles, cycleSettlements, isCurrentCycleActive } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'closed' | 'rejected'>('all');

  const filtered = cycleSettlements.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    return true;
  });

  const getProfile = (id: string) => profiles.find((p) => p.id === id);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Handshake className="w-5 h-5 text-indigo-400" />
            <span>Two-Party Consent Settlements</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pending dues cannot be closed unilaterally • Both debtor & creditor must digitally consent
          </p>
        </div>

        {isCurrentCycleActive && (
          <button
            onClick={() => onOpenSettlementModal()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Settlement</span>
          </button>
        )}
      </div>

      {/* Main Settlement Action Queue (Pending for me & Pairwise Queues) */}
      <SettlementActionQueue onInitiateSettlement={onOpenSettlementModal} />

      {/* Historical Audit Log of Settlements */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Settlement Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-400">Full record of all 2-party digital settlements in this cycle</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'pending', 'closed', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  filter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No settlements logged under status "{filter}".
            </div>
          ) : (
            filtered.map((s) => {
              const fromUser = getProfile(s.from_user_id);
              const toUser = getProfile(s.to_user_id);
              const initiator = getProfile(s.initiated_by);
              const confirmer = s.confirmed_by ? getProfile(s.confirmed_by) : null;

              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span>{fromUser?.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>{toUser?.name}</span>
                      <span className="font-mono-num font-extrabold text-base ml-2">
                        {formatINR(s.amount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>Initiated by {initiator?.name}</span>
                      <span>•</span>
                      <span>{formatDateTime(s.created_at)}</span>
                      {s.status === 'closed' && confirmer && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">
                            Confirmed by {confirmer.name} on {formatDateTime(s.confirmed_at || '')}
                          </span>
                        </>
                      )}
                    </div>

                    {s.upi_ref && (
                      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded inline-block">
                        Ref: {s.upi_ref}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {s.status === 'closed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Closed (2/2)</span>
                      </span>
                    )}
                    {s.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending (1/2)</span>
                      </span>
                    )}
                    {s.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
