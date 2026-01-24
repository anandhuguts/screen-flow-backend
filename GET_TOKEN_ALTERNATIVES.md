# 🔑 Alternative: Get Token Without Script

Since the automated token generation isn't working, here are **3 easy alternatives**:

---

## Option 1: Use Existing Login (Easiest if you have credentials)

If you know the password for the **designpods** user:

### Find the email first:
```sql
SELECT 
  au.id,
  au.email,
  p.name,
  p.role
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.id = '83e78d45-a92c-4dde-9c7f-da4eb3b06571';
```

### Then login via your existing API:
```powershell
$body = @{
  email = "EMAIL_FROM_ABOVE"
  password = "YOUR_PASSWORD"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

This will give you the token!

---

## Option 2: Create a New Test Superadmin (Cleanest)

Let's create a fresh system superadmin just for testing:

### Step 1: Create user in Supabase Auth
Go to **Supabase Dashboard** → **Authentication** → **Users** → **Add User**

**Email:** `superadmin@test.com`  
**Password:** `TestAdmin123!`  
**Auto Confirm User:** ✅ Yes

**Copy the User ID** (it will be a UUID like `abc123...`)

### Step 2: Create profile
```sql
-- Replace USER_ID_HERE with the ID from Step 1
INSERT INTO profiles (id, name, role, business_id, is_active)
VALUES (
  'USER_ID_HERE',
  'Test System Admin',
  'system_superadmin',
  NULL,
  true
);
```

### Step 3: Login and get token
```powershell
$body = @{
  email = "superadmin@test.com"
  password = "TestAdmin123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## Option 3: Test Without Full Auth (Quick Check)

We can at least test the **public endpoints** that don't require authentication:

### Test 1: Get Subscription Plans (Works without token)
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/plans" `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:** JSON with 4 subscription plans ✅

### Test 2: Check Server Health
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/" `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected:** `{"message": "Backend running 🚀"}`

---

## 🎯 Recommended Approach

**I recommend Option 2** (Create new test superadmin):
- ✅ Clean and doesn't affect existing users
- ✅ You'll know the password
- ✅ Can easily login and get token
- ✅ Takes only 2 minutes

---

## ⚡ Quick Steps Summary (Option 2)

1. **Supabase Dashboard** → Authentication → Users → **Add User**
   - Email: `admin@test.local`
   - Password: `Admin123!`
   - Auto-confirm: Yes
   - **Copy the User ID**

2. **SQL Editor** → Run:
```sql
INSERT INTO profiles (id, name, role, business_id, is_active)
VALUES (
  'PASTE_USER_ID_HERE',
  'System Admin',
  'system_superadmin',
  NULL,
  true
);
```

3. **Test login:**
```powershell
$body = @{email="admin@test.local"; password="Admin123!"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing | Select-Object -ExpandProperty Content
```

4. **Copy the token** from response and use it!

---

**Which option do you want to try?** Let me know and I'll guide you through it! 🚀
