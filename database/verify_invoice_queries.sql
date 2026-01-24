-- ═══════════════════════════════════════════════════════════════
-- INVOICE VERIFICATION QUERIES
-- Business ID: 76834d81-ce40-43f5-8082-1e08809663ff
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. CHECK LATEST INVOICES WITH CUSTOMER DETAILS
-- ─────────────────────────────────────────────────────────────
SELECT 
    i.invoice_number,
    i.status,
    i.subtotal,
    i.tax_amount,
    i.total_amount,
    i.paid_amount,
    i.balance_amount,
    i.due_date,
    i.created_at,
    c.name as customer_name,
    c.phone as customer_phone
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY i.created_at DESC
LIMIT 5;


-- ─────────────────────────────────────────────────────────────
-- 2. CHECK INVOICE ITEMS
-- ─────────────────────────────────────────────────────────────
SELECT 
    i.invoice_number,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total,
    (ii.quantity * ii.unit_price) as calculated_total
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY i.created_at DESC, ii.id
LIMIT 10;


-- ─────────────────────────────────────────────────────────────
-- 3. CHECK JOURNAL ENTRIES (ACCOUNTING)
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.date,
    je.description,
    je.reference_type,
    a.code as account_code,
    a.name as account_name,
    jl.debit,
    jl.credit
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'invoice'
ORDER BY je.created_at DESC, jl.id
LIMIT 10;


-- ─────────────────────────────────────────────────────────────
-- 4. VERIFY ACCOUNTING BALANCE (Debits = Credits)
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.description,
    je.date,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'invoice'
GROUP BY je.id, je.description, je.date
ORDER BY je.created_at DESC
LIMIT 5;

-- ✅ PASS: If difference = 0 for all entries
-- ❌ FAIL: If any difference != 0, there's an accounting error


-- ─────────────────────────────────────────────────────────────
-- 5. CHECK REQUIRED ACCOUNTS EXIST
-- ─────────────────────────────────────────────────────────────
SELECT code, name, type
FROM accounts
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND code IN ('1003', '4001', '2001')
ORDER BY code;

-- Expected:
-- 1003 | Accounts Receivable | asset
-- 2001 | Tax Payable        | liability  
-- 4001 | Sales              | revenue


-- ─────────────────────────────────────────────────────────────
-- 6. CHECK ALL ACCOUNTS FOR YOUR BUSINESS
-- ─────────────────────────────────────────────────────────────
SELECT code, name, type
FROM accounts
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY code;


-- ─────────────────────────────────────────────────────────────
-- 7. CUSTOMER OUTSTANDING BALANCE SUMMARY
-- ─────────────────────────────────────────────────────────────
SELECT 
    c.name,
    c.total_purchases,
    c.outstanding_balance,
    COUNT(i.id) as invoice_count,
    SUM(i.total_amount) as total_invoiced,
    SUM(i.balance_amount) as total_outstanding
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
WHERE c.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY c.id, c.name, c.total_purchases, c.outstanding_balance
ORDER BY total_outstanding DESC
LIMIT 10;


-- ─────────────────────────────────────────────────────────────
-- 8. FIND INVOICES WITHOUT JOURNAL ENTRIES
-- ─────────────────────────────────────────────────────────────
SELECT 
    i.invoice_number,
    i.total_amount,
    i.created_at,
    CASE WHEN je.id IS NULL THEN '❌ Missing' ELSE '✅ Exists' END as journal_status
FROM invoices i
LEFT JOIN journal_entries je ON je.reference_id = i.id AND je.reference_type = 'invoice'
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY i.created_at DESC
LIMIT 10;


-- ─────────────────────────────────────────────────────────────
-- 9. SPECIFIC INVOICE COMPLETE DETAILS
-- Replace 'INV-2026-XXXXXXXXXX' with actual invoice number
-- ─────────────────────────────────────────────────────────────
WITH target_invoice AS (
    SELECT id, invoice_number, total_amount, subtotal, tax_amount
    FROM invoices
    WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND invoice_number = 'INV-2026-XXXXXXXXXX' -- REPLACE THIS
)
SELECT 
    'Invoice Header' as section,
    i.invoice_number as reference,
    i.subtotal as amount,
    NULL as account
FROM target_invoice i

UNION ALL

SELECT 
    'Invoice Item' as section,
    ii.description as reference,
    ii.total as amount,
    NULL as account
FROM target_invoice ti
JOIN invoice_items ii ON ti.id = ii.invoice_id

UNION ALL

SELECT 
    'Journal Entry' as section,
    a.name as reference,
    COALESCE(jl.debit, jl.credit) as amount,
    CASE WHEN jl.debit > 0 THEN 'Debit' ELSE 'Credit' END as account
FROM target_invoice ti
JOIN journal_entries je ON je.reference_id = ti.id
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
ORDER BY section, amount DESC;


-- ─────────────────────────────────────────────────────────────
-- 10. ACCOUNTS RECEIVABLE (AR) LEDGER
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.date,
    je.description,
    je.reference_type,
    jl.debit,
    jl.credit,
    SUM(jl.debit - jl.credit) OVER (ORDER BY je.date, je.id) as running_balance
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND a.code = '1003'  -- Accounts Receivable
ORDER BY je.date DESC, je.id DESC
LIMIT 20;


-- ─────────────────────────────────────────────────────────────
-- 11. SALES REVENUE SUMMARY
-- ─────────────────────────────────────────────────────────────
SELECT 
    DATE_TRUNC('day', je.date) as day,
    COUNT(DISTINCT je.id) as invoice_count,
    SUM(jl.credit) as total_sales
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND a.code = '4001'  -- Sales
  AND je.reference_type = 'invoice'
GROUP BY DATE_TRUNC('day', je.date)
ORDER BY day DESC
LIMIT 10;


-- ─────────────────────────────────────────────────────────────
-- 12. TAX PAYABLE SUMMARY
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.date,
    je.description,
    jl.credit as tax_collected,
    SUM(jl.credit) OVER (ORDER BY je.date) as cumulative_tax_payable
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND a.code = '2001'  -- Tax Payable
  AND je.reference_type = 'invoice'
ORDER BY je.date DESC
LIMIT 10;


-- ═══════════════════════════════════════════════════════════════
-- TROUBLESHOOTING QUERIES
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- T1. FIND UNBALANCED JOURNAL ENTRIES
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.id,
    je.description,
    je.date,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as imbalance
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY je.id, je.description, je.date
HAVING SUM(jl.debit) != SUM(jl.credit)
ORDER BY je.date DESC;

-- ✅ PASS: No results (all balanced)
-- ❌ FAIL: Shows unbalanced entries


-- ─────────────────────────────────────────────────────────────
-- T2. CHECK FOR NEGATIVE BALANCES (SHOULDN'T HAPPEN)
-- ─────────────────────────────────────────────────────────────
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    balance_amount,
    status
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND (balance_amount < 0 OR paid_amount > total_amount)
ORDER BY created_at DESC;


-- ─────────────────────────────────────────────────────────────
-- T3. CHECK FOR DUPLICATE INVOICE NUMBERS
-- ─────────────────────────────────────────────────────────────
SELECT 
    invoice_number,
    COUNT(*) as duplicate_count
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY invoice_number
HAVING COUNT(*) > 1;


-- ═══════════════════════════════════════════════════════════════
-- CREATE MISSING ACCOUNTS (RUN ONLY IF NEEDED)
-- ═══════════════════════════════════════════════════════════════
-- Uncomment and run if you get "Missing accounts" error

/*
INSERT INTO accounts (business_id, name, code, type) VALUES
('76834d81-ce40-43f5-8082-1e08809663ff', 'Cash', '1001', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Bank Account', '1002', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Accounts Receivable', '1003', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Tax Payable', '2001', 'liability'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Sales', '4001', 'revenue'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Cost of Goods Sold - Raw Materials', '5001', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Cost of Goods Sold - Labor', '5002', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Utilities', '6001', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Rent', '6002', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Transportation', '6003', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Maintenance', '6004', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Office Supplies', '6005', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Marketing', '6006', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Salaries', '6007', 'expense'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Operating Expenses - Miscellaneous', '6008', 'expense')
ON CONFLICT DO NOTHING;
*/
