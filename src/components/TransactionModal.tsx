import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory, SplitMode } from '../types';
import { calculateExpenseSplits } from '../engine/splitEngine';
import { formatINR } from '../lib/format';
import {
  X,
  Check,
  Calculator,
  ReceiptIndianRupee,
  Crown,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
  defaultTab?: 'expense' | 'admin_transfer';
}

const CATEGORIES: ExpenseCategory[] = ['Grocery', 'Food', 'Fixed', 'Utilities', 'Other'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingExpense,
  defaultTab = 'expense',
}) => {
  const {
    profiles,
    currentUser,
    activeAdmin,
    isCurrentUserAdmin,
    selectedCycle,
    addExpense,
    updateExpense,
    addPayment,
  } = useApp();

  const [txType, setTxType] = useState<'expense' | 'admin_transfer'>(defaultTab);

  // Room Expense fields
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Grocery');
  const [paidById, setPaidById] = useState<string>(currentUser.id);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Transfer fields
  const otherRoommates = useMemo(
    () => profiles.filter((p) => p.id !== activeAdmin?.id),
    [profiles, activeAdmin]
  );
  const [transferFromId, setTransferFromId] = useState<string>('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!isOpen) return;

    if (editingExpense) {
      setTxType('expense');
      setTitle(editingExpense.title);
      setAmountStr(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setPaidById(editingExpense.created_by || currentUser.id);
      setParticipantIds(editingExpense.participant_ids);
      setNotes(editingExpense.notes || '');
    } else {
      setTxType(defaultTab);
      setTitle('');
      setAmountStr('');
      setCategory('Grocery');
      setPaidById(currentUser.id);
      setParticipantIds(profiles.map((p) => p.id));
      setNotes('');

      if (isCurrentUserAdmin) {
        setTransferFromId(otherRoommates[0]?.id || '');
      } else {
        setTransferFromId(currentUser.id);
      }
      setTransferDate(new Date().toISOString().slice(0, 10));
    }
  }, [editingExpense, isOpen, defaultTab, profiles, currentUser, isCurrentUserAdmin, otherRoommates]);

  const numericAmount = parseFloat(amountStr) || 0;

  const previewSplits = useMemo(() => {
    if (txType !== 'expense' || numericAmount <= 0) return [];
    const dummyExpense: Expense = {
      id: 'preview',
      cycle_id: selectedCycle?.id || 'cycle_1_nov_2026',
      title: title || 'Draft Expense',
      amount: numericAmount,
      category,
      is_excluded: false,
      split_mode: 'equal',
      participant_ids: participantIds,
      created_by: paidById || currentUser.id,
      created_at: new Date().toISOString(),
    };
    return calculateExpenseSplits(dummyExpense, profiles);
  }, [txType, numericAmount, category, participantIds, profiles, paidById, currentUser, selectedCycle, title]);

  if (!isOpen) return null;

  const toggleParticipant = (pid: string) => {
    setParticipantIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const selectAllParticipants = () => setParticipantIds(profiles.map((p) => p.id));

  const selectFourOnly = () => {
    const withoutYash = profiles.filter((p) => p.username !== 'yashwanth').map((p) => p.id);
    setParticipantIds(withoutYash.length > 0 ? withoutYash : profiles.slice(0, 4).map((p) => p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || numericAmount <= 0 || !selectedCycle) return;

    setIsSubmitting(true);
    try {
      if (txType === 'admin_transfer') {
        const fromId = isCurrentUserAdmin ? transferFromId : currentUser.id;
        const toAdminId = activeAdmin?.id;
        if (!fromId || !toAdminId || fromId === toAdminId) return;

        await addPayment({
          cycle_id: selectedCycle.id,
          payer_id: fromId,
          amount: numericAmount,
          payment_type: 'admin_treasury',
          recipient_admin_id: toAdminId,
          vendor_name: `Admin Treasury (${activeAdmin?.name || 'Admin'})`,
          notes: notes.trim() || 'Transfer to Admin Treasury',
          payment_date: new Date(transferDate).toISOString(),
        });
        onClose();
        return;
      }

      if (!title.trim() || participantIds.length === 0) return;

      const expensePayload = {
        cycle_id: selectedCycle.id,
        title: title.trim(),
        amount: numericAmount,
        category,
        is_excluded: false,
        split_mode: 'equal' as SplitMode,
        participant_ids: participantIds,
        notes: notes.trim() || undefined,
        created_by: editingExpense ? editingExpense.created_by : paidById,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expensePayload);
      } else {
        await addExpense(expensePayload, paidById);
      }
      onClose();
    } catch (err) {
      console.error('Error submitting transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingExpense ? 'Edit Room Expense' : 'Log Transaction'}
            </h3>
            <p className="text-xs text-slate-400">
              {editingExpense
                ? 'Update expense details and participating roommates'
                : 'Log a room expense you paid for, or a transfer to Admin'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Transaction Type Switcher */}
        {!editingExpense && (
          <div className="px-6 pt-4">
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  txType === 'expense'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ReceiptIndianRupee className="w-3.5 h-3.5" />
                <span>Room Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('admin_transfer')}
                className={`py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  txType === 'admin_transfer'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{isCurrentUserAdmin ? 'Cash Received (Admin)' : 'Transfer to Admin'}</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {txType === 'admin_transfer' ? (
            <>
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-center justify-between gap-2 text-xs">
                <div className="font-semibold text-slate-200">
                  {isCurrentUserAdmin
                    ? profiles.find((p) => p.id === transferFromId)?.name || 'Roommate'
                    : `${currentUser.name} (You)`}
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{activeAdmin?.name} (Admin)</span>
                </div>
              </div>

              {isCurrentUserAdmin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Received From Roommate *</label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {otherRoommates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (@{p.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Amount (₹) *</label>
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Date</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Note / UPI Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI advance to Admin for room pool"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice Bag, Room Rent, Vegetables, Chicken"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Amount (₹) *</label>
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

              {/* Single Payer Selector */}
              {!editingExpense && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Paid By</label>
                  {isCurrentUserAdmin ? (
                    <select
                      value={paidById}
                      onChange={(e) => setPaidById(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.id === currentUser.id ? '(You)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 font-semibold">
                      {currentUser.name} (You)
                    </div>
                  )}
                </div>
              )}

              {/* Participant Checkboxes (Equal Split) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Split Equally Among ({participantIds.length}/{profiles.length})
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllParticipants}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      All {profiles.length}
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={selectFourOnly}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      4-Way
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

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional bill note or reference"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Share Preview */}
              {numericAmount > 0 && previewSplits.length > 0 && (
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
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                numericAmount <= 0 ||
                (txType === 'expense' && (!title.trim() || participantIds.length === 0)) ||
                (txType === 'admin_transfer' &&
                  (!transferFromId ||
                    !activeAdmin?.id ||
                    (isCurrentUserAdmin && transferFromId === activeAdmin.id)))
              }
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                txType === 'admin_transfer'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {editingExpense
                      ? 'Saving Changes...'
                      : txType === 'admin_transfer'
                      ? isCurrentUserAdmin
                        ? 'Recording Cash...'
                        : 'Logging Transfer...'
                      : 'Logging Expense & Payment...'}
                  </span>
                </>
              ) : editingExpense ? (
                'Save Changes'
              ) : txType === 'admin_transfer' ? (
                isCurrentUserAdmin ? (
                  'Record Cash Received'
                ) : (
                  'Log Transfer to Admin'
                )
              ) : (
                'Log Expense & Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
