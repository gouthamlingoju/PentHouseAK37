import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  Profile,
  Cycle,
  Expense,
  Payment,
  Settlement,
  MemberStanding,
  PairwiseDebt,
} from '../types';
import {
  loadInitialData,
  saveLocalState,
  resetToSeedData,
  AppDataState,
} from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  calculateMemberStandings,
  calculatePairwiseDebts,
  calculateExpenseSplits,
  round2,
} from '../engine/splitEngine';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface CreateRoommateInput {
  username: string;
  name: string;
  password: string;
  upi_id?: string;
  phone?: string;
  color?: string;
}

interface AppContextType {
  // Auth & Loading State
  isLiveSupabase: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  isAuthenticated: boolean;
  session: Session | null;

  // Domain State
  profiles: Profile[];
  currentUser: Profile;
  cycles: Cycle[];
  selectedCycle: Cycle | undefined;
  activeCycle: Cycle | undefined;
  cycleExpenses: Expense[];
  cyclePayments: Payment[];
  cycleSettlements: Settlement[];
  standings: MemberStanding[];
  currentUserStanding: MemberStanding | undefined;
  pairwiseDebts: PairwiseDebt[];
  activeAdmin: Profile | undefined;
  isCurrentCycleActive: boolean;
  isCurrentUserAdmin: boolean;
  pendingApprovalsForMe: Settlement[];
  pendingInitiatedByMe: Settlement[];
  toasts: Toast[];

  // Auth Actions
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  createRoommate: (input: CreateRoommateInput) => Promise<{ profile?: Profile; error?: string }>;
  adminResetRoommatePassword: (profileId: string, newPassword: string) => Promise<{ error?: string }>;

  // App Actions
  switchUser: (userId: string) => void;
  selectCycle: (cycleId: string) => void;
  updateProfile: (userId: string, data: Partial<Profile>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>, paidByUserId?: string) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  initiateSettlement: (params: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    notes?: string;
    upiRef?: string;
  }) => Promise<void>;
  confirmSettlement: (settlementId: string) => Promise<void>;
  rejectSettlement: (settlementId: string, reason?: string) => Promise<void>;
  transferAdminRole: (newAdminId: string) => Promise<void>;
  closeCycle: (carryForwardUnpaid: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
  resetData: () => void;
  dismissToast: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const FALLBACK_PROFILE: Profile = {
  id: 'loading',
  username: 'loading',
  name: 'Loading...',
  email: '',
  upi_id: '',
  is_admin: false,
  created_at: new Date().toISOString(),
};

function normalizeUsernameToEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@penthouse.ak37`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLiveSupabase = isSupabaseConfigured && Boolean(supabase);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isLiveSupabase);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  const [data, setData] = useState<AppDataState>(() =>
    isLiveSupabase
      ? {
          profiles: [],
          cycles: [],
          expenses: [],
          payments: [],
          settlements: [],
          currentUserId: '',
          selectedCycleId: '',
        }
      : loadInitialData()
  );

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist to localStorage only in local fallback mode
  useEffect(() => {
    if (!isLiveSupabase) {
      saveLocalState(data);
    }
  }, [data, isLiveSupabase]);

  // Fetch all data from Supabase
  const refreshData = useCallback(async () => {
    if (!isLiveSupabase || !supabase) return;
    setDataLoading(true);
    try {
      const [profRes, cycRes, expRes, payRes, setRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('cycles').select('*').order('started_at', { ascending: true }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('settlements').select('*').order('created_at', { ascending: false }),
      ]);

      if (profRes.error) throw profRes.error;
      if (cycRes.error) throw cycRes.error;
      if (expRes.error) throw expRes.error;
      if (payRes.error) throw payRes.error;
      if (setRes.error) throw setRes.error;

      const profiles: Profile[] = (profRes.data || []).map((p: any) => ({
        ...p,
        is_admin: Boolean(p.is_admin),
        must_change_password: Boolean(p.must_change_password),
      }));

      const cycles: Cycle[] = cycRes.data || [];

      const expenses: Expense[] = (expRes.data || []).map((e: any) => ({
        ...e,
        amount: Number(e.amount),
        is_excluded: Boolean(e.is_excluded),
        participant_ids: Array.isArray(e.participant_ids) ? e.participant_ids : [],
      }));

      const payments: Payment[] = (payRes.data || []).map((p: any) => ({
        ...p,
        amount: Number(p.amount),
      }));

      const settlements: Settlement[] = (setRes.data || []).map((s: any) => ({
        ...s,
        amount: Number(s.amount),
      }));

      setData((prev) => {
        const activeCyc = cycles.find((c) => c.status === 'active') || cycles[0];
        const validSelected = cycles.some((c) => c.id === prev.selectedCycleId)
          ? prev.selectedCycleId
          : activeCyc?.id || '';

        return {
          ...prev,
          profiles,
          cycles,
          expenses,
          payments,
          settlements,
          selectedCycleId: validSelected,
        };
      });
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      showToast('error', `Failed syncing with Supabase: ${err.message || err}`);
    } finally {
      setDataLoading(false);
    }
  }, [isLiveSupabase, showToast]);

  // Listen to Supabase Auth session
  useEffect(() => {
    if (!isLiveSupabase || !supabase) return;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLiveSupabase]);

  // Load data & subscribe to Realtime when authenticated
  useEffect(() => {
    if (!isLiveSupabase || !supabase || !session) return;

    refreshData();

    const channel = supabase
      .channel('penthouse-ak37-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cycles' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => refreshData())
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isLiveSupabase, session, refreshData]);

  // Determine current user profile
  const currentUser = useMemo(() => {
    if (isLiveSupabase) {
      if (!session) return FALLBACK_PROFILE;
      const byAuthId = data.profiles.find((p) => p.auth_user_id === session.user.id);
      if (byAuthId) return byAuthId;
      const byEmail = data.profiles.find(
        (p) => p.email.toLowerCase() === (session.user.email || '').toLowerCase()
      );
      return byEmail || FALLBACK_PROFILE;
    }
    return data.profiles.find((p) => p.id === data.currentUserId) || data.profiles[0] || FALLBACK_PROFILE;
  }, [isLiveSupabase, session, data.profiles, data.currentUserId]);

  const isAuthenticated = isLiveSupabase ? Boolean(session) : true;

  // Cycles
  const activeCycle = useMemo(() => {
    return data.cycles.find((c) => c.status === 'active') || data.cycles[0];
  }, [data.cycles]);

  const selectedCycle = useMemo(() => {
    return data.cycles.find((c) => c.id === data.selectedCycleId) || activeCycle;
  }, [data.cycles, data.selectedCycleId, activeCycle]);

  const activeAdmin = useMemo(() => {
    if (!selectedCycle) return data.profiles.find((p) => p.is_admin);
    return (
      data.profiles.find((p) => p.id === selectedCycle.admin_id) ||
      data.profiles.find((p) => p.is_admin)
    );
  }, [data.profiles, selectedCycle]);

  const isCurrentCycleActive = selectedCycle?.status === 'active';
  const isCurrentUserAdmin = Boolean(currentUser.is_admin);

  // Scoped records for selected cycle
  const cycleExpenses = useMemo(() => {
    if (!selectedCycle) return [];
    return data.expenses.filter((e) => e.cycle_id === selectedCycle.id);
  }, [data.expenses, selectedCycle]);

  const cyclePayments = useMemo(() => {
    if (!selectedCycle) return [];
    return data.payments.filter((p) => p.cycle_id === selectedCycle.id);
  }, [data.payments, selectedCycle]);

  const cycleSettlements = useMemo(() => {
    if (!selectedCycle) return [];
    return data.settlements.filter((s) => s.cycle_id === selectedCycle.id);
  }, [data.settlements, selectedCycle]);

  const standings = useMemo(() => {
    if (!selectedCycle || !activeAdmin || data.profiles.length === 0) return [];
    return calculateMemberStandings(
      data.profiles,
      cycleExpenses,
      cyclePayments,
      cycleSettlements,
      activeAdmin.id
    );
  }, [data.profiles, cycleExpenses, cyclePayments, cycleSettlements, activeAdmin, selectedCycle]);

  const currentUserStanding = useMemo(() => {
    return standings.find((s) => s.profile.id === currentUser.id);
  }, [standings, currentUser.id]);

  const pairwiseDebts = useMemo(() => calculatePairwiseDebts(standings), [standings]);

  const pendingApprovalsForMe = useMemo(() => {
    return cycleSettlements.filter(
      (s) =>
        s.status === 'pending' &&
        s.initiated_by !== currentUser.id &&
        (s.to_user_id === currentUser.id || s.from_user_id === currentUser.id)
    );
  }, [cycleSettlements, currentUser.id]);

  const pendingInitiatedByMe = useMemo(() => {
    return cycleSettlements.filter(
      (s) => s.status === 'pending' && s.initiated_by === currentUser.id
    );
  }, [cycleSettlements, currentUser.id]);

  // =================== AUTH ACTIONS ===================

  const signIn = async (usernameOrEmail: string, password: string): Promise<{ error?: string }> => {
    if (!isLiveSupabase || !supabase) {
      return { error: 'Supabase is not configured.' };
    }
    const email = normalizeUsernameToEmail(usernameOrEmail);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message === 'Invalid login credentials' ? 'Invalid username or password.' : error.message };
    }
    showToast('success', 'Signed in to PentHouse AK37!');
    return {};
  };

  const signOut = async () => {
    if (isLiveSupabase && supabase) {
      await supabase.auth.signOut();
      setSession(null);
      showToast('info', 'Signed out cleanly.');
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }
    if (!isLiveSupabase || !supabase) {
      showToast('success', 'Password updated (Local Mode).');
      return {};
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast('error', error.message);
      return { error: error.message };
    }

    // Clear mandatory first-login password change flag in profiles
    if (currentUser.id && currentUser.id !== 'loading') {
      const { error: flagErr } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', currentUser.id);
      if (flagErr) {
        console.warn('Could not clear must_change_password flag:', flagErr.message);
      }
      await refreshData();
    }

    showToast('success', 'Your login password has been updated!');
    return {};
  };

  const createRoommate = async (
    input: CreateRoommateInput
  ): Promise<{ profile?: Profile; error?: string }> => {
    if (!isCurrentUserAdmin) {
      return { error: 'Only the active Admin can create new roommates.' };
    }

    if (!isLiveSupabase || !supabase || !session) {
      // Local mode creation
      const cleanUser = input.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const newProf: Profile = {
        id: `user_${cleanUser}_${Date.now().toString(36).slice(-4)}`,
        username: cleanUser,
        name: input.name.trim(),
        email: `${cleanUser}@penthouse.ak37`,
        upi_id: input.upi_id?.trim() || `${cleanUser}@upi`,
        phone: input.phone?.trim() || null,
        color: input.color || '#8b5cf6',
        is_admin: false,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, profiles: [...prev.profiles, newProf] }));
      showToast('success', `Roommate ${newProf.name} (@${newProf.username}) created!`);
      return { profile: newProf };
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-roommate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'create', ...input }),
      });

      const payload = await res.json();
      if (!res.ok) {
        return { error: payload.error || 'Failed to create roommate.' };
      }

      await refreshData();
      showToast('success', `Roommate ${payload.profile.name} (@${payload.profile.username}) created!`);
      return { profile: payload.profile };
    } catch (err: any) {
      return { error: err?.message || 'Network error creating roommate.' };
    }
  };

  const adminResetRoommatePassword = async (
    profileId: string,
    newPassword: string
  ): Promise<{ error?: string }> => {
    if (!isCurrentUserAdmin) {
      return { error: 'Only the Admin can reset roommate passwords.' };
    }
    if (!isLiveSupabase || !supabase || !session) {
      showToast('success', 'Password reset (Local Mode).');
      return {};
    }
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-roommate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'reset_password', profileId, newPassword }),
      });
      const payload = await res.json();
      if (!res.ok) return { error: payload.error || 'Failed to reset password.' };
      showToast('success', payload.message || 'Password updated!');
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Network error resetting password.' };
    }
  };

  // =================== DOMAIN ACTIONS ===================

  const switchUser = (userId: string) => {
    if (isLiveSupabase) return; // Disabled in live Supabase Auth mode
    setData((prev) => ({ ...prev, currentUserId: userId }));
    const p = data.profiles.find((prof) => prof.id === userId);
    showToast('info', `Switched active view to ${p?.name || 'User'}`);
  };

  const selectCycle = (cycleId: string) => {
    setData((prev) => ({ ...prev, selectedCycleId: cycleId }));
  };

  const updateProfile = async (userId: string, updates: Partial<Profile>) => {
    if (isLiveSupabase && supabase) {
      const safeUpdates: Record<string, any> = {};
      if (updates.name !== undefined) safeUpdates.name = updates.name;
      if (updates.upi_id !== undefined) safeUpdates.upi_id = updates.upi_id;
      if (updates.phone !== undefined) safeUpdates.phone = updates.phone;
      if (updates.color !== undefined) safeUpdates.color = updates.color;
      if (updates.avatar_url !== undefined) safeUpdates.avatar_url = updates.avatar_url;

      const { error } = await supabase.from('profiles').update(safeUpdates).eq('id', userId);
      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
      showToast('success', 'Profile updated successfully!');
      return;
    }

    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === userId ? { ...p, ...updates } : p)),
    }));
    showToast('success', 'Profile updated successfully!');
  };

  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at'>,
    paidByUserId?: string
  ) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot add expenses to a closed monthly cycle');
      return;
    }

    const nowIso = new Date().toISOString();
    const newId = `exp_${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      created_at: nowIso,
    };
    const splits = calculateExpenseSplits(newExpense, data.profiles);

    // Automatically create the single linked vendor payment for expenses
    const shouldCreatePayment = Boolean(paidByUserId) && newExpense.amount > 0;
    const autoPayment: Payment | null = shouldCreatePayment
      ? {
          id: `pay_${Date.now()}`,
          cycle_id: newExpense.cycle_id,
          payer_id: paidByUserId!,
          amount: newExpense.amount,
          payment_type: 'vendor',
          recipient_admin_id: null,
          linked_expense_id: newExpense.id,
          vendor_name: newExpense.title,
          notes: newExpense.notes || newExpense.title,
          payment_date: nowIso,
          created_at: nowIso,
        }
      : null;

    if (isLiveSupabase && supabase) {
      const { error } = await supabase.from('expenses').insert({
        id: newExpense.id,
        cycle_id: newExpense.cycle_id,
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
        is_excluded: newExpense.is_excluded,
        split_mode: newExpense.split_mode,
        participant_ids: newExpense.participant_ids,
        notes: newExpense.notes || null,
        created_by: newExpense.created_by,
      });

      if (error) {
        showToast('error', error.message);
        return;
      }

      if (splits.length > 0) {
        await supabase.from('expense_splits').insert(
          splits.map((s) => ({
            id: s.id,
            expense_id: s.expense_id,
            cycle_id: s.cycle_id,
            profile_id: s.profile_id,
            share_amount: s.share_amount,
            notes: s.notes || null,
          }))
        );
      }

      if (autoPayment) {
        await supabase.from('payments').insert({
          id: autoPayment.id,
          cycle_id: autoPayment.cycle_id,
          payer_id: autoPayment.payer_id,
          amount: autoPayment.amount,
          payment_type: autoPayment.payment_type,
          recipient_admin_id: null,
          linked_expense_id: autoPayment.linked_expense_id,
          vendor_name: autoPayment.vendor_name,
          notes: autoPayment.notes || null,
          payment_date: autoPayment.payment_date,
        });
      }

      await refreshData();
      showToast('success', `Logged "${newExpense.title}" (₹${newExpense.amount})`);
      return;
    }

    newExpense.splits = splits;
    setData((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      payments: autoPayment ? [autoPayment, ...prev.payments] : prev.payments,
    }));
    showToast('success', `Logged "${newExpense.title}" (₹${newExpense.amount})`);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot edit expenses in a closed monthly cycle');
      return;
    }

    if (isLiveSupabase && supabase) {
      const existing = data.expenses.find((e) => e.id === id);
      if (!existing) return;
      const merged: Expense = { ...existing, ...updates };
      const splits = calculateExpenseSplits(merged, data.profiles);

      const { error } = await supabase
        .from('expenses')
        .update({
          title: merged.title,
          amount: merged.amount,
          category: merged.category,
          is_excluded: merged.is_excluded,
          split_mode: merged.split_mode,
          participant_ids: merged.participant_ids,
          notes: merged.notes || null,
        })
        .eq('id', id);

      if (error) {
        showToast('error', error.message);
        return;
      }

      await supabase.from('expense_splits').delete().eq('expense_id', id);
      if (splits.length > 0) {
        await supabase.from('expense_splits').insert(
          splits.map((s) => ({
            id: s.id,
            expense_id: s.expense_id,
            cycle_id: s.cycle_id,
            profile_id: s.profile_id,
            share_amount: s.share_amount,
            notes: s.notes || null,
          }))
        );
      }

      await refreshData();
      showToast('success', 'Expense updated');
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          updated.splits = calculateExpenseSplits(updated, prev.profiles);
          return updated;
        }
        return e;
      }),
    }));
    showToast('success', 'Expense updated');
  };

  const deleteExpense = async (id: string) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot delete expenses from a closed monthly cycle');
      return;
    }

    const exp = data.expenses.find((e) => e.id === id);
    const linkedPayments = data.payments.filter(
      (p) => p.linked_expense_id === id && p.payment_type === 'vendor'
    );
    const autoLinkedPaymentId =
      exp && linkedPayments.length === 1 && Math.abs(linkedPayments[0].amount - exp.amount) < 0.01
        ? linkedPayments[0].id
        : null;

    if (isLiveSupabase && supabase) {
      if (autoLinkedPaymentId) {
        await supabase.from('payments').delete().eq('id', autoLinkedPaymentId);
      }
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
      showToast('info', 'Expense deleted');
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
      payments: autoLinkedPaymentId
        ? prev.payments.filter((p) => p.id !== autoLinkedPaymentId)
        : prev.payments,
    }));
    showToast('info', 'Expense deleted');
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot log payments in a closed monthly cycle');
      return;
    }

    const newId = `pay_${Date.now()}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabase && supabase) {
      const { error } = await supabase.from('payments').insert({
        id: newPayment.id,
        cycle_id: newPayment.cycle_id,
        payer_id: newPayment.payer_id,
        amount: newPayment.amount,
        payment_type: newPayment.payment_type,
        recipient_admin_id: newPayment.recipient_admin_id || null,
        linked_expense_id: newPayment.linked_expense_id || null,
        vendor_name: newPayment.vendor_name || null,
        notes: newPayment.notes || null,
        payment_date: newPayment.payment_date,
      });

      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
    } else {
      setData((prev) => ({ ...prev, payments: [newPayment, ...prev.payments] }));
    }

    if (newPayment.payment_type === 'admin_treasury') {
      showToast('success', `Logged ₹${newPayment.amount} handed to Admin Treasury`);
    } else {
      showToast('success', `Logged vendor payment of ₹${newPayment.amount}`);
    }
  };

  const deletePayment = async (id: string) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot delete payments in a closed monthly cycle');
      return;
    }

    if (isLiveSupabase && supabase) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
      showToast('info', 'Payment removed');
      return;
    }

    setData((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }));
    showToast('info', 'Payment removed');
  };

  const initiateSettlement = async (params: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    notes?: string;
    upiRef?: string;
  }) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot initiate settlements in a closed monthly cycle');
      return;
    }
    if (params.amount <= 0) {
      showToast('error', 'Settlement amount must be greater than ₹0');
      return;
    }

    const newId = `set_${Date.now()}`;
    const fromUser = data.profiles.find((p) => p.id === params.fromUserId);
    const toUser = data.profiles.find((p) => p.id === params.toUserId);

    const newSettlement: Settlement = {
      id: newId,
      cycle_id: selectedCycle!.id,
      from_user_id: params.fromUserId,
      to_user_id: params.toUserId,
      amount: round2(params.amount),
      status: 'pending',
      initiated_by: currentUser.id,
      notes: params.notes,
      upi_ref: params.upiRef,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabase && supabase) {
      const { error } = await supabase.from('settlements').insert({
        id: newSettlement.id,
        cycle_id: newSettlement.cycle_id,
        from_user_id: newSettlement.from_user_id,
        to_user_id: newSettlement.to_user_id,
        amount: newSettlement.amount,
        status: 'pending',
        initiated_by: currentUser.id,
        notes: newSettlement.notes || null,
        upi_ref: newSettlement.upi_ref || null,
      });

      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
    } else {
      setData((prev) => ({ ...prev, settlements: [newSettlement, ...prev.settlements] }));
    }

    showToast(
      'info',
      `Settlement of ₹${params.amount} initiated (${fromUser?.name} → ${toUser?.name}). Awaiting counterparty confirmation!`
    );
  };

  const confirmSettlement = async (settlementId: string) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot close settlements in a closed monthly cycle');
      return;
    }

    const target = data.settlements.find((s) => s.id === settlementId);
    if (!target) return;

    if (target.initiated_by === currentUser.id) {
      showToast('error', 'Two-party consent required: The counterparty must confirm this settlement!');
      return;
    }

    if (isLiveSupabase && supabase) {
      const { error } = await supabase
        .from('settlements')
        .update({
          status: 'closed',
          confirmed_by: currentUser.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', settlementId);

      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
    } else {
      setData((prev) => ({
        ...prev,
        settlements: prev.settlements.map((s) =>
          s.id === settlementId
            ? {
                ...s,
                status: 'closed',
                confirmed_by: currentUser.id,
                confirmed_at: new Date().toISOString(),
              }
            : s
        ),
      }));
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
      });
    } catch {}

    showToast('success', `Settlement of ₹${target.amount} confirmed & locked as Closed!`);
  };

  const rejectSettlement = async (settlementId: string, reason?: string) => {
    if (!isCurrentCycleActive) {
      showToast('error', 'Cannot modify settlements in a closed monthly cycle');
      return;
    }

    const target = data.settlements.find((s) => s.id === settlementId);
    if (!target) return;

    if (isLiveSupabase && supabase) {
      const { error } = await supabase
        .from('settlements')
        .update({
          status: 'rejected',
          rejected_by: currentUser.id,
          rejection_reason: reason || 'Declined by counterparty',
        })
        .eq('id', settlementId);

      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
    } else {
      setData((prev) => ({
        ...prev,
        settlements: prev.settlements.map((s) =>
          s.id === settlementId
            ? {
                ...s,
                status: 'rejected',
                rejected_by: currentUser.id,
                rejection_reason: reason || 'Declined by counterparty',
              }
            : s
        ),
      }));
    }

    showToast('info', `Settlement of ₹${target.amount} was rejected.`);
  };

  const transferAdminRole = async (newAdminId: string) => {
    if (!isCurrentUserAdmin) {
      showToast('error', 'Only the active Admin can transfer the Admin role');
      return;
    }

    const newAdmin = data.profiles.find((p) => p.id === newAdminId);
    if (!newAdmin) return;

    if (isLiveSupabase && supabase) {
      const { error } = await supabase.rpc('transfer_admin_role', { new_admin_id: newAdminId });
      if (error) {
        showToast('error', error.message);
        return;
      }
      await refreshData();
      showToast('success', `Admin Role transferred to ${newAdmin.name}!`);
      return;
    }

    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => ({ ...p, is_admin: p.id === newAdminId })),
      cycles: prev.cycles.map((c) =>
        c.id === prev.selectedCycleId ? { ...c, admin_id: newAdminId } : c
      ),
    }));
    showToast('success', `Admin Role transferred to ${newAdmin.name}!`);
  };

  const closeCycle = async (carryForwardUnpaid: boolean) => {
    if (!isCurrentUserAdmin) {
      showToast('error', 'Only the Admin can close the monthly cycle');
      return;
    }

    const currentCycleToClose = selectedCycle;
    if (!currentCycleToClose) return;

    const nextCycleNum = data.cycles.length + 1;
    const now = new Date();
    const nextMonthName = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const nextCycleId = `cycle_${nextCycleNum}_${Date.now().toString(36).slice(-4)}`;
    const nextCycleMonth = now.toISOString().slice(0, 7);

    const newCycle: Cycle = {
      id: nextCycleId,
      name: `Cycle ${nextCycleNum} — ${nextMonthName}`,
      month_year: nextCycleMonth,
      status: 'active',
      admin_id: activeAdmin?.id || currentUser.id,
      started_at: new Date().toISOString(),
      closed_at: null,
      created_at: new Date().toISOString(),
    };

    const carriedExpenses: Expense[] = [];
    const carriedPayments: Payment[] = [];

    if (carryForwardUnpaid) {
      pairwiseDebts.forEach((debt, index) => {
        if (debt.amount > 0.01) {
          carriedExpenses.push({
            id: `exp_cf_${index}_${Date.now()}`,
            cycle_id: nextCycleId,
            title: `Carry Forward Debt: ${debt.fromUser.name} → ${debt.toUser.name}`,
            amount: debt.amount,
            category: 'Other',
            is_excluded: false,
            split_mode: 'equal',
            participant_ids: [debt.fromUser.id],
            notes: `Unsettled balance carried from ${currentCycleToClose.name}`,
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
          });

          carriedPayments.push({
            id: `pay_cf_${index}_${Date.now()}`,
            cycle_id: nextCycleId,
            payer_id: debt.toUser.id,
            amount: debt.amount,
            payment_type: 'vendor',
            vendor_name: 'Opening Balance Credit',
            notes: `Credited for outstanding receivable carried from ${currentCycleToClose.name}`,
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      });
    }

    if (isLiveSupabase && supabase) {
      const { error: closeErr } = await supabase
        .from('cycles')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', currentCycleToClose.id);

      if (closeErr) {
        showToast('error', closeErr.message);
        return;
      }

      const { error: createErr } = await supabase.from('cycles').insert({
        id: newCycle.id,
        name: newCycle.name,
        month_year: newCycle.month_year,
        status: 'active',
        admin_id: newCycle.admin_id,
        started_at: newCycle.started_at,
      });

      if (createErr) {
        showToast('error', createErr.message);
        return;
      }

      if (carriedExpenses.length > 0) {
        await supabase.from('expenses').insert(
          carriedExpenses.map((e) => ({
            id: e.id,
            cycle_id: e.cycle_id,
            title: e.title,
            amount: e.amount,
            category: e.category,
            is_excluded: e.is_excluded,
            split_mode: e.split_mode,
            participant_ids: e.participant_ids,
            notes: e.notes || null,
            created_by: e.created_by,
          }))
        );
      }

      if (carriedPayments.length > 0) {
        await supabase.from('payments').insert(
          carriedPayments.map((p) => ({
            id: p.id,
            cycle_id: p.cycle_id,
            payer_id: p.payer_id,
            amount: p.amount,
            payment_type: p.payment_type,
            vendor_name: p.vendor_name || null,
            notes: p.notes || null,
            payment_date: p.payment_date,
          }))
        );
      }

      setData((prev) => ({ ...prev, selectedCycleId: nextCycleId }));
      await refreshData();
      showToast('success', `Locked & archived ${currentCycleToClose.name}. Initialized ${newCycle.name}!`);
      return;
    }

    setData((prev) => ({
      ...prev,
      cycles: prev.cycles
        .map((c) =>
          c.id === currentCycleToClose.id
            ? { ...c, status: 'closed' as const, closed_at: new Date().toISOString() }
            : c
        )
        .concat(newCycle),
      selectedCycleId: nextCycleId,
      expenses: [...carriedExpenses, ...prev.expenses],
      payments: [...carriedPayments, ...prev.payments],
    }));

    showToast('success', `Locked & archived ${currentCycleToClose.name}. Initialized ${newCycle.name}!`);
  };

  const resetData = () => {
    if (isLiveSupabase) {
      showToast('info', 'Reset is disabled while connected to live Supabase.');
      return;
    }
    const fresh = resetToSeedData();
    setData(fresh);
    showToast('info', 'Reset to Cycle 1 Seed Baseline (Section 6)');
  };

  return (
    <AppContext.Provider
      value={{
        isLiveSupabase,
        authLoading,
        dataLoading,
        isAuthenticated,
        session,
        profiles: data.profiles,
        currentUser,
        cycles: data.cycles,
        selectedCycle,
        activeCycle,
        cycleExpenses,
        cyclePayments,
        cycleSettlements,
        standings,
        currentUserStanding,
        pairwiseDebts,
        activeAdmin,
        isCurrentCycleActive,
        isCurrentUserAdmin,
        pendingApprovalsForMe,
        pendingInitiatedByMe,
        toasts,
        signIn,
        signOut,
        updatePassword,
        createRoommate,
        adminResetRoommatePassword,
        switchUser,
        selectCycle,
        updateProfile,
        addExpense,
        updateExpense,
        deleteExpense,
        addPayment,
        deletePayment,
        initiateSettlement,
        confirmSettlement,
        rejectSettlement,
        transferAdminRole,
        closeCycle,
        refreshData,
        resetData,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
