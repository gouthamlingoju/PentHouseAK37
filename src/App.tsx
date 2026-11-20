import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { TransactionModal } from './components/TransactionModal';
import { SettlementModal } from './components/SettlementModal';
import { ProfileModal } from './components/ProfileModal';
import { CreateRoommateModal } from './components/CreateRoommateModal';
import { AdminTransferModal } from './components/AdminTransferModal';
import { CloseCycleModal } from './components/CloseCycleModal';
import { NotificationDrawer } from './components/NotificationDrawer';

import { LoginPage } from './pages/LoginPage';
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { SettingsPage } from './pages/SettingsPage';

import { Expense, PairwiseDebt, Profile } from './types';

function AppShell() {
  const { isLiveSupabase, authLoading, isAuthenticated, dataLoading, profiles, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionDefaultTab, setTransactionDefaultTab] = useState<'expense' | 'admin_transfer'>('expense');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementPrefill, setSettlementPrefill] = useState<{
    debt?: PairwiseDebt | null;
    targetUser?: Profile | null;
    amount?: number;
  }>({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createRoommateModalOpen, setCreateRoommateModalOpen] = useState(false);
  const [adminTransferModalOpen, setAdminTransferModalOpen] = useState(false);
  const [closeCycleModalOpen, setCloseCycleModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-[2px] animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-white text-base">
            AK<span className="text-amber-400 text-xs ml-0.5">37</span>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-400">Connecting to PentHouse AK37...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <LoginPage />
      </>
    );
  }

  if (dataLoading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Syncing live ledger from Supabase...</p>
      </div>
    );
  }

  // Strictly require password change on first login (or after Admin password reset)
  if (isLiveSupabase && currentUser.id !== 'loading' && currentUser.must_change_password) {
    return (
      <>
        <ToastContainer />
        <ForcePasswordChangePage />
      </>
    );
  }

  const openTransactionModal = (
    defaultTab: 'expense' | 'admin_transfer' = 'expense',
    expense?: Expense
  ) => {
    setEditingExpense(expense || null);
    setTransactionDefaultTab(defaultTab);
    setTransactionModalOpen(true);
  };

  const openSettlementModal = (
    debt?: PairwiseDebt,
    targetUser?: Profile,
    amount?: number
  ) => {
    setSettlementPrefill({ debt: debt || null, targetUser: targetUser || null, amount });
    setSettlementModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-clip">
      <ToastContainer />

      {/* Header */}
      <Navbar
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAdminTransfer={() => setAdminTransferModalOpen(true)}
        onOpenCloseCycle={() => setCloseCycleModalOpen(true)}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
      />

      {/* Desktop Sub-Nav & Mobile Bottom Nav */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onOpenTransactionModal={(tab) => openTransactionModal(tab || 'expense')}
            onOpenSettlementModal={openSettlementModal}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            onOpenTransactionModal={(tab, exp) => openTransactionModal(tab || 'expense', exp)}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementsPage onOpenSettlementModal={(debt) => openSettlementModal(debt)} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenCreateRoommate={() => setCreateRoommateModalOpen(true)}
            onOpenAdminTransfer={() => setAdminTransferModalOpen(true)}
            onOpenCloseCycle={() => setCloseCycleModalOpen(true)}
          />
        )}
      </main>

      {/* Unified Transaction Modal (Room Expense + Transfer to Admin) */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        defaultTab={transactionDefaultTab}
      />

      <SettlementModal
        isOpen={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        prefillDebt={settlementPrefill.debt}
        prefillTargetUser={settlementPrefill.targetUser}
        prefillAmount={settlementPrefill.amount}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <CreateRoommateModal
        isOpen={createRoommateModalOpen}
        onClose={() => setCreateRoommateModalOpen(false)}
      />

      <AdminTransferModal
        isOpen={adminTransferModalOpen}
        onClose={() => setAdminTransferModalOpen(false)}
      />

      <CloseCycleModal
        isOpen={closeCycleModalOpen}
        onClose={() => setCloseCycleModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
