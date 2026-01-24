import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user profile with role and business_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, business_id, is_active")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: "User profile not found" });
    }

    // Check if user is active
    if (!profile.is_active) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    // Attach user info to request
    req.user = {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      business_id: profile.business_id,
      email: data.user.email
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};
