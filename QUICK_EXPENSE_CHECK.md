# ⚡ Quick Expense Verification

**Your Business ID:** `76834d81-ce40-43f5-8082-1e08809663ff`

---

## 🎯 4-Step Check After Creating Expense

### Your Expense Details:
```
Category: other
Vendor: supllier 1
Amount: ₹500
Payment Mode: cash
Status: pending
```

---

### ✅ Step 1: Check Expense Record

```sql
SELECT 
    expense_number,
    category,
    vendor_name,
    amount,
    payment_mode,
    status
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** Shows your ₹500 expense with status = 'pending'

---

### ✅ Step 2: Check Journal Entry

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
  AND je.reference_type = 'expense'
ORDER BY je.created_at DESC
LIMIT 2;
```

**Expected (for your ₹500 cash expense with category "other"):**
- `6008` (Operating Expenses - Miscellaneous) - **DEBIT** = ₹500
- `1001` (Cash) - **CREDIT** = ₹500

---

### ✅ Step 3: Verify Journal Balanced

```sql
SELECT 
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'expense'
ORDER BY je.created_at DESC
LIMIT 1;
```

**Expected:** `difference` = **0**

---

### ✅ Step 4: Verify Expense Has Journal

```sql
SELECT 
    e.expense_number,
    e.amount,
    e.category,
    CASE WHEN je.id IS NOT NULL THEN '✅ Journal Created' 
         ELSE '❌ No Journal' 
    END as journal_status
FROM expenses e
LEFT JOIN journal_entries je ON je.reference_id = e.id 
    AND je.reference_type = 'expense'
WHERE e.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY e.created_at DESC
LIMIT 1;
```

**Expected:** `journal_status` = '✅ Journal Created'

---

## 📖 How Expense Recording Works

### When you create an expense:

1. ✅ **Creates expense record** in `expenses` table
2. ✅ **Creates journal entry IMMEDIATELY** (even for pending status)
3. ⏳ **Awaits approval** (admin must approve/reject)

**Your ₹500 cash expense created:**

```
Expense Record:
  expense_number: EXP-2026-XXXXXXXXXX
  vendor: supllier 1
  amount: ₹500
  category: other
  payment_mode: cash
  status: pending

Journal Entry:
  DR  Operating Expenses - Miscellaneous (6008)   ₹500
  CR  Cash (1001)                                  ₹500
```

**Accounting Effect:**
- Your expense increased: +₹500
- Your cash decreased: -₹500

---

## 📚 Category to Account Mapping

| Category | Account Code | Account Name |
|----------|--------------|--------------|
| raw-materials | 5001 | COGS - Raw Materials |
| labor | 5002 | COGS - Labor |
| utilities | 6001 | Operating - Utilities |
| rent | 6002 | Operating - Rent |
| transportation | 6003 | Operating - Transportation |
| maintenance | 6004 | Operating - Maintenance |
| office-supplies | 6005 | Operating - Office Supplies |
| marketing | 6006 | Operating - Marketing |
| salary | 6007 | Operating - Salaries |
| **other** | **6008** | **Operating - Miscellaneous** ← Your expense |

---

## 💳 Payment Mode Mapping

| Payment Mode | Account Code | Account Name |
|--------------|--------------|--------------|
| **cash** | **1001** | **Cash** ← Your payment |
| upi | 1002 | Bank Account |
| bank-transfer | 1002 | Bank Account |
| cheque | 1002 | Bank Account |

---

## 🔍 Additional Checks

### Check Total Expenses by Category:

```sql
SELECT 
    category,
    COUNT(*) as count,
    SUM(amount) as total
FROM expenses
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY category
ORDER BY total DESC;
```

---

### Check Cash Balance:

```sql
SELECT 
    SUM(jl.debit - jl.credit) as cash_balance
FROM journal_lines jl
JOIN accounts a ON jl.account_id = a.id
JOIN journal_entries je ON jl.journal_entry_id = je.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND a.code = '1001';  -- Cash
```

**After your ₹500 expense:**
- Starting cash (from ₹236 UPI payment to you): ₹0
- Cash expenses: -₹500
- **Cash balance: -₹500** (you spent cash you didn't have)

---

### Check Total Expenses:

```sql
SELECT 
    SUM(jl.debit - jl.credit) as total_expenses
FROM journal_lines jl
JOIN accounts a ON jl.account_id = a.id
JOIN journal_entries je ON jl.journal_entry_id = je.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND (a.code LIKE '5%' OR a.code LIKE '6%');
```

---

## 🎓 Understanding Expense Accounting

### Before Expense:
```
Cash (1001):              ₹0
Expense Account (6008):   ₹0
```

### After Creating ₹500 Cash Expense:
```
Journal Entry:
  DR  Expense Account (6008)   ₹500
  CR  Cash (1001)              ₹500

New Balances:
  Cash (1001):              -₹500 (you paid cash)
  Expense Account (6008):   +₹500 (expense recorded)
```

**Meaning:**
- Expense increased by ₹500 (reduces profit)
- Cash decreased by ₹500 (asset down)

---

## ⚠️ Important Notes

### 1. Journal Entry Created IMMEDIATELY
Unlike some systems, your expense journal is created **when you create the expense**, NOT when it's approved.

**Status Flow:**
```
pending → approved → paid
  ↑
Journal created here (immediately)
```

### 2. Rejection Deletes Journal
If admin rejects the expense, the journal entry is automatically deleted (line 428-437 in expenseController.js)

---

## 🚨 Common Issues

### If Cash Balance is Negative:

This means you recorded cash expenses but don't have cash in your account. You either:
1. Need to record cash deposits
2. Should have used bank payment instead
3. Had cash before you started recording transactions

---

## 📊 Complete Accounting View

```sql
-- See all account balances
SELECT 
    a.code,
    a.name,
    SUM(jl.debit - jl.credit) as balance
FROM journal_lines jl
JOIN accounts a ON jl.account_id = a.id
JOIN journal_entries je ON jl.journal_entry_id = je.id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY a.code, a.name
ORDER BY a.code;
```

**Expected to see:**
- Cash (1001): -₹500 (your expense)
- Bank (1002): +₹236 (UPI payment received)
- AR (1003): ₹0 (customer paid)
- Tax Payable (2001): +₹36 (you owe government)
- Sales (4001): +₹200 (revenue)
- Expenses (6008): +₹500 (your expense)

---

## 📚 Full Documentation

- **All Expense Queries:** `database/verify_expense_queries.sql`
- **Expense Guide:** `EXPENSES_README.md`
- **Field Explanations:** `EXPENSE_FIELDS_EXPLAINED.md`
- **System Flow:** `SYSTEM_FLOW_GUIDE.md`

---

**✅ If all 4 steps pass → Your expense system works correctly!**
