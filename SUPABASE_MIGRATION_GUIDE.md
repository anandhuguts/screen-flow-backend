# 🚀 Supabase Migration Instructions - Phase 1

## ⚠️ IMPORTANT - Read Before Proceeding

**Supabase SQL execution must be done through the Supabase Dashboard SQL Editor.**

The JavaScript client doesn't allow arbitrary SQL execution for security reasons. Follow these steps:

---

## 📋 Step-by-Step Migration Process

### Step 1: Backup Your Database ✅

1. Go to Supabase Dashboard: https://zmeevdtgslrxaelmultq.supabase.co
2. Navigate to **Database** → **Backups**
3. Click **Create Backup** or note your automatic backup time
4. ✅ Confirm backup exists before proceeding

---

### Step 2: Open SQL Editor

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. You'll execute our migration SQL in sections

---

### Step 3: Execute Migration SQL (In Order!)

I'll break down the migration into **safe, executable chunks**. Run each section separately:

#### Section 1: Create New Tables (Core)

```sql
-- ==================================================
-- SECTION 1: CREATE SUBSCRIPTION_PLANS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_type text NOT NULL UNIQUE CHECK (plan_type = ANY (ARRAY[
    'trial'::text, 
    'basic'::text, 
    'advanced'::text, 
    'premium'::text
  ])),
  name text NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  max_users integer,
  max_invoices_per_month integer,
  max_products integer,
  max_customers integer,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  trial_days integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type 
  ON public.subscription_plans(plan_type);
```

**Action:** 
- [ ] Copy the above SQL
- [ ] Paste into Supabase SQL Editor
- [ ] Click **RUN**
- [ ] Verify: "Success. No rows returned" or similar

---

#### Section 2: Create Subscriptions Table

```sql
-- ==================================================
-- SECTION 2: CREATE SUBSCRIPTIONS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  plan_type text NOT NULL CHECK (plan_type = ANY (ARRAY[
    'trial'::text, 
    'basic'::text, 
    'advanced'::text, 
    'premium'::text
  ])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY[
    'active'::text, 
    'suspended'::text, 
    'cancelled'::text, 
    'expired'::text
  ])),
  start_date timestamp without time zone DEFAULT now(),
  end_date timestamp without time zone,
  trial_ends_at timestamp without time zone,
  monthly_price numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_business_id_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id 
  ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON public.subscriptions(status);
```

**Action:** 
- [ ] Copy, paste, RUN
- [ ] Verify success

---

#### Section 3: Create Supporting Tables

```sql
-- ==================================================
-- SECTION 3: CREATE SUPPORTING TABLES
-- ==================================================

-- Subscription History
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  from_plan text,
  to_plan text NOT NULL,
  reason text,
  changed_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscription_history_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_history_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT subscription_history_changed_by_fkey FOREIGN KEY (changed_by) 
    REFERENCES public.profiles(id)
);

-- Subscription Payments
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_date timestamp without time zone DEFAULT now(),
  payment_reference text,
  invoice_number text,
  status text NOT NULL DEFAULT 'completed'::text CHECK (status = ANY (ARRAY[
    'completed'::text, 
    'pending'::text, 
    'failed'::text, 
    'refunded'::text
  ])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscription_payments_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_payments_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT subscription_payments_subscription_fkey FOREIGN KEY (subscription_id) 
    REFERENCES public.subscriptions(id) ON DELETE CASCADE
);

-- Business Invitations
CREATE TABLE IF NOT EXISTS public.business_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['superadmin'::text, 'staff'::text])),
  invited_by uuid NOT NULL,
  invitation_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'accepted'::text, 
    'expired'::text, 
    'cancelled'::text
  ])),
  expires_at timestamp without time zone NOT NULL,
  accepted_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT business_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT business_invitations_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_invitations_invited_by_fkey FOREIGN KEY (invited_by) 
    REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_token 
  ON public.business_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email 
  ON public.business_invitations(email);

-- Feature Usage Logs
CREATE TABLE IF NOT EXISTS public.feature_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 1,
  month text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT feature_usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT feature_usage_logs_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT feature_usage_logs_unique UNIQUE (business_id, feature_name, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_business_month 
  ON public.feature_usage_logs(business_id, month);
```

**Action:** 
- [ ] Copy, paste, RUN
- [ ] Verify all 4 tables created

---

#### Section 4: Modify Existing Tables

```sql
-- ==================================================
-- SECTION 4: MODIFY BUSINESSES TABLE
-- ==================================================

-- Add new columns
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial'::text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update constraint
ALTER TABLE public.businesses 
  DROP CONSTRAINT IF EXISTS businesses_subscription_status_check;

ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_subscription_status_check 
  CHECK (subscription_status = ANY (ARRAY[
    'trial'::text, 
    'active'::text, 
    'suspended'::text, 
    'cancelled'::text
  ]));

-- Add foreign key
ALTER TABLE public.businesses 
  DROP CONSTRAINT IF EXISTS businesses_created_by_fkey;
  
ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status 
  ON public.businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active 
  ON public.businesses(is_active);
```

**Action:** 
- [ ] Copy, paste, RUN
- [ ] Verify businesses table modified

---

#### Section 5: Modify Profiles Table

```sql
-- ==================================================
-- SECTION 5: MODIFY PROFILES TABLE
-- ==================================================

-- Update role constraint to include system_superadmin
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY[
    'system_superadmin'::text,
    'superadmin'::text,
    'staff'::text
  ]));

-- Add invitation fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS invitation_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invited_at timestamp without time zone;
```

**Action:** 
- [ ] Copy, paste, RUN
- [ ] Verify profiles table modified

---

#### Section 6: Seed Subscription Plans 🌱

```sql
-- ==================================================
-- SECTION 6: SEED SUBSCRIPTION PLANS
-- ==================================================

INSERT INTO public.subscription_plans 
  (plan_type, name, description, monthly_price, features, trial_days, max_users, max_invoices_per_month, max_products, max_customers) 
VALUES
  (
    'trial', 
    'Trial Plan', 
    '14-day free trial with limited features', 
    0, 
    '{"modules": ["leads", "customers", "quotations"], "advanced_reports": false, "api_access": false, "priority_support": false, "custom_branding": false}'::jsonb, 
    14, 
    2, 
    50, 
    100, 
    50
  ),
  (
    'basic', 
    'Basic Plan', 
    'Essential features for small businesses', 
    999, 
    '{"modules": ["leads", "customers", "quotations", "invoices", "payments", "products"], "advanced_reports": false, "api_access": false, "priority_support": false, "custom_branding": false}'::jsonb, 
    0, 
    5, 
    500, 
    1000, 
    500
  ),
  (
    'advanced', 
    'Advanced Plan', 
    'For growing businesses with advanced needs', 
    2999, 
    '{"modules": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports", "accounting"], "advanced_reports": true, "api_access": false, "priority_support": true, "custom_branding": false}'::jsonb, 
    0, 
    15, 
    2000, 
    5000, 
    2000
  ),
  (
    'premium', 
    'Premium Plan', 
    'Complete solution with all features', 
    5999, 
    '{"modules": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports", "accounting", "inventory", "staff"], "advanced_reports": true, "api_access": true, "priority_support": true, "custom_branding": true, "white_label": true}'::jsonb, 
    0, 
    NULL, 
    NULL, 
    NULL, 
    NULL
  )
ON CONFLICT (plan_type) DO NOTHING;
```

**Action:** 
- [ ] Copy, paste, RUN
- [ ] Verify: "4 rows affected" or plans already exist

---

### Step 4: Verify Migration ✅

Run this verification query:

```sql
-- Verification Query
SELECT 
  'subscription_plans' as table_name, 
  COUNT(*) as row_count 
FROM public.subscription_plans
UNION ALL
SELECT 
  'subscriptions', 
  COUNT(*) 
FROM public.subscriptions
UNION ALL
SELECT 
  'subscription_history', 
  COUNT(*) 
FROM public.subscription_history
UNION ALL
SELECT 
  'subscription_payments', 
  COUNT(*) 
FROM public.subscription_payments
UNION ALL
SELECT 
  'business_invitations', 
  COUNT(*) 
FROM public.business_invitations
UNION ALL
SELECT 
  'feature_usage_logs', 
  COUNT(*) 
FROM public.feature_usage_logs;
```

**Expected Result:**
```
subscription_plans       | 4
subscriptions            | 0
subscription_history     | 0
subscription_payments    | 0
business_invitations     | 0
feature_usage_logs       | 0
```

---

### Step 5: View Subscription Plans

```sql
SELECT 
  plan_type,
  name,
  monthly_price,
  max_users,
  max_invoices_per_month,
  features->>'modules' as modules
FROM public.subscription_plans
ORDER BY monthly_price;
```

**Expected:** You should see all 4 plans (Trial, Basic, Advanced, Premium)

---

## 🎉 Success Checklist

After completing all sections, verify:

- [ ] All 6 new tables exist
- [ ] `businesses` table has new columns
- [ ] `profiles` table has new columns
- [ ] 4 subscription plans are seeded
- [ ] No errors in SQL Editor
- [ ] Verification query shows correct counts

---

## ⏭️ Next Steps

Once migration is complete:

1. ✅ Mark Phase 1 as complete
2. 🚀 Proceed to **Phase 2: Backend Controllers**
3. 📝 I'll create the superadmin controller next

---

## 🆘 Troubleshooting

**Error: "relation already exists"**
→ Table already created. Safe to ignore or use `DROP TABLE IF EXISTS` first.

**Error: "column already exists"**
→ Column already added. Safe to ignore.

**Error: "constraint already exists"**
→ Constraint already added. Safe to ignore.

**Foreign key violation**
→ Make sure you run sections in order (core tables before modifications).

---

**Ready to execute?** Open Supabase SQL Editor and run each section! 🚀

Let me know when Phase 1 is complete, and I'll start Phase 2!
