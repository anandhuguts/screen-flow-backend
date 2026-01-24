// Middleware factory to check if business plan includes a specific feature
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      // Subscription details should be attached by checkSubscription middleware
      if (!req.subscription) {
        return res.status(500).json({ 
          error: "Subscription check middleware must run before feature check" 
        });
      }

      const { plan_type, features } = req.subscription;
      const modules = features?.modules || [];

      // Check if feature is included in plan
      if (!modules.includes(featureName)) {
        // Determine which plans include this feature
        const featurePlans = {
          // Trial plan
          leads: ['trial', 'basic', 'advanced', 'premium'],
          customers: ['trial', 'basic', 'advanced', 'premium'],
          quotations: ['trial', 'basic', 'advanced', 'premium'],
          
          // Basic plan and above
          invoices: ['basic', 'advanced', 'premium'],
          payments: ['basic', 'advanced', 'premium'],
          products: ['basic', 'advanced', 'premium'],
          
          // Advanced plan and above
          expenses: ['advanced', 'premium'],
          reports: ['advanced', 'premium'],
          accounting: ['advanced', 'premium'],
          
          // Premium only
          inventory: ['premium'],
          staff: ['premium']
        };

        const availablePlans = featurePlans[featureName] || ['premium'];
        const minPlan = availablePlans[0];

        return res.status(403).json({
          error: `This feature is not available in your current plan`,
          feature: featureName,
          current_plan: plan_type,
          required_plan: minPlan,
          upgrade_required: true,
          available_in_plans: availablePlans,
          message: `Upgrade to ${minPlan.charAt(0).toUpperCase() + minPlan.slice(1)} plan or higher to access ${featureName}`
        });
      }

      next();
    } catch (error) {
      console.error('requireFeature middleware error:', error);
      res.status(500).json({ error: "Feature access check failed" });
    }
  };
};
