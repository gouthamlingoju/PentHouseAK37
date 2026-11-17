import { INITIAL_PROFILES, INITIAL_EXPENSES, INITIAL_PAYMENTS, INITIAL_SETTLEMENTS } from '../data/seedData';
import { calculateMemberStandings, calculatePairwiseDebts } from './splitEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('Running PentHouse AK37 Split Engine Baseline Verification...');

// 1. Verify Active Expenses & Excluded items
const activeExpenses = INITIAL_EXPENSES.filter((e) => !e.is_excluded);
const excludedExpenses = INITIAL_EXPENSES.filter((e) => e.is_excluded);

assert(activeExpenses.length === 34, `Expected 34 active expenses, got ${activeExpenses.length}`);
assert(excludedExpenses.length === 3, `Expected 3 excluded expenses, got ${excludedExpenses.length}`);

const totalActive = activeExpenses.reduce((s, e) => s + e.amount, 0);
const totalExcluded = excludedExpenses.reduce((s, e) => s + e.amount, 0);

assert(totalActive === 45831, `Expected total active ₹45831, got ₹${totalActive}`);
assert(totalExcluded === 360, `Expected total excluded ₹360, got ₹${totalExcluded}`);

// 2. Verify Member Standings
const standings = calculateMemberStandings(
  INITIAL_PROFILES,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_SETTLEMENTS,
  'user_goutham'
);

const goutham = standings.find((s) => s.profile.name === 'Goutham')!;
const saikumar = standings.find((s) => s.profile.name === 'Saikumar')!;
const santhosh = standings.find((s) => s.profile.name === 'Santhosh')!;
const yashwanth = standings.find((s) => s.profile.name === 'Yashwanth')!;
const puri = standings.find((s) => s.profile.name === 'Puri')!;

assert(goutham.totalVendorPaid === 33866, `Goutham vendor paid mismatch: ${goutham.totalVendorPaid}`);
assert(saikumar.totalVendorPaid === 5999, `Saikumar vendor paid mismatch: ${saikumar.totalVendorPaid}`);
assert(santhosh.totalVendorPaid === 4959, `Santhosh vendor paid mismatch: ${santhosh.totalVendorPaid}`);
assert(yashwanth.totalVendorPaid === 857, `Yashwanth vendor paid mismatch: ${yashwanth.totalVendorPaid}`);
assert(puri.totalVendorPaid === 150, `Puri vendor paid mismatch: ${puri.totalVendorPaid}`);

assert(saikumar.totalAdminTreasuryPaid === 1750, `Saikumar admin paid mismatch: ${saikumar.totalAdminTreasuryPaid}`);
assert(santhosh.totalAdminTreasuryPaid === 1250, `Santhosh admin paid mismatch: ${santhosh.totalAdminTreasuryPaid}`);
assert(goutham.adminTreasuryHeld === 3000, `Admin treasury held mismatch: ${goutham.adminTreasuryHeld}`);

assert(Math.abs(goutham.netBalance - 20513.3) < 0.01, `Goutham net balance mismatch: ${goutham.netBalance}`);
assert(Math.abs(saikumar.netBalance - -2603.7) < 0.01, `Saikumar net balance mismatch: ${saikumar.netBalance}`);
assert(Math.abs(santhosh.netBalance - -4143.7) < 0.01, `Santhosh net balance mismatch: ${santhosh.netBalance}`);
assert(Math.abs(yashwanth.netBalance - -3563.2) < 0.01, `Yashwanth net balance mismatch: ${yashwanth.netBalance}`);
assert(Math.abs(puri.netBalance - -10202.7) < 0.01, `Puri net balance mismatch: ${puri.netBalance}`);

// 3. Verify Pairwise Debts
const debts = calculatePairwiseDebts(standings);
const owedBySaikumar = debts.find((d) => d.fromUser.name === 'Saikumar')!;
const owedBySanthosh = debts.find((d) => d.fromUser.name === 'Santhosh')!;
const owedByYashwanth = debts.find((d) => d.fromUser.name === 'Yashwanth')!;
const owedByPuri = debts.find((d) => d.fromUser.name === 'Puri')!;

assert(owedBySaikumar.amount === 2603.7, `Saikumar owed mismatch: ${owedBySaikumar.amount}`);
assert(owedBySanthosh.amount === 4143.7, `Santhosh owed mismatch: ${owedBySanthosh.amount}`);
assert(owedByYashwanth.amount === 3563.2, `Yashwanth owed mismatch: ${owedByYashwanth.amount}`);
assert(owedByPuri.amount === 10202.7, `Puri owed mismatch: ${owedByPuri.amount}`);

console.log('✅ ALL BASELINE ENGINE & CYCLE 1 VERIFICATION TESTS PASSED (ZERO CAPPING)!');
