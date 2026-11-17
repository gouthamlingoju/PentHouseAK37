import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  UserPlus,
  User,
  Lock,
  Smartphone,
  Phone,
  RefreshCw,
  CheckCircle2,
  Copy,
  AlertCircle,
} from 'lucide-react';

interface CreateRoommateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Rose
  '#3b82f6', // Blue
];

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  let pwd = 'AK37_';
  for (let i = 0; i < 6; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export const CreateRoommateModal: React.FC<CreateRoommateModalProps> = ({ isOpen, onClose }) => {
  const { createRoommate, showToast } = useApp();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(() => generateTempPassword());
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[5]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    password: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setUsername('');
    setPassword(generateTempPassword());
    setUpiId('');
    setPhone('');
    setError('');
    setCreatedCredentials(null);
    onClose();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username) {
      // Auto-suggest lowercase username
      const suggested = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await createRoommate({
      name,
      username,
      password,
      upi_id: upiId,
      phone,
      color,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.profile) {
      setCreatedCredentials({
        name: res.profile.name,
        username: res.profile.username,
        password,
      });
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `PentHouse AK37 Login Credentials\nName: ${createdCredentials.name}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}\n(You can update your password & UPI ID anytime in Profile Settings)`;
    navigator.clipboard?.writeText(text);
    showToast('success', 'Credentials copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Roommate</h3>
              <p className="text-xs text-slate-400">Creates live Supabase Auth login + room profile</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdCredentials ? (
          /* Success View with Copy Credentials */
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">
                {createdCredentials.name} Added to AK37!
              </h4>
              <p className="text-xs text-slate-300">
                Share these login credentials with them. They can update their own password and UPI ID after signing in.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="text-white font-bold">{createdCredentials.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Password:</span>
                <span className="text-amber-300 font-bold">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Credentials</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Create Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Display Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Login Username *</label>
              <input
                type="text"
                required
                minLength={3}
                autoCapitalize="none"
                placeholder="e.g. karthik"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 font-mono">
                Auth ID: {username || 'username'}@penthouse.ak37
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Initial Password *</label>
                <button
                  type="button"
                  onClick={() => setPassword(generateTempPassword())}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">UPI ID (Optional)</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="name@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+91 98765..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Avatar Badge Color</label>
              <div className="flex items-center gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    className={`w-7 h-7 rounded-lg transition-transform ${
                      color === swatch ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                {loading ? 'Creating...' : 'Create Roommate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
