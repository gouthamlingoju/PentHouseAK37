import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Payment, PaymentType } from '../types';
import { X, Wallet, Building2, Crown, Calendar, Tag } from 'lucide-react';
import { formatINR } from '../lib/format';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    profiles,
    currentUser,
    selectedCycle,
    activeAdmin,
    cycleExpenses,
    addPayment,
  } = useApp();

  const [payerId, setPayerId] = useState(currentUser.id);
  const [amountStr, setAmountStr] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('vendor');
  const [recipientAdminId, setRecipientAdminId] = useState(activeAdmin?.id || '');
  const [vendorName, setVendorName] = useState('');
  const [linkedExpenseId, setLinkedExpenseId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen) {
      setPayerId(currentUser.id);
      setAmountStr('');
      setPaymentType('vendor');
      setRecipientAdminId(activeAdmin?.id || '');
      setVendorName('');
      setLinkedExpenseId('');
      setNotes('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, currentUser, activeAdmin]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) return;

    addPayment({
      cycle_id: selectedCycle!.id,
      payer_id: payerId,
      amount,
      payment_type: paymentType,
      recipient_admin_id: paymentType === 'admin_treasury' ? recipientAdminId : null,
      vendor_name:
        paymentType === 'admin_treasury'
          ? `Admin Treasury (${profiles.find((p) => p.id === recipientAdminId)?.name || 'Admin'})`
          : vendorName.trim() || 'External Vendor',
      linked_expense_id: linkedExpenseId || null,
      notes: notes.trim() || undefined,
      payment_date: new Date(paymentDate).toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Log Payment ("Who Paid")</h3>
            <p className="text-xs text-slate-400">
              Record real money outflow paid directly to vendors or handed to Admin Treasury
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
          {/* Payment Type Selector (Vendor vs Admin Treasury) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Payment Routing *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('vendor')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentType === 'vendor'
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Vendor / Bill Payment</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Paid directly to Landlord, DMart, cook, groceries, electricity
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('admin_treasury')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentType === 'admin_treasury'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Paid to Admin Treasury</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Mid-month cash or UPI transfer handed to Admin for pool funds
                </p>
              </button>
            </div>
          </div>

          {/* Paid By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Who Paid *</label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* If Paid to Admin: Show Recipient Admin */}
          {paymentType === 'admin_treasury' ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2">
              <label className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Recipient</span>
              </label>
              <select
                value={recipientAdminId}
                onChange={(e) => setRecipientAdminId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.id === activeAdmin?.id ? '(Active Admin)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-300/80">
                This transfer credits the payer's balance and reduces the Admin's net receivable balance by holding cash in the room treasury.
              </p>
            </div>
          ) : (
            /* Vendor Name */
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Vendor / Merchant Name</label>
              <input
                type="text"
                placeholder="e.g. DMart, Landlord, Swiggy, HP Gas"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Optional Linked Expense */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Linked Expense Tag (Optional)</span>
            </label>
            <select
              value={linkedExpenseId}
              onChange={(e) => setLinkedExpenseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- No specific linked expense tag --</option>
              {cycleExpenses.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({formatINR(e.amount)})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Notes / Transaction Reference</label>
              <input
                type="text"
                placeholder="e.g. Paid via GooglePay, UPI Ref #9021"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Log Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
