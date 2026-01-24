# 🧪 Subscription System - Complete Testing Guide

## Step 1: Create First System Superadmin User

### Option A: Using Existing User (Easiest)
If you already have a user account in your system:

**Run this SQL in Supabase SQL Editor:**
```sql
-- Find your user
SELECT id, name, role, business_id 
FROM profiles 
LIMIT 5;

-- Update to system_superadmin (replace with your user's id)
UPDATE profiles 
SET role = 'system_superadmin',
    business_id = NULL  -- System admins don't belong to a business
WHERE id = 'YOUR-USER-ID-HERE';

-- Verify
SELECT id, name, role, business_id 
FROM profiles 
WHERE role = 'system_superadmin';
```

### Option B: Create New Superadmin (Manual)
If you don't have any users yet:

**1. Create auth user in Supabase:**
- Go to Supabase Dashboard → Authentication → Users
- Click "Add User"
- Email: `admin@yourcompany.com`
- Password: `YourSecurePassword123!`
- Auto Confirm User: ✅ Yes
- Copy the User ID (uuid)

**2. Create profile:**
```sql
-- Replace USER-ID with the ID from step 1
INSERT INTO profiles (id, name, role, business_id, is_active)
VALUES (
  'USER-ID-FROM-STEP-1',
  'System Administrator',
  'system_superadmin',
  NULL,
  true
);
```

---

## Step 2: Get Authentication Token

### Using Supabase Dashboard:
1. Go to Supabase Dashboard → Authentication → Users
2. Click on your admin user
3. Scroll to "User's access token"
4. Click "Generate new access token"
5. Copy the token

### Using API (if you have login endpoint):
```bash
POST http://localhost:5000/api/auth/login
{
  "email": "admin@yourcompany.com",
  "password": "YourSecurePassword123!"
}
```

**Save this token!** You'll use it for all admin requests.

---

## Step 3: Test Platform Statistics

**Request:**
```bash
GET http://localhost:5000/api/superadmin/statistics
Authorization: Bearer YOUR_TOKEN_HERE
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:5000/api/superadmin/statistics" `
  -Headers @{Authorization = "Bearer $token"} `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "statistics": {
    "total_businesses": 0,
    "active_subscriptions": 0,
    "trial_users": 0,
    "monthly_revenue": 0,
    "annual_revenue_projection": 0,
    "plan_distribution": {}
  }
}
```

---

## Step 4: Create First Test Business

**Request:**
```bash
POST http://localhost:5000/api/superadmin/businesses
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "ABC Manufacturing",
  "owner_email": "owner@abc.com",
  "owner_name": "John Doe",
  "owner_phone": "+91-9876543210",
  "plan_type": "trial",
  "send_invitation": true
}
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
  name = "ABC Manufacturing"
  owner_email = "owner@abc.com"
  owner_name = "John Doe"
  owner_phone = "+91-9876543210"
  plan_type = "trial"
  send_invitation = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/superadmin/businesses" `
  -Method POST `
  -Headers @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Business \"ABC Manufacturing\" created successfully",
  "business": {
    "id": "business-uuid",
    "name": "ABC Manufacturing",
    "subscription_status": "trial",
    "plan_type": "trial"
  },
  "subscription": {
    "plan_type": "trial",
    "status": "active",
    "trial_ends_at": "2026-02-06T...",
    "monthly_price": 0
  },
  "invitation": {
    "token": "invitation-token-here",
    "expires_at": "2026-01-30T...",
    "invitation_link": "http://localhost:3000/accept-invitation?token=..."
  }
}
```

**✅ Checkpoint:**
- Business created ✅
- Subscription created ✅
- Chart of accounts seeded ✅
- Invitation sent ✅
- **Save the invitation_token!**

---

## Step 5: Verify Business Created

**Check in Database:**
```sql
-- View the business
SELECT * FROM businesses ORDER BY created_at DESC LIMIT 1;

-- View the subscription
SELECT 
  s.*,
  sp.name as plan_name
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_type = sp.plan_type
ORDER BY s.created_at DESC LIMIT 1;

-- View the invitation
SELECT * FROM business_invitations ORDER BY created_at DESC LIMIT 1;

-- View chart of accounts
SELECT code, name, type 
FROM accounts 
WHERE business_id = 'YOUR-BUSINESS-ID'
ORDER BY code;
```

---

## Step 6: Test Get All Businesses

**Request:**
```bash
GET http://localhost:5000/api/superadmin/businesses
Authorization: Bearer YOUR_TOKEN_HERE
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:5000/api/superadmin/businesses" `
  -Headers @{Authorization = "Bearer $token"} `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:** List of businesses with subscription details

---

## Step 7: Test Invitation Verification (Public Endpoint)

**Request:**
```bash
GET http://localhost:5000/api/invitations/verify/INVITATION_TOKEN_HERE
```

**PowerShell:**
```powershell
$inviteToken = "INVITATION_TOKEN_FROM_STEP_4"
Invoke-WebRequest -Uri "http://localhost:5000/api/invitations/verify/$inviteToken" `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "invitation": {
    "email": "owner@abc.com",
    "role": "superadmin",
    "business_name": "ABC Manufacturing",
    "expires_at": "2026-01-30T..."
  }
}
```

---

## Step 8: Accept Invitation & Create User

**Request:**
```bash
POST http://localhost:5000/api/invitations/accept
Content-Type: application/json

{
  "token": "INVITATION_TOKEN_HERE",
  "name": "John Doe",
  "password": "SecurePassword123!"
}
```

**PowerShell:**
```powershell
$body = @{
  token = "INVITATION_TOKEN_FROM_STEP_4"
  name = "John Doe"
  password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/invitations/accept" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "owner@abc.com",
    "role": "superadmin",
    "business_id": "business-uuid"
  },
  "token": "JWT_TOKEN_FOR_BUSINESS_OWNER"
}
```

**✅ Checkpoint:**
- User created in auth ✅
- Profile created ✅
- Linked to business ✅
- Invitation marked as accepted ✅
- **Save the new user's token!**

---

## Step 9: Test Business User Endpoints

Now using the **business owner's token** (from Step 8):

### 9.1: Get Current Subscription
```powershell
$businessToken = "TOKEN_FROM_STEP_8"
Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/current" `
  -Headers @{Authorization = "Bearer $businessToken"} `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:** Trial subscription details with usage stats

### 9.2: Get Subscription History
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/history" `
  -Headers @{Authorization = "Bearer $businessToken"} `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

### 9.3: Check Usage Stats
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/usage" `
  -Headers @{Authorization = "Bearer $businessToken"} `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:**
```json
{
  "success": true,
  "month": "2026-01",
  "usage": {
    "invoices": 0,
    "quotations": 0,
    "payments": 0,
    "users": 1,
    "products": 0,
    "customers": 0
  }
}
```

---

## Step 10: Test Upgrade Subscription

**Request:**
```bash
POST http://localhost:5000/api/subscriptions/upgrade
Authorization: Bearer BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "plan_type": "basic"
}
```

**PowerShell:**
```powershell
$businessToken = "TOKEN_FROM_STEP_8"
$body = @{plan_type = "basic"} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/upgrade" `
  -Method POST `
  -Headers @{
    Authorization = "Bearer $businessToken"
    "Content-Type" = "application/json"
  } `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:** Upgraded from trial to basic

**Verify in Database:**
```sql
SELECT plan_type, status, monthly_price 
FROM subscriptions 
WHERE business_id = 'YOUR_BUSINESS_ID';

SELECT * FROM subscription_history 
WHERE business_id = 'YOUR_BUSINESS_ID'
ORDER BY created_at DESC;
```

---

## Step 11: Test Team Invitation

Business owner invites a staff member:

**Request:**
```bash
POST http://localhost:5000/api/invitations
Authorization: Bearer BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "email": "staff@abc.com",
  "role": "staff"
}
```

**PowerShell:**
```powershell
$businessToken = "TOKEN_FROM_STEP_8"
$body = @{
  email = "staff@abc.com"
  role = "staff"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/invitations" `
  -Method POST `
  -Headers @{
    Authorization = "Bearer $businessToken"
    "Content-Type" = "application/json"
  } `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:** Invitation sent to staff member

---

## Step 12: Test Superadmin Can Change Subscription

**Request:**
```bash
PATCH http://localhost:5000/api/superadmin/businesses/BUSINESS_ID/subscription
Authorization: Bearer SYSTEM_ADMIN_TOKEN
Content-Type: application/json

{
  "plan_type": "premium",
  "reason": "Upgraded for testing"
}
```

**Expected:** Subscription changed by system admin

---

## ✅ Testing Checklist

After completing all steps, verify:

### Database Checks:
- [ ] System superadmin user exists with `role = 'system_superadmin'`
- [ ] Business created with subscription
- [ ] Subscription plan is correct (trial → basic → premium)
- [ ] Chart of accounts seeded (15 accounts)
- [ ] Business owner profile created
- [ ] Invitation marked as accepted
- [ ] Subscription history logged

### API Checks:
- [ ] Can get platform statistics
- [ ] Can create business
- [ ] Can list all businesses
- [ ] Can verify invitation token
- [ ] Can accept invitation
- [ ] Can get current subscription
- [ ] Can get usage stats
- [ ] Can upgrade subscription
- [ ] Can send team invitations
- [ ] System admin can change subscriptions

### Error Checks:
- [ ] Invalid token returns 401
- [ ] Non-admin can't access /superadmin routes
- [ ] Expired invitation returns error
- [ ] Duplicate email returns error

---

## 🐛 Troubleshooting

### Error: "system_superadmin access required"
**Fix:** Make sure you updated the role in step 1

### Error: "No token provided"
**Fix:** Check Authorization header format: `Bearer YOUR_TOKEN`

### Error: "Invitation not found"
**Fix:** Check token is correct and not expired

### Error: "Cannot find module"
**Fix:** Restart the server after creating new files

---

## 📊 Expected Database State After Testing

```sql
-- Should have:
SELECT COUNT(*) as total_businesses FROM businesses;           -- 1
SELECT COUNT(*) as total_subscriptions FROM subscriptions;     -- 1
SELECT COUNT(*) as total_profiles FROM profiles;               -- 2 (admin + owner)
SELECT COUNT(*) as total_invitations FROM business_invitations; -- 2
SELECT COUNT(*) as total_history FROM subscription_history;    -- 2-3
```

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Option A:** Update existing routes with subscription checks
2. **Option B:** Start building frontend Superadmin Portal
3. **Option C:** Write automated tests (Jest/Mocha)

---

**Testing Status:** Ready to begin!  
**Estimated Time:** 30-45 minutes  
**Let me know when you're ready to start!** 🚀
