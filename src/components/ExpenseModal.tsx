import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory, SplitMode } from '../types';
import { calculateExpenseSplits } from '../engine/splitEngine';
import { formatINR, getInitials } from '../lib/format';
import { X, Check, Calculator, Shield, Users, Tag, AlertTriangle } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = ['Rent', 'Groceries', 'Food', 'Utilities', 'Personal', 'Other'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  editingExpense,
}) => {
  const { profiles, currentUser, selectedCycle, addExpense, updateExpense } = useApp();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [isExcluded, setIsExcluded] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [cappedUserId, setCappedUserId] = useState<string>('');
  const [capPoolAmountStr, setCapPoolAmountStr] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Pre-fill when editing or opening
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmountStr(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setIsExcluded(editingExpense.is_excluded);
      setSplitMode(editingExpense.split_mode);
      setParticipantIds(editingExpense.participant_ids);
      setCappedUserId(editingExpense.cap_rule?.capped_user_id || '');
      setCapPoolAmountStr(editingExpense.cap_rule?.cap_pool_amount?.toString() || '');
      setNotes(editingExpense.notes || '');
    } else {
      setTitle('');
      setAmountStr('');
      setCategory('Groceries');
      setIsExcluded(false);
      setSplitMode('equal');
      setParticipantIds(profiles.map((p) => p.id)); // default all members
      setCappedUserId(profiles[3]?.id || ''); // e.g. Yashwanth
      setCapPoolAmountStr('');
      setNotes('');
    }
  }, [editingExpense, isOpen, profiles]);

  const numericAmount = parseFloat(amountStr) || 0;
  const numericCapPool = parseFloat(capPoolAmountStr) || 0;

  // Live preview calculation of splits
  const previewSplits = useMemo(() => {
    if (numericAmount <= 0) return [];

    const dummyExpense: Expense = {
      id: 'preview',
      cycle_id: selectedCycle?.id || 'cycle_1_nov_2026',
      title: title || 'Draft Expense',
      amount: numericAmount,
      category,
      is_excluded: isExcluded,
      split_mode: isExcluded ? 'excluded' : splitMode,
      participant_ids: participantIds,
      cap_rule:
        splitMode === 'capped' && cappedUserId
          ? {
              capped_user_id: cappedUserId,
              cap_pool_amount: numericCapPool,
            }
          : null,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    return calculateExpenseSplits(dummyExpense, profiles);
  }, [numericAmount, category, isExcluded, splitMode, participantIds, cappedUserId, numericCapPool, profiles, currentUser, selectedCycle, title]);

  if (!isOpen) return null;

  const toggleParticipant = (pid: string) => {
    setParticipantIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const selectAllParticipants = () => {
    setParticipantIds(profiles.map((p) => p.id));
  };

  const selectFourOnly = () => {
    // Select all except Yashwanth (common 4-way pattern)
    setParticipantIds(profiles.slice(0, 4).map((p) => p.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericAmount <= 0) return;
    if (participantIds.length === 0 && !isExcluded) return;

    const expensePayload = {
      cycle_id: selectedCycle!.id,
      title: title.trim(),
      amount: numericAmount,
      category,
      is_excluded: isExcluded,
      split_mode: isExcluded ? ('excluded' as SplitMode) : splitMode,
      participant_ids: participantIds,
      cap_rule:
        splitMode === 'capped' && cappedUserId
          ? {
              capped_user_id: cappedUserId,
              cap_pool_amount: numericCapPool,
            }
          : null,
      notes: notes.trim() || undefined,
      created_by: editingExpense ? editingExpense.created_by : currentUser.id,
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expensePayload);
    } else {
      addExpense(expensePayload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingExpense ? 'Edit Room Expense' : 'Log New Expense ("Paid For What")'}
            </h3>
            <p className="text-xs text-slate-400">
              Record consumption and room liability with granular split rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title & Amount */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Expense Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. DMart Combined Pool, Room Rent, Rice Bag"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Total Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Excluded Toggle (Section 3.2.3) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-200 block">Personal Item (Excluded)</span>
              <span className="text-xs text-slate-400">
                Log for room transparency with ₹0 balance impact
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isExcluded}
                onChange={(e) => setIsExcluded(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {!isExcluded && (
            <>
              {/* Split Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Split Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitMode('equal')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      splitMode === 'equal'
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Equal Participant Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('capped')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      splitMode === 'capped'
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Capped / Partial Pool Split
                  </button>
                </div>
              </div>

              {/* Capped Rule Settings */}
              {splitMode === 'capped' && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span>Capped Pool Rule</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Capped Roommate
                      </label>
                      <select
                        value={cappedUserId}
                        onChange={(e) => setCappedUserId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Capped Shared Pool (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1000 of 1650"
                        value={capPoolAmountStr}
                        onChange={(e) => setCapPoolAmountStr(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-indigo-300/80">
                    Example: In ₹1,650 Rice Bag, selected roommate participates in ₹1,000 (pays ₹200), rest splits equally among others.
                  </p>
                </div>
              )}

              {/* Participant Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Participating Roommates ({participantIds.length}/{profiles.length})
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllParticipants}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      All 5
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={selectFourOnly}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      The 4
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {profiles.map((p) => {
                    const isChecked = participantIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleParticipant(p.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Notes / Bill Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Bought via Swiggy Instamart, receipt attached"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Preview of Per-Person Share */}
          {numericAmount > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Live Share Preview</span>
              </div>
              <div className="space-y-1">
                {previewSplits.map((s) => {
                  const prof = profiles.find((p) => p.id === s.profile_id);
                  return (
                    <div key={s.profile_id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{prof?.name}</span>
                      <span className="font-mono-num font-bold text-slate-100">
                        {formatINR(s.share_amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
