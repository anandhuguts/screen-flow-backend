# 💳 Payment Recording Verification Guide

## 🎯 Your Business ID
```
76834d81-ce40-43f5-8082-1e08809663ff
```

---

## 📖 How Payment Recording Works

When you record a payment, the system:

1. ✅ **Inserts payment record** → `payments` table
2. ✅ **Creates journal entry** → `journal_entries` + `journal_lines` (automatic!)
3. ✅ **Updates invoice** → `paid_amount`, `balance_amount`, `status`

---

## ⚡ Quick Payment Verification (3 Steps)

### ✅ Step 1: Check Latest Payment Record

```sql
SELECT 
    p.receipt_number,
    p.amount,
    p.payment_method,
    p.payment_date,
    p.status,
    p.created_at,
    i.invoice_number,
    c.name as customer_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN customers c ON p.customer_id = c.id
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY p.created_at DESC
LIMIT 5;
```

**What to check:**
- ✅ `receipt_number` exists and is unique
- ✅ `amount` matches what you recorded
- ✅ `payment_method` is correct (cash, upi, bank-transfer, cheque)
- ✅ `status` = 'completed'

---

### ✅ Step 2: Verify Invoice Updated Correctly

```sql
SELECT 
    i.invoice_number,
    i.total_amount,
    i.paid_amount,
    i.balance_amount,
    i.status,
    (i.paid_amount + i.balance_amount) as calculated_total,
    CASE 
        WHEN i.paid_amount + i.balance_amount = i.total_amount THEN '✅ Correct'
        ELSE '❌ Mismatch'
    END as validation
FROM invoices i
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY i.updated_at DESC
LIMIT 5;
```

**What to check:**
- ✅ `paid_amount` increased by payment amount
- ✅ `balance_amount` decreased by payment amount
- ✅ `paid_amount + balance_amount = total_amount` (always!)
- ✅ Status updated:
  - `pending` → `partially-paid` (if partial payment)
  - `partially-paid` → `paid` (if fully paid)
  - `pending` → `paid` (if full payment in one go)

---

### ✅ Step 3: Check Payment History for Invoice

```sql
SELECT 
    i.invoice_number,
    i.total_amount,
    i.paid_amount,
    i.balance_amount,
    i.status,
    COUNT(p.id) as payment_count,
    SUM(p.amount) as total_payments
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY i.id, i.invoice_number, i.total_amount, i.paid_amount, i.balance_amount, i.status
HAVING COUNT(p.id) > 0
ORDER BY i.updated_at DESC
LIMIT 10;
```

**What to check:**
- ✅ `total_payments` = `paid_amount` (sum of all payments matches invoice paid amount)
- ✅ If `balance_amount = 0`, status should be `paid`

---

## 📊 Payment Scenarios

### Scenario 1: Full Payment

**Example:** Invoice ₹236, Payment ₹236 (Cash)

#### Before Payment:
```
Invoice:
  total_amount: ₹236
  paid_amount: ₹0
  balance_amount: ₹236
  status: pending
```

#### After Payment:
```
Payment Record:
  receipt_number: RCPT-2026-XXXXXXXXXX
  amount: ₹236
  payment_method: cash

Invoice Updated:
  total_amount: ₹236
  paid_amount: ₹236
  balance_amount: ₹0
  status: paid  ← Changed!
```

---

### Scenario 2: Partial Payment

**Example:** Invoice ₹236, Payment ₹100 (UPI)

#### Before Payment:
```
Invoice:
  total_amount: ₹236
  paid_amount: ₹0
  balance_amount: ₹236
  status: pending
```

#### After Payment:
```
Payment Record:
  receipt_number: RCPT-2026-XXXXXXXXXX
  amount: ₹100
  payment_method: upi

Invoice Updated:
  total_amount: ₹236
  paid_amount: ₹100
  balance_amount: ₹136
  status: partially-paid  ← Changed!
```

---

### Scenario 3: Multiple Partial Payments

**Example:** Invoice ₹236, Payment 1: ₹100, Payment 2: ₹136

#### After 1st Payment (₹100):
```
Invoice:
  paid_amount: ₹100
  balance_amount: ₹136
  status: partially-paid
  
Payments: 1 record
```

#### After 2nd Payment (₹136):
```
Invoice:
  paid_amount: ₹236
  balance_amount: ₹0
  status: paid  ← Changed!
  
Payments: 2 records
```

---

## ⚠️ IMPORTANT: Missing Journal Entries

### Current Behavior

The `recordPayment` function **does NOT create journal entries**. This means:

- ❌ Cash/Bank balances are not updated in accounting
- ❌ Accounts Receivable is not reduced in accounting
- ❌ Reports may not reflect actual cash position

### What SHOULD Happen

When payment is recorded, this journal entry should be created:

#### For Cash Payment (₹236):
```
Debit:  Cash (1001)                  ₹236
Credit: Accounts Receivable (1003)   ₹236
```

#### For Bank/UPI/Cheque Payment (₹236):
```
Debit:  Bank Account (1002)          ₹236
Credit: Accounts Receivable (1003)   ₹236
```

**Meaning:**
- Cash/Bank increases (you received money)
- AR decreases (customer no longer owes you)

---

## 🔍 Detailed Verification Queries

### Query 1: Payment Details for Specific Invoice

Replace `INV-2026-XXXXXXXXXX` with your invoice number:

```sql
SELECT 
    p.receipt_number,
    p.amount,
    p.payment_method,
    p.payment_date,
    p.reference,
    p.created_at,
    i.invoice_number,
    i.total_amount,
    i.paid_amount,
    i.balance_amount
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE i.invoice_number = 'INV-2026-XXXXXXXXXX'
ORDER BY p.created_at;
```

---

### Query 2: Customer Payment History

```sql
SELECT 
    c.name as customer_name,
    COUNT(DISTINCT i.id) as invoice_count,
    SUM(i.total_amount) as total_invoiced,
    SUM(i.paid_amount) as total_paid,
    SUM(i.balance_amount) as total_outstanding,
    COUNT(p.id) as payment_count,
    SUM(p.amount) as total_payments_received
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE c.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT i.id) > 0
ORDER BY total_outstanding DESC;
```

---

### Query 3: Payment Method Breakdown

```sql
SELECT 
    payment_method,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM payments
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY payment_method
ORDER BY total_amount DESC;
```

---

### Query 4: Recent Payments with Full Details

```sql
SELECT 
    p.receipt_number,
    p.amount,
    p.payment_method,
    TO_CHAR(p.payment_date, 'DD-Mon-YYYY') as payment_date,
    i.invoice_number,
    c.name as customer,
    i.balance_amount as remaining_balance,
    CASE 
        WHEN i.balance_amount = 0 THEN '✅ Fully Paid'
        WHEN i.paid_amount > 0 THEN '⏳ Partially Paid'
        ELSE '❌ Unpaid'
    END as payment_status
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN customers c ON p.customer_id = c.id
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY p.created_at DESC
LIMIT 20;
```

---

### Query 5: Find Overpayments (Data Integrity Check)

```sql
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    balance_amount,
    (paid_amount - total_amount) as overpayment_amount
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND paid_amount > total_amount
ORDER BY overpayment_amount DESC;
```

**Expected:** No results (overpayments should be prevented)

---

### Query 6: Find Negative Balances (Data Integrity Check)

```sql
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    balance_amount
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND balance_amount < 0
ORDER BY balance_amount;
```

**Expected:** No results (negative balances shouldn't happen)

---

### Query 7: Invoice Payment Timeline

```sql
WITH payment_timeline AS (
    SELECT 
        i.invoice_number,
        i.total_amount,
        i.created_at as invoice_date,
        p.receipt_number,
        p.amount as payment_amount,
        p.payment_date,
        p.payment_method,
        SUM(p.amount) OVER (
            PARTITION BY i.id 
            ORDER BY p.created_at
        ) as cumulative_paid
    FROM invoices i
    LEFT JOIN payments p ON i.id = p.invoice_id
    WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
)
SELECT 
    invoice_number,
    total_amount,
    TO_CHAR(invoice_date, 'DD-Mon-YYYY') as invoice_date,
    receipt_number,
    payment_amount,
    TO_CHAR(payment_date, 'DD-Mon-YYYY') as payment_date,
    payment_method,
    cumulative_paid,
    (total_amount - cumulative_paid) as remaining_balance
FROM payment_timeline
ORDER BY invoice_date DESC, payment_date;
```

---

### Query 8: Payments by Date Range

```sql
SELECT 
    DATE(p.payment_date) as payment_date,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_collected,
    STRING_AGG(p.payment_method, ', ') as methods_used
FROM payments p
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND p.payment_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(p.payment_date)
ORDER BY payment_date DESC;
```

---

## 🔧 Troubleshooting

### Issue 1: Payment Record Created but Invoice Not Updated

**Check:**
```sql
SELECT 
    p.receipt_number,
    p.amount,
    i.invoice_number,
    i.paid_amount,
    i.balance_amount
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY p.created_at DESC
LIMIT 5;
```

**Fix:** This would indicate a bug in the update logic (lines 269-277 in invoiceController.js)

---

### Issue 2: Duplicate Receipt Numbers

**Check:**
```sql
SELECT 
    receipt_number,
    COUNT(*) as duplicate_count
FROM payments
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY receipt_number
HAVING COUNT(*) > 1;
```

**Expected:** No results

---

## 📈 Accounting in Action

## ✅ Verification Checklist

After recording a payment:

- [ ] Payment record exists in `payments` table
- [ ] Receipt number is unique
- [ ] Invoice `paid_amount` increased correctly
- [ ] Invoice `balance_amount` decreased correctly
- [ ] Invoice `status` updated (pending → partially-paid → paid)
- [ ] `paid_amount + balance_amount = total_amount`
- [ ] No overpayments (paid_amount ≤ total_amount)
- [ ] No negative balances

---

**For quick checks, see:** `database/verify_payment_queries.sql` (next file)
