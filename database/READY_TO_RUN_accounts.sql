-- ========================================
-- READY TO RUN - EXPENSE ACCOUNTS
-- ========================================
-- Just copy this entire file and paste into Supabase SQL Editor
-- Then click RUN

INSERT INTO public.accounts (business_id, code, name, type) VALUES

-- Asset Accounts (for payment tracking)
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '1001', 'Cash', 'asset'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '1002', 'Bank Account', 'asset'),

-- Expense Accounts - COGS (Cost of Goods Sold)
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '5001', 'Cost of Goods Sold - Raw Materials', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '5002', 'Cost of Goods Sold - Labor', 'expense'),

-- Expense Accounts - Operating Expenses
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6001', 'Operating Expenses - Utilities', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6002', 'Operating Expenses - Rent', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6003', 'Operating Expenses - Transportation', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6004', 'Operating Expenses - Maintenance', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6005', 'Operating Expenses - Office Supplies', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6006', 'Operating Expenses - Marketing', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6007', 'Operating Expenses - Salaries', 'expense'),
('4eac8aa9-db1f-4ac8-9c59-0dd65b101046', '6008', 'Operating Expenses - Miscellaneous', 'expense')

ON CONFLICT (business_id, code) DO NOTHING;

-- ✅ Done! Run this query to verify:
-- SELECT code, name, type FROM public.accounts WHERE business_id = '4eac8aa9-db1f-4ac8-9c59-0dd65b101046' ORDER BY code;
