-- ========================================
-- EXPENSES TABLE - SUPABASE SQL
-- ========================================
-- Copy and paste this entire file into your Supabase SQL Editor

-- Step 1: Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  expense_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'raw-materials', 'labor', 'utilities', 'rent', 
    'transportation', 'maintenance', 'office-supplies', 
    'marketing', 'salary', 'other'
  )),
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'cash' CHECK (payment_mode IN (
    'cash', 'upi', 'bank-transfer', 'cheque'
  )),
  reference TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'paid', 'rejected'
  )),
  approved_by UUID,
  approved_at TIMESTAMP WITHOUT TIME ZONE,
  rejected_by UUID,
  rejected_at TIMESTAMP WITHOUT TIME ZONE,
  rejection_reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT expenses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id),
  CONSTRAINT expenses_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.profiles(id),
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);

-- Step 3: Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
CREATE POLICY "Users can view expenses from their business"
  ON public.expenses FOR SELECT
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff and admins can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

CREATE POLICY "Staff and admins can update expenses"
  ON public.expenses FOR UPDATE
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

CREATE POLICY "Only admins can delete expenses"
  ON public.expenses FOR DELETE
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Step 5: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_expenses_updated_at_trigger ON public.expenses;
CREATE TRIGGER update_expenses_updated_at_trigger
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- ✅ DONE! Expenses table created successfully.
