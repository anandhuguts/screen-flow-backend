import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

// Middleware to check if business subscription is active
export const checkSubscription = async (req, res, next) => {
  try {
    const business_id = req.business_id;

    if (!business_id) {
      return res.status(403).json({ error: "Business ID not found" });
    }

    // Get subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('business_id', business_id)
      .single();

    if (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({ error: "Failed to verify subscription" });
    }

    if (!subscription) {
      return res.status(403).json({ 
        error: "No active subscription found for this business",
        action: "contact_admin"
      });
    }

    // Check subscription status
    if (subscription.status === 'suspended') {
      return res.status(403).json({ 
        error: "Your subscription has been suspended",
        action: "contact_support",
        status: "suspended"
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(403).json({ 
        error: "Your subscription has been cancelled",
        action: "renew_subscription",
        status: "cancelled"
      });
    }

    if (subscription.status === 'expired') {
      return res.status(403).json({ 
        error: "Your subscription has expired",
        action: "renew_subscription",
        status: "expired"
      });
    }

    // Check if trial has expired
    if (subscription.plan_type === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      
      if (now > trialEnd) {
        // Auto-expire trial
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('business_id', business_id);

        await supabaseAdmin
          .from('businesses')
          .update({ subscription_status: 'cancelled' })
          .eq('id', business_id);

        return res.status(403).json({ 
          error: "Your trial period has ended",
          action: "upgrade_required",
          trial_ended_at: subscription.trial_ends_at
        });
      }

      // Add days remaining to response
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      req.trial_days_remaining = daysRemaining;
    }

    // Attach subscription details to request
    req.subscription = {
      plan_type: subscription.plan_type,
      status: subscription.status,
      features: subscription.subscription_plans.features,
      limits: {
        max_users: subscription.subscription_plans.max_users,
        max_invoices_per_month: subscription.subscription_plans.max_invoices_per_month,
        max_products: subscription.subscription_plans.max_products,
        max_customers: subscription.subscription_plans.max_customers
      }
    };

    next();
  } catch (error) {
    console.error('checkSubscription middleware error:', error);
    res.status(500).json({ error: "Subscription verification failed" });
  }
};
