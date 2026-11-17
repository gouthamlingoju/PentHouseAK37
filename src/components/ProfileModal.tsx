import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { AvatarCropModal } from './AvatarCropModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  validateAvatarFile,
  uploadCroppedAvatarBlob,
  deleteStoredAvatarFiles,
  CroppedAvatarResult,
} from '../lib/avatar';
import {
  X,
  User,
  Smartphone,
  Crown,
  Phone,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Crop,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#3b82f6',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, session, updateProfile, updatePassword, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<'details' | 'password'>('details');
  const [name, setName] = useState(currentUser.name);
  const [upiId, setUpiId] = useState(currentUser.upi_id);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [color, setColor] = useState(currentUser.color || '#6366f1');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatar_url || null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropSourceIsBlob, setCropSourceIsBlob] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab('details');
      setName(currentUser.name);
      setUpiId(currentUser.upi_id);
      setPhone(currentUser.phone || '');
      setColor(currentUser.color || '#6366f1');
      setAvatarUrl(currentUser.avatar_url || null);
      setPhotoError('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdError('');
      setPwdSuccess(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const closeCropModal = () => {
    if (cropSourceIsBlob && cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    setCropSourceUrl(null);
    setCropSourceIsBlob(false);
  };

  const openCropWithFile = (file: File) => {
    const validationErr = validateAvatarFile(file);
    if (validationErr) {
      setPhotoError(validationErr);
      return;
    }

    setPhotoError('');
    const objUrl = URL.createObjectURL(file);
    setCropSourceUrl(objUrl);
    setCropSourceIsBlob(true);
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    openCropWithFile(file);
  };

  const handleCameraCaptured = (file: File) => {
    setCameraOpen(false);
    openCropWithFile(file);
  };

  const handleAdjustExistingPhoto = () => {
    if (!avatarUrl) return;
    setPhotoError('');
    setCropSourceUrl(avatarUrl);
    setCropSourceIsBlob(false);
  };

  const handleApplyCrop = async (cropped: CroppedAvatarResult) => {
    setPhotoError('');
    setUploadingPhoto(true);
    const authUid = session?.user?.id || currentUser.auth_user_id;
    const res = await uploadCroppedAvatarBlob(authUid, cropped);

    if (res.error || !res.url) {
      setPhotoError(res.error || 'Failed to upload photo.');
      setUploadingPhoto(false);
      closeCropModal();
      return;
    }

    setAvatarUrl(res.url);
    await updateProfile(currentUser.id, { avatar_url: res.url });
    setUploadingPhoto(false);
    closeCropModal();
  };

  const handleRemovePhoto = async () => {
    setPhotoError('');
    setUploadingPhoto(true);
    const authUid = session?.user?.id || currentUser.auth_user_id;
    await deleteStoredAvatarFiles(authUid);
    setAvatarUrl(null);
    await updateProfile(currentUser.id, { avatar_url: null });
    setUploadingPhoto(false);
    showToast('info', 'Profile picture removed.');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !upiId.trim()) return;
    setSaving(true);
    await updateProfile(currentUser.id, {
      name: name.trim(),
      upi_id: upiId.trim(),
      phone: phone.trim() || null,
      color,
      avatar_url: avatarUrl,
    });
    setSaving(false);
    onClose();
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const res = await updatePassword(newPassword);
    setSaving(false);

    if (res.error) {
      setPwdError(res.error);
    } else {
      setPwdSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Avatar name={name || currentUser.name} avatarUrl={avatarUrl} color={color} size="md" />
            <div>
              <h3 className="text-base font-bold text-white">Self Profile Updation</h3>
              <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTab('details')}
              className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'details'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('password')}
              className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'password'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        {tab === 'details' ? (
          <form onSubmit={handleSaveDetails} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Profile Picture Upload Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex items-center gap-4">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="relative block rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Upload profile picture"
                >
                  <Avatar
                    name={name || currentUser.name}
                    avatarUrl={avatarUrl}
                    color={color}
                    size="xl"
                    className={uploadingPhoto ? 'opacity-50' : 'group-hover:opacity-85 transition-opacity'}
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg ring-2 ring-slate-950">
                    {uploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoSelected}
                  className="hidden"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-xs font-bold text-slate-200">Profile Picture</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Upload from gallery or snap with your camera, then crop & adjust.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Gallery'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => setCameraOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Camera</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleAdjustExistingPhoto}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Crop className="w-3 h-3 text-indigo-400" />
                      <span>Adjust</span>
                    </button>
                  )}
                  {avatarUrl && (
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {photoError && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Display Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">UPI ID / VPA *</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. goutham@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Fallback Badge Color</label>
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

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between items-center">
                <span>Login Username:</span>
                <span className="font-mono text-slate-200">{currentUser.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Role:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  {currentUser.is_admin ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-400" /> Admin
                    </>
                  ) : (
                    'Roommate (Member)'
                  )}
                </span>
              </div>
            </div>

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
                disabled={saving || uploadingPhoto}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSavePassword} className="p-6 space-y-4">
            {pwdError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCaptureFile={handleCameraCaptured}
        defaultFacingMode="user"
      />

      {/* Interactive Crop, Zoom, Rotate & Aspect Ratio Editor */}
      <AvatarCropModal
        isOpen={Boolean(cropSourceUrl)}
        imageSrc={cropSourceUrl}
        onCancel={closeCropModal}
        onApply={handleApplyCrop}
      />
    </div>
  );
};
