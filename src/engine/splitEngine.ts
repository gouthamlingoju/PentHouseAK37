import { Expense, ExpenseSplit, Payment, Profile, Settlement, MemberStanding, PairwiseDebt } from '../types';

/**
 * Calculates per-participant split shares for an expense.
 */
export function calculateExpenseSplits(
  expense: Expense,
  _allProfiles: Profile[]
): ExpenseSplit[] {
  const { id: expenseId, cycle_id: cycleId, amount, is_excluded, participant_ids } = expense;

  if (is_excluded || (expense.split_mode as string) === 'excluded') {
    return [];
  }

  if (participant_ids.length === 0) {
    return [];
  }

  // Equal Split among selected participants
  const share = round2(amount / participant_ids.length);
  return participant_ids.map((pid) => ({
    id: `${expenseId}_split_${pid}`,
    expense_id: expenseId,
    cycle_id: cycleId,
    profile_id: pid,
    share_amount: share,
  }));
}

/**
 * Calculates member standings for a given cycle.
 *
 * Balance Equation (Per Member, Per Cycle):
 *   Net Balance = Total Payments Made - Total Expense Share Consumed - Admin Treasury Held (if Admin)
 *   + (Closed Settlements Paid - Closed Settlements Received)
 */
export function calculateMemberStandings(
  profiles: Profile[],
  expenses: Expense[],
  payments: Payment[],
  settlements: Settlement[],
  activeAdminId: string
): MemberStanding[] {
  // Pre-calculate expense splits for all active expenses
  const expenseSplitsMap = new Map<string, number>();
  for (const exp of expenses) {
    const splits = exp.splits && exp.splits.length > 0 ? exp.splits : calculateExpenseSplits(exp, profiles);
    for (const s of splits) {
      const current = expenseSplitsMap.get(s.profile_id) || 0;
      expenseSplitsMap.set(s.profile_id, round2(current + s.share_amount));
    }
  }

  // Pre-calculate vendor payments and admin treasury transfers
  const vendorPaymentsMap = new Map<string, number>();
  const adminPaymentsMadeMap = new Map<string, number>();
  const adminTreasuryHeldMap = new Map<string, number>();

  for (const pay of payments) {
    if (pay.payment_type === 'vendor') {
      const current = vendorPaymentsMap.get(pay.payer_id) || 0;
      vendorPaymentsMap.set(pay.payer_id, round2(current + pay.amount));
    } else if (pay.payment_type === 'admin_treasury') {
      // The payer paid to Admin Treasury
      const current = adminPaymentsMadeMap.get(pay.payer_id) || 0;
      adminPaymentsMadeMap.set(pay.payer_id, round2(current + pay.amount));

      // The recipient admin holds that cash
      const recipientId = pay.recipient_admin_id || activeAdminId;
      const currentHeld = adminTreasuryHeldMap.get(recipientId) || 0;
      adminTreasuryHeldMap.set(recipientId, round2(currentHeld + pay.amount));
    }
  }

  // Pre-calculate settlements (closed & pending)
  const closedSettlementsPaidMap = new Map<string, number>();
  const closedSettlementsReceivedMap = new Map<string, number>();
  const pendingSettlementsOutMap = new Map<string, number>();

  for (const set of settlements) {
    if (set.status === 'closed') {
      const pPaid = closedSettlementsPaidMap.get(set.from_user_id) || 0;
      closedSettlementsPaidMap.set(set.from_user_id, round2(pPaid + set.amount));

      const pRecv = closedSettlementsReceivedMap.get(set.to_user_id) || 0;
      closedSettlementsReceivedMap.set(set.to_user_id, round2(pRecv + set.amount));
    } else if (set.status === 'pending') {
      const pPend = pendingSettlementsOutMap.get(set.from_user_id) || 0;
      pendingSettlementsOutMap.set(set.from_user_id, round2(pPend + set.amount));
    }
  }

  return profiles.map((profile) => {
    const totalVendorPaid = vendorPaymentsMap.get(profile.id) || 0;
    const totalAdminTreasuryPaid = adminPaymentsMadeMap.get(profile.id) || 0;
    const totalPayments = round2(totalVendorPaid + totalAdminTreasuryPaid);

    const totalExpenseShare = expenseSplitsMap.get(profile.id) || 0;
    const adminTreasuryHeld = adminTreasuryHeldMap.get(profile.id) || 0;

    const closedSettlementsPaid = closedSettlementsPaidMap.get(profile.id) || 0;
    const closedSettlementsReceived = closedSettlementsReceivedMap.get(profile.id) || 0;
    const pendingSettlementsOut = pendingSettlementsOutMap.get(profile.id) || 0;

    // Net Balance Formula
    // Base: Payments - Share - Treasury Held
    // Settlements: + Paid (reduces debt) - Received (reduces receivable)
    const rawBalance = totalPayments - totalExpenseShare - adminTreasuryHeld;
    const netBalance = round2(rawBalance + closedSettlementsPaid - closedSettlementsReceived);

    return {
      profile,
      totalVendorPaid,
      totalAdminTreasuryPaid,
      totalPayments,
      totalExpenseShare,
      adminTreasuryHeld,
      closedSettlementsPaid,
      closedSettlementsReceived,
      pendingSettlementsOut,
      netBalance,
    };
  });
}

/**
 * Calculates pairwise simplified debts between members.
 * Debtors (negative net balance) owe Creditors (positive net balance).
 */
export function calculatePairwiseDebts(
  standings: MemberStanding[]
): PairwiseDebt[] {
  const debtors: { profile: Profile; amount: number }[] = [];
  const creditors: { profile: Profile; amount: number }[] = [];

  for (const s of standings) {
    if (s.netBalance < -0.01) {
      debtors.push({ profile: s.profile, amount: Math.abs(s.netBalance) });
    } else if (s.netBalance > 0.01) {
      creditors.push({ profile: s.profile, amount: s.netBalance });
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: PairwiseDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    if (settledAmount > 0.01) {
      debts.push({
        fromUser: debtor.profile,
        toUser: creditor.profile,
        amount: round2(settledAmount),
      });
    }

    debtor.amount = round2(debtor.amount - settledAmount);
    creditor.amount = round2(creditor.amount - settledAmount);

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return debts;
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
