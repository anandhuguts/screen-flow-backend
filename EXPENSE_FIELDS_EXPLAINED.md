# Expense Form Fields - Complete Guide

## Field Mapping (Frontend → Backend → Database)

### 1. **Category** (Required)
- **Frontend:** `category` (dropdown)
- **Backend:** `category` (text)
- **Database:** `expenses.category`
- **What it is:** Type of expense (raw-materials, labor, utilities, etc.)
- **Example:** "raw-materials"
- **Why needed:** Categorizes the expense for reports and accounting

### 2. **Vendor/Supplier Name** (Required)
- **Frontend:** `vendorName` (text input)
- **Backend:** `vendor_name` (text)
- **Database:** `expenses.vendor_name`
- **What it is:** Name of the company/person you paid
- **Example:** "Mesh Suppliers Ltd" or "ABC Hardware Store" or "Ramesh (Labor Contractor)"
- **Why needed:** Track who you're paying money to

### 3. **Amount** (Required)
- **Frontend:** `amount` (number input)
- **Backend:** `amount` (numeric)
- **Database:** `expenses.amount`
- **What it is:** How much money you spent
- **Example:** 25000 (for ₹25,000)
- **Why needed:** Track total expenses

### 4. **Description** (Required)
- **Frontend:** `description` (textarea)
- **Backend:** `description` (text)
- **Database:** `expenses.description`
- **What it is:** Details about what you bought/paid for
- **Example:** "Fiberglass mesh rolls - 100 meters" or "Daily wages for 4 workers"
- **Why needed:** Remember what the expense was for

### 5. **Expense Date** (Required)
- **Frontend:** `expenseDate` (date picker)
- **Backend:** `expense_date` (date)
- **Database:** `expenses.expense_date`
- **What it is:** When the expense occurred
- **Example:** "2024-01-15"
- **Why needed:** Track when money was spent

### 6. **Payment Mode** (Required, Default: cash)
- **Frontend:** `paymentMode` (dropdown)
- **Backend:** `payment_mode` (text)
- **Database:** `expenses.payment_mode`
- **What it is:** How you paid (cash/UPI/bank transfer/cheque)
- **Example:** "bank-transfer"
- **Why needed:** Track payment methods for accounting

### 7. **Reference Number** (Optional)
- **Frontend:** `reference` (text input)
- **Backend:** `reference` (text, nullable)
- **Database:** `expenses.reference`
- **What it is:** Bill number, receipt number, or transaction ID
- **Example:** "INV-2024-001" or "TXN-ABC123" or "BILL-DEC-2023"
- **Why needed:** Link to physical bills/receipts for audit

### 8. **Additional Notes** (Optional)
- **Frontend:** `notes` (textarea)
- **Backend:** `notes` (text, nullable)
- **Database:** `expenses.notes`
- **What it is:** Any extra information
- **Example:** "Urgent delivery" or "Price negotiated - saved ₹2000"
- **Why needed:** Additional context for future reference

---

## Auto-Generated Fields (Not in Form)

### 9. **Expense Number**
- **Backend:** Auto-generated as `EXP-2024-{timestamp}`
- **Database:** `expenses.expense_number`
- **Example:** "EXP-2024-1737025800000"

### 10. **Status**
- **Backend:** Always starts as "pending"
- **Database:** `expenses.status`
- **Values:** 'pending', 'approved', 'paid', 'rejected'

### 11. **Created By**
- **Backend:** From `req.user.id` (logged-in user)
- **Database:** `expenses.created_by`
- **Example:** User UUID

### 12. **Business ID**
- **Backend:** From `req.business_id` (user's business)
- **Database:** `expenses.business_id`
- **Example:** "4eac8aa9-db1f-4ac8-9c59-0dd65b101046"

### 13. **Timestamps**
- **Database:** `expenses.created_at`, `expenses.updated_at`
- **Auto-generated:** Current timestamp

---

## Real-World Example

**Scenario:** You bought mosquito net mesh from a supplier

```json
{
  "category": "raw-materials",           // What type of expense
  "vendorName": "Mesh Suppliers Ltd",    // Who you paid
  "amount": 25000,                       // How much (₹25,000)
  "description": "Fiberglass mesh rolls - 100 meters for windows",  // What exactly
  "expenseDate": "2024-01-15",          // When you bought it
  "paymentMode": "bank-transfer",        // How you paid
  "reference": "INV-MSL-2024-001",      // Their invoice number
  "notes": "Bulk discount applied - saved ₹3000"  // Extra info
}
```

### What Happens in Backend:

1. **Validates** all required fields
2. **Generates** expense number: "EXP-2024-001"
3. **Sets** status to "pending"
4. **Records** who created it (your user ID)
5. **Links** to your business
6. **Creates accounting entry:**
   ```
   Debit:  Raw Materials (5001)     ₹25,000
   Credit: Bank Account (1002)      ₹25,000
   ```

---

## Common Questions

### Q: What if I don't have the vendor name?
**A:** Put a general description like "Local Hardware Store" or "Unknown Vendor"

### Q: What if I paid with multiple methods?
**A:** Create separate expenses for each payment method

### Q: Can I edit the expense later?
**A:** Yes, but only if status is "pending". Once approved, it's locked for audit purposes.

### Q: What's the difference between Description and Notes?
- **Description:** WHAT you bought (required, shown in reports)
- **Notes:** WHY or extra context (optional, for your reference)

---

## Database Table Structure

```sql
CREATE TABLE expenses (
  id                UUID PRIMARY KEY,
  business_id       UUID NOT NULL,          -- Your business
  expense_number    TEXT NOT NULL UNIQUE,   -- Auto: EXP-2024-001
  category          TEXT NOT NULL,          -- Form field
  vendor_name       TEXT NOT NULL,          -- Form field
  amount            NUMERIC NOT NULL,       -- Form field
  description       TEXT NOT NULL,          -- Form field
  expense_date      DATE NOT NULL,          -- Form field
  payment_mode      TEXT NOT NULL,          -- Form field
  reference         TEXT,                   -- Form field (optional)
  notes             TEXT,                   -- Form field (optional)
  status            TEXT NOT NULL,          -- Auto: pending
  approved_by       UUID,                   -- Set when approved
  approved_at       TIMESTAMP,              -- Set when approved
  rejected_by       UUID,                   -- Set when rejected
  rejected_at       TIMESTAMP,              -- Set when rejected
  rejection_reason  TEXT,                   -- Set when rejected
  created_by        UUID NOT NULL,          -- Auto: current user
  created_at        TIMESTAMP NOT NULL,     -- Auto: now()
  updated_at        TIMESTAMP NOT NULL      -- Auto: now()
);
```

---

**Summary:** The vendor/supplier name is simply **who you paid the money to**. Could be a company, a person, or even a shop name. It helps you track where your money is going! 💰
