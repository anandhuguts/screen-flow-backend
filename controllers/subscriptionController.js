import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

// ========================================
// GET CURRENT SUBSCRIPTION
// ========================================
export async function getSubscription(req, res) {
  try {
    const business_id = req.business_id;

    // Get subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('business_id', business_id)
      .single();

    if (subError) throw subError;

    if (!subscription) {
      return res.status(404).json({ error: "No subscription found for this business" });
    }

    // Get plan details separately
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', subscription.plan_type)
      .single();

    if (planError) throw planError;

    // Get current usage stats
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Count users
    const { count: userCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id)
      .eq('is_active', true);

    // Count products
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id);

    // Count customers
    const { count: customerCount } = await supabaseAdmin
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id);

    // Get invoice count for current month
    const { data: invoiceUsage } = await supabaseAdmin
      .from('feature_usage_logs')
      .select('usage_count')
      .eq('business_id', business_id)
      .eq('feature_name', 'invoices')
      .eq('month', currentMonth)
      .single();

    res.json({
      success: true,
      subscription: {
        plan_type: subscription.plan_type,
        plan_name: plan.name,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        trial_ends_at: subscription.trial_ends_at,
        monthly_price: subscription.monthly_price
      },
      limits: {
        max_users: plan.max_users,
        max_invoices_per_month: plan.max_invoices_per_month,
        max_products: plan.max_products,
        max_customers: plan.max_customers
      },
      current_usage: {
        users: userCount || 0,
        invoices_this_month: invoiceUsage?.usage_count || 0,
        products: productCount || 0,
        customers: customerCount || 0
      },
      features: plan.features
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch subscription" });
  }
}

// ========================================
// GET AVAILABLE PLANS (PUBLIC)
// ========================================
export async function getAvailablePlans(req, res) {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price');

    if (error) throw error;

    res.json({
      success: true,
      plans: plans.map(plan => ({
        plan_type: plan.plan_type,
        name: plan.name,
        description: plan.description,
        monthly_price: plan.monthly_price,
        features: plan.features,
        limits: {
          max_users: plan.max_users,
          max_invoices_per_month: plan.max_invoices_per_month,
          max_products: plan.max_products,
          max_customers: plan.max_customers
        },
        trial_days: plan.trial_days
      }))
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch plans" });
  }
}

// ========================================
// REQUEST PLAN UPGRADE
// ========================================
export async function requestUpgrade(req, res) {
  try {
    const business_id = req.business_id;
    const { plan_type } = req.body;

    // Validate plan type
    const validPlans = ['basic', 'advanced', 'premium'];
    if (!validPlans.includes(plan_type)) {
      return res.status(400).json({ 
        error: `Invalid plan type. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Get current subscription
    const { data: currentSub, error: currentError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('business_id', business_id)
      .single();

    if (currentError) throw currentError;

    // Check if it's actually an upgrade
    const planOrder = { trial: 0, basic: 1, advanced: 2, premium: 3 };
    if (planOrder[plan_type] <= planOrder[currentSub.plan_type]) {
      return res.status(400).json({ 
        error: "This is not an upgrade. Use downgrade endpoint instead." 
      });
    }

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
        trial_ends_at: null, // Clear trial end date on upgrade
        updated_at: new Date()
      })
      .eq('business_id', business_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to history
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        business_id,
        subscription_id: currentSub.id,
        from_plan: currentSub.plan_type,
        to_plan: plan_type,
        reason: 'User requested upgrade',
        changed_by: req.user.id
      });

    // Update business status
    await supabaseAdmin
      .from('businesses')
      .update({
        subscription_status: 'active'
      })
      .eq('id', business_id);

    res.json({
      success: true,
      message: `Successfully upgraded from ${currentSub.plan_type} to ${plan_type}`,
      subscription: {
        plan_type: updatedSub.plan_type,
        monthly_price: updatedSub.monthly_price,
        effective_date: updatedSub.updated_at
      },
      next_steps: "Payment details will be sent to your email"
    });

  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: error.message || "Failed to upgrade subscription" });
  }
}

// ========================================
// REQUEST PLAN DOWNGRADE
// ========================================
export async function requestDowngrade(req, res) {
  try {
    const business_id = req.business_id;
    const { plan_type, reason } = req.body;

    // Validate plan type
    const validPlans = ['trial', 'basic', 'advanced'];
    if (!validPlans.includes(plan_type)) {
      return res.status(400).json({ 
        error: `Invalid plan type for downgrade. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Get current subscription
    const { data: currentSub, error: currentError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('business_id', business_id)
      .single();

    if (currentError) throw currentError;

    // Check if it's actually a downgrade
    const planOrder = { trial: 0, basic: 1, advanced: 2, premium: 3 };
    if (planOrder[plan_type] >= planOrder[currentSub.plan_type]) {
      return res.status(400).json({ 
        error: "This is not a downgrade. Use upgrade endpoint instead." 
      });
    }

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
      .eq('business_id', business_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to history
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        business_id,
        subscription_id: currentSub.id,
        from_plan: currentSub.plan_type,
        to_plan: plan_type,
        reason: reason || 'User requested downgrade',
        changed_by: req.user.id
      });

    res.json({
      success: true,
      message: `Successfully downgraded from ${currentSub.plan_type} to ${plan_type}`,
      subscription: {
        plan_type: updatedSub.plan_type,
        monthly_price: updatedSub.monthly_price,
        effective_date: updatedSub.updated_at
      },
      warning: "Some features may no longer be available with this plan"
    });

  } catch (error) {
    console.error('Downgrade error:', error);
    res.status(500).json({ error: error.message || "Failed to downgrade subscription" });
  }
}

// ========================================
// GET SUBSCRIPTION HISTORY
// ========================================
export async function getSubscriptionHistory(req, res) {
  try {
    const business_id = req.business_id;

    const { data: history, error } = await supabaseAdmin
      .from('subscription_history')
      .select(`
        *,
        changed_by_user:profiles!subscription_history_changed_by_fkey(name)
      `)
      .eq('business_id', business_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      history: history.map(h => ({
        from_plan: h.from_plan,
        to_plan: h.to_plan,
        reason: h.reason,
        changed_by: h.changed_by_user?.name,
        changed_at: h.created_at
      }))
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch subscription history" });
  }
}

// ========================================
// CHECK FEATURE ACCESS
// ========================================
export async function checkFeatureAccess(req, res) {
  try {
    const business_id = req.business_id;
    const { feature } = req.query;

    if (!feature) {
      return res.status(400).json({ error: "Feature name is required" });
    }

    // Get subscription with plan
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (features)
      `)
      .eq('business_id', business_id)
      .single();

    if (subError) throw subError;

    const plan = subscription.subscription_plans;
    const modules = plan.features?.modules || [];
    const hasAccess = modules.includes(feature);

    res.json({
      success: true,
      has_access: hasAccess,
      feature,
      current_plan: subscription.plan_type,
      available_in_plans: hasAccess ? [subscription.plan_type] : ['basic', 'advanced', 'premium']
    });

  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({ error: error.message || "Failed to check feature access" });
  }
}

// ========================================
// GET CURRENT USAGE STATS
// ========================================
export async function getCurrentUsage(req, res) {
  try {
    const business_id = req.business_id;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get all usage logs for current month
    const { data: usageLogs, error: usageError } = await supabaseAdmin
      .from('feature_usage_logs')
      .select('feature_name, usage_count')
      .eq('business_id', business_id)
      .eq('month', currentMonth);

    if (usageError) throw usageError;

    // Count current totals
    const { count: userCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id)
      .eq('is_active', true);

    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id);

    const { count: customerCount } = await supabaseAdmin
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id);

    // Convert usage logs to object
    const usage = usageLogs?.reduce((acc, log) => {
      acc[log.feature_name] = log.usage_count;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      month: currentMonth,
      usage: {
        invoices: usage.invoices || 0,
        quotations: usage.quotations || 0,
        payments: usage.payments || 0,
        users: userCount || 0,
        products: productCount || 0,
        customers: customerCount || 0
      }
    });

  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: error.message || "Failed to fetch usage stats" });
  }
}

// ========================================
// RECORD SUBSCRIPTION PAYMENT
// ========================================
export async function recordPayment(req, res) {
  try {
    const business_id = req.business_id;
    const { amount, payment_method, payment_reference } = req.body;

    if (!amount || !payment_method) {
      return res.status(400).json({ 
        error: "Amount and payment method are required" 
      });
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('business_id', business_id)
      .single();

    if (subError) throw subError;

    // Record payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('subscription_payments')
      .insert({
        business_id,
        subscription_id: subscription.id,
        amount,
        payment_method,
        payment_reference,
        payment_date: new Date(),
        status: 'completed'
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    res.json({
      success: true,
      message: "Payment recorded successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_reference: payment.payment_reference
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: error.message || "Failed to record payment" });
  }
}
