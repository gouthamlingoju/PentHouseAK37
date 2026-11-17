import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PairwiseDebt, Profile } from '../types';
import { formatINR } from '../lib/format';
import { generateUpiUrl, generateQrCodeUrl } from '../lib/upi';
import {
  X,
  Handshake,
  ArrowRight,
  Smartphone,
  QrCode,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillDebt?: PairwiseDebt | null;
  prefillTargetUser?: Profile | null;
  prefillAmount?: number;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  prefillDebt,
  prefillTargetUser,
  prefillAmount,
}) => {
  const {
    profiles,
    currentUser,
    activeAdmin,
    pairwiseDebts,
    initiateSettlement,
    isCurrentUserAdmin,
  } = useApp();

  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [notes, setNotes] = useState('');
  const [showQr, setShowQr] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (!isOpen) return;

    setShowQr(false);
    setUpiRef('');
    setNotes('');

    if (prefillDebt) {
      setFromUserId(prefillDebt.fromUser.id);
      setToUserId(prefillDebt.toUser.id);
      setAmountStr(prefillDebt.amount.toFixed(2));
    } else if (prefillTargetUser) {
      setFromUserId(prefillTargetUser.id);
      setToUserId(activeAdmin?.id || currentUser.id);
      setAmountStr(prefillAmount ? prefillAmount.toFixed(2) : '');
    } else {
      // Find first debt involving current user, or first overall
      const myDebt = pairwiseDebts.find(
        (d) => d.fromUser.id === currentUser.id || d.toUser.id === currentUser.id
      );
      if (myDebt && (isCurrentUserAdmin || myDebt.fromUser.id === currentUser.id)) {
        setFromUserId(myDebt.fromUser.id);
        setToUserId(myDebt.toUser.id);
        setAmountStr(myDebt.amount.toFixed(2));
      } else {
        setFromUserId(currentUser.id);
        const defaultRecipient =
          activeAdmin && activeAdmin.id !== currentUser.id
            ? activeAdmin
            : profiles.find((p) => p.id !== currentUser.id);
        setToUserId(defaultRecipient?.id || '');
        setAmountStr('');
      }
    }
  }, [isOpen, prefillDebt, prefillTargetUser, prefillAmount, currentUser, activeAdmin, pairwiseDebts, profiles]);

  const fromUser = profiles.find((p) => p.id === fromUserId);
  const toUser = profiles.find((p) => p.id === toUserId);
  const numericAmount = parseFloat(amountStr) || 0;

  // Lookup exact remaining owed amount between selected from -> to pair
  // Privacy: non-admins can only view owed amounts involving themselves
  const remainingOwed = useMemo(() => {
    if (!isCurrentUserAdmin && fromUserId !== currentUser.id && toUserId !== currentUser.id) {
      return 0;
    }
    const match = pairwiseDebts.find(
      (d) => d.fromUser.id === fromUserId && d.toUser.id === toUserId
    );
    return match ? match.amount : 0;
  }, [pairwiseDebts, fromUserId, toUserId, isCurrentUserAdmin, currentUser.id]);

  const upiUrl = useMemo(() => {
    if (!toUser || numericAmount <= 0) return '';
    return generateUpiUrl({
      payeeUpiId: toUser.upi_id,
      payeeName: toUser.name,
      amount: numericAmount,
      transactionNote: `PentHouse AK37 Settlement (${fromUser?.name || ''})`,
    });
  }, [toUser, numericAmount, fromUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromUserId || !toUserId || fromUserId === toUserId || numericAmount <= 0) return;

    initiateSettlement({
      fromUserId,
      toUserId,
      amount: numericAmount,
      upiRef: upiRef.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-indigo-400" />
              <span>Initiate Settlement (Full / Partial)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Requires two-party digital consent before permanently closing debt
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Debtor & Creditor Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-end">
            <div className="sm:col-span-5 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Payer (Debtor)</label>
              {isCurrentUserAdmin ? (
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-rose-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-rose-300 font-semibold">
                  {currentUser.name} (You)
                </div>
              )}
            </div>

            <div className="sm:col-span-1 flex items-center justify-center pb-2.5 text-slate-500">
              <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
            </div>

            <div className="sm:col-span-5 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Recipient (Creditor)</label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-emerald-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(isCurrentUserAdmin ? profiles : profiles.filter((p) => p.id !== currentUser.id)).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fromUserId === toUserId && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Payer and Recipient must be two different roommates.</span>
            </div>
          )}

          {/* Remaining Balance Indicator */}
          {remainingOwed > 0 && (
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Exact Remaining Due:</span>
              <span className="font-mono-num font-extrabold text-sm text-white">
                {formatINR(remainingOwed)}
              </span>
            </div>
          )}

          {/* Settlement Amount Input + Quick Partial Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Settlement Amount (₹) *</label>
              {remainingOwed > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountStr((remainingOwed / 2).toFixed(2))}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    50% Partial
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountStr(remainingOwed.toFixed(2))}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300"
                  >
                    Full ({formatINR(remainingOwed)})
                  </button>
                </div>
              )}
            </div>

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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-3 text-base font-bold text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {remainingOwed > 0 && numericAmount > 0 && numericAmount < remainingOwed && (
              <p className="text-xs text-amber-300">
                Partial settlement: {formatINR(remainingOwed - numericAmount)} will remain pending after closure.
              </p>
            )}
          </div>

          {/* 1-Tap UPI Pay & QR Code Helper */}
          {toUser && numericAmount > 0 && fromUserId !== toUserId && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">
                    Pay {toUser.name} via UPI
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{toUser.upi_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQr((prev) => !prev)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Show Scannable UPI QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <a
                    href={upiUrl}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open UPI App</span>
                  </a>
                </div>
              </div>

              {showQr && (
                <div className="pt-2 border-t border-emerald-500/20 flex flex-col items-center justify-center">
                  <img
                    src={generateQrCodeUrl(upiUrl, 180)}
                    alt={`UPI QR for ${toUser.name}`}
                    className="rounded-xl border-4 border-white shadow-lg"
                  />
                  <span className="text-[11px] text-slate-400 mt-2">
                    Scan with GPay, PhonePe, Paytm or BHIM for {formatINR(numericAmount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* UPI Reference / UTR & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">UPI Ref / UTR Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 432198012345"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Partial settlement via GPay"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Two-Party Consent Notice */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Two-Party Consent Protocol:</strong> Logging this settlement places it in{' '}
              <span className="text-amber-300 font-semibold">Awaiting Counterparty Confirmation</span>{' '}
              (1/2 Confirmed). The counterparty must click <strong>Confirm & Close</strong> before balances permanently update.
            </p>
          </div>

          {/* Actions */}
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
              disabled={fromUserId === toUserId || numericAmount <= 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Initiate Settlement Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
