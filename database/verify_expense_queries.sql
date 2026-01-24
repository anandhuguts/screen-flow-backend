-- ═══════════════════════════════════════════════════════════════
-- EXPENSE VERIFICATION QUERIES
-- Business ID: 76834d81-ce40-43f5-8082-1e08809663ff
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- ⚡ QUICK 4-STEP VERIFICATION (Run these after creating expense)
-- ─────────────────────────────────────────────────────────────

-- ✅ STEP 1: CHECK LATEST EXPENSE RECORD
-- ─────────────────────────────────────────────────────────────
SELECT 
    expense_number,
    category,
    vendor_name,
    amount,
    payment_mode,
    status,
    expense_date,
    created_at
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: Shows your expense with status = 'pending'


-- ✅ STEP 2: CHECK JOURNAL ENTRY EXISTS
-- ─────────────────────────────────────────────────────────────
SELECT 
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
  AND je.reference_type = 'expense'
ORDER BY je.created_at DESC
LIMIT 2;

-- Expected for your ₹500 cash expense (category: other):
-- 6008 (Operating Expenses - Miscellaneous)  | DEBIT  | 500
-- 1001 (Cash)                                 | CREDIT | 500


-- ✅ STEP 3: VERIFY JOURNAL BALANCED
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.description,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'expense'
GROUP BY je.id, je.description
ORDER BY je.created_at DESC
LIMIT 1;

-- Expected: difference = 0 ✅


-- ✅ STEP 4: CHECK EXPENSE WITH JOURNAL ENTRY
-- ─────────────────────────────────────────────────────────────
SELECT 
    e.expense_number,
    e.amount,
    e.category,
    e.status,
    CASE WHEN je.id IS NOT NULL THEN '✅ Journal Created' ELSE '❌ No Journal' END as journal_status
FROM expenses e
LEFT JOIN journal_entries je ON je.reference_id = e.id AND je.reference_type = 'expense'
WHERE e.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY e.created_at DESC
LIMIT 5;

-- Expected: Journal status should be '✅ Journal Created'


-- ═══════════════════════════════════════════════════════════════
-- DETAILED EXPENSE ANALYSIS QUERIES
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. COMPLETE EXPENSE HISTORY (Last 20)
-- ─────────────────────────────────────────────────────────────
SELECT 
    expense_number,
    category,
    vendor_name,
    amount,
    payment_mode,
    status,
    TO_CHAR(expense_date, 'DD-Mon-YYYY') as expense_date,
    reference,
    notes
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY expense_date DESC, created_at DESC
LIMIT 20;


-- ─────────────────────────────────────────────────────────────
-- 2. EXPENSES BY CATEGORY
-- ─────────────────────────────────────────────────────────────
SELECT 
    category,
    COUNT(*) as expense_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as smallest_expense,
    MAX(amount) as largest_expense
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY category
ORDER BY total_amount DESC;


-- ─────────────────────────────────────────────────────────────
-- 3. EXPENSES BY STATUS
-- ─────────────────────────────────────────────────────────────
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'paid' THEN 3
        WHEN 'rejected' THEN 4
    END;


-- ─────────────────────────────────────────────────────────────
-- 4. EXPENSES BY PAYMENT MODE
-- ─────────────────────────────────────────────────────────────
SELECT 
    payment_mode,
    COUNT(*) as expense_count,
    SUM(amount) as total_spent
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY payment_mode
ORDER BY total_spent DESC;


-- ─────────────────────────────────────────────────────────────
-- 5. MONTHLY EXPENSE SUMMARY
-- ─────────────────────────────────────────────────────────────
SELECT 
    TO_CHAR(expense_date, 'YYYY-MM') as month,
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
ORDER BY month DESC
LIMIT 12;


-- ─────────────────────────────────────────────────────────────
-- 6. EXPENSES BY VENDOR
-- ─────────────────────────────────────────────────────────────
SELECT 
    vendor_name,
    COUNT(*) as transaction_count,
    SUM(amount) as total_paid,
    AVG(amount) as average_transaction
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY vendor_name
ORDER BY total_paid DESC
LIMIT 20;


-- ─────────────────────────────────────────────────────────────
-- 7. PENDING EXPENSES (NEEDS APPROVAL)
-- ─────────────────────────────────────────────────────────────
SELECT 
    expense_number,
    vendor_name,
    category,
    amount,
    description,
    TO_CHAR(expense_date, 'DD-Mon-YYYY') as expense_date,
    TO_CHAR(created_at, 'DD-Mon-YYYY HH24:MI') as submitted_at
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND status = 'pending'
ORDER BY created_at ASC;


-- ─────────────────────────────────────────────────────────────
-- 8. CASH vs BANK EXPENSES
-- ─────────────────────────────────────────────────────────────
SELECT 
    CASE 
        WHEN payment_mode = 'cash' THEN 'Cash (1001)'
        ELSE 'Bank (1002)'
    END as account,
    COUNT(*) as expense_count,
    SUM(amount) as total_spent
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY 
    CASE 
        WHEN payment_mode = 'cash' THEN 'Cash (1001)'
        ELSE 'Bank (1002)'
    END
ORDER BY total_spent DESC;


-- ─────────────────────────────────────────────────────────────
-- 9. EXPENSE ACCOUNT BALANCES (From Journal)
-- ─────────────────────────────────────────────────────────────
SELECT 
    a.code,
    a.name,
    SUM(jl.debit - jl.credit) as balance,
    COUNT(jl.id) as transaction_count
FROM journal_lines jl
JOIN accounts a ON jl.account_id = a.id
JOIN journal_entries je ON jl.journal_entry_id = je.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND a.code LIKE '5%' OR a.code LIKE '6%'  -- Expense accounts
GROUP BY a.code, a.name
HAVING SUM(jl.debit - jl.credit) > 0
ORDER BY a.code;

-- Shows total expenses by account from accounting perspective


-- ─────────────────────────────────────────────────────────────
-- 10. CASH & BANK BALANCES (After Expenses)
-- ─────────────────────────────────────────────────────────────
SELECT 
    a.code,
    a.name,
    SUM(jl.debit - jl.credit) as balance
FROM journal_lines jl
JOIN accounts a ON jl.account_id = a.id
JOIN journal_entries je ON jl.journal_entry_id = je.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND a.code IN ('1001', '1002')  -- Cash and Bank
GROUP BY a.code, a.name
ORDER BY a.code;

-- Shows how much cash/bank you have left after expenses


-- ═══════════════════════════════════════════════════════════════
-- EXPENSE CATEGORY TO ACCOUNT MAPPING
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 11. VERIFY CATEGORY MAPPINGS
-- ─────────────────────────────────────────────────────────────
SELECT 
    e.category,
    e.amount,
    a.code as account_code,
    a.name as account_name,
    jl.debit
FROM expenses e
JOIN journal_entries je ON je.reference_id = e.id AND je.reference_type = 'expense'
JOIN journal_lines jl ON je.id = jl.journal_entry_id AND jl.debit > 0
JOIN accounts a ON jl.account_id = a.id
WHERE e.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY e.created_at DESC
LIMIT 10;

-- Shows which expense category mapped to which account


-- ═══════════════════════════════════════════════════════════════
-- DATA INTEGRITY CHECKS
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- CHECK 1: EXPENSES WITHOUT JOURNAL ENTRIES
-- ─────────────────────────────────────────────────────────────
SELECT 
    e.expense_number,
    e.amount,
    e.category,
    e.status,
    e.created_at
FROM expenses e
LEFT JOIN journal_entries je ON je.reference_id = e.id AND je.reference_type = 'expense'
WHERE e.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.id IS NULL
ORDER BY e.created_at DESC;

-- Expected: No results ✅
-- If results exist, journal entry creation failed!


-- ─────────────────────────────────────────────────────────────
-- CHECK 2: UNBALANCED EXPENSE JOURNALS
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.description,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as imbalance
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'expense'
GROUP BY je.id, je.description
HAVING SUM(jl.debit) != SUM(jl.credit);

-- Expected: No results ✅


-- ─────────────────────────────────────────────────────────────
-- CHECK 3: NEGATIVE EXPENSE AMOUNTS
-- ─────────────────────────────────────────────────────────────
SELECT 
    expense_number,
    amount,
    vendor_name
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND amount <= 0;

-- Expected: No results ✅


-- ═══════════════════════════════════════════════════════════════
-- COMPLETE TRANSACTION VIEW
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 12. LATEST EXPENSE WITH FULL DETAILS
-- ─────────────────────────────────────────────────────────────
WITH latest_expense AS (
    SELECT 
        id,
        expense_number,
        category,
        vendor_name,
        amount,
        description,
        payment_mode,
        status
    FROM expenses
    WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'Expense Record' as record_type,
    le.expense_number as detail,
    le.amount as value
FROM latest_expense le

UNION ALL

SELECT 
    'Category',
    le.category,
    NULL
FROM latest_expense le

UNION ALL

SELECT 
    'Vendor',
    le.vendor_name,
    NULL
FROM latest_expense le

UNION ALL

SELECT 
    'Journal Entry',
    a.code || ' - ' || a.name,
    COALESCE(jl.debit, jl.credit)
FROM latest_expense le
JOIN journal_entries je ON je.reference_id = le.id AND je.reference_type = 'expense'
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id;


-- ═══════════════════════════════════════════════════════════════
-- ACCOUNTING REPORTS
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- REPORT 1: TOTAL EXPENSES BY TYPE
-- ─────────────────────────────────────────────────────────────
WITH expense_types AS (
    SELECT 
        CASE 
            WHEN category IN ('raw-materials', 'labor') THEN 'Cost of Goods Sold'
            ELSE 'Operating Expenses'
        END as expense_type,
        category,
        amount
    FROM expenses
    WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND status IN ('pending', 'approved', 'paid')
)
SELECT 
    expense_type,
    COUNT(*) as expense_count,
    SUM(amount) as total_amount
FROM expense_types
GROUP BY expense_type
ORDER BY total_amount DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 2: PROFIT & LOSS (Revenue vs Expenses)
-- ─────────────────────────────────────────────────────────────
WITH revenue AS (
    SELECT COALESCE(SUM(jl.credit - jl.debit), 0) as total
    FROM journal_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND a.code = '4001'  -- Sales
),
expenses AS (
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as total
    FROM journal_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND (a.code LIKE '5%' OR a.code LIKE '6%')  -- All expenses
)
SELECT 
    'Revenue' as category,
    (SELECT total FROM revenue) as amount
UNION ALL
SELECT 
    'Expenses',
    (SELECT total FROM expenses)
UNION ALL
SELECT 
    'Net Profit/Loss',
    (SELECT total FROM revenue) - (SELECT total FROM expenses);


-- ═══════════════════════════════════════════════════════════════
-- END OF EXPENSE VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════
