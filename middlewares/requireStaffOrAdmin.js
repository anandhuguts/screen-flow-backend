import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export const requireStaffOrAdmin = async (req, res, next) => {
  const userId = req.user.id;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role, business_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!["superadmin", "staff"].includes(profile.role)) {
    return res.status(403).json({ error: "Access denied" });
  }

  req.business_id = profile.business_id;
  req.profile = profile;

  next();
};
