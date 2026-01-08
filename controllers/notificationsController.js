// controllers/notifications.js
import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function getNotifications(req, res) {
  const user_id = req.user.id;
  const business_id = req.business_id;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user_id)
    .eq("business_id", business_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      hasMore: to + 1 < count,
    },
  });
}

export async function getUnreadNotificationCount(req, res) {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", req.user.id)
    .eq("business_id", req.business_id)
    .eq("is_read", false);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ count });
}

export async function markNotificationRead(req, res) {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
}

export async function markAllNotificationsRead(req, res) {
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", req.user.id)
    .eq("business_id", req.business_id)
    .eq("is_read", false);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
}
