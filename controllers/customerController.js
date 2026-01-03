import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

/* ---------------- GET ALL CUSTOMERS ---------------- */
export const getCustomers = async (req, res) => {
  try {
    const businessId = req.business_id;

    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

/* ---------------- CREATE CUSTOMER ---------------- */
export const createCustomer = async (req, res) => {
  try {
    const businessId = req.business_id;

    const {
      name,
      phone,
      email,
      address,
      location,
      gstNumber,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({
        business_id: businessId,
        name,
        phone,
        email,
        address,
        location,
        gst_number: gstNumber,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch {
    res.status(500).json({ error: "Failed to create customer" });
  }
};

/* ---------------- UPDATE CUSTOMER ---------------- */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.business_id;

    const {
      name,
      phone,
      email,
      address,
      location,
      gstNumber,
    } = req.body;

    const { error } = await supabaseAdmin
      .from("customers")
      .update({
        name,
        phone,
        email,
        address,
        location,
        gst_number: gstNumber,
        updated_at: new Date(),
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) throw error;

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update customer" });
  }
};

/* ---------------- DELETE CUSTOMER ---------------- */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.business_id;

    const { error } = await supabaseAdmin
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) throw error;

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete customer" });
  }
};
