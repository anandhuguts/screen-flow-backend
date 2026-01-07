import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

/**
 * Change password (Supabase Auth)
 */
export async function changePassword(req, res) {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters",
    });
  }

  try {
    // 🔐 Update password via Supabase Admin
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 🧠 Optional audit log
    await supabaseAdmin.from("security_events").insert({
      user_id: req.user.id,
      business_id: req.business_id,
      type: "password_changed",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
}
