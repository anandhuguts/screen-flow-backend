import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

// Middleware factory to check usage limits
export const checkUsageLimit = (featureName, limitField) => {
  return async (req, res, next) => {
    try {
      const business_id = req.business_id;

      // Subscription details should be attached by checkSubscription middleware
      if (!req.subscription) {
        return res.status(500).json({ 
          error: "Subscription check middleware must run before usage limit check" 
        });
      }

      const { limits, plan_type } = req.subscription;
      const limit = limits[limitField];

      // If limit is null/undefined, it means unlimited
      if (limit === null || limit === undefined) {
        return next();
      }

      let currentUsage = 0;

      // Check monthly limits (invoices, etc.)
      if (limitField === 'max_invoices_per_month') {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const { data: usageLog } = await supabaseAdmin
          .from('feature_usage_logs')
          .select('usage_count')
          .eq('business_id', business_id)
          .eq('feature_name', featureName)
          .eq('month', currentMonth)
          .single();

        currentUsage = usageLog?.usage_count || 0;
      } 
      // Check total limits (products, customers, users)
      else if (limitField === 'max_products') {
        const { count } = await supabaseAdmin
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business_id);
        
        currentUsage = count || 0;
      } 
      else if (limitField === 'max_customers') {
        const { count } = await supabaseAdmin
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business_id);
        
        currentUsage = count || 0;
      } 
      else if (limitField === 'max_users') {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business_id)
          .eq('is_active', true);
        
        currentUsage = count || 0;
      }

      // Check if limit exceeded
      if (currentUsage >= limit) {
        const planUpgrades = {
          trial: 'basic',
          basic: 'advanced',
          advanced: 'premium',
          premium: null
        };

        const nextPlan = planUpgrades[plan_type];

        return res.status(403).json({
          error: `${featureName.charAt(0).toUpperCase() + featureName.slice(1)} limit reached`,
          limit_type: limitField,
          limit: limit,
          current: currentUsage,
          upgrade_required: nextPlan !== null,
          current_plan: plan_type,
          suggested_plan: nextPlan,
          message: nextPlan 
            ? `Upgrade to ${nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)} plan for higher limits`
            : "You've reached the maximum limit for this feature"
        });
      }

      // Attach usage info to request (optional, for logging)
      req.current_usage = {
        [limitField]: currentUsage,
        limit: limit,
        percentage: Math.round((currentUsage / limit) * 100)
      };

      next();
    } catch (error) {
      console.error('checkUsageLimit middleware error:', error);
      res.status(500).json({ error: "Usage limit check failed" });
    }
  };
};

// Helper function to track feature usage
export async function trackFeatureUsage(business_id, featureName) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const { error } = await supabaseAdmin.rpc('track_feature_usage', {
      p_business_id: business_id,
      p_feature_name: featureName
    });

    if (error) {
      // Fallback if RPC function doesn't exist
      await supabaseAdmin
        .from('feature_usage_logs')
        .upsert({
          business_id,
          feature_name: featureName,
          month: currentMonth,
          usage_count: 1
        }, {
          onConflict: 'business_id,feature_name,month',
          ignoreDuplicates: false
        });
    }
  } catch (error) {
    console.error('Track feature usage error:', error);
    // Don't throw - usage tracking failure shouldn't block the operation
  }
}
