import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/format';
import { Lock, AlertCircle, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';

interface CloseCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloseCycleModal: React.FC<CloseCycleModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedCycle,
    pairwiseDebts,
    standings,
    closeCycle,
  } = useApp();

  const [carryForward, setCarryForward] = useState(true);
  const totalUnsettled = pairwiseDebts.reduce((sum, d) => sum + d.amount, 0);

  if (!isOpen) return null;

  const handleConfirmClose = () => {
    closeCycle(carryForward);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Close & Archive Monthly Cycle</h3>
              <p className="text-xs text-slate-400">{selectedCycle?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Cycle Status</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Ready to Lock
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Outstanding Unsettled Balances</span>
              <span className="font-mono-num font-extrabold text-sm text-white">
                {formatINR(totalUnsettled)}
              </span>
            </div>
          </div>

          {/* Unresolved Balances Notice */}
          {pairwiseDebts.length > 0 ? (
            <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{pairwiseDebts.length} Unresolved Debt(s) Remain</span>
              </div>
              <div className="space-y-1 text-xs">
                {pairwiseDebts.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-300 font-mono-num">
                    <span>
                      {d.fromUser.name} → {d.toUser.name}
                    </span>
                    <span className="font-bold text-white">{formatINR(d.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-3.5 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>All balances are zero! Perfect clean closure.</span>
            </div>
          )}

          {/* Option to carry forward */}
          {pairwiseDebts.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carryForward}
                  onChange={(e) => setCarryForward(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Carry Forward Unsettled Dues into Next Cycle
                  </span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                    Automatically seeds opening debt liabilities and credit receivables in the new monthly cycle so nobody loses track of unpaid dues.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Permanent Read-Only Warning */}
          <p className="text-xs text-slate-400 leading-relaxed">
            Closing will permanently lock <strong>{selectedCycle?.name}</strong> as read-only (RLS-enforced). A new active cycle will be initialized immediately.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClose}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Cycle & Initialize Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
