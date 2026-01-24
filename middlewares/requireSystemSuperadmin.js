// Middleware to require system superadmin role
export const requireSystemSuperadmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has system_superadmin role
    if (req.user.role !== 'system_superadmin') {
      return res.status(403).json({ 
        error: "Access denied. System superadmin privileges required.",
        current_role: req.user.role
      });
    }

    next();
  } catch (error) {
    console.error('requireSystemSuperadmin error:', error);
    res.status(500).json({ error: "Authorization check failed" });
  }
};
