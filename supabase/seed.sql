-- ====================================================================
-- PentHouse AK37 - Real Cycle 1 Seed Data (Pure Equal Splits, Zero Capping)
-- Active Expenses: ₹45,831 (34 active equal-split items)
-- Excluded Personal Items: ₹360 (3 items)
-- Vendor Payments: ₹45,831 (32 entries) | Admin Treasury: ₹3,000 (2 entries)
-- ====================================================================

-- 1. Profiles (Upsert preserving auth_user_id links)
insert into public.profiles (id, username, name, email, upi_id, is_admin, color, avatar_url) values
  ('user_goutham', 'goutham', 'Goutham', 'goutham@penthouse.ak37', 'goutham@okhdfcbank', true, '#6366f1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('user_saikumar', 'saikumar', 'Saikumar', 'saikumar@penthouse.ak37', 'saikumar@oksbi', false, '#06b6d4', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
  ('user_santhosh', 'santhosh', 'Santhosh', 'santhosh@penthouse.ak37', 'santhosh@okaxis', false, '#10b981', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
  ('user_yashwanth', 'yashwanth', 'Yashwanth', 'yashwanth@penthouse.ak37', 'yashwanth@ybl', false, '#f59e0b', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'),
  ('user_puri', 'puri', 'Puri', 'puri@penthouse.ak37', 'puri@paytm', false, '#ec4899', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80')
on conflict (id) do update set
  username = excluded.username,
  name = excluded.name,
  email = excluded.email;

-- 2. Cycle 1
insert into public.cycles (id, name, month_year, status, admin_id, started_at) values
  ('cycle_1_nov_2026', 'Cycle 1 — Nov 2026', '2026-11', 'active', 'user_goutham', '2026-11-01 00:00:00+00')
on conflict (id) do nothing;

-- 3. Replace Cycle 1 expenses & payments cleanly
delete from public.payments where cycle_id = 'cycle_1_nov_2026';
delete from public.expense_splits where cycle_id = 'cycle_1_nov_2026';
delete from public.expenses where cycle_id = 'cycle_1_nov_2026';

-- A. 4-Way Expenses (Yashwanth Excluded)
insert into public.expenses (id, cycle_id, title, amount, category, is_excluded, split_mode, participant_ids, notes, created_by, created_at) values
  ('exp_01', 'cycle_1_nov_2026', 'Room Advance', 15000.00, 'Fixed', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_goutham', '2026-11-01 09:00:00+00'),
  ('exp_02', 'cycle_1_nov_2026', 'Auto', 500.00, 'Fixed', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_goutham', '2026-11-01 10:00:00+00'),
  ('exp_09', 'cycle_1_nov_2026', 'Stove & Vessel', 2841.00, 'Fixed', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_santhosh', '2026-11-04 11:00:00+00'),
  ('exp_15', 'cycle_1_nov_2026', 'Eggs (130)', 130.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_goutham', '2026-11-07 09:00:00+00'),
  ('exp_16', 'cycle_1_nov_2026', 'Eggs (100)', 100.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_santhosh', '2026-11-08 09:00:00+00'),
  ('exp_22', 'cycle_1_nov_2026', 'Fridge', 1200.00, 'Fixed', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_saikumar', '2026-11-10 12:00:00+00'),

-- B. 5-Way Equal Expenses (All 5)
  ('exp_03', 'cycle_1_nov_2026', 'Welcome Party', 150.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_puri', '2026-11-01 19:00:00+00'),
  ('exp_04', 'cycle_1_nov_2026', 'Room Rent', 15000.00, 'Fixed', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-02 10:00:00+00'),
  ('exp_05', 'cycle_1_nov_2026', 'Semya', 131.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-02 14:00:00+00'),
  ('exp_07', 'cycle_1_nov_2026', 'Water (Page 1 - G)', 10.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-03 11:00:00+00'),
  ('exp_10', 'cycle_1_nov_2026', 'Water (Page 1 - S)', 10.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_santhosh', '2026-11-04 15:00:00+00'),
  ('exp_11', 'cycle_1_nov_2026', 'Misc Item (77)', 77.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_santhosh', '2026-11-05 10:00:00+00'),
  ('exp_12', 'cycle_1_nov_2026', 'Vegetables', 70.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_saikumar', '2026-11-05 16:00:00+00'),
  ('exp_13', 'cycle_1_nov_2026', 'Fresh & Mart (20)', 20.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-06 10:00:00+00'),
  ('exp_14', 'cycle_1_nov_2026', 'Cooking (483)', 483.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-06 18:00:00+00'),
  ('exp_17', 'cycle_1_nov_2026', 'Milk (10)', 10.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-08 18:00:00+00'),
  ('exp_18', 'cycle_1_nov_2026', 'Fresh Mart (42)', 42.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-09 11:00:00+00'),
  ('exp_23', 'cycle_1_nov_2026', 'Basmati', 120.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_saikumar', '2026-11-11 10:00:00+00'),
  ('exp_25', 'cycle_1_nov_2026', 'Thums Up', 90.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-12 13:00:00+00'),
  ('exp_26', 'cycle_1_nov_2026', 'Cooking (50)', 50.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_goutham', '2026-11-12 18:00:00+00'),
  ('exp_27', 'cycle_1_nov_2026', 'Cooking (20)', 20.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_yashwanth', '2026-11-13 10:00:00+00'),
  ('exp_28', 'cycle_1_nov_2026', 'Tomato', 60.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_yashwanth', '2026-11-13 15:00:00+00'),
  ('exp_29', 'cycle_1_nov_2026', 'Comfort', 64.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_yashwanth', '2026-11-14 11:00:00+00'),
  ('exp_30', 'cycle_1_nov_2026', 'Chicken', 670.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_yashwanth', '2026-11-14 19:00:00+00'),
  ('exp_31', 'cycle_1_nov_2026', 'Milk (43)', 43.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_yashwanth', '2026-11-15 08:00:00+00'),
  ('exp_32', 'cycle_1_nov_2026', 'Curd', 50.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_santhosh', '2026-11-15 13:00:00+00'),
  ('exp_33', 'cycle_1_nov_2026', 'Rice & Onion', 291.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_santhosh', '2026-11-16 11:00:00+00'),
  ('exp_34', 'cycle_1_nov_2026', 'Milk (40)', 40.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, null, 'user_santhosh', '2026-11-16 18:00:00+00'),

-- C. Split Pool Items (Plain Equal Splits — zero capping)
  ('exp_06a', 'cycle_1_nov_2026', 'DMart (5-Way Shared)', 3000.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Shared among all 5 roommates', 'user_goutham', '2026-11-03 18:00:00+00'),
  ('exp_06b', 'cycle_1_nov_2026', 'DMart (4-Way Shared)', 2359.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_saikumar', '2026-11-03 18:01:00+00'),
  ('exp_08a', 'cycle_1_nov_2026', 'Airtel Wifi (5-Way Shared)', 600.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Shared among all 5 roommates', 'user_santhosh', '2026-11-03 20:00:00+00'),
  ('exp_08b', 'cycle_1_nov_2026', 'Airtel Wifi (4-Way Shared)', 950.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_santhosh', '2026-11-03 20:01:00+00'),
  ('exp_24a', 'cycle_1_nov_2026', 'Rice Bag (5-Way Shared)', 1000.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Shared among all 5 roommates', 'user_saikumar', '2026-11-11 16:00:00+00'),
  ('exp_24b', 'cycle_1_nov_2026', 'Rice Bag (4-Way Shared)', 650.00, 'Grocery', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, '4-Way — Yashwanth excluded', 'user_saikumar', '2026-11-11 16:01:00+00'),

-- D. Excluded Personal Items
  ('exp_19', 'cycle_1_nov_2026', 'Movie Ticket', 250.00, 'Personal', true, 'excluded', '["user_yashwanth"]'::jsonb, 'Excluded from room pool', 'user_yashwanth', '2026-11-09 20:00:00+00'),
  ('exp_20', 'cycle_1_nov_2026', 'Chips', 20.00, 'Personal', true, 'excluded', '["user_goutham"]'::jsonb, 'Excluded from room pool', 'user_goutham', '2026-11-09 21:00:00+00'),
  ('exp_21', 'cycle_1_nov_2026', 'Personal Item (90)', 90.00, 'Personal', true, 'excluded', '["user_puri"]'::jsonb, 'Excluded from room pool', 'user_puri', '2026-11-10 09:00:00+00');

-- E. Payments (Vendor Bills + Paid to Admin Treasury)
insert into public.payments (id, cycle_id, payer_id, amount, payment_type, recipient_admin_id, linked_expense_id, vendor_name, notes, payment_date) values
  -- Goutham (₹33,866)
  ('pay_01', 'cycle_1_nov_2026', 'user_goutham', 15000.00, 'vendor', null, 'exp_01', 'Room Advance', 'Room Advance', '2026-11-01 09:00:00+00'),
  ('pay_02', 'cycle_1_nov_2026', 'user_goutham', 500.00, 'vendor', null, 'exp_02', 'Auto', 'Auto', '2026-11-01 10:00:00+00'),
  ('pay_03', 'cycle_1_nov_2026', 'user_goutham', 15000.00, 'vendor', null, 'exp_04', 'Room Rent', 'Room Rent', '2026-11-02 10:00:00+00'),
  ('pay_04', 'cycle_1_nov_2026', 'user_goutham', 131.00, 'vendor', null, 'exp_05', 'Semya', 'Semya', '2026-11-02 14:00:00+00'),
  ('pay_05', 'cycle_1_nov_2026', 'user_goutham', 2400.00, 'vendor', null, 'exp_06a', 'DMart part 1', 'DMart part 1', '2026-11-03 18:00:00+00'),
  ('pay_06', 'cycle_1_nov_2026', 'user_goutham', 10.00, 'vendor', null, 'exp_07', 'Water', 'Water', '2026-11-03 11:00:00+00'),
  ('pay_07', 'cycle_1_nov_2026', 'user_goutham', 20.00, 'vendor', null, 'exp_13', 'Fresh & Mart', 'Fresh & Mart', '2026-11-06 10:00:00+00'),
  ('pay_08', 'cycle_1_nov_2026', 'user_goutham', 483.00, 'vendor', null, 'exp_14', 'Cooking', 'Cooking', '2026-11-06 18:00:00+00'),
  ('pay_09', 'cycle_1_nov_2026', 'user_goutham', 130.00, 'vendor', null, 'exp_15', 'Eggs', 'Eggs', '2026-11-07 09:00:00+00'),
  ('pay_10', 'cycle_1_nov_2026', 'user_goutham', 10.00, 'vendor', null, 'exp_17', 'Milk', 'Milk', '2026-11-08 18:00:00+00'),
  ('pay_11', 'cycle_1_nov_2026', 'user_goutham', 42.00, 'vendor', null, 'exp_18', 'Fresh Mart', 'Fresh Mart', '2026-11-09 11:00:00+00'),
  ('pay_12', 'cycle_1_nov_2026', 'user_goutham', 90.00, 'vendor', null, 'exp_25', 'Thums Up', 'Thums Up', '2026-11-12 13:00:00+00'),
  ('pay_13', 'cycle_1_nov_2026', 'user_goutham', 50.00, 'vendor', null, 'exp_26', 'Cooking', 'Cooking', '2026-11-12 18:00:00+00'),

  -- Saikumar (₹5,999)
  ('pay_14', 'cycle_1_nov_2026', 'user_saikumar', 2959.00, 'vendor', null, 'exp_06b', 'DMart part 2', 'DMart part 2', '2026-11-03 18:05:00+00'),
  ('pay_15', 'cycle_1_nov_2026', 'user_saikumar', 70.00, 'vendor', null, 'exp_12', 'Vegetables', 'Vegetables', '2026-11-05 16:00:00+00'),
  ('pay_16', 'cycle_1_nov_2026', 'user_saikumar', 1200.00, 'vendor', null, 'exp_22', 'Fridge', 'Fridge', '2026-11-10 12:00:00+00'),
  ('pay_17', 'cycle_1_nov_2026', 'user_saikumar', 120.00, 'vendor', null, 'exp_23', 'Basmati', 'Basmati', '2026-11-11 10:00:00+00'),
  ('pay_18', 'cycle_1_nov_2026', 'user_saikumar', 1650.00, 'vendor', null, 'exp_24a', 'Rice Bag', 'Rice Bag', '2026-11-11 16:00:00+00'),

  -- Santhosh (₹4,959)
  ('pay_19', 'cycle_1_nov_2026', 'user_santhosh', 1550.00, 'vendor', null, 'exp_08a', 'Airtel Wifi', 'Airtel Wifi', '2026-11-03 20:00:00+00'),
  ('pay_20', 'cycle_1_nov_2026', 'user_santhosh', 2841.00, 'vendor', null, 'exp_09', 'Stove & Vessel', 'Stove & Vessel', '2026-11-04 11:00:00+00'),
  ('pay_21', 'cycle_1_nov_2026', 'user_santhosh', 10.00, 'vendor', null, 'exp_10', 'Water', 'Water', '2026-11-04 15:00:00+00'),
  ('pay_22', 'cycle_1_nov_2026', 'user_santhosh', 77.00, 'vendor', null, 'exp_11', 'Misc Item (77)', 'Misc Item (77)', '2026-11-05 10:00:00+00'),
  ('pay_23', 'cycle_1_nov_2026', 'user_santhosh', 100.00, 'vendor', null, 'exp_16', 'Eggs', 'Eggs', '2026-11-08 09:00:00+00'),
  ('pay_24', 'cycle_1_nov_2026', 'user_santhosh', 50.00, 'vendor', null, 'exp_32', 'Curd', 'Curd', '2026-11-15 13:00:00+00'),
  ('pay_25', 'cycle_1_nov_2026', 'user_santhosh', 291.00, 'vendor', null, 'exp_33', 'Rice & Onion', 'Rice & Onion', '2026-11-16 11:00:00+00'),
  ('pay_26', 'cycle_1_nov_2026', 'user_santhosh', 40.00, 'vendor', null, 'exp_34', 'Milk', 'Milk', '2026-11-16 18:00:00+00'),

  -- Yashwanth (₹857)
  ('pay_27', 'cycle_1_nov_2026', 'user_yashwanth', 20.00, 'vendor', null, 'exp_27', 'Cooking', 'Cooking', '2026-11-13 10:00:00+00'),
  ('pay_28', 'cycle_1_nov_2026', 'user_yashwanth', 60.00, 'vendor', null, 'exp_28', 'Tomato', 'Tomato', '2026-11-13 15:00:00+00'),
  ('pay_29', 'cycle_1_nov_2026', 'user_yashwanth', 64.00, 'vendor', null, 'exp_29', 'Comfort', 'Comfort', '2026-11-14 11:00:00+00'),
  ('pay_30', 'cycle_1_nov_2026', 'user_yashwanth', 670.00, 'vendor', null, 'exp_30', 'Chicken', 'Chicken', '2026-11-14 19:00:00+00'),
  ('pay_31', 'cycle_1_nov_2026', 'user_yashwanth', 43.00, 'vendor', null, 'exp_31', 'Milk', 'Milk', '2026-11-15 08:00:00+00'),

  -- Puri (₹150)
  ('pay_32', 'cycle_1_nov_2026', 'user_puri', 150.00, 'vendor', null, 'exp_03', 'Welcome Party', 'Welcome Party', '2026-11-01 19:00:00+00'),

  -- Paid to Admin Treasury (₹3,000)
  ('pay_33_admin', 'cycle_1_nov_2026', 'user_saikumar', 1750.00, 'admin_treasury', 'user_goutham', null, 'Admin Treasury (Goutham)', 'Prior payment to Admin', '2026-11-05 18:00:00+00'),
  ('pay_34_admin', 'cycle_1_nov_2026', 'user_santhosh', 1250.00, 'admin_treasury', 'user_goutham', null, 'Admin Treasury (Goutham)', 'Prior payment to Admin', '2026-11-06 12:00:00+00');
