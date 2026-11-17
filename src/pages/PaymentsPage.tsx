import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDateTime, getInitials } from '../lib/format';
import {
  Plus,
  Wallet,
  Building2,
  Crown,
  Search,
  Trash2,
  Tag,
} from 'lucide-react';

interface PaymentsPageProps {
  onOpenPaymentModal: () => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ onOpenPaymentModal }) => {
  const {
    profiles,
    cyclePayments,
    cycleExpenses,
    deletePayment,
    isCurrentCycleActive,
    currentUser,
    isCurrentUserAdmin,
  } = useApp();

  const [payerFilter, setPayerFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'vendor' | 'admin_treasury'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = useMemo(() => {
    return cyclePayments
      .filter((p) => {
        if (payerFilter !== 'All' && p.payer_id !== payerFilter) return false;
        if (typeFilter !== 'all' && p.payment_type !== typeFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchVendor = p.vendor_name?.toLowerCase().includes(q);
          const matchNotes = p.notes?.toLowerCase().includes(q);
          if (!matchVendor && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [cyclePayments, payerFilter, typeFilter, searchQuery]);

  const totalFiltered = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>Payments Ledger ("Who Paid")</span>
          </h2>
          <p className="text-xs text-slate-400">
            Actual money outflow — Vendor payments & Admin Treasury cash transfers
          </p>
        </div>

        {isCurrentCycleActive && (
          <button
            onClick={onOpenPaymentModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Payment</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Payer Filter */}
          <select
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Payer: All Roommates</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                Paid By: {p.name}
              </option>
            ))}
          </select>

          {/* Payment Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Type: All Outflows</option>
            <option value="vendor">Vendor / Bill Payments</option>
            <option value="admin_treasury">Paid to Admin Treasury</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">
            Showing <strong className="text-slate-200">{filteredPayments.length}</strong> entries
          </span>
          <span className="text-slate-300 font-mono-num">
            Total Outflow: <strong className="text-emerald-400">{formatINR(totalFiltered)}</strong>
          </span>
        </div>
      </div>

      {/* Audit List */}
      <div className="space-y-2.5">
        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
            No payments logged matching these filters.
          </div>
        ) : (
          filteredPayments.map((pay) => {
            const payer = profiles.find((p) => p.id === pay.payer_id);
            const linkedExpense = pay.linked_expense_id
              ? cycleExpenses.find((e) => e.id === pay.linked_expense_id)
              : null;
            const isAdminTreasury = pay.payment_type === 'admin_treasury';
            const canDelete =
              isCurrentCycleActive && (isCurrentUserAdmin || pay.payer_id === currentUser.id);

            return (
              <div
                key={pay.id}
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isAdminTreasury
                    ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Payer Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow"
                    style={{ backgroundColor: payer?.color || '#6366f1' }}
                  >
                    {getInitials(payer?.name || '?')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{payer?.name}</span>
                      <span className="text-slate-500 text-xs">paid</span>
                      <span className="text-sm font-semibold text-slate-200">
                        {pay.vendor_name || 'Vendor'}
                      </span>

                      {isAdminTreasury ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-3 h-3" /> Paid to Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <Building2 className="w-3 h-3" /> Vendor Bill
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>{formatDateTime(pay.payment_date)}</span>
                      {linkedExpense && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            <Tag className="w-3 h-3" /> {linkedExpense.title}
                          </span>
                        </>
                      )}
                    </div>

                    {pay.notes && <p className="text-xs text-slate-400 italic">"{pay.notes}"</p>}
                  </div>
                </div>

                {/* Amount & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div
                      className={`text-lg font-extrabold font-mono-num ${
                        isAdminTreasury ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {formatINR(pay.amount)}
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete payment of ${formatINR(pay.amount)}?`)) {
                          deletePayment(pay.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
