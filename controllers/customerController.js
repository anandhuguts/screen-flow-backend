import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

/* ---------------- GET ALL CUSTOMERS ---------------- */
export const getCustomers = async (req, res) => {
  try {
    const businessId = req.business_id;

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count of customers for this business
    const { count, error: countError } = await supabaseAdmin
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId);

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.json({
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
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

    if (error) {
      console.error("Customer insert error:", error);
      return res.status(400).json({
        error: error.message || "Failed to create customer"
      });
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error("Create customer error:", err);
    const errorMessage = err.message || err.msg || "Failed to create customer. Please try again.";
    res.status(500).json({ error: errorMessage });
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

    if (error) {
      console.error("Customer update error:", error);
      return res.status(400).json({
        error: error.message || "Failed to update customer"
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Update customer error:", err);
    const errorMessage = err.message || err.msg || "Failed to update customer. Please try again.";
    res.status(500).json({ error: errorMessage });
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

    if (error) {
      console.error("Customer delete error:", error);
      return res.status(400).json({
        error: error.message || "Failed to delete customer"
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete customer error:", err);
    const errorMessage = err.message || err.msg || "Failed to delete customer. Please try again.";
    res.status(500).json({ error: errorMessage });
  }
};
