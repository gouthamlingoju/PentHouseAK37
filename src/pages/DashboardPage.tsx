import React from 'react';
import { useApp } from '../context/AppContext';
import { StandingCards } from '../components/StandingCards';
import { SettlementActionQueue } from '../components/SettlementActionQueue';
import { formatINR } from '../lib/format';
import {
  Plus,
  ReceiptIndianRupee,
  Wallet,
  Crown,
  Handshake,
  TrendingUp,
  Layers,
  Info,
} from 'lucide-react';
import { PairwiseDebt, Profile } from '../types';

interface DashboardPageProps {
  onOpenExpenseModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenSettlementModal: (debt?: PairwiseDebt, targetUser?: Profile, amount?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenExpenseModal,
  onOpenPaymentModal,
  onOpenSettlementModal,
}) => {
  const {
    selectedCycle,
    cycleExpenses,
    cyclePayments,
    currentUserStanding,
    activeAdmin,
    standings,
    isCurrentCycleActive,
  } = useApp();

  const activeExpenses = cycleExpenses.filter((e) => !e.is_excluded);
  const excludedExpenses = cycleExpenses.filter((e) => e.is_excluded);

  const totalActiveExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExcludedAmount = excludedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalVendorPayments = cyclePayments
    .filter((p) => p.payment_type === 'vendor')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalAdminTreasury = cyclePayments
    .filter((p) => p.payment_type === 'admin_treasury')
    .reduce((sum, p) => sum + p.amount, 0);

  const myBalance = currentUserStanding?.netBalance || 0;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {selectedCycle?.name}
            </h2>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isCurrentCycleActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isCurrentCycleActive ? 'Active Ledger' : 'Archived (Read-Only)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Decoupled Expense Pool, Admin Treasury & Two-Party Settlement Dashboard
          </p>
        </div>

        {/* Quick Actions */}
        {isCurrentCycleActive && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenExpenseModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
            <button
              onClick={onOpenPaymentModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Log Payment</span>
            </button>
            <button
              onClick={() => onOpenSettlementModal()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Handshake className="w-4 h-4" />
              <span>Settle Dues</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Active Pool */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Pool Expenses</span>
            <ReceiptIndianRupee className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono-num text-white">
              {formatINR(totalActiveExpenses)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeExpenses.length} active • {excludedExpenses.length} excluded ({formatINR(totalExcludedAmount, false)})
            </div>
          </div>
        </div>

        {/* Card 2: Total Vendor Payments */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Vendor Payments Logged</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono-num text-white">
              {formatINR(totalVendorPayments)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {Math.abs(totalVendorPayments - totalActiveExpenses) < 0.01 ? (
                <span className="text-emerald-400 font-semibold">✓ 100% Reconciled with Pool</span>
              ) : (
                <span className="text-amber-300">
                  Diff: {formatINR(totalVendorPayments - totalActiveExpenses)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Admin Treasury */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300/80 mb-2">
            <span className="text-xs font-semibold">Admin Treasury Held</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono-num text-amber-300">
              {formatINR(totalAdminTreasury)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Custodian: <strong className="text-amber-200">{activeAdmin?.name}</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Your Net Balance */}
        <div
          className={`rounded-2xl border p-4 flex flex-col justify-between ${
            myBalance > 0.01
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : myBalance < -0.01
              ? 'border-rose-500/30 bg-rose-950/20'
              : 'border-slate-800 bg-slate-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-semibold">Your Net Balance</span>
            <TrendingUp
              className={`w-4 h-4 ${
                myBalance > 0.01
                  ? 'text-emerald-400'
                  : myBalance < -0.01
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            />
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-extrabold font-mono-num ${
                myBalance > 0.01
                  ? 'text-emerald-300'
                  : myBalance < -0.01
                  ? 'text-rose-300'
                  : 'text-white'
              }`}
            >
              {formatINR(myBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {myBalance > 0.01
                ? 'Roommates owe you money'
                : myBalance < -0.01
                ? 'You owe the room pool'
                : 'You are completely settled'}
            </div>
          </div>
        </div>
      </div>

      {/* Member Standing Cards */}
      <StandingCards
        onSettleWithUser={(targetUser, amount) =>
          onOpenSettlementModal(undefined, targetUser, amount)
        }
      />

      {/* Settlement Action Queue (Approvals + Pairwise Dues) */}
      <SettlementActionQueue
        onInitiateSettlement={(debt) => onOpenSettlementModal(debt)}
      />
    </div>
  );
};
