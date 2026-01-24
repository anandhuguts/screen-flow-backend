# 📋 Invoice Verification Guide

## 🎯 Your Business Software - Overview

This is a **complete B2B accounting system** for a mosquito net manufacturing business. It handles:

- **Lead Management** → **Quotations** → **Invoices** → **Payments**
- **Customer Management** with outstanding balance tracking
- **Expense Management** with approval workflows
- **Double-Entry Accounting** (automatic journal entries)
- **Financial Reports** (Day Book, Ledger, Trial Balance, P&L)

---

## 💡 Invoice Creation Flow

When you create an invoice, here's what happens:

### Step 1: Invoice Creation
```
POST /api/invoices
```

1. **Validate Data** - Check customer, items, due date
2. **Prevent Duplicates** - Check if quotation already has invoice
3. **Calculate Totals** - Subtotal, Tax, Total Amount
4. **Generate Invoice Number** - `INV-2026-1737006053000`
5. **Insert Invoice Record** - Save to `invoices` table
6. **Insert Invoice Items** - Save line items to `invoice_items` table

### Step 2: Automatic Journal Entry

The system creates **double-entry accounting** records:

**For Invoice of ₹11,800 (₹10,000 + 18% GST):**

```
Debit:  Accounts Receivable (1003)    ₹11,800
Credit: Sales Revenue (4001)           ₹10,000
Credit: Tax Payable (2001)             ₹1,800
```

This is saved in:
- `journal_entries` table (header)
- `journal_lines` table (debit/credit lines)

---

## 🔍 SQL Queries to Verify Invoice Creation

### Your Business ID:
```
76834d81-ce40-43f5-8082-1e08809663ff
```

---

## ✅ Query 1: Check Invoice Details

```sql
-- Get the latest invoice with customer details
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
```

**What to check:**
- ✅ `invoice_number` should be unique
- ✅ `total_amount` = `subtotal` + `tax_amount`
- ✅ `balance_amount` = `total_amount` (when newly created)
- ✅ `status` = 'pending'

---

## ✅ Query 2: Check Invoice Items

```sql
-- Get items for the latest invoice
SELECT 
    i.invoice_number,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY i.created_at DESC, ii.id
LIMIT 10;
```

**What to check:**
- ✅ All items are present
- ✅ `total` = `quantity` × `unit_price`
- ✅ Sum of all item totals = invoice `subtotal`

---

## ✅ Query 3: Check Journal Entry (Accounting)

```sql
-- Get journal entry for the latest invoice
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
```

**What to check:**
- ✅ Should have 3 lines (Debit AR, Credit Sales, Credit Tax)
- ✅ Total Debits = Total Credits (accounting rule)
- ✅ Debit (1003) = Invoice `total_amount`
- ✅ Credit (4001) = Invoice `subtotal`
- ✅ Credit (2001) = Invoice `tax_amount`

---

## ✅ Query 4: Verify Accounting Balance

```sql
-- Check that debits equal credits for all invoice journal entries
SELECT 
    je.description,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as difference
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.reference_type = 'invoice'
GROUP BY je.id, je.description
ORDER BY je.created_at DESC
LIMIT 5;
```

**What to check:**
- ✅ `difference` should be **exactly 0** for every entry
- ✅ If not, there's an accounting error!

---

## ✅ Query 5: Check All Accounts Exist

```sql
-- Verify that required accounts exist for your business
SELECT code, name, type
FROM accounts
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND code IN ('1003', '4001', '2001')
ORDER BY code;
```

**Expected Results:**
```
1003 | Accounts Receivable | asset
2001 | Tax Payable        | liability
4001 | Sales              | revenue
```

**If missing:** Run the account creation SQL from `database/READY_TO_RUN_accounts.sql`

---

## ✅ Query 6: Check Customer Outstanding Balance

```sql
-- Verify customer's outstanding balance is updated
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
ORDER BY c.created_at DESC
LIMIT 5;
```

**Note:** Customer balances might be updated by a trigger or need manual update.

---

## ✅ Query 7: Full Invoice Audit Trail

```sql
-- Complete view of a specific invoice
WITH invoice_data AS (
    SELECT 
        i.invoice_number,
        i.total_amount,
        i.created_at as invoice_date,
        c.name as customer
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
    ORDER BY i.created_at DESC
    LIMIT 1
)
SELECT 
    'Invoice' as record_type,
    id.invoice_number as reference,
    id.customer,
    id.total_amount,
    id.invoice_date as date
FROM invoice_data id

UNION ALL

SELECT 
    'Journal Entry' as record_type,
    a.code || ' - ' || a.name as reference,
    CASE 
        WHEN jl.debit > 0 THEN 'Debit'
        ELSE 'Credit'
    END as customer,
    COALESCE(jl.debit, jl.credit) as total_amount,
    je.date
FROM invoice_data id
JOIN journal_entries je ON je.description LIKE '%' || id.invoice_number || '%'
JOIN journal_lines jl ON je.id = jl.journal_entry_id
JOIN accounts a ON jl.account_id = a.id
ORDER BY record_type DESC, total_amount DESC;
```

---

## 🧪 Test Invoice Creation

### Test Data Example:

```json
POST http://localhost:5000/api/invoices
Authorization: Bearer YOUR_TOKEN

{
  "customerId": "YOUR_CUSTOMER_ID",
  "items": [
    {
      "description": "Mosquito Net - Standard Size",
      "quantity": 10,
      "unitPrice": 500
    },
    {
      "description": "Mosquito Net - King Size",
      "quantity": 5,
      "unitPrice": 800
    }
  ],
  "subtotal": 9000,
  "taxPercent": 18,
  "dueDate": "2026-02-15",
  "isGstInvoice": true,
  "notes": "Test invoice"
}
```

**Expected Journal Entry:**
```
Debit:  AR (1003)      ₹10,620
Credit: Sales (4001)   ₹9,000
Credit: Tax (2001)     ₹1,620
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "Missing accounts: 1003, 4001, 2001"

**Cause:** Accounts not created for your business

**Fix:** Run this SQL:

```sql
INSERT INTO accounts (business_id, name, code, type) VALUES
('76834d81-ce40-43f5-8082-1e08809663ff', 'Cash', '1001', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Bank Account', '1002', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Accounts Receivable', '1003', 'asset'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Tax Payable', '2001', 'liability'),
('76834d81-ce40-43f5-8082-1e08809663ff', 'Sales', '4001', 'revenue')
ON CONFLICT DO NOTHING;
```

---

### Issue 2: Debits don't equal Credits

**Check:**
```sql
SELECT 
    je.id,
    SUM(jl.debit) - SUM(jl.credit) as imbalance
FROM journal_entries je
JOIN journal_lines jl ON je.id = jl.journal_entry_id
WHERE je.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
GROUP BY je.id
HAVING SUM(jl.debit) != SUM(jl.credit);
```

If any results show up, there's a bug in the accounting logic.

---

### Issue 3: Invoice created but no journal entry

**Check:**
```sql
SELECT 
    i.invoice_number,
    i.created_at,
    je.id as journal_id
FROM invoices i
LEFT JOIN journal_entries je ON je.reference_id = i.id AND je.reference_type = 'invoice'
WHERE i.business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND je.id IS NULL
ORDER BY i.created_at DESC;
```

**Fix:** The invoice creation continues even if journal fails. Check server logs for errors.

---

## 📊 Account Codes Reference

| Code | Account Name | Type | Used For |
|------|--------------|------|----------|
| 1001 | Cash | Asset | Cash payments |
| 1002 | Bank Account | Asset | Bank/UPI/Cheque |
| 1003 | Accounts Receivable | Asset | **Invoice Sales** |
| 2001 | Tax Payable | Liability | **GST/Tax** |
| 4001 | Sales | Revenue | **Sales Revenue** |
| 5001 | COGS - Raw Materials | Expense | Raw material purchases |
| 5002 | COGS - Labor | Expense | Direct labor costs |
| 6001-6008 | Operating Expenses | Expense | Various operating costs |

---

## 🎓 Understanding the Flow

### Complete Business Flow:

```
1. LEAD GENERATION
   ↓
2. LEAD FOLLOW-UP
   ↓
3. QUOTATION SENT
   ↓
4. QUOTATION ACCEPTED → Lead converts to Customer
   ↓
5. INVOICE CREATED
   Journal Entry:
   DR Accounts Receivable
   CR Sales Revenue
   CR Tax Payable
   ↓
6. PAYMENT RECEIVED
   Journal Entry:
   DR Cash/Bank
   CR Accounts Receivable
   ↓
7. REPORTS UPDATED
   - Day Book
   - Ledger
   - Trial Balance
   - Profit & Loss
```

---

## 🚀 Quick Verification Checklist

After creating an invoice, run these queries in order:

1. ✅ **Invoice exists:** Query 1
2. ✅ **Items match:** Query 2
3. ✅ **Journal entry exists:** Query 3
4. ✅ **Accounting is balanced:** Query 4
5. ✅ **All accounts exist:** Query 5

If all pass → **System is working correctly!** ✅

---

## 📚 Additional Resources

- **Expense Management:** See `EXPENSES_README.md`
- **Account Setup:** See `AUTOMATIC_ACCOUNTS_EXPLAINED.md`
- **Database Schema:** Check the schema you provided above
- **Server Logs:** Check console for any errors

---

**Need Help?** Check the `controllers/invoiceController.js` file (lines 148-166) for the journal entry creation logic.
