# PentHouse AK37 — Multi-User Roommate Expense & Treasury Engine

A mobile-first roommate expense, treasury management, and two-party consent settlement web application powered by **React + Vite + Tailwind CSS** and **Supabase (PostgreSQL + Auth + RLS + Realtime + Edge Functions)**.

## Features

- **Decoupled Ledger ("Who Paid" vs. "Paid For What")** — Split logic lives on Expenses; Payments track Vendor bills and Admin Treasury transfers separately.
- **Per-Expense Split Engine** — Supports Equal Participant Split across any selected roommates and Excluded Personal items (`₹0` impact).
- **Transferable Admin Treasury** — Atomic `transfer_admin_role` RPC transfers future treasury collections while preserving historical audit integrity.
- **Two-Party Consent Settlements** — Strict RLS enforces that only the counterparty can confirm (`2/2 Closed`) or decline pending full/partial settlements. Includes 1-tap `upi://pay` deep links and scannable UPI QR codes.
- **Username & Password Auth** — Roommates sign in with their username (`goutham`, `saikumar`, `santhosh`, `yashwanth`, `puri`, or any newly added roommate) and password.
- **Admin Roommate Onboarding** — Active Admin can create new roommate accounts (with temporary credentials & password reset) via the deployed Supabase Edge Function `create-roommate`.
- **Self Profile Updation** — Every roommate can update their Display Name, UPI ID, Phone Number, Avatar Color, and Login Password directly from Profile Settings.
- **Monthly Cycles & Archiving** — Closed cycles are locked read-only at the PostgreSQL trigger level, with optional carry-forward of unpaid balances into the next cycle.

---

## Local Development

```bash
npm install
npm run dev
```

Run the Cycle 1 calculation verification suite:
```bash
npx tsx src/engine/splitEngine.test.ts
```

---

## Deploying to Render (Static Site)

This repository includes a ready-to-use `render.yaml` Blueprint.

1. Push this project to a GitHub/GitLab repository.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** (or **Static Site**).
3. Connect your repository:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Rewrite Rule:** `/*` → `/index.html` *(auto-configured via `render.yaml`)*
4. Add the two environment variables in Render:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy** — your live URL will sync instantaneously with Supabase Realtime across all roommates' phones!
