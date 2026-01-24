# ⚡ Quick Invoice Verification

**Your Business ID:** `76834d81-ce40-43f5-8082-1e08809663ff`

---

## 🎯 5-Minute Check After Creating Invoice

### ✅ Step 1: Check Latest Invoice

```sql
SELECT 
    invoice_number,
    total_amount,
    status,
    created_at
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** Shows your new invoice with status = 'pending'

---

### ✅ Step 2: Verify Journal Entry Exists

```sql
SELECT 
    a.code,
    a.name,
    jl.debit,
    jl.credit
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'invoice'
ORDER BY je.created_at DESC
LIMIT 3;
```

**Expected:** 3 rows showing:
- `1003` (AR) with **DEBIT** = total amount
- `4001` (Sales) with **CREDIT** = subtotal
- `2001` (Tax) with **CREDIT** = tax amount

---

### ✅ Step 3: Verify Balance

```sql
SELECT 
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'invoice'
ORDER BY je.created_at DESC
LIMIT 1;
```

**Expected:** `difference` = **0** (if not zero, there's a bug!)

---

## 🔧 Common Issues

### ❌ Error: "Missing accounts: 1003, 4001, 2001"

**Fix:** Run this SQL:

```sql
INSERT INTO accounts (business_id, name, code, type) VALUES
('76834d81-ce40-43f5-8082-1e08809663ff', 'Accounts Receivable', '1003', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Sales', '4001', 'revenue'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Tax Payable', '2001', 'liability')
ON CONFLICT DO NOTHING;
```

---

### ❌ Invoice Created but No Journal Entry

**Check:**
```sql
SELECT invoice_number
FROM invoices i
LEFT JOIN journal_entries je ON je.reference_id = i.id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.id IS NULL;
```

**Fix:** Check server logs for errors. Journal creation is non-blocking.

---

## 📊 What Your Invoice Should Look Like

### Invoice Table:
```
invoice_number: INV-2026-1737006053000
status: pending
subtotal: 10000
tax_amount: 1800
total_amount: 11800
paid_amount: 0
balance_amount: 11800
```

### Journal Entry:
```
Account Code | Account Name          | Debit  | Credit
─────────────────────────────────────────────────────
1003         | Accounts Receivable   | 11800  | 0
4001         | Sales                 | 0      | 10000
2001         | Tax Payable           | 0      | 1800
─────────────────────────────────────────────────────
TOTAL                                 | 11800  | 11800  ✓
```

---

## 🚀 Quick Test

Run this complete check:

```sql
-- Get the latest invoice with its journal entry
WITH latest_invoice AS (
    SELECT id, invoice_number, total_amount, subtotal, tax_amount
    FROM invoices
    WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'Invoice' as type,
    li.invoice_number as reference,
    li.total_amount as amount
FROM latest_invoice li

UNION ALL

SELECT 
    'Journal' as type,
    a.code || ' - ' || a.name as reference,
    COALESCE(jl.debit, jl.credit) as amount
FROM latest_invoice li
JOIN journal_entries je ON je.reference_id = li.id
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id;
```

**Expected Output:**
```
type    | reference                | amount
─────────────────────────────────────────────
Invoice | INV-2026-XXX             | 11800
Journal | 1003 - Accounts Rec...   | 11800
Journal | 4001 - Sales             | 10000
Journal | 2001 - Tax Payable       | 1800
```

---

## 📞 Need More Help?

- **Full Guide:** See `INVOICE_VERIFICATION_GUIDE.md`
- **All Queries:** See `database/verify_invoice_queries.sql`
- **System Flow:** See `SYSTEM_FLOW_GUIDE.md`
- **Code:** See `controllers/invoiceController.js` (lines 148-166)

---

**✅ If all 3 steps pass → Your invoice system is working correctly!**
