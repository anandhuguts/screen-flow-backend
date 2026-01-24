import { supabaseAdmin } from "../supabase/supabaseAdmin.js";
import crypto from "crypto";
import { sendInvitationEmail } from "../services/emailService.js";

// ========================================
// CREATE NEW BUSINESS
// ========================================
export async function createBusiness(req, res) {
  try {
    const { 
      name, 
      owner_email, 
      owner_name, 
      owner_phone, 
      plan_type = 'trial',
      send_invitation = true 
    } = req.body;

    // Validate required fields
    if (!name || !owner_email || !owner_name) {
      return res.status(400).json({ 
        error: "Business name, owner email, and owner name are required" 
      });
    }

    // Validate plan type
    const validPlans = ['trial', 'basic', 'advanced', 'premium'];
    if (!validPlans.includes(plan_type)) {
      return res.status(400).json({ 
        error: `Invalid plan type. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Check if email already exists in auth system
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!authError) {
      const existingAuthUser = authUsers.users.find(u => u.email === owner_email);
      if (existingAuthUser) {
        return res.status(400).json({ 
          error: "A user with this email already exists in the system" 
        });
      }
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await supabaseAdmin
      .from('business_invitations')
      .select('id, business_id, status')
      .eq('email', owner_email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return res.status(400).json({ 
        error: "An invitation has already been sent to this email. Please wait for them to accept or cancel the existing invitation first." 
      });
    }

    // 1. Create business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name,
        phone: owner_phone,
        email: owner_email,
        is_active: true,
        subscription_status: plan_type === 'trial' ? 'trial' : 'active',
        onboarding_completed: false,
        created_by: req.user.id // System superadmin who created it
      })
      .select()
      .single();

    if (businessError) throw businessError;

    // 2. Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', plan_type)
      .single();

    if (planError) throw planError;

    // 3. Create subscription
    const trial_ends_at = plan_type === 'trial' 
      ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000)
      : null;

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        business_id: business.id,
        plan_type,
        status: 'active',
        start_date: new Date(),
        trial_ends_at,
        monthly_price: plan.monthly_price
      })
      .select()
      .single();

    if (subscriptionError) throw subscriptionError;

    // 4. Seed Chart of Accounts for the business
    await seedDefaultAccounts(business.id);

    // 5. Create invitation if requested
    let invitation = null;
    if (send_invitation) {
      const invitation_token = crypto.randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { data: inv, error: invError } = await supabaseAdmin
        .from('business_invitations')
        .insert({
          business_id: business.id,
          email: owner_email,
          role: 'superadmin',
          invited_by: req.user.id,
          invitation_token,
          status: 'pending',
          expires_at
        })
        .select()
        .single();

      if (invError) throw invError;
      
      const invitation_link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitation_token}`;

      // Send invitation email
      try {
        await sendInvitationEmail(owner_email, name, invitation_link, 'Business Owner');
        console.log(`📧 Invitation email sent to: ${owner_email}`);
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
      }
      
      invitation = {
        token: invitation_token,
        expires_at,
        invitation_link
      };
    }

    res.json({
      success: true,
      message: `Business "${name}" created successfully`,
      business: {
        id: business.id,
        name: business.name,
        subscription_status: business.subscription_status,
        plan_type
      },
      subscription: {
        plan_type,
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
        monthly_price: subscription.monthly_price
      },
      invitation: send_invitation ? invitation : null
    });

  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: error.message || "Failed to create business" });
  }
}

// ========================================
// GET ALL BUSINESSES
// ========================================
export async function getAllBusinesses(req, res) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      plan_type = '',
      status = '' 
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('businesses')
      .select(`
        id,
        name,
        email,
        phone,
        is_active,
        subscription_status,
        created_at,
        subscriptions (
          plan_type,
          status,
          start_date,
          trial_ends_at,
          monthly_price
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (status) {
      query = query.eq('subscription_status', status);
    }

    // Pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: businesses, error, count } = await query;

    if (error) throw error;

    // Enhance with plan details
    const enrichedBusinesses = businesses.map(business => ({
      ...business,
      subscription: business.subscriptions?.[0] || null
    }));

    res.json({
      success: true,
      businesses: enrichedBusinesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get all businesses error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch businesses" });
  }
}

// ========================================
// GET BUSINESS BY ID
// ========================================
export async function getBusinessById(req, res) {
  try {
    const { id } = req.params;

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select(`
        *,
        subscriptions (*),
        profiles (id, name, role, is_active)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json({
      success: true,
      business
    });

  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch business" });
  }
}

// ========================================
// UPDATE SUBSCRIPTION
// ========================================
export async function updateBusinessSubscription(req, res) {
  try {
    const { id } = req.params;
    const { plan_type, reason } = req.body;

    // Validate plan type
    const validPlans = ['trial', 'basic', 'advanced', 'premium'];
    if (!validPlans.includes(plan_type)) {
      return res.status(400).json({ 
        error: `Invalid plan type. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Get current subscription
    const { data: currentSub, error: currentError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('business_id', id)
      .single();

    if (currentError) throw currentError;

    // Get new plan details
    const { data: newPlan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', plan_type)
      .single();

    if (planError) throw planError;

    // Update subscription
    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_type,
        monthly_price: newPlan.monthly_price,
        updated_at: new Date()
      })
      .eq('business_id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to history
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        business_id: id,
        subscription_id: currentSub.id,
        from_plan: currentSub.plan_type,
        to_plan: plan_type,
        reason: reason || `Changed by superadmin ${req.user.name}`,
        changed_by: req.user.id
      });

    // Update business status
    await supabaseAdmin
      .from('businesses')
      .update({
        subscription_status: plan_type === 'trial' ? 'trial' : 'active'
      })
      .eq('id', id);

    res.json({
      success: true,
      message: `Subscription updated from ${currentSub.plan_type} to ${plan_type}`,
      subscription: updatedSub
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: error.message || "Failed to update subscription" });
  }
}

// ========================================
// SUSPEND BUSINESS
// ========================================
export async function suspendBusiness(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Update business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .update({
        is_active: false,
        subscription_status: 'suspended'
      })
      .eq('id', id)
      .select()
      .single();

    if (businessError) throw businessError;

    // Update subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'suspended'
      })
      .eq('business_id', id);

    // Log to history
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        business_id: id,
        subscription_id: business.id,
        from_plan: null,
        to_plan: 'suspended',
        reason: reason || `Suspended by superadmin ${req.user.name}`,
        changed_by: req.user.id
      });

    res.json({
      success: true,
      message: `Business "${business.name}" has been suspended`,
      business
    });

  } catch (error) {
    console.error('Suspend business error:', error);
    res.status(500).json({ error: error.message || "Failed to suspend business" });
  }
}

// ========================================
// ACTIVATE BUSINESS
// ========================================
export async function activateBusiness(req, res) {
  try {
    const { id } = req.params;

    // Get current subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type')
      .eq('business_id', id)
      .single();

    // Update business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .update({
        is_active: true,
        subscription_status: subscription?.plan_type === 'trial' ? 'trial' : 'active'
      })
      .eq('id', id)
      .select()
      .single();

    if (businessError) throw businessError;

    // Update subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active'
      })
      .eq('business_id', id);

    res.json({
      success: true,
      message: `Business "${business.name}" has been activated`,
      business
    });

  } catch (error) {
    console.error('Activate business error:', error);
    res.status(500).json({ error: error.message || "Failed to activate business" });
  }
}

// ========================================
// GET PLATFORM STATISTICS
// ========================================
export async function getPlatformStatistics(req, res) {
  try {
    // Total businesses
    const { count: totalBusinesses } = await supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true });

    // Active subscriptions
    const { count: activeSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Trial users
    const { count: trialUsers } = await supabaseAdmin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan_type', 'trial')
      .eq('status', 'active');

    // Revenue calculation
    const { data: paidSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('monthly_price')
      .eq('status', 'active')
      .neq('plan_type', 'trial');

    const monthlyRevenue = paidSubscriptions?.reduce(
      (sum, sub) => sum + (parseFloat(sub.monthly_price) || 0), 
      0
    ) || 0;

    // Plan distribution
    const { data: planDistribution } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type')
      .eq('status', 'active');

    const planCounts = planDistribution?.reduce((acc, sub) => {
      acc[sub.plan_type] = (acc[sub.plan_type] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      statistics: {
        total_businesses: totalBusinesses || 0,
        active_subscriptions: activeSubscriptions || 0,
        trial_users: trialUsers || 0,
        monthly_revenue: monthlyRevenue,
        annual_revenue_projection: monthlyRevenue * 12,
        plan_distribution: planCounts
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch statistics" });
  }
}

// ========================================
// GET ALL PLANS (ADMIN)
// ========================================
export async function getAllPlans(req, res) {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('monthly_price');

    if (error) throw error;

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========================================
// UPDATE PLAN
// ========================================
export async function updatePlan(req, res) {
  try {
    const { type } = req.params;
    const updates = req.body;

    // Prevent updating plan_type
    delete updates.plan_type;
    delete updates.id;
    delete updates.created_at;

    const { data: plan, error } = await supabaseAdmin
      .from('subscription_plans')
      .update(updates)
      .eq('plan_type', type)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========================================
// GET ALL INVITATIONS (SYSTEM)
// ========================================
export async function getAllInvitations(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('business_invitations')
      .select(`
        *,
        business:businesses(name),
        invited_by_user:profiles!business_invitations_invited_by_fkey(name)
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: invitations, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      invitations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========================================
// HELPER: Seed Default Accounts
// ========================================
async function seedDefaultAccounts(business_id) {
  const accounts = [
    { code: "1001", name: "Cash", type: "asset" },
    { code: "1002", name: "Bank Account", type: "asset" },
    { code: "1003", name: "Accounts Receivable", type: "asset" },
    { code: "2001", name: "Tax Payable", type: "liability" },
    { code: "4001", name: "Sales", type: "revenue" },
    { code: "5001", name: "Cost of Goods Sold - Raw Materials", type: "expense" },
    { code: "5002", name: "Cost of Goods Sold - Labor", type: "expense" },
    { code: "6001", name: "Operating Expenses - Utilities", type: "expense" },
    { code: "6002", name: "Operating Expenses - Rent", type: "expense" },
    { code: "6003", name: "Operating Expenses - Transportation", type: "expense" },
    { code: "6004", name: "Operating Expenses - Maintenance", type: "expense" },
    { code: "6005", name: "Operating Expenses - Office Supplies", type: "expense" },
    { code: "6006", name: "Operating Expenses - Marketing", type: "expense" },
    { code: "6007", name: "Operating Expenses - Salaries", type: "expense" },
    { code: "6008", name: "Operating Expenses - Miscellaneous", type: "expense" },
  ];

  await supabaseAdmin.from("accounts").insert(
    accounts.map(a => ({ ...a, business_id }))
  );
}
