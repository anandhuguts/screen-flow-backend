-- ========================================
-- ADD EXPENSE ACCOUNTS
-- ========================================
-- STEP 1: Find your business_id
SELECT id, name FROM public.businesses;

-- STEP 2: Replace 'YOUR_BUSINESS_ID' below with your actual UUID
-- Then run this INSERT statement

INSERT INTO public.accounts (business_id, code, name, type) VALUES

-- Asset Accounts
('YOUR_BUSINESS_ID', '1001', 'Cash', 'asset'),
('YOUR_BUSINESS_ID', '1002', 'Bank Account', 'asset'),

-- Expense Accounts - COGS
('YOUR_BUSINESS_ID', '5001', 'Cost of Goods Sold - Raw Materials', 'expense'),
('YOUR_BUSINESS_ID', '5002', 'Cost of Goods Sold - Labor', 'expense'),

-- Expense Accounts - Operating
('YOUR_BUSINESS_ID', '6001', 'Operating Expenses - Utilities', 'expense'),
('YOUR_BUSINESS_ID', '6002', 'Operating Expenses - Rent', 'expense'),
('YOUR_BUSINESS_ID', '6003', 'Operating Expenses - Transportation', 'expense'),
('YOUR_BUSINESS_ID', '6004', 'Operating Expenses - Maintenance', 'expense'),
('YOUR_BUSINESS_ID', '6005', 'Operating Expenses - Office Supplies', 'expense'),
('YOUR_BUSINESS_ID', '6006', 'Operating Expenses - Marketing', 'expense'),
('YOUR_BUSINESS_ID', '6007', 'Operating Expenses - Salaries', 'expense'),
('YOUR_BUSINESS_ID', '6008', 'Operating Expenses - Miscellaneous', 'expense')

ON CONFLICT (business_id, code) DO NOTHING;

-- ✅ Accounts created successfully!
