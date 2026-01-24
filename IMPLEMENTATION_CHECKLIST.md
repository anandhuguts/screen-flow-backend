# 🚀 Subscription System Implementation Checklist

## Phase 1: Database Setup ✅

### Step 1.1: Create New Tables
```bash
# Run these SQL scripts in order
```

- [ ] `subscriptions` table
- [ ] `subscription_plans` table (with seed data)
- [ ] `subscription_history` table
- [ ] `subscription_payments` table
- [ ] `business_invitations` table
- [ ] `feature_usage_logs` table

### Step 1.2: Modify Existing Tables
- [ ] Add fields to `businesses` table:
  - `is_active`
  - `subscription_status`
  - `onboarding_completed`
  - `created_by`
- [ ] Update `profiles` table role constraint
  - Add `system_superadmin` role
  - Add `invitation_accepted`, `invited_by`, `invited_at` fields

### Step 1.3: Create Database Functions
- [ ] `check_subscription_active(business_id)`
- [ ] `has_feature_access(business_id, feature)`
- [ ] `update_expired_subscriptions()` (scheduled job)
- [ ] `track_feature_usage(business_id, feature_name)`

### Step 1.4: Add Indexes
- [ ] `idx_subscriptions_business_id`
- [ ] `idx_subscriptions_status`
- [ ] `idx_businesses_subscription_status`
- [ ] `idx_businesses_is_active`
- [ ] `idx_invitations_token`
- [ ] `idx_invitations_email`
- [ ] `idx_usage_logs_business_month`

---

## Phase 2: Backend Controllers & Services ⚙️

### Step 2.1: Create New Controllers
- [ ] `controllers/superadminController.js`
  - [ ] `createBusiness()`
  - [ ] `getAllBusinesses()`
  - [ ] `getBusinessById()`
  - [ ] `updateBusinessSubscription()`
  - [ ] `suspendBusiness()`
  - [ ] `activateBusiness()`
  - [ ] `deleteBusinessById()`
  - [ ] `getBusinessAnalytics()`
  - [ ] `getPlatformStatistics()`

- [ ] `controllers/subscriptionController.js`
  - [ ] `getSubscription()`
  - [ ] `getAvailablePlans()`
  - [ ] `requestPlanChange()`
  - [ ] `getSubscriptionHistory()`
  - [ ] `checkFeatureAccess()`
  - [ ] `getCurrentUsage()`
  - [ ] `recordPayment()`

- [ ] `controllers/invitationController.js`
  - [ ] `sendInvitation()`
  - [ ] `getInvitationByToken()`
  - [ ] `acceptInvitation()`
  - [ ] `cancelInvitation()`
  - [ ] `getPendingInvitations()`
  - [ ] `resendInvitation()`

### Step 2.2: Create New Services
- [ ] `services/subscriptionService.js`
  - [ ] `validatePlanLimits(business_id, feature, count)`
  - [ ] `trackUsage(business_id, feature)`
  - [ ] `canAccessFeature(business_id, feature)`
  - [ ] `getUsageStats(business_id, month)`
  - [ ] `upgradePlan(business_id, new_plan)`
  - [ ] `downgradePlan(business_id, new_plan)`

- [ ] `services/emailService.js`
  - [ ] `sendBusinessInvitation(email, token, business_name)`
  - [ ] `sendTrialExpiringEmail(business_id)`
  - [ ] `sendSubscriptionExpiredEmail(business_id)`
  - [ ] `sendUpgradeConfirmation(business_id)`

### Step 2.3: Modify Existing Controllers
- [ ] `controllers/authController.js`
  - [ ] Remove auto-business creation from `completeSignup()`
  - [ ] Create new `completeInvitationSignup()`
  - [ ] Create `systemSuperadminLogin()`
  - [ ] Update token payload to include `role`

### Step 2.4: Create Middlewares
- [ ] `middlewares/requireSystemSuperadmin.js`
- [ ] `middlewares/checkSubscription.js`
- [ ] `middlewares/requireFeature.js` (parameterized)
- [ ] `middlewares/checkUsageLimit.js`

---

## Phase 3: Routes Setup 🛣️

### Step 3.1: Create New Route Files
- [ ] `routes/superadminRoutes.js`
  ```javascript
  POST   /api/superadmin/businesses
  GET    /api/superadmin/businesses
  GET    /api/superadmin/businesses/:id
  PATCH  /api/superadmin/businesses/:id
  DELETE /api/superadmin/businesses/:id
  POST   /api/superadmin/businesses/:id/suspend
  POST   /api/superadmin/businesses/:id/activate
  PATCH  /api/superadmin/businesses/:id/subscription
  GET    /api/superadmin/analytics
  GET    /api/superadmin/statistics
  ```

- [ ] `routes/subscriptionRoutes.js`
  ```javascript
  GET    /api/subscriptions/current
  GET    /api/subscriptions/plans
  POST   /api/subscriptions/upgrade
  POST   /api/subscriptions/downgrade
  GET    /api/subscriptions/history
  GET    /api/subscriptions/usage
  POST   /api/subscriptions/payments
  ```

- [ ] `routes/invitationRoutes.js`
  ```javascript
  POST   /api/invitations
  GET    /api/invitations/pending
  GET    /api/invitations/verify/:token
  POST   /api/invitations/accept
  DELETE /api/invitations/:id
  POST   /api/invitations/:id/resend
  ```

### Step 3.2: Update Existing Routes
Update ALL protected routes to include subscription checks:

- [ ] `routes/leadRoutes.js` - Add `requireFeature('leads')`
- [ ] `routes/customerRoutes.js` - Add `requireFeature('customers')`
- [ ] `routes/quotationsRoutes.js` - Add `requireFeature('quotations')`
- [ ] `routes/invoiceRoutes.js` - Add `requireFeature('invoices')` + usage limit
- [ ] `routes/paymentRoutes.js` - Add `requireFeature('payments')`
- [ ] `routes/expenseRoutes.js` - Add `requireFeature('expenses')`
- [ ] `routes/reportRoutes.js` - Add `requireFeature('reports')`
- [ ] `routes/accountRoutes.js` - Add `requireFeature('accounting')`
- [ ] `routes/staffRoutes.js` - Add `requireFeature('staff')`

### Step 3.3: Register Routes in `index.js`
- [ ] Import and mount superadmin routes
- [ ] Import and mount subscription routes
- [ ] Import and mount invitation routes

---

## Phase 4: Frontend - Superadmin Portal 🎨

### Step 4.1: Create Superadmin Layout
- [ ] `src/pages/superadmin/SuperadminLayout.tsx`
  - [ ] Sidebar with navigation
  - [ ] Header with user menu
  - [ ] Protected route (requires system_superadmin role)

### Step 4.2: Dashboard Pages
- [ ] `src/pages/superadmin/Dashboard.tsx`
  - [ ] Stats cards (businesses, revenue, subscriptions)
  - [ ] Charts (subscription growth, revenue trends)
  - [ ] Recent activity feed

- [ ] `src/pages/superadmin/Businesses.tsx`
  - [ ] Data table with search/filter
  - [ ] Business status badges
  - [ ] Action buttons (view, edit, suspend, delete)

- [ ] `src/pages/superadmin/CreateBusiness.tsx`
  - [ ] Form to create new business
  - [ ] Owner details input
  - [ ] Plan selection dropdown
  - [ ] Send invitation checkbox

- [ ] `src/pages/superadmin/BusinessDetails.tsx`
  - [ ] Overview tab
  - [ ] Subscription tab
  - [ ] Billing history tab
  - [ ] Usage statistics tab
  - [ ] Activity logs tab

- [ ] `src/pages/superadmin/Plans.tsx`
  - [ ] View all subscription plans
  - [ ] Edit plan features
  - [ ] Update pricing
  - [ ] Enable/disable plans

- [ ] `src/pages/superadmin/Analytics.tsx`
  - [ ] Revenue charts
  - [ ] Subscription trends
  - [ ] Trial conversion analytics
  - [ ] Churn analysis

### Step 4.3: Create Components
- [ ] `src/components/superadmin/StatCard.tsx`
- [ ] `src/components/superadmin/BusinessTable.tsx`
- [ ] `src/components/superadmin/SubscriptionBadge.tsx`
- [ ] `src/components/superadmin/RevenueChart.tsx`
- [ ] `src/components/superadmin/PlanCard.tsx`

### Step 4.4: API Integration
- [ ] `src/services/superadminApi.ts`
  - [ ] `getAllBusinesses()`
  - [ ] `createBusiness(data)`
  - [ ] `updateBusiness(id, data)`
  - [ ] `suspendBusiness(id)`
  - [ ] `activateBusiness(id)`
  - [ ] `getAnalytics()`

---

## Phase 5: Frontend - User Portal Updates 🔐

### Step 5.1: Update Auth Flow
- [ ] `src/pages/auth/Signup.tsx`
  - [ ] Remove business creation
  - [ ] Add invitation token verification
  - [ ] Show business name from invitation

- [ ] `src/pages/auth/AcceptInvitation.tsx`
  - [ ] New page for invitation acceptance
  - [ ] Token verification
  - [ ] Complete profile form

### Step 5.2: Subscription Management
- [ ] `src/pages/settings/Subscription.tsx`
  - [ ] Current plan display
  - [ ] Feature comparison table
  - [ ] Usage statistics (invoices, users, etc.)
  - [ ] Upgrade/Downgrade buttons
  - [ ] Billing history

- [ ] `src/components/UpgradeModal.tsx`
  - [ ] Plan comparison
  - [ ] Pricing breakdown
  - [ ] Upgrade confirmation

### Step 5.3: Feature Gating UI
- [ ] `src/components/FeatureGate.tsx`
  - [ ] Wrap locked features
  - [ ] Show upgrade prompt
  - [ ] Blur/disable locked content

- [ ] `src/components/UpgradePrompt.tsx`
  - [ ] Inline upgrade CTA
  - [ ] Show plan comparison

- [ ] `src/components/TrialBanner.tsx`
  - [ ] Sticky banner for trial users
  - [ ] Countdown display
  - [ ] Upgrade CTA

### Step 5.4: Team Management
- [ ] `src/pages/settings/Team.tsx`
  - [ ] Invite team members form
  - [ ] Pending invitations list
  - [ ] Active users table
  - [ ] Role management

### Step 5.5: Navigation Updates
- [ ] Update `src/components/Sidebar.tsx`
  - [ ] Conditionally show menu items based on plan
  - [ ] Add lock icons for unavailable features
  - [ ] Tooltips on hover: "Upgrade to Advanced"

### Step 5.6: API Integration
- [ ] `src/services/subscriptionApi.ts`
  - [ ] `getCurrentSubscription()`
  - [ ] `getAvailablePlans()`
  - [ ] `requestUpgrade(plan)`
  - [ ] `getUsageStats()`

- [ ] `src/services/invitationApi.ts`
  - [ ] `sendInvitation(email, role)`
  - [ ] `getPendingInvitations()`
  - [ ] `cancelInvitation(id)`
  - [ ] `acceptInvitation(token)`

---

## Phase 6: Testing 🧪

### Step 6.1: Backend Testing
- [ ] Test superadmin create business flow
- [ ] Test invitation send/accept flow
- [ ] Test subscription upgrade/downgrade
- [ ] Test feature gating (block restricted features)
- [ ] Test usage limits (invoices, products, users)
- [ ] Test trial expiration logic
- [ ] Test subscription status changes
- [ ] Load testing for multi-tenant queries

### Step 6.2: Frontend Testing
- [ ] Test superadmin login
- [ ] Test business creation UI
- [ ] Test subscription management
- [ ] Test feature gates (locked features)
- [ ] Test invitation acceptance
- [ ] Test usage display
- [ ] Test upgrade prompts

### Step 6.3: Integration Testing
- [ ] End-to-end: Create business → Send invite → Accept → Upgrade
- [ ] Test RLS policies (data isolation)
- [ ] Test role-based access
- [ ] Test expired trial handling
- [ ] Test payment recording

---

## Phase 7: Deployment 🚀

### Step 7.1: Database Migration
- [ ] Backup production database
- [ ] Run migration scripts on production
- [ ] Seed subscription plans
- [ ] Create initial system superadmin account
- [ ] Verify all tables and constraints

### Step 7.2: Backend Deployment
- [ ] Update environment variables
- [ ] Deploy updated backend
- [ ] Test API endpoints
- [ ] Monitor logs for errors

### Step 7.3: Frontend Deployment
- [ ] Build production bundle
- [ ] Deploy superadmin portal
- [ ] Deploy updated user portal
- [ ] Test in production

### Step 7.4: Data Migration (Existing Users)
- [ ] Script to migrate existing businesses to Trial plan
- [ ] Set trial expiration dates
- [ ] Send notification emails to existing users

---

## Phase 8: Documentation 📚

- [ ] API documentation for new endpoints
- [ ] Database schema documentation
- [ ] Superadmin user guide
- [ ] Subscription management guide
- [ ] Developer setup instructions
- [ ] Deployment runbook

---

## Phase 9: Monitoring & Analytics 📊

- [ ] Set up metrics tracking
  - [ ] Trial-to-paid conversion rate
  - [ ] Monthly recurring revenue (MRR)
  - [ ] Churn rate
  - [ ] Feature adoption rates
- [ ] Set up alerts
  - [ ] Failed payments
  - [ ] Subscription expirations
  - [ ] Usage limit breaches
- [ ] Create admin dashboards
  - [ ] Revenue dashboard
  - [ ] User growth dashboard

---

## Optional Enhancements 🌟

- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Automated billing
- [ ] Email templates for all notifications
- [ ] Referral program
- [ ] Custom domain support (Premium)
- [ ] White-label branding (Premium)
- [ ] API key generation (Premium)
- [ ] Webhook support
- [ ] Advanced analytics (cohort analysis, LTV)

---

## Timeline Estimate 📅

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Database Setup | 3-4 days |
| Phase 2 | Backend Development | 5-7 days |
| Phase 3 | Routes & Middleware | 2-3 days |
| Phase 4 | Superadmin Portal | 5-6 days |
| Phase 5 | User Portal Updates | 4-5 days |
| Phase 6 | Testing | 4-5 days |
| Phase 7 | Deployment | 2-3 days |
| Phase 8 | Documentation | 2-3 days |
| **Total** | | **27-36 days** |

---

## Key Decisions Needed Before Starting ⚠️

1. **Pricing**: Confirm final pricing for each tier
2. **Payment Gateway**: Which payment provider? (Razorpay/Stripe/Manual)
3. **Trial Duration**: 14 days confirmed?
4. **Grace Period**: How many days after expiration?
5. **Data Retention**: What happens to data after cancellation?
6. **Proration**: How to handle mid-month upgrades/downgrades?
7. **Refund Policy**: Any refunds for downgrades?
8. **Email Provider**: Which service for transactional emails?

---

**Status Tracker:**
- [ ] Proposal Approved
- [ ] Database Schema Finalized
- [ ] Pricing Confirmed
- [ ] Development Started
- [ ] Testing Complete
- [ ] Deployed to Production
- [ ] Documentation Complete
