import React from 'react';
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  Handshake,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type NavTab = 'dashboard' | 'transactions' | 'settlements' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { pendingApprovalsForMe } = useApp();
  const pendingCount = pendingApprovalsForMe.length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <ReceiptIndianRupee className="w-5 h-5" /> },
    {
      id: 'settlements',
      label: 'Settle',
      icon: <Handshake className="w-5 h-5" />,
      badge: pendingCount,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Top Sub-Navigation */}
      <div className="hidden md:block border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 py-2" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-rose-500 text-white rounded-full ring-2 ring-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
