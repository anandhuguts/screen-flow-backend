import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function getCompany(req, res) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", req.business_id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function updateCompany(req, res) {
  const { name, phone, email, address, gst_number, financial_year } = req.body;

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ name, phone, email, address, gst_number, financial_year })
    .eq("id", req.business_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

export async function getProfile(req, res) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function updateProfile(req, res) {
  const { name, phone } = req.body;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ name, phone })
    .eq("id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

export async function getUsers(req, res) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role, is_active, created_at")
    .eq("business_id", req.business_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function getNotifications(req, res) {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", req.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ error: error.message });
  }

  res.json({ data });
}

export async function updateNotifications(req, res) {
  const payload = {
    business_id: req.business_id,
    user_id: req.user.id,
    ...req.body,
  };

  const { error } = await supabaseAdmin
    .from("notification_preferences")
    .upsert(payload, { onConflict: "business_id,user_id" });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}
