// middlewares/requireBusiness.js
import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export const requireBusiness = async (req, res, next) => {
  const userId = req.user.id;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .single();

  if (error || !data?.business_id) {
    return res.status(403).json({ error: "Business not found" });
  }

  req.business_id = data.business_id;
  next();
};
