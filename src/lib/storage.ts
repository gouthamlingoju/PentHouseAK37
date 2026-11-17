import { Profile, Cycle, Expense, Payment, Settlement } from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_CYCLES,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_SETTLEMENTS,
} from '../data/seedData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PROFILES: 'penthouse_ak37_profiles_v1',
  CYCLES: 'penthouse_ak37_cycles_v1',
  EXPENSES: 'penthouse_ak37_expenses_v1',
  PAYMENTS: 'penthouse_ak37_payments_v1',
  SETTLEMENTS: 'penthouse_ak37_settlements_v1',
  CURRENT_USER_ID: 'penthouse_ak37_current_user_id_v1',
  ACTIVE_CYCLE_ID: 'penthouse_ak37_active_cycle_id_v1',
};

export interface AppDataState {
  profiles: Profile[];
  cycles: Cycle[];
  expenses: Expense[];
  payments: Payment[];
  settlements: Settlement[];
  currentUserId: string;
  selectedCycleId: string;
}

export function loadInitialData(): AppDataState {
  try {
    const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const savedCycles = localStorage.getItem(STORAGE_KEYS.CYCLES);
    const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const savedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    const savedSettlements = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const savedCycleId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CYCLE_ID);

    const profiles: Profile[] = savedProfiles ? JSON.parse(savedProfiles) : INITIAL_PROFILES;
    const cycles: Cycle[] = savedCycles ? JSON.parse(savedCycles) : INITIAL_CYCLES;
    const expenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : INITIAL_EXPENSES;
    const payments: Payment[] = savedPayments ? JSON.parse(savedPayments) : INITIAL_PAYMENTS;
    const settlements: Settlement[] = savedSettlements ? JSON.parse(savedSettlements) : INITIAL_SETTLEMENTS;

    const currentUserId = savedUserId || 'user_goutham';
    const selectedCycleId = savedCycleId || 'cycle_1_nov_2026';

    return {
      profiles,
      cycles,
      expenses,
      payments,
      settlements,
      currentUserId,
      selectedCycleId,
    };
  } catch (err) {
    console.error('Error loading data from localStorage, falling back to seed baseline:', err);
    return {
      profiles: INITIAL_PROFILES,
      cycles: INITIAL_CYCLES,
      expenses: INITIAL_EXPENSES,
      payments: INITIAL_PAYMENTS,
      settlements: INITIAL_SETTLEMENTS,
      currentUserId: 'user_goutham',
      selectedCycleId: 'cycle_1_nov_2026',
    };
  }
}

export function saveLocalState(state: Partial<AppDataState>) {
  try {
    if (state.profiles) localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(state.profiles));
    if (state.cycles) localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(state.cycles));
    if (state.expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
    if (state.payments) localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(state.payments));
    if (state.settlements) localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(state.settlements));
    if (state.currentUserId) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, state.currentUserId);
    if (state.selectedCycleId) localStorage.setItem(STORAGE_KEYS.ACTIVE_CYCLE_ID, state.selectedCycleId);
  } catch (err) {
    console.warn('Could not persist to localStorage:', err);
  }
}

export function resetToSeedData(): AppDataState {
  localStorage.removeItem(STORAGE_KEYS.PROFILES);
  localStorage.removeItem(STORAGE_KEYS.CYCLES);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
  localStorage.removeItem(STORAGE_KEYS.SETTLEMENTS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_CYCLE_ID);

  return {
    profiles: INITIAL_PROFILES,
    cycles: INITIAL_CYCLES,
    expenses: INITIAL_EXPENSES,
    payments: INITIAL_PAYMENTS,
    settlements: INITIAL_SETTLEMENTS,
    currentUserId: 'user_goutham',
    selectedCycleId: 'cycle_1_nov_2026',
  };
}
