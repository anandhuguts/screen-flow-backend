# 🛣️ API Routes Reference - Subscription System

## 🔐 Authentication Note
All routes except public endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 1️⃣ Superadmin Routes
**Base URL:** `/api/superadmin`  
**Access:** `system_superadmin` role only

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| **GET** | `/businesses` | List all businesses (with filters) | - | Array of businesses |
| **GET** | `/businesses/:id` | Get business details | - | Business object |
| **POST** | `/businesses` | Create new business | `{ name, owner_email, owner_name, owner_phone, plan_type }` | Created business |
| **PATCH** | `/businesses/:id` | Update business details | `{ name?, phone?, email? }` | Updated business |
| **DELETE** | `/businesses/:id` | Delete business (soft delete) | - | Success message |
| **POST** | `/businesses/:id/suspend` | Suspend business access | `{ reason }` | Updated business |
| **POST** | `/businesses/:id/activate` | Reactivate business | - | Updated business |
| **PATCH** | `/businesses/:id/subscription` | Change subscription plan | `{ plan_type, reason? }` | Updated subscription |
| **GET** | `/analytics` | Platform analytics | - | Analytics data |
| **GET** | `/statistics` | Platform statistics | - | Stats object |

### Example: Create Business
```bash
POST /api/superadmin/businesses
Content-Type: application/json
Authorization: Bearer <system_admin_token>

{
  "name": "ABC Manufacturing",
  "owner_email": "owner@abc.com",
  "owner_name": "John Doe",
  "owner_phone": "+91-9876543210",
  "plan_type": "trial"
}

Response:
{
  "success": true,
  "business": {
    "id": "uuid",
    "name": "ABC Manufacturing",
    "subscription_status": "trial"
  },
  "invitation": {
    "token": "unique-token",
    "expires_at": "2026-02-06T11:22:54Z"
  }
}
```

---

## 2️⃣ Subscription Routes
**Base URL:** `/api/subscriptions`  
**Access:** Authenticated business users

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| **GET** | `/current` | Get current subscription | - | Subscription details |
| **GET** | `/plans` | List available plans (PUBLIC) | - | Array of plans |
| **POST** | `/upgrade` | Request plan upgrade | `{ plan_type }` | Updated subscription |
| **POST** | `/downgrade` | Request plan downgrade | `{ plan_type, reason? }` | Updated subscription |
| **GET** | `/history` | Subscription change history | - | Array of changes |
| **GET** | `/usage` | Current month usage stats | - | Usage object |
| **POST** | `/payments` | Record subscription payment | `{ amount, payment_method, reference }` | Payment record |

### Example: Get Current Subscription
```bash
GET /api/subscriptions/current
Authorization: Bearer <user_token>

Response:
{
  "subscription": {
    "plan_type": "basic",
    "plan_name": "Basic Plan",
    "status": "active",
    "start_date": "2026-01-01",
    "end_date": "2026-02-01",
    "monthly_price": 999
  },
  "limits": {
    "max_users": 5,
    "max_invoices_per_month": 500,
    "max_products": 1000,
    "max_customers": 500
  },
  "current_usage": {
    "users": 3,
    "invoices_this_month": 127,
    "products": 245,
    "customers": 89
  },
  "features": ["leads", "customers", "quotations", "invoices", "payments", "products"]
}
```

### Example: Upgrade Plan
```bash
POST /api/subscriptions/upgrade
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "plan_type": "advanced"
}

Response:
{
  "success": true,
  "subscription": {
    "plan_type": "advanced",
    "monthly_price": 2999,
    "effective_date": "2026-01-23"
  },
  "prorated_charge": 1500,
  "next_billing_date": "2026-02-01"
}
```

---

## 3️⃣ Invitation Routes
**Base URL:** `/api/invitations`

| Method | Endpoint | Description | Access | Request Body | Response |
|--------|----------|-------------|--------|--------------|----------|
| **POST** | `/` | Send invitation | Business owner | `{ email, role }` | Invitation object |
| **GET** | `/pending` | List pending invitations | Business owner | - | Array of invitations |
| **GET** | `/verify/:token` | Verify invitation token | PUBLIC | - | Invitation details |
| **POST** | `/accept` | Accept invitation | PUBLIC | `{ token, name, password }` | User created |
| **DELETE** | `/:id` | Cancel invitation | Business owner | - | Success message |
| **POST** | `/:id/resend` | Resend invitation email | Business owner | - | Updated invitation |

### Example: Send Invitation
```bash
POST /api/invitations
Authorization: Bearer <business_owner_token>
Content-Type: application/json

{
  "email": "staff@abc.com",
  "role": "staff"
}

Response:
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "staff@abc.com",
    "role": "staff",
    "invitation_token": "unique-token",
    "expires_at": "2026-02-06T11:22:54Z",
    "status": "pending"
  },
  "message": "Invitation sent to staff@abc.com"
}
```

### Example: Accept Invitation
```bash
POST /api/invitations/accept
Content-Type: application/json

{
  "token": "unique-invitation-token",
  "name": "Jane Smith",
  "password": "SecurePassword123!"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "role": "staff",
    "business_id": "business-uuid"
  },
  "token": "jwt-token-for-login"
}
```

---

## 4️⃣ Modified Authentication Routes
**Base URL:** `/api/auth`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| **POST** | `/signup` | ~~Create account + business~~ (REMOVED) | - | - |
| **POST** | `/system-admin/login` | System superadmin login | `{ email, password }` | Token + user |
| **POST** | `/login` | Regular user login | `{ email, password }` | Token + user + subscription |

### Example: User Login (Modified Response)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@abc.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "owner@abc.com",
    "role": "superadmin",
    "business_id": "business-uuid"
  },
  "business": {
    "id": "business-uuid",
    "name": "ABC Manufacturing",
    "subscription_status": "active"
  },
  "subscription": {
    "plan_type": "advanced",
    "status": "active",
    "features": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports"]
  }
}
```

---

## 5️⃣ Feature-Gated Routes (Examples)

All existing routes now include subscription checks. Here are some examples:

### Invoices (Requires "invoices" feature + usage limit)
```bash
POST /api/invoices
Authorization: Bearer <user_token>

# Middleware checks:
# 1. Is subscription active?
# 2. Does plan include "invoices" feature?
# 3. Has user hit invoice limit this month?
#
# If any check fails:
{
  "error": "Feature not available",
  "required_plan": "basic",
  "current_plan": "trial",
  "upgrade_required": true
}

# Or if limit reached:
{
  "error": "Monthly invoice limit reached",
  "limit": 500,
  "current": 500,
  "upgrade_prompt": "Upgrade to Advanced for 2,000 invoices/month"
}
```

### Expenses (Requires "expenses" feature)
```bash
POST /api/expenses
Authorization: Bearer <user_token>

# If plan doesn't include expenses:
{
  "error": "This feature requires Advanced plan or higher",
  "current_plan": "basic",
  "feature": "expenses",
  "upgrade_options": [
    {
      "plan": "advanced",
      "price": 2999
    },
    {
      "plan": "premium",
      "price": 5999
    }
  ]
}
```

---

## 6️⃣ Middleware Flow

Every protected route goes through this middleware chain:

```
1. verifyToken (existing)
   ↓
2. requireBusiness (existing)
   ↓
3. checkSubscription (NEW)
   - Checks if subscription is active
   - Checks if not expired
   - Attaches subscription details to req.subscription
   ↓
4. requireFeature(featureName) (NEW)
   - Checks if plan includes this module
   - Returns 403 if not available
   ↓
5. checkUsageLimit(feature, limitField) (NEW - optional)
   - Checks monthly/total limits
   - Returns 403 if limit exceeded
   ↓
6. Controller
```

### Example Route Definition
```javascript
// routes/invoiceRoutes.js
import { verifyToken } from '../middlewares/verifyToken.js';
import { requireBusiness } from '../middlewares/requireBusiness.js';
import { checkSubscription } from '../middlewares/checkSubscription.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { checkUsageLimit } from '../middlewares/checkUsageLimit.js';
import { createInvoice } from '../controllers/invoiceController.js';

router.post(
  '/',
  verifyToken,
  requireBusiness,
  checkSubscription,
  requireFeature('invoices'),
  checkUsageLimit('invoices', 'max_invoices_per_month'),
  createInvoice
);
```

---

## 7️⃣ Error Codes & Responses

| Status | Error Type | Description | Response |
|--------|------------|-------------|----------|
| **401** | Unauthorized | No token or invalid token | `{ error: "Authentication required" }` |
| **403** | Forbidden - Role | User doesn't have required role | `{ error: "Access denied" }` |
| **403** | Forbidden - Subscription | Subscription inactive/expired | `{ error: "Subscription expired", action: "renew" }` |
| **403** | Forbidden - Feature | Feature not in plan | `{ error: "Feature not available", upgrade_required: true }` |
| **403** | Forbidden - Limit | Usage limit exceeded | `{ error: "Limit reached", limit: 500, current: 500 }` |
| **404** | Not Found | Resource doesn't exist | `{ error: "Not found" }` |
| **400** | Bad Request | Invalid input | `{ error: "Validation error", details: [...] }` |
| **500** | Server Error | Unexpected error | `{ error: "Internal server error" }` |

---

## 8️⃣ Public Endpoints (No Auth Required)

| Endpoint | Description |
|----------|-------------|
| `GET /api/subscriptions/plans` | List subscription plans |
| `GET /api/invitations/verify/:token` | Verify invitation token |
| `POST /api/invitations/accept` | Accept invitation & create account |

---

## 9️⃣ Rate Limiting (Future Enhancement)

Different rate limits per plan tier:

| Plan | Requests per Minute |
|------|---------------------|
| Trial | 30 |
| Basic | 60 |
| Advanced | 120 |
| Premium | 300 |

---

## 🔟 Webhooks (Future Enhancement)

For premium users, webhook endpoints for events:

| Event | Payload |
|-------|---------|
| `subscription.upgraded` | `{ business_id, from_plan, to_plan, timestamp }` |
| `subscription.downgraded` | `{ business_id, from_plan, to_plan, timestamp }` |
| `subscription.cancelled` | `{ business_id, plan, timestamp }` |
| `usage.limit_reached` | `{ business_id, feature, limit, current }` |

---

## 📝 Notes

1. **Caching:** Subscription details should be cached (Redis) to avoid DB hits on every request
2. **Logging:** All subscription changes, feature access attempts, and limit hits should be logged
3. **Metrics:** Track feature usage, limits hit, upgrade prompts shown
4. **Testing:** Use Postman/Insomnia collections for API testing
5. **Documentation:** Auto-generate API docs using Swagger/OpenAPI

---

## 🎯 Quick Start for Developers

### Testing Superadmin Routes
1. Create system superadmin user in database
2. Login via `/api/auth/system-admin/login`
3. Use returned token for all `/api/superadmin/*` routes

### Testing Feature Gates
1. Create business with Trial plan
2. Try to create invoice → Should fail
3. Upgrade to Basic plan
4. Try again → Should succeed

### Testing Usage Limits
1. Create business with Basic plan (500 invoices/month limit)
2. Create 500 invoices
3. Try to create 501st → Should fail with limit error

---

**Last Updated:** 2026-01-23  
**Version:** 1.0  
**Status:** Proposal Phase
