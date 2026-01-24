# 🏢 Mosquito Net Business ERP System

> **Complete B2B Accounting & CRM System**  
> Lead Management → Quotations → Invoices → Payments → Financial Reports

---

## 🚀 Quick Start

### Your Business ID
```
76834d81-ce40-43f5-8082-1e08809663ff
```

### Server
```bash
npm start
```
Server runs on: `http://localhost:5000`

---

## 📚 Documentation Index

### 🎯 **Quick References** (Start Here!)
1. **[QUICK_INVOICE_CHECK.md](./QUICK_INVOICE_CHECK.md)** ⚡  
   → 5-minute verification after creating an invoice

2. **[SYSTEM_FLOW_GUIDE.md](./SYSTEM_FLOW_GUIDE.md)** 📊  
   → Complete system overview with diagrams and examples

### 🔍 **Detailed Guides**
3. **[INVOICE_VERIFICATION_GUIDE.md](./INVOICE_VERIFICATION_GUIDE.md)** 📋  
   → Comprehensive invoice & accounting verification guide

4. **[EXPENSES_README.md](./EXPENSES_README.md)** 💰  
   → Expense management system documentation

5. **[EXPENSE_FIELDS_EXPLAINED.md](./EXPENSE_FIELDS_EXPLAINED.md)** 📝  
   → Detailed field-by-field explanation

6. **[AUTOMATIC_ACCOUNTS_EXPLAINED.md](./AUTOMATIC_ACCOUNTS_EXPLAINED.md)** ✅  
   → How automatic account creation works

### 🔧 **SQL & Database**
7. **[database/verify_invoice_queries.sql](./database/verify_invoice_queries.sql)** 🗄️  
   → Ready-to-run SQL queries for invoice verification

---

## 💡 Core Features

### Lead to Cash Flow
```
Lead → Quotation → Customer → Invoice → Payment → Reports
```

### Modules
- ✅ **Authentication** - User signup, login, JWT
- ✅ **Lead Management** - Capture, assign, follow-up
- ✅ **Customer Management** - Contact info, balances
- ✅ **Quotation System** - Price quotes with items
- ✅ **Invoice Creation** - Sales invoices with GST
- ✅ **Payment Recording** - Cash, UPI, bank transfer
- ✅ **Expense Tracking** - 10 categories with approval
- ✅ **Double-Entry Accounting** - Automatic journal entries
- ✅ **Financial Reports** - Day Book, Ledger, Trial Balance, P&L
- ✅ **Notifications** - Real-time user alerts
- ✅ **Security** - RLS, login tracking, audit logs

---

## 🏗️ Architecture

### Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT + RLS
- **Accounting:** Double-entry system

### Project Structure
```
mosquito-backend/
├── controllers/        → API business logic
│   ├── invoiceController.js
│   ├── paymentsController.js
│   ├── expenseController.js
│   └── ... (11 more)
│
├── routes/            → API endpoints
│   ├── invoiceController.js
│   ├── paymentRoutes.js
│   └── ... (11 more)
│
├── middlewares/       → Auth & validation
│   ├── authenticate.js
│   └── businessAuth.js
│
├── services/          → Reusable business logic
│   └── accounting/
│       └── createJournalEntry.js
│
├── database/          → SQL files
│   └── verify_invoice_queries.sql
│
├── supabase/          → DB connection
│   └── supabaseAdmin.js
│
└── index.js           → Server entry point
```

---

## 📖 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Available Routes

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `/auth` | Signup, login |
| Leads | `/leads` | Lead CRUD |
| Customers | `/customers` | Customer management |
| Quotations | `/quotations` | Quote generation |
| **Invoices** | `/invoices` | **Invoice creation** |
| **Payments** | `/payments` | **Payment recording** |
| Expenses | `/expenses` | Expense tracking |
| Accounts | `/accounts` | Chart of accounts |
| Reports | `/reports` | Financial reports |
| Dashboard | `/dashboard` | Business metrics |
| Staff | `/staff` | User management |
| Settings | `/settings` | Business settings |
| Notifications | `/notifications` | User alerts |
| Security | `/security` | Security logs |

---

## 🔐 Authentication

### Headers Required
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### User Roles
- **superadmin** - Full access
- **staff** - Limited access (no expense approval)

---

## 💰 Accounting System

### Chart of Accounts

```
ASSETS
├── 1001 - Cash
├── 1002 - Bank Account
└── 1003 - Accounts Receivable

LIABILITIES
└── 2001 - Tax Payable

REVENUE
└── 4001 - Sales

EXPENSES
├── 5001 - COGS - Raw Materials
├── 5002 - COGS - Labor
├── 6001 - Operating - Utilities
├── 6002 - Operating - Rent
├── 6003 - Operating - Transportation
├── 6004 - Operating - Maintenance
├── 6005 - Operating - Office Supplies
├── 6006 - Operating - Marketing
├── 6007 - Operating - Salaries
└── 6008 - Operating - Miscellaneous
```

### Invoice Accounting Entry

**When invoice of ₹11,800 is created:**
```
Debit:  Accounts Receivable (1003)    ₹11,800
Credit: Sales (4001)                   ₹10,000
Credit: Tax Payable (2001)              ₹1,800
```

**When payment of ₹11,800 is received (Cash):**
```
Debit:  Cash (1001)                    ₹11,800
Credit: Accounts Receivable (1003)     ₹11,800
```

---

## 🧪 Testing

### Create Test Invoice

```http
POST http://localhost:5000/api/invoices
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "items": [
    {
      "description": "Mosquito Net - Standard",
      "quantity": 10,
      "unitPrice": 500
    }
  ],
  "subtotal": 5000,
  "taxPercent": 18,
  "dueDate": "2026-02-15",
  "isGstInvoice": true,
  "notes": "Test invoice"
}
```

### Verify with SQL

```sql
-- See QUICK_INVOICE_CHECK.md for verification queries
SELECT * FROM invoices 
WHERE business_id = '76834d81-ce40-43f5-8082-1e08809663ff'
ORDER BY created_at DESC LIMIT 1;
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Missing Accounts Error**
```
Error: Missing accounts: 1003, 4001, 2001
```

**Fix:** Run the SQL in `database/verify_invoice_queries.sql` (commented section at bottom)

#### 2. **401 Unauthorized**
```
Error: Unauthorized
```

**Fix:** Ensure Authorization header with valid JWT token is sent

#### 3. **Invoice Created but No Journal Entry**

**Check:** See `QUICK_INVOICE_CHECK.md` Step 2

#### 4. **Unbalanced Journal Entry**

**Check:** See `QUICK_INVOICE_CHECK.md` Step 3

---

## 📊 Environment Variables

Create `.env` file:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

---

## 🔄 Database Schema

See the complete schema in your original message. Key tables:

- `businesses` - Business entities
- `customers` - Customer records
- `invoices` - Sales invoices
- `invoice_items` - Invoice line items
- `payments` - Payment receipts
- `journal_entries` - Accounting journal headers
- `journal_lines` - Debit/Credit entries
- `accounts` - Chart of accounts

---

## 📈 Reports Available

1. **Day Book** - Daily transaction listing
2. **Ledger** - Account-wise transactions
3. **Trial Balance** - All account balances
4. **Profit & Loss** - Revenue vs Expenses
5. **Dashboard** - Key business metrics

---

## 🎯 Next Steps After Invoice Creation

1. ✅ **Verify Invoice** - Run queries from `QUICK_INVOICE_CHECK.md`
2. ✅ **Check Accounting** - Ensure debits = credits
3. ✅ **Record Payment** - When customer pays
4. ✅ **View Reports** - Check Day Book and Ledger

---

## 📞 Support Files

- **Quick Check:** `QUICK_INVOICE_CHECK.md`
- **System Flow:** `SYSTEM_FLOW_GUIDE.md`
- **Verification Guide:** `INVOICE_VERIFICATION_GUIDE.md`
- **SQL Queries:** `database/verify_invoice_queries.sql`

---

## 🎓 Learning Resources

### Understanding the Flow
1. Read `SYSTEM_FLOW_GUIDE.md` for overview
2. Review accounting examples in the guide
3. Test with API calls
4. Verify with SQL queries

### Understanding Accounting
- Every transaction has equal debits and credits
- Accounts Receivable = Money customers owe you
- Sales = Revenue you earned
- Tax Payable = Tax you owe government

---

## ✅ Production Ready

- ✅ Error handling
- ✅ Data validation
- ✅ Transaction safety
- ✅ Audit trail
- ✅ Security (RLS)
- ✅ Accounting compliance

---

## 📝 License

Proprietary - Mosquito Net Business Management System

---

**For invoice verification, start with:** [QUICK_INVOICE_CHECK.md](./QUICK_INVOICE_CHECK.md) ⚡
