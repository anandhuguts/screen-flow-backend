# 🐛 Dashboard Bug Fix - Lead Sources Count

## Problem Identified

In your dashboard API response, the `leadSources` had incorrect data:

```json
"leadSources": [
    {
        "source": "phone",
        "count": "phone"  ← BUG: Should be a number like 1
    }
]
```

---

## Root Cause

**File:** `controllers/dashboardController.js`  
**Line:** 88

**Incorrect Code:**
```javascript
const { data: leadSources } = await supabaseAdmin
  .from("leads")
  .select("source, count:source", { group: "source" })  // ❌ Wrong syntax
  .eq("business_id", business_id);
```

**Issue:** The syntax `count:source` doesn't work properly in Supabase. It was returning the source value instead of counting.

---

## Solution Applied

### 1. Updated Controller (✅ Already Done)

Changed to use a PostgreSQL function:

```javascript
const { data: leadSources } = await supabaseAdmin.rpc(
  "get_lead_sources",
  { b_id: business_id }
);
```

---

### 2. Create Database Function (⚠️ YOU NEED TO DO THIS)

**Step 1:** Open Supabase SQL Editor

**Step 2:** Copy and run this SQL:

```sql
CREATE OR REPLACE FUNCTION get_lead_sources(b_id uuid)
RETURNS TABLE (
    source text,
    count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.source,
        COUNT(*)::bigint as count
    FROM leads l
    WHERE l.business_id = b_id
    GROUP BY l.source
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
```

**Step 3:** Test it:

```sql
SELECT * FROM get_lead_sources('76834d81-ce40-43f5-8082-1e08809663ff');
```

**Expected Output:**
```
source  | count
--------+-------
phone   | 1
```

---

## Also Check: Monthly Sales Function

While fixing this, I noticed the dashboard also uses `monthly_sales_summary`. Make sure this function exists:

```sql
CREATE OR REPLACE FUNCTION monthly_sales_summary(b_id uuid)
RETURNS TABLE (
    month text,
    sales numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(p.payment_date, 'Mon') as month,
        SUM(p.amount) as sales
    FROM payments p
    WHERE p.business_id = b_id
      AND p.payment_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY TO_CHAR(p.payment_date, 'Mon'), DATE_PART('month', p.payment_date)
    ORDER BY DATE_PART('month', MIN(p.payment_date));
END;
$$ LANGUAGE plpgsql;
```

---

## Quick Setup (All-in-One)

**File:** `database/dashboard_functions.sql`

Just open that file and run ALL the SQL in Supabase SQL Editor. It will create both functions.

---

## After Running SQL

Restart your backend server:
```bash
# If using nodemon, it should auto-restart
# Otherwise, restart manually
```

Then test the dashboard API:
```http
GET http://localhost:5000/api/dashboard
Authorization: Bearer YOUR_TOKEN
```

---

## Expected Fixed Response

```json
{
    "charts": {
        "sales": [
            {
                "month": "Jan",
                "sales": 236
            }
        ],
        "leadSources": [
            {
                "source": "phone",
                "count": 1  ← ✅ Fixed: Now shows correct number
            }
        ]
    }
}
```

---

## Summary

✅ **Fixed:** Updated `dashboardController.js` to use RPC function  
⚠️ **TODO:** Run SQL to create `get_lead_sources` function  
⚠️ **TODO:** Run SQL to create `monthly_sales_summary` function (if missing)

---

**File Locations:**
- Controller: `controllers/dashboardController.js` (already updated)
- SQL Functions: `database/dashboard_functions.sql` (run this in Supabase)
