-- ═══════════════════════════════════════════════════════════════
-- PAYMENT VERIFICATION QUERIES
-- Business ID: 76834d81-ce40-43f5-8082-1e08809663ff
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- ⚡ QUICK 3-STEP VERIFICATION (Run these after payment)
-- ─────────────────────────────────────────────────────────────

-- ✅ STEP 1: CHECK LATEST PAYMENT RECORD
-- ─────────────────────────────────────────────────────────────
SELECT 
    p.amount,
    p.payment_method,
    p.payment_date,
    p.reference,
    p.created_at,
    i.invoice_number,
    c.name as customer_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN customers c ON p.customer_id = c.id
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY p.created_at DESC
LIMIT 1;


-- ✅ STEP 2: VERIFY INVOICE UPDATED CORRECTLY
-- ─────────────────────────────────────────────────────────────
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    balance_amount,
    status,
    (paid_amount + balance_amount) as should_equal_total,
    CASE 
        WHEN paid_amount + balance_amount = total_amount THEN '✅ Correct'
        ELSE '❌ MISMATCH!'
    END as validation
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY updated_at DESC
LIMIT 1;

-- Expected:
-- ✅ paid_amount increased
-- ✅ balance_amount decreased
-- ✅ status changed (pending → partially-paid OR paid)
-- ✅ validation = '✅ Correct'


-- ✅ STEP 3: CHECK PAYMENT JOURNAL ENTRY
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
  AND je.reference_type = 'payment'
ORDER BY je.created_at DESC
LIMIT 2;

-- Expected for Cash Payment:
-- 1001 (Cash)                  | DEBIT  | [amount]
-- 1003 (Accounts Receivable)   | CREDIT | [amount]

-- Expected for UPI/Bank/Cheque Payment:
-- 1002 (Bank Account)          | DEBIT  | [amount]
-- 1003 (Accounts Receivable)   | CREDIT | [amount]


-- ✅ STEP 4: VERIFY PAYMENT JOURNAL IS BALANCED
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.description,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'payment'
GROUP BY je.id, je.description
ORDER BY je.created_at DESC
LIMIT 1;

-- Expected:
-- difference = 0 ✅


-- ═══════════════════════════════════════════════════════════════
-- DETAILED PAYMENT ANALYSIS QUERIES
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. COMPLETE PAYMENT HISTORY (Last 10)
-- ─────────────────────────────────────────────────────────────
SELECT 
    p.amount,
    p.payment_method,
    TO_CHAR(p.payment_date, 'DD-Mon-YYYY') as payment_date,
    p.reference,
    i.invoice_number,
    c.name as customer,
    i.total_amount as invoice_total,
    i.paid_amount as invoice_paid,
    i.balance_amount as invoice_balance,
    i.status as invoice_status
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN customers c ON p.customer_id = c.id
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY p.created_at DESC
LIMIT 10;


-- ─────────────────────────────────────────────────────────────
-- 2. PAYMENTS FOR SPECIFIC INVOICE
-- Replace 'INV-2026-XXXXXXXXXX' with actual invoice number
-- ─────────────────────────────────────────────────────────────
SELECT 
    p.amount,
    p.payment_method,
    p.payment_date,
    p.reference,
    p.created_at,
    SUM(p.amount) OVER (ORDER BY p.created_at) as cumulative_paid
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE i.invoice_number = 'INV-2026-1768537237290'  -- REPLACE THIS
ORDER BY p.created_at;


-- ─────────────────────────────────────────────────────────────
-- 3. PAYMENT METHOD BREAKDOWN
-- ─────────────────────────────────────────────────────────────
SELECT 
    payment_method,
    COUNT(*) as payment_count,
    SUM(amount) as total_collected,
    AVG(amount) as average_payment,
    MIN(amount) as smallest_payment,
    MAX(amount) as largest_payment
FROM payments
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY payment_method
ORDER BY total_collected DESC;


-- ─────────────────────────────────────────────────────────────
-- 4. CUSTOMER PAYMENT SUMMARY
-- ─────────────────────────────────────────────────────────────
SELECT 
    c.name as customer_name,
    COUNT(DISTINCT i.id) as total_invoices,
    SUM(i.total_amount) as total_invoiced,
    SUM(i.paid_amount) as total_paid,
    SUM(i.balance_amount) as total_outstanding,
    COUNT(p.id) as payment_count,
    ROUND((SUM(i.paid_amount) / NULLIF(SUM(i.total_amount), 0) * 100), 2) as payment_percentage
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE c.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT i.id) > 0
ORDER BY total_outstanding DESC;


-- ─────────────────────────────────────────────────────────────
-- 5. DAILY PAYMENT COLLECTION (Last 30 days)
-- ─────────────────────────────────────────────────────────────
SELECT 
    DATE(payment_date) as date,
    COUNT(*) as payment_count,
    SUM(amount) as total_collected,
    STRING_AGG(DISTINCT payment_method, ', ') as methods_used
FROM payments
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND payment_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(payment_date)
ORDER BY date DESC;


-- ─────────────────────────────────────────────────────────────
-- 6. INVOICE PAYMENT TIMELINE
-- ─────────────────────────────────────────────────────────────
SELECT 
    i.invoice_number,
    i.total_amount,
    TO_CHAR(i.created_at, 'DD-Mon-YYYY') as invoice_date,
    TO_CHAR(i.due_date, 'DD-Mon-YYYY') as due_date,
    p.amount as payment_amount,
    TO_CHAR(p.payment_date, 'DD-Mon-YYYY') as payment_date,
    p.payment_method,
    i.status,
    CASE 
        WHEN i.balance_amount = 0 THEN '✅ Paid'
        WHEN p.payment_date > i.due_date THEN '⚠️ Late Payment'
        WHEN i.paid_amount > 0 THEN '⏳ Partial'
        ELSE '❌ Unpaid'
    END as payment_status
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY i.created_at DESC, p.created_at
LIMIT 20;


-- ─────────────────────────────────────────────────────────────
-- 7. CASH vs BANK BALANCE FROM PAYMENTS
-- ─────────────────────────────────────────────────────────────
SELECT 
    CASE 
        WHEN payment_method = 'cash' THEN 'Cash (1001)'
        ELSE 'Bank Account (1002)'
    END as account,
    SUM(amount) as total_received
FROM payments
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY 
    CASE 
        WHEN payment_method = 'cash' THEN 'Cash (1001)'
        ELSE 'Bank Account (1002)'
    END
ORDER BY total_received DESC;


-- ─────────────────────────────────────────────────────────────
-- 8. ACCOUNTS RECEIVABLE BALANCE (From Invoices)
-- ─────────────────────────────────────────────────────────────
SELECT 
    SUM(balance_amount) as total_accounts_receivable,
    COUNT(*) as invoices_with_balance,
    AVG(balance_amount) as average_outstanding
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND balance_amount > 0;


-- ─────────────────────────────────────────────────────────────
-- 9. AR BALANCE FROM JOURNAL ENTRIES (Accounting Ledger)
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
  AND a.code IN ('1001', '1002', '1003')  -- Cash, Bank, AR
GROUP BY a.code, a.name
ORDER BY a.code;

-- Expected:
-- 1001 (Cash) = Sum of all cash payments received
-- 1002 (Bank) = Sum of all bank/upi/cheque payments
-- 1003 (AR)   = Outstanding invoices balance


-- ─────────────────────────────────────────────────────────────
-- 10. COMPLETE INVOICE + PAYMENT + JOURNAL VIEW
-- ─────────────────────────────────────────────────────────────
WITH invoice_data AS (
    SELECT 
        i.invoice_number,
        i.total_amount,
        i.paid_amount,
        i.balance_amount,
        i.status
    FROM invoices i
    WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
    ORDER BY i.created_at DESC
    LIMIT 1
),
payment_data AS (
    SELECT 
        p.amount,
        p.payment_method,
        i.invoice_number
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
    ORDER BY p.created_at DESC
    LIMIT 1
),
journal_data AS (
    SELECT 
        a.code,
        a.name,
        jl.debit,
        jl.credit
    FROM journal_entries je
    JOIN journal_lines jl ON je.id = jl.journal_entry_id
    JOIN accounts a ON jl.account_id = a.id
    WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND je.reference_type = 'payment'
    ORDER BY je.created_at DESC
    LIMIT 2
)
SELECT 'Invoice' as record_type, invoice_number as detail, total_amount as amount 
FROM invoice_data
UNION ALL
SELECT 'Payment', payment_method, amount 
FROM payment_data
UNION ALL
SELECT 'Journal', code || ' - ' || name, COALESCE(debit, credit) 
FROM journal_data;


-- ═══════════════════════════════════════════════════════════════
-- DATA INTEGRITY CHECKS
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- CHECK 1: FIND OVERPAYMENTS
-- ─────────────────────────────────────────────────────────────
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    (paid_amount - total_amount) as overpayment
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND paid_amount > total_amount;

-- Expected: No results ✅


-- ─────────────────────────────────────────────────────────────
-- CHECK 2: FIND NEGATIVE BALANCES
-- ─────────────────────────────────────────────────────────────
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    balance_amount
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND balance_amount < 0;

-- Expected: No results ✅


-- ─────────────────────────────────────────────────────────────
-- CHECK 3: VERIFY PAID_AMOUNT MATCHES PAYMENT RECORDS
-- ─────────────────────────────────────────────────────────────
SELECT 
    i.invoice_number,
    i.paid_amount as invoice_paid_amount,
    COALESCE(SUM(p.amount), 0) as sum_of_payments,
    i.paid_amount - COALESCE(SUM(p.amount), 0) as difference
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND i.paid_amount > 0
GROUP BY i.id, i.invoice_number, i.paid_amount
HAVING i.paid_amount != COALESCE(SUM(p.amount), 0);

-- Expected: No results ✅
-- If results exist, there's a data inconsistency!


-- ─────────────────────────────────────────────────────────────
-- CHECK 4: FIND UNBALANCED PAYMENT JOURNALS
-- ─────────────────────────────────────────────────────────────
SELECT 
    je.description,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as imbalance
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'payment'
GROUP BY je.id, je.description
HAVING SUM(jl.debit) != SUM(jl.credit);

-- Expected: No results ✅


-- ─────────────────────────────────────────────────────────────
-- CHECK 5: PAYMENTS WITHOUT JOURNAL ENTRIES
-- ─────────────────────────────────────────────────────────────
SELECT 
    i.invoice_number,
    p.amount,
    p.payment_date,
    p.created_at
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
LEFT JOIN journal_entries je ON je.reference_id = p.invoice_id 
    AND je.reference_type = 'payment'
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.id IS NULL
ORDER BY p.created_at DESC;

-- Expected: No results ✅
-- If results exist, journal entry creation failed!


-- ═══════════════════════════════════════════════════════════════
-- ACCOUNTING REPORTS
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- REPORT 1: CASH FLOW SUMMARY
-- ─────────────────────────────────────────────────────────────
WITH cash_inflows AS (
    SELECT SUM(amount) as total
    FROM payments
    WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND payment_method = 'cash'
),
bank_inflows AS (
    SELECT SUM(amount) as total
    FROM payments
    WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
      AND payment_method IN ('upi', 'bank-transfer', 'cheque')
)
SELECT 
    'Cash Collected' as category,
    COALESCE((SELECT total FROM cash_inflows), 0) as amount
UNION ALL
SELECT 
    'Bank Collected',
    COALESCE((SELECT total FROM bank_inflows), 0);


-- ─────────────────────────────────────────────────────────────
-- REPORT 2: ACCOUNTS RECEIVABLE AGING
-- ─────────────────────────────────────────────────────────────
SELECT 
    CASE 
        WHEN CURRENT_DATE - due_date <= 0 THEN '✅ Not Yet Due'
        WHEN CURRENT_DATE - due_date <= 30 THEN '⚠️ 0-30 Days Overdue'
        WHEN CURRENT_DATE - due_date <= 60 THEN '🔴 31-60 Days Overdue'
        ELSE '🚨 60+ Days Overdue'
    END as aging_bucket,
    COUNT(*) as invoice_count,
    SUM(balance_amount) as total_outstanding
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND balance_amount > 0
GROUP BY aging_bucket
ORDER BY 
    CASE 
        WHEN CURRENT_DATE - due_date <= 0 THEN 1
        WHEN CURRENT_DATE - due_date <= 30 THEN 2
        WHEN CURRENT_DATE - due_date <= 60 THEN 3
        ELSE 4
    END;


-- ═══════════════════════════════════════════════════════════════
-- END OF PAYMENT VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════
