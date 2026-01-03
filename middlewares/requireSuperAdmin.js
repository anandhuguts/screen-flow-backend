import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export const requireSuperAdmin = async (req, res, next) => {
  const userId = req.user.id;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role, business_id")
    .eq("id", userId)
    .single();

  if (error || profile.role !== "superadmin") {
    return res.status(403).json({ error: "Access denied" });
  }

  req.business_id = profile.business_id;
  next();
};
