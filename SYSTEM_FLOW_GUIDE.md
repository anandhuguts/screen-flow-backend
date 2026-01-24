# 🏢 Mosquito Net Business ERP - Complete System Flow

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR BUSINESS SOFTWARE                    │
│                  Mosquito Net Manufacturing                   │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vue)                            │
│  - Customer Management                                                  │
│  - Lead Management                                                      │
│  - Quotation Generation                                                 │
│  - Invoice Creation                                                     │
│  - Payment Recording                                                    │
│  - Financial Reports                                                    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Express.js)                           │
│  PORT: 5000 | Base URL: http://localhost:5000/api/                     │
│                                                                          │
│  Routes:                                                                 │
│  ├── /auth          → User authentication & signup                      │
│  ├── /leads         → Lead management                                   │
│  ├── /customers     → Customer CRUD                                     │
│  ├── /quotations    → Quotation generation                              │
│  ├── /invoices      → Invoice creation & management                     │
│  ├── /payments      → Payment recording                                 │
│  ├── /expenses      → Expense tracking & approval                       │
│  ├── /accounts      → Chart of accounts                                 │
│  ├── /reports       → Financial reports                                 │
│  ├── /dashboard     → Business metrics                                  │
│  ├── /staff         → Staff management                                  │
│  ├── /settings      → Business settings                                 │
│  ├── /notifications → User notifications                                │
│  └── /security      → Security logs                                     │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL/Supabase)                     │
│                                                                          │
│  Core Tables:                                                            │
│  ├── businesses          → Business entities                            │
│  ├── profiles            → User profiles                                │
│  ├── leads               → Potential customers                          │
│  ├── customers           → Converted customers                          │
│  ├── quotations          → Price quotes                                 │
│  ├── quotation_items     → Quote line items                             │
│  ├── invoices            → Sales invoices                               │
│  ├── invoice_items       → Invoice line items                           │
│  ├── payments            → Payment receipts                             │
│  ├── expenses            → Business expenses                            │
│                                                                          │
│  Accounting Tables:                                                      │
│  ├── accounts            → Chart of Accounts (COA)                      │
│  ├── journal_entries     → Accounting journal headers                   │
│  └── journal_lines       → Debit/Credit entries                         │
│                                                                          │
│  Support Tables:                                                         │
│  ├── notifications       → User notifications                           │
│  ├── activity_logs       → Action audit trail                           │
│  └── login_activity      → Security logs                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Business Flow

### Phase 1: Lead Generation → Customer Conversion

```
┌──────────────┐
│  New Lead    │  Source: Walk-in, Phone, WhatsApp, Website
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Lead Management                             │
│  - Assign to sales rep                      │
│  - Set follow-up date                       │
│  - Add notes                                │
│  - Status: new → follow-up → quoted         │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Quotation   │  Create price quote with items, tax, discount
└──────┬───────┘
       │
       ├─── Rejected ──→ Lead Status: Lost
       │
       └─── Accepted ──→ ┌────────────────────────┐
                          │  Convert to Customer   │
                          │  (Auto-conversion)     │
                          └────────────────────────┘
```

### Phase 2: Invoice Creation & Accounting

```
┌──────────────────┐
│  Create Invoice  │  Customer + Items + Tax + Due Date
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Invoice Creation Process                                    │
│                                                               │
│  1. Validate Data                                            │
│     ✓ Customer exists                                        │
│     ✓ Items have description, quantity, price                │
│     ✓ Due date is set                                        │
│                                                               │
│  2. Calculate Totals                                         │
│     • Subtotal = Sum of (qty × price)                        │
│     • Tax = Subtotal × Tax%                                  │
│     • Total = Subtotal + Tax                                 │
│                                                               │
│  3. Generate Invoice Number                                  │
│     Format: INV-2026-1737006053000                           │
│                                                               │
│  4. Insert Invoice Record                                    │
│     Table: invoices                                          │
│     Status: pending                                          │
│     Balance: total_amount                                    │
│                                                               │
│  5. Insert Invoice Items                                     │
│     Table: invoice_items                                     │
│                                                               │
│  6. Create Journal Entry (DOUBLE-ENTRY ACCOUNTING)          │
│     ┌──────────────────────────────────────────┐            │
│     │  Example: ₹11,800 Invoice                │            │
│     │  (₹10,000 + 18% GST = ₹1,800)           │            │
│     │                                           │            │
│     │  Debit:  Accounts Receivable  ₹11,800   │            │
│     │  Credit: Sales Revenue        ₹10,000   │            │
│     │  Credit: Tax Payable           ₹1,800   │            │
│     └──────────────────────────────────────────┘            │
│                                                               │
│     Tables:                                                   │
│     • journal_entries (header)                               │
│     • journal_lines (debit/credit lines)                     │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Payment Recording

```
┌──────────────────┐
│ Payment Received │  Amount + Payment Method + Reference
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Payment Recording Process                                   │
│                                                               │
│  1. Validate Payment                                         │
│     ✓ Amount ≤ Balance Amount                               │
│     ✓ Invoice exists                                         │
│                                                               │
│  2. Generate Receipt Number                                  │
│     Format: RCPT-2026-1737006053000                          │
│                                                               │
│  3. Insert Payment Record                                    │
│     Table: payments                                          │
│                                                               │
│  4. Update Invoice Status                                    │
│     • If fully paid: status = "paid"                         │
│     • If partially paid: status = "partially-paid"           │
│                                                               │
│  5. Create Journal Entry                                     │
│     ┌──────────────────────────────────────────┐            │
│     │  Example: ₹5,000 Cash Payment            │            │
│     │                                           │            │
│     │  Debit:  Cash                    ₹5,000  │            │
│     │  Credit: Accounts Receivable     ₹5,000  │            │
│     └──────────────────────────────────────────┘            │
│                                                               │
│  6. Update Customer Balance                                  │
│     outstanding_balance -= payment_amount                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Chart of Accounts (Your Business)

```
ASSETS (Debit increases, Credit decreases)
├── 1001 - Cash
├── 1002 - Bank Account
└── 1003 - Accounts Receivable (Customer owes you)

LIABILITIES (Credit increases, Debit decreases)
└── 2001 - Tax Payable (GST you owe to government)

EQUITY (Credit increases, Debit decreases)
└── (Not used yet)

REVENUE (Credit increases, Debit decreases)
└── 4001 - Sales (Income from selling mosquito nets)

EXPENSES (Debit increases, Credit decreases)
├── 5001 - COGS - Raw Materials (Mesh, frames, etc.)
├── 5002 - COGS - Labor (Direct workers)
├── 6001 - Operating Expenses - Utilities (Electric, water)
├── 6002 - Operating Expenses - Rent
├── 6003 - Operating Expenses - Transportation
├── 6004 - Operating Expenses - Maintenance
├── 6005 - Operating Expenses - Office Supplies
├── 6006 - Operating Expenses - Marketing
├── 6007 - Operating Expenses - Salaries
└── 6008 - Operating Expenses - Miscellaneous
```

---

## 📖 Accounting Examples

### Example 1: Invoice Creation (₹11,800)

```
TRANSACTION: Create invoice for customer
Items: 10 nets @ ₹1,000 = ₹10,000
Tax: 18% = ₹1,800
Total: ₹11,800

JOURNAL ENTRY:
─────────────────────────────────────────────
Account                         Debit    Credit
─────────────────────────────────────────────
1003 - Accounts Receivable    ₹11,800
4001 - Sales                             ₹10,000
2001 - Tax Payable                        ₹1,800
─────────────────────────────────────────────
TOTAL                         ₹11,800   ₹11,800  ✓

MEANING:
• Customer now owes you ₹11,800 (AR increases)
• You earned ₹10,000 in sales revenue
• You owe ₹1,800 in GST to the government
```

### Example 2: Full Payment Received (₹11,800 Cash)

```
TRANSACTION: Customer pays full amount in cash

JOURNAL ENTRY:
─────────────────────────────────────────────
Account                         Debit    Credit
─────────────────────────────────────────────
1001 - Cash                   ₹11,800
1003 - Accounts Receivable               ₹11,800
─────────────────────────────────────────────
TOTAL                         ₹11,800   ₹11,800  ✓

MEANING:
• Cash increases by ₹11,800
• Customer no longer owes you (AR decreases)

INVOICE STATUS:
• paid_amount: ₹11,800
• balance_amount: ₹0
• status: "paid"
```

### Example 3: Partial Payment (₹5,000 Bank Transfer)

```
TRANSACTION: Customer pays ₹5,000 via bank transfer

JOURNAL ENTRY:
─────────────────────────────────────────────
Account                         Debit    Credit
─────────────────────────────────────────────
1002 - Bank Account            ₹5,000
1003 - Accounts Receivable                ₹5,000
─────────────────────────────────────────────
TOTAL                          ₹5,000    ₹5,000  ✓

MEANING:
• Bank balance increases by ₹5,000
• Customer still owes ₹6,800

INVOICE STATUS:
• paid_amount: ₹5,000
• balance_amount: ₹6,800
• status: "partially-paid"
```

### Example 4: Expense Recording (₹25,000 Raw Material)

```
TRANSACTION: Purchase raw materials via bank transfer
Amount: ₹25,000
Category: raw-materials
Vendor: Mesh Suppliers Ltd

JOURNAL ENTRY:
─────────────────────────────────────────────
Account                         Debit    Credit
─────────────────────────────────────────────
5001 - COGS - Raw Materials   ₹25,000
1002 - Bank Account                      ₹25,000
─────────────────────────────────────────────
TOTAL                         ₹25,000   ₹25,000  ✓

MEANING:
• Raw material expense increases by ₹25,000
• Bank balance decreases by ₹25,000
```

---

## 🔐 Security & Access Control

### User Roles

```
SUPERADMIN (Business Owner)
├── Full access to all features
├── Approve/reject expenses
├── Manage staff
├── View all reports
└── Modify business settings

STAFF (Regular Employee)
├── Create leads
├── Create quotations
├── Create invoices
├── Record payments
├── Create expenses (requires approval)
└── View assigned data
```

### Data Isolation

```
Row Level Security (RLS)
├── Each business sees ONLY their data
├── Enforced at database level
└── business_id filter on all queries

Example:
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
```

---

## 📊 Reports Available

1. **Day Book**
   - All transactions for a date range
   - Shows debits and credits

2. **Ledger**
   - Account-wise transaction history
   - Running balance per account

3. **Trial Balance**
   - Summary of all account balances
   - Verifies Debits = Credits

4. **Profit & Loss Statement**
   - Revenue vs Expenses
   - Net Profit/Loss calculation

5. **Dashboard Metrics**
   - Total sales
   - Outstanding payments
   - Expense summary
   - Cash flow

---

## 🚀 API Testing Examples

### Create Invoice

```http
POST http://localhost:5000/api/invoices
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "customerId": "customer-uuid-here",
  "items": [
    {
      "description": "Mosquito Net - Standard",
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
  "notes": "Deliver before 15th Feb"
}
```

### Record Payment

```http
POST http://localhost:5000/api/payments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "invoiceId": "invoice-uuid-here",
  "amount": 5000,
  "paymentMethod": "bank-transfer",
  "reference": "TXN-123456789"
}
```

---

## ✅ System Health Checks

### Before Creating Invoice

```sql
-- Check accounts exist
SELECT code, name 
FROM accounts 
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
  AND code IN ('1003', '4001', '2001');
```

### After Creating Invoice

```sql
-- Verify journal entry balanced
SELECT 
    SUM(debit) as total_debit,
    SUM(credit) as total_credit
FROM journal_lines
WHERE journal_entry_id = 'your-entry-id';
```

---

## 🎓 Key Concepts

### Double-Entry Accounting

Every transaction has **equal and opposite** entries:
- Total Debits = Total Credits (always!)
- This ensures the books are balanced
- If they don't match, there's an error

### Accounts Receivable (AR)

- Money customers **owe you**
- Increases when invoice created
- Decreases when payment received

### Accounts Payable (AP)

- Money you **owe vendors** (not implemented yet)
- Would increase on expense
- Would decrease on payment

---

## 📁 Project Structure

```
mosquito-backend/
├── controllers/
│   ├── authController.js      (User signup/login)
│   ├── invoiceController.js   (Invoice CRUD + journal)
│   ├── paymentsController.js  (Payment recording)
│   ├── expenseController.js   (Expense management)
│   ├── leadController.js      (Lead management)
│   ├── quotationController.js (Quotation generation)
│   └── ... (other controllers)
│
├── routes/
│   ├── invoiceController.js   (Invoice routes)
│   ├── paymentRoutes.js       (Payment routes)
│   └── ... (other routes)
│
├── services/
│   └── accounting/
│       └── createJournalEntry.js  (Journal entry service)
│
├── middlewares/
│   ├── authenticate.js        (JWT verification)
│   └── businessAuth.js        (Business isolation)
│
├── database/
│   ├── verify_invoice_queries.sql  (Your verification queries)
│   └── ... (other SQL files)
│
└── index.js                   (Main server file)
```

---

**For queries, see:** `database/verify_invoice_queries.sql`  
**For detailed guide, see:** `INVOICE_VERIFICATION_GUIDE.md`
