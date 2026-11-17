import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { calculateExpenseSplits } from '../engine/splitEngine';
import { formatINR, formatShortDate } from '../lib/format';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Users,
  Shield,
  Ban,
  ReceiptIndianRupee,
} from 'lucide-react';

interface ExpensesPageProps {
  onOpenExpenseModal: (expense?: Expense) => void;
}

const CATEGORIES: ('All' | ExpenseCategory)[] = [
  'All',
  'Fixed',
  'Grocery',
  'Food',
  'Utilities',
  'Personal',
  'Other',
];

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenExpenseModal }) => {
  const {
    profiles,
    cycleExpenses,
    deleteExpense,
    isCurrentCycleActive,
    currentUser,
    isCurrentUserAdmin,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExpenseCategory>('All');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('All');
  const [showExcludedFilter, setShowExcludedFilter] = useState<'all' | 'active' | 'excluded'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return cycleExpenses
      .filter((exp) => {
        if (searchQuery && !exp.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (selectedCategory !== 'All' && exp.category !== selectedCategory) {
          return false;
        }
        if (selectedParticipant !== 'All' && !exp.participant_ids.includes(selectedParticipant)) {
          return false;
        }
        if (showExcludedFilter === 'active' && exp.is_excluded) return false;
        if (showExcludedFilter === 'excluded' && !exp.is_excluded) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [cycleExpenses, searchQuery, selectedCategory, selectedParticipant, showExcludedFilter]);

  const totalFilteredActive = filteredExpenses
    .filter((e) => !e.is_excluded)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalFilteredExcluded = filteredExpenses
    .filter((e) => e.is_excluded)
    .reduce((sum, e) => sum + e.amount, 0);

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
            <span>Expenses Ledger ("Paid For What")</span>
          </h2>
          <p className="text-xs text-slate-400">
            Consumption & room liabilities • Split rules live strictly here
          </p>
        </div>

        {isCurrentCycleActive && (
          <button
            onClick={() => onOpenExpenseModal()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Transaction</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Participant */}
          <select
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Participant: Everyone</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                Includes: {p.name}
              </option>
            ))}
          </select>

          {/* Active vs Excluded */}
          <select
            value={showExcludedFilter}
            onChange={(e) => setShowExcludedFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Pool Status: All Items</option>
            <option value="active">Active Pool Only</option>
            <option value="excluded">Excluded / Personal Only</option>
          </select>
        </div>

        {/* Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">
            Showing <strong className="text-slate-200">{filteredExpenses.length}</strong> items
          </span>
          <div className="flex items-center gap-4 font-mono-num">
            <span className="text-slate-300">
              Active Sum: <strong className="text-emerald-400">{formatINR(totalFilteredActive)}</strong>
            </span>
            {totalFilteredExcluded > 0 && (
              <span className="text-slate-400">
                Excluded: <strong className="text-rose-400">{formatINR(totalFilteredExcluded)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
            No matching expenses found for these filters.
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const isExpanded = expandedId === exp.id;
            const splits =
              exp.splits && exp.splits.length > 0
                ? exp.splits
                : calculateExpenseSplits(exp, profiles);
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
                {/* Main Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                >
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
                      {exp.split_mode === 'capped' && !exp.is_excluded && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          <Shield className="w-3 h-3" /> Capped Pool
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
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
                      {!exp.is_excluded && exp.split_mode === 'equal' && exp.participant_ids.length > 0 && (
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

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Per-Member Split Breakdown
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        {splits.map((s) => {
                          const prof = profiles.find((p) => p.id === s.profile_id);
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
                            onOpenExpenseModal(exp);
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
