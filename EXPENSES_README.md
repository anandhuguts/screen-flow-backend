# Expense Management System

Complete expense tracking system for your mosquito net business with double-entry accounting integration.

## ✨ Features

- ✅ Full CRUD operations for expenses
- ✅ 10 expense categories (raw materials, labor, utilities, rent, etc.)
- ✅ Approval workflow (pending → approved/rejected)
- ✅ Automatic double-entry accounting
- ✅ Role-based access control
- ✅ Pagination support
- ✅ Complete audit trail

## 🚀 Quick Setup

### Step 1: Create Database Table (2 minutes)

1. Open **Supabase SQL Editor**
2. Copy contents of `database/create_expenses_table.sql`
3. Paste and click **Run**

### Step 2: Add Accounts for Existing Business (One-time only)

**⚠️ IMPORTANT:** 
- **New businesses** (created after this update) will automatically get all expense accounts
- **Existing businesses** (like yours) need to run this once:

1. Open `database/READY_TO_RUN_accounts.sql` (Your business_id is already filled in!)
2. Copy all content
3. Paste in Supabase SQL Editor
4. Click **Run**

✅ That's it! Future businesses will get these accounts automatically.

### Step 3: Test the API (2 minutes)

✅ Server already running with nodemon - routes are live!

Test with Postman:
```http
GET http://localhost:5000/api/expenses?page=1&limit=10
Authorization: Bearer <your_token>
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses?page=1&limit=10` | Get paginated expenses |
| POST | `/api/expenses` | Create new expense |
| PUT | `/api/expenses/:id` | Update expense (pending only) |
| DELETE | `/api/expenses/:id` | Delete expense (pending only) |
| POST | `/api/expenses/:id/approve` | Approve expense (admin) |
| POST | `/api/expenses/:id/reject` | Reject expense (admin) |

## 📝 Create Expense Example

```json
POST /api/expenses
{
  "category": "raw-materials",
  "vendorName": "Mesh Suppliers Ltd",
  "amount": 25000,
  "description": "Fiberglass mesh rolls",
  "expenseDate": "2024-01-15",
  "paymentMode": "bank-transfer",
  "reference": "INV-2024-001",
  "notes": "Urgent delivery"
}
```

## 💡 Expense Categories

| Category | Account Code | Type |
|----------|--------------|------|
| raw-materials | 5001 | COGS |
| labor | 5002 | COGS |
| utilities | 6001 | Operating |
| rent | 6002 | Operating |
| transportation | 6003 | Operating |
| maintenance | 6004 | Operating |
| office-supplies | 6005 | Operating |
| marketing | 6006 | Operating |
| salary | 6007 | Operating |
| other | 6008 | Operating |

## 📈 Accounting Integration

Every expense automatically creates a journal entry:

**Example:** ₹25,000 raw material purchase via bank transfer

```
Debit:  Raw Materials Expense (5001)    ₹25,000
Credit: Bank Account (1002)             ₹25,000
```

Payment modes map to accounts:
- `cash` → Account 1001
- `upi`, `bank-transfer`, `cheque` → Account 1002

## 🔒 Security & Permissions

### Staff Role
- ✅ Create expenses
- ✅ View expenses
- ✅ Update pending expenses
- ✅ Delete pending expenses

### Admin Role (superadmin)
- ✅ All staff permissions
- ✅ Approve expenses
- ✅ Reject expenses

### Data Isolation
- Users only see expenses from their business (RLS enforced)
- Cannot modify approved/paid expenses (audit integrity)

## 🎯 Workflow States

```
PENDING → APPROVED → PAID
   ↓
REJECTED (journal entry deleted)
```

## 🔗 Integration with Reports

Expenses automatically appear in:
- **Day Book** - Daily transaction view
- **Ledger** - Account-wise details
- **Trail Balance** - All expense accounts
- **Profit & Loss** - Total expenses by category

## 🐛 Troubleshooting

### Error: "Missing accounts: 5001"
**Fix:** Run `database/add_expense_accounts.sql` with your business_id

### Error: "Cannot update approved expenses"
**Fix:** This is expected - only pending expenses can be modified

### Error: "401 Unauthorized"
**Fix:** Ensure Authorization header with Bearer token is sent

## 📦 Files Structure

```
mosquito-backend/
├── controllers/
│   └── expenseController.js (CRUD + approval logic)
├── routes/
│   └── expenseRoutes.js (API endpoints)
├── database/
│   ├── create_expenses_table.sql (Table schema)
│   └── add_expense_accounts.sql (Chart of accounts)
└── index.js (routes registered)
```

## ✅ Production Ready

- ✅ Error handling
- ✅ Data validation
- ✅ Transaction safety (rollback on errors)
- ✅ Audit trail
- ✅ Security policies
- ✅ Accounting compliance

---

**Need Help?** Check the inline comments in the code files for detailed explanations.
