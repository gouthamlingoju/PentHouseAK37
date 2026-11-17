import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory, Payment } from '../types';
import { calculateExpenseSplits } from '../engine/splitEngine';
import { formatINR, formatShortDate, formatDateTime } from '../lib/format';
import { Avatar } from '../components/Avatar';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Users,
  Ban,
  ReceiptIndianRupee,
  Crown,
  Building2,
  ArrowRight,
  Wallet,
} from 'lucide-react';

interface TransactionsPageProps {
  onOpenTransactionModal: (defaultTab?: 'expense' | 'admin_transfer', expense?: Expense) => void;
}

type FeedFilter = 'all' | 'expenses' | 'admin_transfers' | 'excluded';

const CATEGORIES: ('All' | ExpenseCategory)[] = [
  'All',
  'Fixed',
  'Grocery',
  'Food',
  'Utilities',
  'Personal',
  'Other',
];

type UnifiedFeedItem =
  | { kind: 'expense'; date: string; expense: Expense; linkedPayments: Payment[] }
  | { kind: 'admin_transfer'; date: string; payment: Payment }
  | { kind: 'standalone_payment'; date: string; payment: Payment };

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenTransactionModal,
}) => {
  const {
    profiles,
    cycleExpenses,
    cyclePayments,
    deleteExpense,
    deletePayment,
    isCurrentCycleActive,
    currentUser,
    isCurrentUserAdmin,
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExpenseCategory>('All');
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getProfile = (id?: string | null) => profiles.find((p) => p.id === id);

  // Build unified chronological feed combining Expenses (+ their linked payments), Admin Transfers, and any unlinked adjustments
  const unifiedItems = useMemo<UnifiedFeedItem[]>(() => {
    const items: UnifiedFeedItem[] = [];

    const paymentsByExpense = new Map<string, Payment[]>();
    for (const pay of cyclePayments) {
      if (pay.payment_type === 'admin_treasury') {
        items.push({ kind: 'admin_transfer', date: pay.payment_date, payment: pay });
      } else if (pay.linked_expense_id) {
        const list = paymentsByExpense.get(pay.linked_expense_id) || [];
        list.push(pay);
        paymentsByExpense.set(pay.linked_expense_id, list);
      } else {
        // Standalone unlinked vendor/carry-forward credit
        items.push({ kind: 'standalone_payment', date: pay.payment_date, payment: pay });
      }
    }

    for (const exp of cycleExpenses) {
      items.push({
        kind: 'expense',
        date: exp.created_at,
        expense: exp,
        linkedPayments: paymentsByExpense.get(exp.id) || [],
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [cycleExpenses, cyclePayments]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return unifiedItems.filter((item) => {
      // Tab filter
      if (feedFilter === 'expenses') {
        if (item.kind !== 'expense' || item.expense.is_excluded) return false;
      } else if (feedFilter === 'admin_transfers') {
        if (item.kind !== 'admin_transfer') return false;
      } else if (feedFilter === 'excluded') {
        if (item.kind !== 'expense' || !item.expense.is_excluded) return false;
      }

      // Category filter (applies to expenses; hides non-expenses when a specific category is picked)
      if (selectedCategory !== 'All') {
        if (item.kind !== 'expense' || item.expense.category !== selectedCategory) return false;
      }

      // Member filter
      if (selectedMember !== 'All') {
        if (item.kind === 'expense') {
          const inParticipants = item.expense.participant_ids.includes(selectedMember);
          const isPayer =
            item.linkedPayments.some((p) => p.payer_id === selectedMember) ||
            item.expense.created_by === selectedMember;
          if (!inParticipants && !isPayer) return false;
        } else {
          const isPayer = item.payment.payer_id === selectedMember;
          const isRecipient = item.payment.recipient_admin_id === selectedMember;
          if (!isPayer && !isRecipient) return false;
        }
      }

      // Search query
      if (q) {
        if (item.kind === 'expense') {
          const titleMatch = item.expense.title.toLowerCase().includes(q);
          const noteMatch = item.expense.notes?.toLowerCase().includes(q);
          const payerMatch = item.linkedPayments.some((p) =>
            getProfile(p.payer_id)?.name.toLowerCase().includes(q)
          );
          if (!titleMatch && !noteMatch && !payerMatch) return false;
        } else {
          const payerName = getProfile(item.payment.payer_id)?.name.toLowerCase() || '';
          const vendorMatch = item.payment.vendor_name?.toLowerCase().includes(q);
          const noteMatch = item.payment.notes?.toLowerCase().includes(q);
          if (!payerName.includes(q) && !vendorMatch && !noteMatch) return false;
        }
      }

      return true;
    });
  }, [unifiedItems, feedFilter, selectedCategory, selectedMember, searchQuery, profiles]);

  const summary = useMemo(() => {
    let activeExpensesTotal = 0;
    let adminTransfersTotal = 0;
    let excludedTotal = 0;

    for (const item of filteredItems) {
      if (item.kind === 'expense') {
        if (item.expense.is_excluded) excludedTotal += item.expense.amount;
        else activeExpensesTotal += item.expense.amount;
      } else if (item.kind === 'admin_transfer') {
        adminTransfersTotal += item.payment.amount;
      }
    }
    return { activeExpensesTotal, adminTransfersTotal, excludedTotal };
  }, [filteredItems]);

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Fixed':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Grocery':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Food':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Utilities':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Personal':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ReceiptIndianRupee className="w-5 h-5 text-indigo-400" />
            <span>Transactions Ledger</span>
          </h2>
          <p className="text-xs text-slate-400">
            All room expenses, split shares, and Admin Treasury transfers in one unified feed
          </p>
        </div>

        {isCurrentCycleActive && (
          <button
            onClick={() =>
              onOpenTransactionModal(feedFilter === 'admin_transfers' ? 'admin_transfer' : 'expense')
            }
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Transaction</span>
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800">
        {(
          [
            { id: 'all', label: 'All Transactions' },
            { id: 'expenses', label: 'Room Expenses' },
            { id: 'admin_transfers', label: 'Admin Transfers' },
            { id: 'excluded', label: 'Personal / Excluded' },
          ] as { id: FeedFilter; label: string }[]
        ).map((pill) => (
          <button
            key={pill.id}
            onClick={() => {
              setFeedFilter(pill.id);
              if (pill.id === 'admin_transfers') setSelectedCategory('All');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              feedFilter === pill.id
                ? pill.id === 'admin_transfers'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Search & Dropdown Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item, payer, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            disabled={feedFilter === 'admin_transfers'}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Member */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Roommate: Everyone</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                Involves: {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">
            Showing <strong className="text-slate-200">{filteredItems.length}</strong> transactions
          </span>
          <div className="flex flex-wrap items-center gap-4 font-mono-num">
            {summary.activeExpensesTotal > 0 && (
              <span className="text-slate-300">
                Room Pool: <strong className="text-emerald-400">{formatINR(summary.activeExpensesTotal)}</strong>
              </span>
            )}
            {summary.adminTransfersTotal > 0 && (
              <span className="text-slate-300">
                Admin Transfers: <strong className="text-amber-300">{formatINR(summary.adminTransfersTotal)}</strong>
              </span>
            )}
            {summary.excludedTotal > 0 && (
              <span className="text-slate-400">
                Excluded: <strong className="text-rose-400">{formatINR(summary.excludedTotal)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unified Feed */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
            No transactions match these filters.
          </div>
        ) : (
          filteredItems.map((item) => {
            if (item.kind === 'admin_transfer') {
              const pay = item.payment;
              const payer = getProfile(pay.payer_id);
              const admin = getProfile(pay.recipient_admin_id);
              const canDelete =
                isCurrentCycleActive && (isCurrentUserAdmin || pay.payer_id === currentUser.id);

              return (
                <div
                  key={pay.id}
                  className="rounded-2xl border bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={payer?.name || '?'}
                      avatarUrl={payer?.avatar_url}
                      color={payer?.color}
                      size="lg"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{payer?.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-sm font-bold text-amber-300">
                          {admin?.name || 'Admin'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-3 h-3" /> Paid to Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDateTime(pay.payment_date)}
                      </div>
                      {pay.notes && <p className="text-xs text-slate-400 italic">"{pay.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0 border-t sm:border-t-0 border-slate-800/70 pt-2 sm:pt-0">
                    <div className="text-lg font-extrabold font-mono-num text-amber-300">
                      {formatINR(pay.amount)}
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete Admin transfer of ${formatINR(pay.amount)}?`)) {
                            deletePayment(pay.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete Transfer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            if (item.kind === 'standalone_payment') {
              const pay = item.payment;
              const payer = getProfile(pay.payer_id);
              const canDelete =
                isCurrentCycleActive && (isCurrentUserAdmin || pay.payer_id === currentUser.id);

              return (
                <div
                  key={pay.id}
                  className="rounded-2xl border bg-slate-900/70 border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={payer?.name || '?'}
                      avatarUrl={payer?.avatar_url}
                      color={payer?.color}
                      size="lg"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{payer?.name}</span>
                        <span className="text-xs text-slate-400">• {pay.vendor_name || 'Credit'}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <Building2 className="w-3 h-3" /> Payment Credit
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{formatDateTime(pay.payment_date)}</div>
                      {pay.notes && <p className="text-xs text-slate-400 italic">"{pay.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-lg font-extrabold font-mono-num text-emerald-400">
                      {formatINR(pay.amount)}
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete payment credit of ${formatINR(pay.amount)}?`)) {
                            deletePayment(pay.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // Room Expense item (with linked payer info + expandable split breakdown)
            const exp = item.expense;
            const isExpanded = expandedId === exp.id;
            const splits =
              exp.splits && exp.splits.length > 0
                ? exp.splits
                : calculateExpenseSplits(exp, profiles);

            const primaryPayer =
              item.linkedPayments.length > 0
                ? getProfile(item.linkedPayments[0].payer_id)
                : getProfile(exp.created_by);

            const canModify =
              isCurrentCycleActive && (isCurrentUserAdmin || exp.created_by === currentUser.id);

            return (
              <div
                key={exp.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  exp.is_excluded
                    ? 'bg-slate-950/60 border-slate-800/70 opacity-75'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
                      name={primaryPayer?.name || '?'}
                      avatarUrl={primaryPayer?.avatar_url}
                      color={primaryPayer?.color}
                      size="md"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            exp.is_excluded ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {exp.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(
                            exp.category
                          )}`}
                        >
                          {exp.category}
                        </span>
                        {exp.is_excluded && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <Ban className="w-3 h-3" /> Excluded (₹0)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                          <Wallet className="w-3 h-3 text-emerald-400" />
                          Paid by {primaryPayer?.name || 'Member'}
                        </span>
                        <span>•</span>
                        <span>{formatShortDate(exp.created_at)}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          {exp.is_excluded
                            ? 'Personal'
                            : `${exp.participant_ids.length} of ${profiles.length} sharing`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold font-mono-num ${
                          exp.is_excluded ? 'text-slate-500' : 'text-white'
                        }`}
                      >
                        {formatINR(exp.amount)}
                      </div>
                      {!exp.is_excluded && exp.participant_ids.length > 0 && (
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          {formatINR(exp.amount / exp.participant_ids.length)} / ea
                        </div>
                      )}
                    </div>
                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Split Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/50 space-y-3 animate-in fade-in duration-150">
                    {exp.notes && (
                      <p className="text-xs text-slate-400 italic">Note: {exp.notes}</p>
                    )}

                    {/* Payment Proof */}
                    {item.linkedPayments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Payment Recorded:
                        </span>
                        {item.linkedPayments.map((lp) => {
                          const lpPayer = getProfile(lp.payer_id);
                          return (
                            <span
                              key={lp.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 font-mono-num text-[11px]"
                            >
                              <strong>{lpPayer?.name}</strong> paid {formatINR(lp.amount)}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Split Shares */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Per-Member Split Breakdown
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        {splits.map((s) => {
                          const prof = getProfile(s.profile_id);
                          return (
                            <div
                              key={s.profile_id}
                              className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-300 font-medium">{prof?.name}</span>
                              <span className="font-mono-num font-bold text-indigo-300">
                                {formatINR(s.share_amount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {canModify && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTransactionModal('expense', exp);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete "${exp.title}"?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
