-- ====================================================================
-- PentHouse AK37 - Cycle 1 Baseline Seed Script
-- Mathematical Parity: Active Expenses: ₹45,831 | Excluded: ₹360
-- Vendor Payments: ₹45,831 | Admin Treasury: ₹3,000
-- ====================================================================

-- 1. Profiles
insert into public.profiles (id, username, name, email, upi_id, is_admin, color, avatar_url) values
  ('user_goutham', 'goutham', 'Goutham', 'goutham@penthouse.ak37', 'goutham@okhdfcbank', true, '#6366f1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('user_saikumar', 'saikumar', 'Saikumar', 'saikumar@penthouse.ak37', 'saikumar@oksbi', false, '#06b6d4', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
  ('user_santhosh', 'santhosh', 'Santhosh', 'santhosh@penthouse.ak37', 'santhosh@okaxis', false, '#10b981', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
  ('user_yashwanth', 'yashwanth', 'Yashwanth', 'yashwanth@penthouse.ak37', 'yashwanth@ybl', false, '#f59e0b', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'),
  ('user_puri', 'puri', 'Puri', 'puri@penthouse.ak37', 'puri@paytm', false, '#ec4899', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80')
on conflict (id) do update set
  username = excluded.username,
  name = excluded.name,
  email = excluded.email,
  upi_id = excluded.upi_id;

-- 2. Cycle 1
insert into public.cycles (id, name, month_year, status, admin_id, started_at) values
  ('cycle_1_nov_2026', 'Cycle 1 — Nov 2026', '2026-11', 'active', 'user_goutham', '2026-11-01 00:00:00+00')
on conflict (id) do nothing;

-- 3. Expenses
-- The Four: Goutham, Saikumar, Santhosh, Puri
-- All Five: Goutham, Saikumar, Santhosh, Yashwanth, Puri

insert into public.expenses (id, cycle_id, title, amount, category, is_excluded, split_mode, participant_ids, notes, created_by, created_at) values
  ('exp_01', 'cycle_1_nov_2026', 'Room Rent — Penthouse AK37', 15000.00, 'Rent', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, 'Monthly penthouse flat rent', 'user_goutham', '2026-11-02 10:00:00+00'),
  ('exp_02', 'cycle_1_nov_2026', 'Cook & Housekeeping Monthly Salary', 5000.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, 'Cook monthly compensation for daily meals', 'user_goutham', '2026-11-05 11:00:00+00'),
  ('exp_03', 'cycle_1_nov_2026', 'Penthouse Deep Cleaning & Pest Control', 1400.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, 'Urban Company deep cleaning', 'user_goutham', '2026-11-07 14:30:00+00'),
  ('exp_04', 'cycle_1_nov_2026', 'Cook Special Sunday Lunch', 1200.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, 'Sunday special lunch preparation', 'user_goutham', '2026-11-09 13:00:00+00'),
  ('exp_05', 'cycle_1_nov_2026', 'HP Gas LPG Cylinder Refill', 1130.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_puri"]'::jsonb, 'Kitchen cylinder refill', 'user_saikumar', '2026-11-10 16:00:00+00'),

  ('exp_06', 'cycle_1_nov_2026', 'DMart Combined Monthly Grocery Pool', 5359.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Combined DMart wholesale haul (Goutham ₹2400 + Saikumar ₹2959)', 'user_goutham', '2026-11-03 18:00:00+00'),
  ('exp_07', 'cycle_1_nov_2026', 'Electricity Bill (TGSPDCL)', 3540.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'High usage AC + geyser meter billing', 'user_goutham', '2026-11-08 09:15:00+00'),
  ('exp_08', 'cycle_1_nov_2026', 'Milk & Dairy Monthly Supply (Heritage)', 1850.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Daily 2 packets milk & curd', 'user_santhosh', '2026-11-04 07:30:00+00'),
  ('exp_09', 'cycle_1_nov_2026', 'Rice Bag (25kg Sona Masoori Premium)', 1650.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Aged rice from super market', 'user_santhosh', '2026-11-04 12:00:00+00'),
  ('exp_10', 'cycle_1_nov_2026', 'ACT Fibernet 300 Mbps Unlimited WiFi', 1499.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Monthly high-speed internet plan', 'user_goutham', '2026-11-01 15:00:00+00'),
  ('exp_11', 'cycle_1_nov_2026', 'Kinley Drinking Water Cans (20L x 32)', 960.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'RO water delivery', 'user_saikumar', '2026-11-06 11:00:00+00'),
  ('exp_12', 'cycle_1_nov_2026', 'Fortune Sunflower Oil (5L Jar)', 720.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Sunflower cooking oil', 'user_goutham', '2026-11-05 14:00:00+00'),
  ('exp_13', 'cycle_1_nov_2026', 'Kitchen Cleaning & Dishwashing Supplies', 680.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Vim liquid, Harpic, Colin', 'user_santhosh', '2026-11-06 17:00:00+00'),
  ('exp_14', 'cycle_1_nov_2026', 'Farm Fresh Eggs (3 Trays / 90 eggs)', 540.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Breakfast eggs stock', 'user_yashwanth', '2026-11-07 08:30:00+00'),
  ('exp_15', 'cycle_1_nov_2026', 'Toor Dal & Yellow Moong Dal (4kg)', 480.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Cooking staples', 'user_goutham', '2026-11-07 12:00:00+00'),
  ('exp_16', 'cycle_1_nov_2026', 'Aashirvaad Shudh Chakki Atta (10kg)', 450.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Wheat flour for daily rotis', 'user_santhosh', '2026-11-08 16:00:00+00'),
  ('exp_17', 'cycle_1_nov_2026', 'Spices, Garam Masala & Ginger-Garlic Paste', 430.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Kitchen condiments', 'user_goutham', '2026-11-09 18:00:00+00'),
  ('exp_18', 'cycle_1_nov_2026', 'Onions, Potatoes & Tomatoes (Week 1)', 420.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Mandi vegetables', 'user_saikumar', '2026-11-03 10:00:00+00'),
  ('exp_19', 'cycle_1_nov_2026', 'Fresh Vegetables & Greens (Week 3)', 410.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Mandi trip', 'user_saikumar', '2026-11-12 10:30:00+00'),
  ('exp_20', 'cycle_1_nov_2026', 'Fresh Vegetables & Palak Greens (Week 4)', 390.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Weekly greens', 'user_santhosh', '2026-11-15 11:00:00+00'),
  ('exp_21', 'cycle_1_nov_2026', 'Onions & Potatoes Restock (Week 2)', 380.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Local market restock', 'user_goutham', '2026-11-10 19:00:00+00'),
  ('exp_22', 'cycle_1_nov_2026', 'Wagh Bakri Tea Powder, Bru Coffee & Sugar (2kg)', 375.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Tea, coffee & sugar', 'user_goutham', '2026-11-11 09:00:00+00'),
  ('exp_23', 'cycle_1_nov_2026', 'Fresh Paneer & Amul Butter', 340.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Paneer and butter', 'user_yashwanth', '2026-11-13 19:30:00+00'),
  ('exp_24', 'cycle_1_nov_2026', 'Modern Sandwich Bread, Kissan Jam & Oats', 295.00, 'Food', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Breakfast essentials', 'user_santhosh', '2026-11-14 08:15:00+00'),
  ('exp_25', 'cycle_1_nov_2026', 'Scotch-Brite Floor Mop & Broom Replacement', 260.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Cleaning supplies', 'user_puri', '2026-11-12 17:00:00+00'),
  ('exp_26', 'cycle_1_nov_2026', 'Black Garbage Bags (Roll of 60) & Odonil', 210.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Trash bags & freshener', 'user_goutham', '2026-11-13 11:00:00+00'),
  ('exp_27', 'cycle_1_nov_2026', 'Kitchen Tissue Rolls & Dettol Handwash', 195.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Sink hygiene supplies', 'user_santhosh', '2026-11-14 14:00:00+00'),
  ('exp_28', 'cycle_1_nov_2026', 'Automatic Water Dispenser Electric Pump', 180.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Pump replacement', 'user_saikumar', '2026-11-05 19:00:00+00'),
  ('exp_29', 'cycle_1_nov_2026', 'Tata Rock Salt, Tamarind & Mustard Seeds', 168.00, 'Groceries', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Kitchen condiments', 'user_goutham', '2026-11-14 18:00:00+00'),
  ('exp_30', 'cycle_1_nov_2026', 'Bathroom Air Freshener Blocks & Naphthalene Balls', 145.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Restroom supplies', 'user_santhosh', '2026-11-15 15:00:00+00'),
  ('exp_31', 'cycle_1_nov_2026', 'Gas Stove Lighter & Steel Wire Scrubbers', 125.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Kitchen maintenance', 'user_goutham', '2026-11-16 12:00:00+00'),
  ('exp_32', 'cycle_1_nov_2026', 'All-Out Mosquito Liquid Refill', 50.00, 'Utilities', false, 'equal', '["user_goutham", "user_saikumar", "user_santhosh", "user_yashwanth", "user_puri"]'::jsonb, 'Mosquito repellent refill', 'user_puri', '2026-11-16 19:00:00+00'),

  -- Excluded Personal Items
  ('exp_33_excluded', 'cycle_1_nov_2026', 'Inox PVR Movie Ticket (Personal Item)', 250.00, 'Personal', true, 'excluded', '["user_saikumar"]'::jsonb, 'Personal movie ticket - excluded from room pool', 'user_saikumar', '2026-11-08 21:00:00+00'),
  ('exp_34_excluded', 'cycle_1_nov_2026', 'Havmor Ice Cream Tub (Personal Item)', 90.00, 'Personal', true, 'excluded', '["user_yashwanth"]'::jsonb, 'Personal dessert - excluded from room pool', 'user_yashwanth', '2026-11-11 22:00:00+00'),
  ('exp_35_excluded', 'cycle_1_nov_2026', 'Lays Chips & Red Bull (Personal Item)', 20.00, 'Personal', true, 'excluded', '["user_puri"]'::jsonb, 'Personal late night snack - excluded from room pool', 'user_puri', '2026-11-14 23:30:00+00')
on conflict (id) do nothing;

-- 4. Payments
-- Vendor Payments: ₹45,831 | Admin Treasury Transfers: ₹3,000
insert into public.payments (id, cycle_id, payer_id, amount, payment_type, recipient_admin_id, linked_expense_id, vendor_name, notes, payment_date) values
  ('pay_01', 'cycle_1_nov_2026', 'user_goutham', 15000.00, 'vendor', null, 'exp_01', 'Landlord (Penthouse AK37)', 'Direct RTGS transfer for Nov 2026 Rent', '2026-11-02 10:05:00+00'),
  ('pay_02', 'cycle_1_nov_2026', 'user_goutham', 5000.00, 'vendor', null, 'exp_02', 'Cook & Maid Staff', 'Monthly cook compensation via UPI', '2026-11-05 11:05:00+00'),
  ('pay_03', 'cycle_1_nov_2026', 'user_goutham', 3540.00, 'vendor', null, 'exp_07', 'TGSPDCL Electricity Board', 'Electricity bill payment online', '2026-11-08 09:20:00+00'),
  ('pay_04', 'cycle_1_nov_2026', 'user_goutham', 2400.00, 'vendor', null, 'exp_06', 'DMart Supermarket', 'Gouthams card swipe for part of DMart bulk haul', '2026-11-03 18:10:00+00'),
  ('pay_05', 'cycle_1_nov_2026', 'user_goutham', 1499.00, 'vendor', null, 'exp_10', 'ACT Fibernet', 'Broadband bill autopay', '2026-11-01 15:05:00+00'),
  ('pay_06', 'cycle_1_nov_2026', 'user_goutham', 1400.00, 'vendor', null, 'exp_03', 'Urban Company', 'Deep cleaning service payment', '2026-11-07 14:35:00+00'),
  ('pay_07', 'cycle_1_nov_2026', 'user_goutham', 1200.00, 'vendor', null, 'exp_04', 'Meat Market & Cook', 'Sunday special lunch payment', '2026-11-09 13:05:00+00'),
  ('pay_08', 'cycle_1_nov_2026', 'user_goutham', 720.00, 'vendor', null, 'exp_12', 'Supermarket', 'Fortune Oil payment', '2026-11-05 14:05:00+00'),
  ('pay_09', 'cycle_1_nov_2026', 'user_goutham', 480.00, 'vendor', null, 'exp_15', 'Kirana Store', 'Dals payment', '2026-11-07 12:05:00+00'),
  ('pay_10', 'cycle_1_nov_2026', 'user_goutham', 430.00, 'vendor', null, 'exp_17', 'Spice Market', 'Masalas payment', '2026-11-09 18:05:00+00'),
  ('pay_11', 'cycle_1_nov_2026', 'user_goutham', 380.00, 'vendor', null, 'exp_21', 'Veg Mandi', 'Vegetables payment', '2026-11-10 19:05:00+00'),
  ('pay_12', 'cycle_1_nov_2026', 'user_goutham', 375.00, 'vendor', null, 'exp_22', 'Local Store', 'Tea & Coffee purchase', '2026-11-11 09:05:00+00'),
  ('pay_13', 'cycle_1_nov_2026', 'user_goutham', 210.00, 'vendor', null, 'exp_26', 'Household Shop', 'Garbage bags & freshener', '2026-11-13 11:05:00+00'),
  ('pay_14', 'cycle_1_nov_2026', 'user_goutham', 168.00, 'vendor', null, 'exp_29', 'Kirana', 'Salt & spices', '2026-11-14 18:05:00+00'),
  ('pay_15', 'cycle_1_nov_2026', 'user_goutham', 125.00, 'vendor', null, 'exp_31', 'Hardware Store', 'Lighter & scrubbers', '2026-11-16 12:05:00+00'),
  ('pay_16', 'cycle_1_nov_2026', 'user_goutham', 939.00, 'vendor', null, null, 'Ratnadeep Supermarket', 'Mid-month pantry top-up & essentials', '2026-11-12 15:00:00+00'),

  ('pay_17', 'cycle_1_nov_2026', 'user_saikumar', 2959.00, 'vendor', null, 'exp_06', 'DMart Supermarket', 'Saikumar part of DMart grocery bill swipe', '2026-11-03 18:15:00+00'),
  ('pay_18', 'cycle_1_nov_2026', 'user_saikumar', 1130.00, 'vendor', null, 'exp_05', 'HP Gas Agency', 'LPG Gas cylinder delivery cash payment', '2026-11-10 16:05:00+00'),
  ('pay_19', 'cycle_1_nov_2026', 'user_saikumar', 960.00, 'vendor', null, 'exp_11', 'Water Delivery Vendor', 'Monthly water cans payment', '2026-11-06 11:05:00+00'),
  ('pay_20', 'cycle_1_nov_2026', 'user_saikumar', 420.00, 'vendor', null, 'exp_18', 'Local Vegetable Market', 'Week 1 veggies', '2026-11-03 10:05:00+00'),
  ('pay_21', 'cycle_1_nov_2026', 'user_saikumar', 410.00, 'vendor', null, 'exp_19', 'Rythu Bazaar', 'Week 3 veggies', '2026-11-12 10:35:00+00'),
  ('pay_22', 'cycle_1_nov_2026', 'user_saikumar', 120.00, 'vendor', null, null, 'Electrical Hardware', 'Water dispenser pump accessories', '2026-11-05 19:05:00+00'),

  ('pay_23', 'cycle_1_nov_2026', 'user_santhosh', 1850.00, 'vendor', null, 'exp_08', 'Heritage Milk Agency', 'Monthly milk & curd subscription', '2026-11-04 07:35:00+00'),
  ('pay_24', 'cycle_1_nov_2026', 'user_santhosh', 1650.00, 'vendor', null, 'exp_09', 'Wholesale Rice Depot', '25kg Sona Masoori Rice Bag', '2026-11-04 12:05:00+00'),
  ('pay_25', 'cycle_1_nov_2026', 'user_santhosh', 680.00, 'vendor', null, 'exp_13', 'DMart Cleaning Counter', 'Cleaning & dishwashing essentials', '2026-11-06 17:05:00+00'),
  ('pay_26', 'cycle_1_nov_2026', 'user_santhosh', 450.00, 'vendor', null, 'exp_16', 'Supermarket', 'Aashirvaad Atta 10kg', '2026-11-08 16:05:00+00'),
  ('pay_27', 'cycle_1_nov_2026', 'user_santhosh', 329.00, 'vendor', null, null, 'Bakery & Dairy', 'Bread, jam, eggs & curd', '2026-11-14 08:20:00+00'),

  ('pay_28', 'cycle_1_nov_2026', 'user_yashwanth', 540.00, 'vendor', null, 'exp_14', 'Poultry Farm Outlet', '3 trays eggs purchase', '2026-11-07 08:35:00+00'),
  ('pay_29', 'cycle_1_nov_2026', 'user_yashwanth', 317.00, 'vendor', null, null, 'Dairy Parlour', 'Paneer, butter and curd', '2026-11-13 19:35:00+00'),

  ('pay_30', 'cycle_1_nov_2026', 'user_puri', 150.00, 'vendor', null, null, 'Water Vendor & Kirana', 'Emergency water can & lemons', '2026-11-12 17:05:00+00'),

  -- Admin Treasury Transfers
  ('pay_31_admin', 'cycle_1_nov_2026', 'user_saikumar', 1750.00, 'admin_treasury', 'user_goutham', null, 'Admin Treasury (Goutham)', 'Mid-month UPI advance to Admin Treasury for rent pool', '2026-11-05 18:00:00+00'),
  ('pay_32_admin', 'cycle_1_nov_2026', 'user_santhosh', 1250.00, 'admin_treasury', 'user_goutham', null, 'Admin Treasury (Goutham)', 'Mid-month UPI transfer to Admin Treasury for grocery buffer', '2026-11-06 12:00:00+00')
on conflict (id) do nothing;
