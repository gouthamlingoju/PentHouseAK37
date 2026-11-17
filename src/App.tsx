import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { ExpenseModal } from './components/ExpenseModal';
import { PaymentModal } from './components/PaymentModal';
import { SettlementModal } from './components/SettlementModal';
import { ProfileModal } from './components/ProfileModal';
import { CreateRoommateModal } from './components/CreateRoommateModal';
import { AdminTransferModal } from './components/AdminTransferModal';
import { CloseCycleModal } from './components/CloseCycleModal';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { SettingsPage } from './pages/SettingsPage';

import { Expense, PairwiseDebt, Profile } from './types';

function AppShell() {
  const { authLoading, isAuthenticated, dataLoading, profiles } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
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

  const openExpenseModal = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setExpenseModalOpen(true);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <ToastContainer />

      {/* Header */}
      <Navbar
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAdminTransfer={() => setAdminTransferModalOpen(true)}
        onOpenCloseCycle={() => setCloseCycleModalOpen(true)}
      />

      {/* Desktop Sub-Nav & Mobile Bottom Nav */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onOpenExpenseModal={() => openExpenseModal()}
            onOpenPaymentModal={() => setPaymentModalOpen(true)}
            onOpenSettlementModal={openSettlementModal}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage onOpenExpenseModal={openExpenseModal} />
        )}

        {activeTab === 'payments' && (
          <PaymentsPage onOpenPaymentModal={() => setPaymentModalOpen(true)} />
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

      {/* Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
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
