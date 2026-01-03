import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export const createStaff = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const business_id = req.business_id;

    console.log("Creating staff:", { email, name, business_id });

    // 1️⃣ Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const userId = data.user.id;

    // 2️⃣ Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        name,
        role: "staff",
        business_id,
      });

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    res.json({
      success: true,
      message: "Staff created successfully",
    });
  } catch (err) {
    console.error("Create staff error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getAllStaff = async (req, res) => {
  try {
    const business_id = req.business_id;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, created_at, is_active")
      .eq("business_id", business_id)
      .neq("role", "superadmin")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Get staff error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deactivateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const business_id = req.business_id;

    // Ensure staff belongs to same business
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", staffId)
      .eq("business_id", business_id)
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", staffId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: "Staff deactivated",
    });
  } catch (err) {
    console.error("Deactivate staff error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
