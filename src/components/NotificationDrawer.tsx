import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDateTime } from '../lib/format';
import {
  X,
  Bell,
  CheckCircle2,
  ReceiptIndianRupee,
  Crown,
  Handshake,
  Smartphone,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationsAsRead,
    clearNotifications,
    pushSupported,
    pushPermission,
    isPushSubscribed,
    togglePushSubscription,
    showToast,
  } = useApp();

  const [togglingPush, setTogglingPush] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    setTogglingPush(true);
    try {
      await togglePushSubscription();
    } finally {
      setTogglingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    setSendingTest(true);
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('PentHouse AK37', {
          body: '🔔 Test notification! Notifications are working on this device.',
          icon: '/favicon.svg',
        });
        showToast('success', 'Test notification triggered!');
      } else {
        showToast('info', 'Please enable notifications first.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to show test notification.');
    } finally {
      setSendingTest(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <ReceiptIndianRupee className="w-4 h-4 text-indigo-400" />;
      case 'admin_transfer':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'settlement':
        return <Handshake className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white">
                    {unreadNotificationCount} new
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Realtime & Push transaction alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadNotificationCount > 0 && (
              <button
                onClick={markNotificationsAsRead}
                className="p-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Web Push Configuration Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Device Web Push</span>
              </div>
              {isPushSubscribed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : pushPermission === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <AlertCircle className="w-3 h-3" /> Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  Off
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isPushSubscribed
                ? 'This device receives lockscreen notifications whenever roommates log expenses or transfer funds.'
                : pushPermission === 'denied'
                ? 'Notifications are blocked in your browser site permissions. Enable them in browser settings.'
                : 'Turn on native push notifications to get alerted even when the PentHouse AK37 tab is closed.'}
            </p>

            {pushSupported ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={togglingPush}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isPushSubscribed
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                  }`}
                >
                  {togglingPush ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : isPushSubscribed ? (
                    <span>Turn Off Push</span>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Enable Web Push</span>
                    </>
                  )}
                </button>

                {isPushSubscribed && (
                  <button
                    type="button"
                    onClick={handleSendTestPush}
                    disabled={sendingTest}
                    className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    {sendingTest ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>Test</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Web Push API is not supported on this browser. On iPhones, tap "Add to Home Screen" in Safari to enable Push.
              </p>
            )}
          </div>

          {/* Notifications Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Recent Alerts</span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <Bell className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No recent notifications</p>
                <p className="text-[11px] text-slate-500">
                  When roommates log expenses or settlements, realtime alerts will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                      item.read
                        ? 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                        : 'bg-indigo-950/20 border-indigo-500/40 text-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                      {getNotifIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold truncate text-slate-100">{item.title}</h4>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center">
          <p className="text-[11px] text-slate-500">
            Realtime updates powered by Supabase Broadcast & Web Push
          </p>
        </div>
      </div>
    </div>
  );
};
