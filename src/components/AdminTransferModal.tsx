import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Crown, AlertTriangle, X, Check } from 'lucide-react';

interface AdminTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminTransferModal: React.FC<AdminTransferModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profiles, currentUser, activeAdmin, transferAdminRole } = useApp();
  const otherProfiles = profiles.filter((p) => p.id !== activeAdmin?.id);
  const [selectedAdminId, setSelectedAdminId] = useState(otherProfiles[0]?.id || '');
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const targetProfile = profiles.find((p) => p.id === selectedAdminId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId || !isConfirmed) return;
    transferAdminRole(selectedAdminId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Transfer Admin Treasury Role</h3>
              <p className="text-xs text-slate-400">Section 3.3 — Transferable Admin Treasury</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Treasury Protocol Notice</span>
            </div>
            <p className="leading-relaxed">
              When transferred, future <strong>"Paid to Admin"</strong> cash collections route to the new Admin ({targetProfile?.name}). Historical entries retain previous Admin records for audit integrity.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Select New Admin Roommate</label>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {otherProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-300">
              I confirm handing over Admin Treasury responsibilities and cycle management to{' '}
              <strong className="text-white">{targetProfile?.name}</strong>.
            </span>
          </label>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || !selectedAdminId}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              Confirm Admin Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
