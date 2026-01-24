-- =====================================================
-- SUBSCRIPTION SYSTEM - DATABASE MIGRATION SCRIPT
-- =====================================================
-- Run this script to add subscription support to your database
-- Make sure to backup your database before running!

-- =====================================================
-- STEP 1: CREATE NEW TABLES
-- =====================================================

-- Table: subscription_plans
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

-- Table: subscriptions
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

-- Table: subscription_history
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

-- Table: subscription_payments
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

-- Table: business_invitations
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

-- Table: feature_usage_logs
CREATE TABLE IF NOT EXISTS public.feature_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 1,
  month text NOT NULL, -- Format: YYYY-MM
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT feature_usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT feature_usage_logs_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT feature_usage_logs_unique UNIQUE (business_id, feature_name, month)
);

-- =====================================================
-- STEP 2: MODIFY EXISTING TABLES
-- =====================================================

-- Add subscription fields to businesses table
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial'::text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Drop old constraint if exists and add new one
ALTER TABLE public.businesses 
  DROP CONSTRAINT IF EXISTS businesses_subscription_status_check;

ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_subscription_status_check 
  CHECK (subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text]));

-- Add foreign key for created_by
ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.profiles(id);

-- Update profiles table to add new role
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY[
    'system_superadmin'::text,
    'superadmin'::text,
    'staff'::text
  ]));

-- Add invitation fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS invitation_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invited_at timestamp without time zone;

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON public.businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON public.businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.business_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.business_invitations(email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_business_month ON public.feature_usage_logs(business_id, month);

-- =====================================================
-- STEP 4: SEED SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO public.subscription_plans (plan_type, name, description, monthly_price, features, trial_days, max_users, max_invoices_per_month, max_products, max_customers) 
VALUES
  (
    'trial', 
    'Trial Plan', 
    '14-day free trial with limited features', 
    0, 
    '{
      "modules": ["leads", "customers", "quotations"],
      "advanced_reports": false,
      "api_access": false,
      "priority_support": false,
      "custom_branding": false
    }'::jsonb, 
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
    '{
      "modules": ["leads", "customers", "quotations", "invoices", "payments", "products"],
      "advanced_reports": false,
      "api_access": false,
      "priority_support": false,
      "custom_branding": false
    }'::jsonb, 
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
    '{
      "modules": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports", "accounting"],
      "advanced_reports": true,
      "api_access": false,
      "priority_support": true,
      "custom_branding": false
    }'::jsonb, 
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
    '{
      "modules": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports", "accounting", "inventory", "staff"],
      "advanced_reports": true,
      "api_access": true,
      "priority_support": true,
      "custom_branding": true,
      "white_label": true
    }'::jsonb, 
    0, 
    NULL, 
    NULL, 
    NULL, 
    NULL
  )
ON CONFLICT (plan_type) DO NOTHING;

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Check if subscription is active
CREATE OR REPLACE FUNCTION public.check_subscription_active(p_business_id uuid)
RETURNS boolean 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.subscriptions 
    WHERE business_id = p_business_id 
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$;

-- Function: Check if business has access to a feature
CREATE OR REPLACE FUNCTION public.has_feature_access(
  p_business_id uuid, 
  p_feature text
)
RETURNS boolean 
LANGUAGE plpgsql
AS $$
DECLARE
  v_features jsonb;
BEGIN
  SELECT sp.features INTO v_features
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_type = sp.plan_type
  WHERE s.business_id = p_business_id
  AND s.status = 'active';
  
  IF v_features IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_features->'modules' ? p_feature;
END;
$$;

-- Function: Get current plan for a business
CREATE OR REPLACE FUNCTION public.get_business_plan(p_business_id uuid)
RETURNS TABLE (
  plan_type text,
  plan_name text,
  max_users integer,
  max_invoices_per_month integer,
  max_products integer,
  max_customers integer,
  features jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.plan_type,
    sp.name,
    sp.max_users,
    sp.max_invoices_per_month,
    sp.max_products,
    sp.max_customers,
    sp.features
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_type = sp.plan_type
  WHERE s.business_id = p_business_id
  AND s.status = 'active'
  LIMIT 1;
END;
$$;

-- Function: Update expired subscriptions (run via cron job)
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE end_date < now() 
  AND status = 'active';
  
  -- Also update business status
  UPDATE public.businesses b
  SET subscription_status = 'cancelled',
      is_active = false
  FROM public.subscriptions s
  WHERE b.id = s.business_id
  AND s.status = 'expired';
END;
$$;

-- Function: Track feature usage
CREATE OR REPLACE FUNCTION public.track_feature_usage(
  p_business_id uuid,
  p_feature_name text
)
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
  v_month text;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  INSERT INTO public.feature_usage_logs (business_id, feature_name, month, usage_count)
  VALUES (p_business_id, p_feature_name, v_month, 1)
  ON CONFLICT (business_id, feature_name, month)
  DO UPDATE SET 
    usage_count = feature_usage_logs.usage_count + 1,
    created_at = now();
END;
$$;

-- Function: Check usage limit for a feature
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_business_id uuid,
  p_feature_name text,
  p_limit_field text -- 'max_invoices_per_month', 'max_products', etc.
)
RETURNS boolean 
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit integer;
  v_current_usage integer;
  v_month text;
BEGIN
  -- Get the limit for this plan
  SELECT 
    CASE p_limit_field
      WHEN 'max_invoices_per_month' THEN sp.max_invoices_per_month
      WHEN 'max_products' THEN sp.max_products
      WHEN 'max_customers' THEN sp.max_customers
      WHEN 'max_users' THEN sp.max_users
      ELSE NULL
    END INTO v_limit
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_type = sp.plan_type
  WHERE s.business_id = p_business_id
  AND s.status = 'active';
  
  -- If limit is NULL, it means unlimited
  IF v_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Get current usage (for monthly limits, check current month only)
  IF p_limit_field = 'max_invoices_per_month' THEN
    v_month := to_char(now(), 'YYYY-MM');
    SELECT COALESCE(usage_count, 0) INTO v_current_usage
    FROM public.feature_usage_logs
    WHERE business_id = p_business_id
    AND feature_name = p_feature_name
    AND month = v_month;
  ELSE
    -- For non-monthly limits, count actual records
    CASE p_feature_name
      WHEN 'products' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.products
        WHERE business_id = p_business_id;
      WHEN 'customers' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.customers
        WHERE business_id = p_business_id;
      WHEN 'users' THEN
        SELECT COUNT(*) INTO v_current_usage
        FROM public.profiles
        WHERE business_id = p_business_id;
      ELSE
        v_current_usage := 0;
    END CASE;
  END IF;
  
  RETURN v_current_usage < v_limit;
END;
$$;

-- =====================================================
-- STEP 6: MIGRATE EXISTING BUSINESSES TO TRIAL
-- =====================================================
-- WARNING: Review this carefully before running!
-- This will set all existing businesses to Trial plan

DO $$
DECLARE
  business_record RECORD;
  trial_end_date timestamp;
BEGIN
  FOR business_record IN 
    SELECT id FROM public.businesses
    WHERE id NOT IN (SELECT business_id FROM public.subscriptions)
  LOOP
    trial_end_date := now() + interval '14 days';
    
    -- Create subscription for existing business
    INSERT INTO public.subscriptions (
      business_id, 
      plan_type, 
      status, 
      start_date, 
      trial_ends_at,
      monthly_price
    )
    VALUES (
      business_record.id,
      'trial',
      'active',
      now(),
      trial_end_date,
      0
    );
    
    -- Update business status
    UPDATE public.businesses
    SET subscription_status = 'trial',
        is_active = true
    WHERE id = business_record.id;
  END LOOP;
  
  RAISE NOTICE 'Migrated existing businesses to Trial plan';
END $$;

-- =====================================================
-- STEP 7: CREATE TRIGGERS
-- =====================================================

-- Trigger: Auto-update subscription updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_subscription_timestamp
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_timestamp();

-- Trigger: Log subscription changes to history
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.plan_type != NEW.plan_type THEN
    INSERT INTO public.subscription_history (
      business_id,
      subscription_id,
      from_plan,
      to_plan,
      reason
    )
    VALUES (
      NEW.business_id,
      NEW.id,
      OLD.plan_type,
      NEW.plan_type,
      'Plan changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_subscription_change
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.plan_type != NEW.plan_type)
  EXECUTE FUNCTION public.log_subscription_change();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration was successful

-- Check subscription plans
SELECT * FROM public.subscription_plans;

-- Check migrated subscriptions
SELECT 
  b.name as business_name,
  s.plan_type,
  s.status,
  s.trial_ends_at
FROM public.subscriptions s
JOIN public.businesses b ON s.business_id = b.id
ORDER BY b.created_at DESC;

-- Check updated business statuses
SELECT 
  name,
  subscription_status,
  is_active,
  created_at
FROM public.businesses
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- ROLLBACK SCRIPT (If needed)
-- =====================================================
-- UNCOMMENT AND RUN ONLY IF YOU NEED TO ROLLBACK

/*
-- Drop new tables
DROP TABLE IF EXISTS public.feature_usage_logs CASCADE;
DROP TABLE IF EXISTS public.business_invitations CASCADE;
DROP TABLE IF EXISTS public.subscription_payments CASCADE;
DROP TABLE IF EXISTS public.subscription_history CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Remove added columns
ALTER TABLE public.businesses 
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS onboarding_completed,
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS invitation_accepted,
  DROP COLUMN IF EXISTS invited_by,
  DROP COLUMN IF EXISTS invited_at;

-- Restore old role constraint
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['superadmin'::text, 'staff'::text]));

-- Drop functions
DROP FUNCTION IF EXISTS public.check_subscription_active(uuid);
DROP FUNCTION IF EXISTS public.has_feature_access(uuid, text);
DROP FUNCTION IF EXISTS public.get_business_plan(uuid);
DROP FUNCTION IF EXISTS public.update_expired_subscriptions();
DROP FUNCTION IF EXISTS public.track_feature_usage(uuid, text);
DROP FUNCTION IF EXISTS public.check_usage_limit(uuid, text, text);
DROP FUNCTION IF EXISTS public.update_subscription_timestamp();
DROP FUNCTION IF EXISTS public.log_subscription_change();
*/

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================
