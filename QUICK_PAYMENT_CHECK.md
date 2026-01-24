# ⚡ Quick Payment Verification

**Your Business ID:** `76834d81-ce40-43f5-8082-1e08809663ff`

---

## 🎯 4-Step Check After Recording Payment

### ✅ Step 1: Check Payment Record

```sql
SELECT 
    p.amount,
    p.payment_method,
    p.payment_date,
    i.invoice_number,
    c.name as customer_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN customers c ON p.customer_id = c.id
WHERE p.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY p.created_at DESC
LIMIT 1;
```

**Expected:** Shows your latest payment record

---

### ✅ Step 2: Verify Invoice Updated

```sql
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    balance_amount,
    status,
    (paid_amount + balance_amount) as should_equal_total
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY updated_at DESC
LIMIT 1;
```

**What to check:**
- ✅ `paid_amount` increased by payment amount
- ✅ `balance_amount` decreased by payment amount
- ✅ `should_equal_total` = `total_amount` (always!)
- ✅ `status` changed:
  - `pending` → `partially-paid` (if partial)
  - `partially-paid` → `paid` (if fully paid)
  - `pending` → `paid` (if full payment)

---

### ✅ Step 3: Check Journal Entry Exists

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
  AND je.reference_type = 'payment'
ORDER BY je.created_at DESC
LIMIT 2;
```

**Expected for Cash Payment:**
- `1001` (Cash) - **DEBIT** = payment amount
- `1003` (Accounts Receivable) - **CREDIT** = payment amount

**Expected for UPI/Bank/Cheque:**
- `1002` (Bank Account) - **DEBIT** = payment amount
- `1003` (Accounts Receivable) - **CREDIT** = payment amount

---

### ✅ Step 4: Verify Journal Balanced

```sql
SELECT 
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'payment'
ORDER BY je.created_at DESC
LIMIT 1;
```

**Expected:** `difference` = **0** (if not, there's a bug!)

---

## 💡 What Payment Recording Does

### Example: Customer pays ₹236 in Cash

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
Payment Record Created:
  amount: ₹236
  payment_method: cash

Invoice Updated:
  paid_amount: ₹236
  balance_amount: ₹0
  status: paid  ← Changed!

Journal Entry Created:
  Debit:  Cash (1001)                  ₹236
  Credit: Accounts Receivable (1003)   ₹236
```

**Meaning:**
- Your cash increased by ₹236
- Customer no longer owes you (AR decreased)

---

## 📊 Payment Status Flow

```
pending
  ↓ (receive partial payment)
partially-paid
  ↓ (receive remaining payment)
paid ✅
```

---

## 🔍 Common Checks

### Check All Payments for an Invoice:

```sql
-- Replace invoice number
SELECT 
    p.amount,
    p.payment_method,
    p.payment_date,
    SUM(p.amount) OVER (ORDER BY p.created_at) as cumulative_paid
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE i.invoice_number = 'INV-2026-1768537237290'
ORDER BY p.created_at;
```

---

### Check Total Cash vs Bank Collected:

```sql
SELECT 
    CASE 
        WHEN payment_method = 'cash' THEN 'Cash'
        ELSE 'Bank'
    END as account,
    SUM(amount) as total_received
FROM payments
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY 
    CASE WHEN payment_method = 'cash' THEN 'Cash' ELSE 'Bank' END;
```

---

### Check Outstanding Balance (AR):

```sql
SELECT 
    SUM(balance_amount) as total_outstanding,
    COUNT(*) as invoices_pending_payment
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND balance_amount > 0;
```

---

## 🚨 Data Integrity Checks

### Find Overpayments (Shouldn't exist):

```sql
SELECT invoice_number, total_amount, paid_amount
FROM invoices
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND paid_amount > total_amount;
```

**Expected:** No results ✅

---

### Verify Payment Sum Matches Invoice:

```sql
SELECT 
    i.invoice_number,
    i.paid_amount as invoice_says,
    SUM(p.amount) as sum_of_payments,
    i.paid_amount - SUM(p.amount) as difference
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND i.paid_amount > 0
GROUP BY i.id, i.invoice_number, i.paid_amount
HAVING i.paid_amount != SUM(p.amount);
```

**Expected:** No results ✅

---

## 📈 Accounting Impact

### Before Payment (Invoice Created):
```
DR  Accounts Receivable (1003)   ₹236
CR  Sales (4001)                  ₹200
CR  Tax Payable (2001)            ₹36
```

**After Cash Payment:**
```
DR  Cash (1001)                   ₹236
CR  Accounts Receivable (1003)    ₹236
```

**Net Effect:**
- Cash increased: +₹236
- AR decreased: -₹236
- AR is now: ₹0

---

## 📚 Full Documentation

- **All Payment Queries:** `database/verify_payment_queries.sql`
- **Payment Guide:** `PAYMENT_VERIFICATION_GUIDE.md`
- **System Flow:** `SYSTEM_FLOW_GUIDE.md`

---

**✅ If all 4 steps pass → Your payment system works perfectly!**
