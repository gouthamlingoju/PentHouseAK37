export type SplitMode = 'equal';
export type PaymentType = 'vendor' | 'admin_treasury';
export type SettlementStatus = 'pending' | 'closed' | 'rejected';
export type ExpenseCategory = 'Fixed' | 'Grocery' | 'Food' | 'Utilities' | 'Other';
export type CycleStatus = 'active' | 'closed';

export interface Profile {
  id: string;
  auth_user_id?: string | null;
  username: string;
  name: string;
  email: string;
  upi_id: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_admin: boolean;
  is_active?: boolean;
  must_change_password?: boolean;
  color?: string;
  created_at: string;
}

export interface Cycle {
  id: string;
  name: string;
  month_year: string;
  status: CycleStatus;
  admin_id: string;
  started_at: string;
  closed_at?: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  cycle_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  is_excluded?: boolean;
  split_mode: SplitMode;
  participant_ids: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  cycle_id: string;
  profile_id: string;
  share_amount: number;
  notes?: string;
}

export interface Payment {
  id: string;
  cycle_id: string;
  payer_id: string;
  amount: number;
  payment_type: PaymentType;
  recipient_admin_id?: string | null; // Set when payment_type === 'admin_treasury'
  linked_expense_id?: string | null;
  vendor_name?: string;
  notes?: string;
  payment_date: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  cycle_id: string;
  from_user_id: string; // The debtor (who pays)
  to_user_id: string;   // The creditor (who receives, usually Admin or another roommate)
  amount: number;
  status: SettlementStatus;
  initiated_by: string;
  confirmed_by?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  notes?: string;
  upi_ref?: string;
  created_at: string;
  confirmed_at?: string | null;
}

export interface MemberStanding {
  profile: Profile;
  totalVendorPaid: number;
  totalAdminTreasuryPaid: number;
  totalPayments: number;
  totalExpenseShare: number;
  adminTreasuryHeld: number; // Cash received if current or historical admin in this cycle
  closedSettlementsPaid: number;    // Confirmed settlement payments made out
  closedSettlementsReceived: number;// Confirmed settlement payments received in
  pendingSettlementsOut: number;    // Pending settlements initiated/awaiting confirmation
  netBalance: number;              // Positive = owed money, Negative = owes money
}

export interface PairwiseDebt {
  fromUser: Profile;
  toUser: Profile;
  amount: number;
}

export interface InAppNotification {
  id: string;
  type: 'expense' | 'admin_transfer' | 'settlement' | 'cycle';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}
