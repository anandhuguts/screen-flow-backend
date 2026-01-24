# 🚀 Multi-Tenant Subscription System - Complete Proposal

## 📋 Executive Summary

Transform your current self-service business creation model into a **superadmin-controlled subscription-based multi-tenant system** with tiered feature access.

### Current State
- ✅ Users visit website → Create account → Business auto-created
- ✅ Single role: "superadmin" (business owner)
- ✅ No subscription tiers
- ✅ All features available to everyone

### Proposed State
- 🎯 **Superadmin Portal** → Creates businesses manually
- 🎯 **Subscription Tiers**: Trial, Basic, Advanced, Premium
- 🎯 **Feature Gating**: Based on subscription level
- 🎯 **User Invitations**: Businesses invite their own users
- 🎯 **Billing Management**: Track subscriptions, renewals, payments

---

## 🗄️ Database Schema Changes

### 1. **New Table: `subscriptions`**
```sql
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  plan_type text NOT NULL CHECK (plan_type = ANY (ARRAY[
    'trial'::text, 
    'basic'::text, 
    'advanced'::text, 
    'premium'::text
  ])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY[
    'active'::text, 
    'suspended'::text, 
    'cancelled'::text, 
    'expired'::text
  ])),
  start_date timestamp without time zone DEFAULT now(),
  end_date timestamp without time zone,
  trial_ends_at timestamp without time zone,
  monthly_price numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_business_id_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE
);

-- Add index for quick lookups
CREATE INDEX idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
```

### 2. **New Table: `subscription_plans`**
```sql
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_type text NOT NULL UNIQUE CHECK (plan_type = ANY (ARRAY[
    'trial'::text, 
    'basic'::text, 
    'advanced'::text, 
    'premium'::text
  ])),
  name text NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  max_users integer,
  max_invoices_per_month integer,
  max_products integer,
  max_customers integer,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  trial_days integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

-- Seed default plans
INSERT INTO public.subscription_plans (plan_type, name, description, monthly_price, features, trial_days, max_users, max_invoices_per_month, max_products, max_customers) VALUES
('trial', 'Trial Plan', '14-day free trial with limited features', 0, 
  '{"modules": ["leads", "customers", "quotations"], "advanced_reports": false, "api_access": false, "priority_support": false, "custom_branding": false}'::jsonb, 
  14, 2, 50, 100, 50),

('basic', 'Basic Plan', 'Essential features for small businesses', 999, 
  '{"modules": ["leads", "customers", "quotations", "invoices", "payments", "products"], "advanced_reports": false, "api_access": false, "priority_support": false, "custom_branding": false}'::jsonb, 
  0, 5, 500, 1000, 500),

('advanced', 'Advanced Plan', 'For growing businesses with advanced needs', 2999, 
  '{"modules": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports", "accounting"], "advanced_reports": true, "api_access": false, "priority_support": true, "custom_branding": false}'::jsonb, 
  0, 15, 2000, 5000, 2000),

('premium', 'Premium Plan', 'Complete solution with all features', 5999, 
  '{"modules": ["leads", "customers", "quotations", "invoices", "payments", "products", "expenses", "reports", "accounting", "inventory", "staff"], "advanced_reports": true, "api_access": true, "priority_support": true, "custom_branding": true, "white_label": true}'::jsonb, 
  0, NULL, NULL, NULL, NULL);
```

### 3. **New Table: `subscription_history`**
```sql
CREATE TABLE public.subscription_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  from_plan text,
  to_plan text NOT NULL,
  reason text,
  changed_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscription_history_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_history_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT subscription_history_changed_by_fkey FOREIGN KEY (changed_by) 
    REFERENCES public.profiles(id)
);
```

### 4. **New Table: `subscription_payments`**
```sql
CREATE TABLE public.subscription_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_date timestamp without time zone DEFAULT now(),
  payment_reference text,
  invoice_number text,
  status text NOT NULL DEFAULT 'completed'::text CHECK (status = ANY (ARRAY[
    'completed'::text, 
    'pending'::text, 
    'failed'::text, 
    'refunded'::text
  ])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT subscription_payments_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_payments_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT subscription_payments_subscription_fkey FOREIGN KEY (subscription_id) 
    REFERENCES public.subscriptions(id) ON DELETE CASCADE
);
```

### 5. **Modify Existing Tables**

#### `businesses` table modifications
```sql
-- Add subscription-related fields
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial'::text 
    CHECK (subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text])),
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD CONSTRAINT businesses_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.profiles(id);

-- Add index
CREATE INDEX idx_businesses_subscription_status ON public.businesses(subscription_status);
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active);
```

#### `profiles` table modifications
```sql
-- Add new role for system superadmin
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY[
    'system_superadmin'::text,  -- NEW: Platform administrator
    'superadmin'::text,          -- Business owner
    'staff'::text                -- Regular staff
  ]));

-- Add field to track if user accepted invitation
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS invitation_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invited_at timestamp without time zone;
```

### 6. **New Table: `business_invitations`**
```sql
CREATE TABLE public.business_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['superadmin'::text, 'staff'::text])),
  invited_by uuid NOT NULL,
  invitation_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'accepted'::text, 
    'expired'::text, 
    'cancelled'::text
  ])),
  expires_at timestamp without time zone NOT NULL,
  accepted_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT business_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT business_invitations_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_invitations_invited_by_fkey FOREIGN KEY (invited_by) 
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_invitations_token ON public.business_invitations(invitation_token);
CREATE INDEX idx_invitations_email ON public.business_invitations(email);
```

### 7. **New Table: `feature_usage_logs`**
```sql
CREATE TABLE public.feature_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 1,
  month text NOT NULL, -- Format: YYYY-MM
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT feature_usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT feature_usage_logs_business_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT feature_usage_logs_unique UNIQUE (business_id, feature_name, month)
);

CREATE INDEX idx_usage_logs_business_month ON public.feature_usage_logs(business_id, month);
```

---

## 🎨 Subscription Tier Comparison

| Feature | Trial | Basic | Advanced | Premium |
|---------|-------|-------|----------|---------|
| **Duration** | 14 days | Monthly | Monthly | Monthly |
| **Price** | ₹0 | ₹999/mo | ₹2,999/mo | ₹5,999/mo |
| **Max Users** | 2 | 5 | 15 | Unlimited |
| **Max Products** | 100 | 1,000 | 5,000 | Unlimited |
| **Max Customers** | 50 | 500 | 2,000 | Unlimited |
| **Max Invoices/Month** | 50 | 500 | 2,000 | Unlimited |
| **Leads** | ✅ | ✅ | ✅ | ✅ |
| **Customers** | ✅ | ✅ | ✅ | ✅ |
| **Quotations** | ✅ | ✅ | ✅ | ✅ |
| **Invoices** | ❌ | ✅ | ✅ | ✅ |
| **Payments** | ❌ | ✅ | ✅ | ✅ |
| **Products** | ❌ | ✅ | ✅ | ✅ |
| **Expenses** | ❌ | ❌ | ✅ | ✅ |
| **Inventory** | ❌ | ❌ | ❌ | ✅ |
| **Staff Management** | ❌ | ❌ | ❌ | ✅ |
| **Accounting & Reports** | ❌ | ❌ | ✅ | ✅ |
| **Advanced Reports** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ✅ |
| **Custom Branding** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |

---

## 🔧 Backend Changes Required

### 1. **New Controllers**

#### `controllers/superadminController.js`
```javascript
// Create business (system superadmin only)
export async function createBusiness(req, res) {}
export async function updateBusinessSubscription(req, res) {}
export async function suspendBusiness(req, res) {}
export async function activateBusiness(req, res) {}
export async function getAllBusinesses(req, res) {}
export async function getBusinessAnalytics(req, res) {}
```

#### `controllers/subscriptionController.js`
```javascript
// Get current subscription details
export async function getSubscription(req, res) {}
// Request plan upgrade/downgrade
export async function requestPlanChange(req, res) {}
// Get subscription history
export async function getSubscriptionHistory(req, res) {}
// Check feature access
export async function checkFeatureAccess(req, res) {}
// Track feature usage
export async function trackFeatureUsage(req, res) {}
```

#### `controllers/invitationController.js`
```javascript
// Send invitation to join business
export async function sendInvitation(req, res) {}
// Accept invitation
export async function acceptInvitation(req, res) {}
// Cancel invitation
export async function cancelInvitation(req, res) {}
// Get pending invitations
export async function getPendingInvitations(req, res) {}
```

### 2. **New Middlewares**

#### `middlewares/requireSystemSuperadmin.js`
```javascript
export const requireSystemSuperadmin = async (req, res, next) => {
  if (req.user.role !== 'system_superadmin') {
    return res.status(403).json({ error: 'System superadmin access required' });
  }
  next();
};
```

#### `middlewares/checkSubscription.js`
```javascript
export const checkSubscription = async (req, res, next) => {
  // Check if business subscription is active
  // Attach subscription details to req.subscription
};
```

#### `middlewares/requireFeature.js`
```javascript
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    // Check if business plan includes this feature
    // Check usage limits (invoices/month, users, etc.)
  };
};
```

### 3. **Modify Existing Controllers**

#### `controllers/authController.js`
**MAJOR CHANGES:**
- ❌ Remove auto-business creation on signup
- ✅ Add invitation-based signup flow
- ✅ Add system superadmin login
- ✅ Verify invitation token before account creation

```javascript
// OLD FLOW (Remove)
export async function completeSignup(req, res) {
  // Create business automatically ❌
}

// NEW FLOWS (Add)
export async function completeInvitationSignup(req, res) {
  // Verify invitation token
  // Create user account
  // Link to existing business
  // Mark invitation as accepted
}

export async function systemSuperadminLogin(req, res) {
  // Separate login for system admins
}
```

### 4. **New Routes**

#### `routes/superadminRoutes.js`
```javascript
router.post('/businesses', requireSystemSuperadmin, createBusiness);
router.get('/businesses', requireSystemSuperadmin, getAllBusinesses);
router.patch('/businesses/:id/subscription', requireSystemSuperadmin, updateBusinessSubscription);
router.post('/businesses/:id/suspend', requireSystemSuperadmin, suspendBusiness);
router.post('/businesses/:id/activate', requireSystemSuperadmin, activateBusiness);
router.get('/analytics', requireSystemSuperadmin, getBusinessAnalytics);
```

#### `routes/subscriptionRoutes.js`
```javascript
router.get('/current', verifyToken, requireBusiness, getSubscription);
router.post('/upgrade', verifyToken, requireBusiness, requestPlanChange);
router.get('/history', verifyToken, requireBusiness, getSubscriptionHistory);
router.get('/plans', getAvailablePlans); // Public endpoint
```

#### `routes/invitationRoutes.js`
```javascript
router.post('/', verifyToken, requireBusiness, sendInvitation);
router.post('/accept', acceptInvitation); // Public with token
router.delete('/:id', verifyToken, requireBusiness, cancelInvitation);
router.get('/pending', verifyToken, requireBusiness, getPendingInvitations);
```

### 5. **Modify All Protected Routes**
Add feature checking to existing routes:

```javascript
// Example: Invoice routes
router.post('/', 
  verifyToken, 
  requireBusiness, 
  checkSubscription,
  requireFeature('invoices'),  // NEW
  createInvoice
);
```

### 6. **Database Functions & Triggers**

```sql
-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_active(p_business_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE business_id = p_business_id 
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  p_business_id uuid, 
  p_feature text
)
RETURNS boolean AS $$
DECLARE
  v_features jsonb;
BEGIN
  SELECT sp.features INTO v_features
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_type = sp.plan_type
  WHERE s.business_id = p_business_id
  AND s.status = 'active';
  
  RETURN v_features->'modules' ? p_feature;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update subscription status when end_date is reached
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE end_date < now() AND status = 'active';
END;
$$ LANGUAGE plpgsql;
```

---

## 💻 Frontend / UI Changes

### 1. **New Superadmin Portal**

A completely separate admin dashboard accessible only to system superadmins.

#### **Pages Required:**

1. **Dashboard** (`/superadmin`)
   - Total businesses count
   - Active subscriptions breakdown
   - Revenue analytics (monthly/yearly)
   - New signups this month
   - Trial conversions rate
   - Quick actions

2. **Businesses Management** (`/superadmin/businesses`)
   - List all businesses (table with search/filter)
   - Columns: Name, Owner, Plan, Status, Created Date, Actions
   - Actions: View Details, Edit, Suspend, Activate, Delete
   - Create New Business button

3. **Create Business** (`/superadmin/businesses/new`)
   - Business details form
   - Owner information (name, email, phone)
   - Select subscription plan
   - Set trial/start date
   - Send invitation checkbox

4. **Business Details** (`/superadmin/businesses/:id`)
   - Overview tab
   - Subscription history
   - Payment history
   - Usage statistics
   - Activity logs
   - Actions: Change Plan, Suspend, Send Message

5. **Subscription Plans** (`/superadmin/plans`)
   - View all plans
   - Edit plan features
   - Update pricing
   - Enable/disable plans

6. **Analytics** (`/superadmin/analytics`)
   - Revenue charts
   - Subscription trends
   - Feature usage across all businesses
   - Churn rate
   - Trial-to-paid conversion

7. **System Settings** (`/superadmin/settings`)
   - Platform configuration
   - Email templates
   - Notification settings
   - Security settings

#### **UI Design Inspiration:**

**Color Scheme:**
- Primary: Deep Purple (#6366F1)
- Secondary: Cyan (#06B6D4)
- Success: Emerald (#10B981)
- Warning: Amber (#F59E0B)
- Danger: Red (#EF4444)
- Background: Dark slate (#0F172A)
- Cards: Slate (#1E293B)

**Key Features:**
- Dark theme by default
- Sidebar navigation with icons
- Real-time stats with animated counters
- Charts using Chart.js or Recharts
- Data tables with sorting, filtering, export
- Modal-based forms for quick actions
- Toast notifications for feedback

### 2. **Modified User Portal**

#### **Changes to Existing App:**

1. **Signup Flow**
   - ❌ Remove business creation
   - ✅ Invitation-only signup
   - User lands on invitation link → Completes profile → Joins business

2. **New Subscription Page** (`/settings/subscription`)
   - Current plan details
   - Features included/excluded
   - Usage stats (invoices this month, users, etc.)
   - Upgrade/Downgrade buttons
   - Billing history
   - Payment methods

3. **Feature Gating UI**
   - Locked features show upgrade prompts
   - Tooltips on disabled menu items
   - Modal: "This feature requires Advanced plan"
   - Comparison table with "Upgrade Now" CTA

4. **Settings → Team** (`/settings/team`)
   - Invite team members
   - Manage roles
   - View pending invitations
   - Disable users (if within user limit)

5. **Trial Banner**
   - Sticky banner at top: "Trial ends in X days"
   - Call-to-action: "Upgrade Now"
   - Dismissible but reappears daily

### 3. **Landing/Marketing Pages**

1. **Pricing Page** (`/pricing`)
   - Comparison table of all plans
   - Monthly/Yearly toggle
   - Highlighted "Popular" badge on Advanced
   - Feature checkmarks
   - "Start Free Trial" buttons
   - FAQ section

2. **Contact Sales** (`/contact`)
   - Form for enterprises
   - Custom plan requests

---

## 📊 Feature Gating Examples

### Module-Based Access
```javascript
// In middleware
const PLAN_MODULES = {
  trial: ['leads', 'customers', 'quotations'],
  basic: ['leads', 'customers', 'quotations', 'invoices', 'payments', 'products'],
  advanced: ['leads', 'customers', 'quotations', 'invoices', 'payments', 'products', 'expenses', 'reports', 'accounting'],
  premium: ['*'] // All modules
};
```

### Usage Limits
```javascript
// Check before creating invoice
const currentMonthInvoices = await getInvoiceCountThisMonth(business_id);
const plan = await getBusinessPlan(business_id);

if (plan.max_invoices_per_month && currentMonthInvoices >= plan.max_invoices_per_month) {
  return res.status(403).json({
    error: 'Invoice limit reached',
    limit: plan.max_invoices_per_month,
    current: currentMonthInvoices,
    upgrade_required: true
  });
}
```

---

## 🔐 Security Considerations

1. **Row Level Security (RLS)** - Update Supabase policies
   - System superadmin can access all data
   - Regular users only see their business data
   - Subscription status check on all queries

2. **API Rate Limiting**
   - Different limits per plan tier
   - Premium gets higher API rate limits

3. **Audit Logging**
   - Log all superadmin actions
   - Track plan changes
   - Monitor suspicious activity

---

## 📈 Implementation Roadmap

### Phase 1: Database & Backend (Week 1-2)
- [ ] Create new database tables
- [ ] Add migrations
- [ ] Seed subscription plans
- [ ] Create superadmin controllers
- [ ] Create subscription middleware
- [ ] Update auth flow
- [ ] Update all routes with feature checks

### Phase 2: Superadmin Portal (Week 3-4)
- [ ] Build superadmin dashboard
- [ ] Build business management
- [ ] Build analytics page
- [ ] Build plan management
- [ ] Test all superadmin flows

### Phase 3: User Portal Updates (Week 5)
- [ ] Update signup flow
- [ ] Build subscription page
- [ ] Add feature gating UI
- [ ] Add team invitation
- [ ] Add trial banner

### Phase 4: Testing & Polish (Week 6)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

---

## 💡 Additional Feature Ideas

### Auto-Upgrade Prompts
- When user tries locked feature, show inline upgrade prompt
- "Create unlimited invoices" → Upgrade to Basic

### Usage Analytics Dashboard
- Show business owner their usage vs limits
- "You've used 45/500 invoices this month"

### Referral Program
- Existing customers get discount for referrals
- Track in `referrals` table

### Granular Permissions
- Even within same business, restrict features per user role
- Staff can create invoices but not delete

### API Keys (Premium Only)
- Generate API keys for integrations
- Track API usage per business

### Custom Domains (Premium)
- White-label the app with custom domain
- Custom branding (logo, colors)

### Automated Billing
- Integration with payment gateway
- Auto-charge on renewal
- Invoice generation for subscriptions

### Grace Period
- 7-day grace period after subscription expires
- Read-only access during grace period

---

## 🎯 Success Metrics

Track these KPIs:
- Trial → Paid conversion rate
- Monthly Recurring Revenue (MRR)
- Churn rate
- Average revenue per user (ARPU)
- Feature adoption rates
- Customer lifetime value (CLV)

---

## 📞 Next Steps

1. **Review this proposal** and provide feedback
2. **Approve database schema changes**
3. **Define exact feature list** for each tier
4. **Set pricing** (currently suggested in INR)
5. **Start Phase 1 implementation**

---

**Questions? Let's discuss!** 🚀
