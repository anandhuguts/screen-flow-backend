import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export const createLead = async (req, res) => {
  const business_id = req.business_id;
  const user_id = req.user.id;

  const {
    name,
    phone,
    email,
    address,
    location,
    source,
    status,
    followUpDate, // camelCase from frontend
    notes,
  } = req.body;

  const payload = {
    business_id,
    assigned_to: user_id,
    name,
    phone,
    email,
    address,
    location,
    source,
    status,
    notes,
    follow_up_date: followUpDate || null, // ✅ mapped correctly
  };

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, data });
};

export const getLeads = async (req, res) => {
  const business_id = req.business_id;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("business_id", business_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ data });
};
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const business_id = req.business_id;

    const {
      name,
      phone,
      email,
      address,
      location,
      source,
      status,
      followUpDate,
      notes,
    } = req.body;

    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        name,
        phone,
        email,
        address,
        location,
        source,
        status,
        follow_up_date: followUpDate || null, // ✅ FIX
        notes,
      })
      .eq("id", id)
      .eq("business_id", business_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const deleteLead = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true });
};


export async function convertLead(req, res) {
  const { id: leadId } = req.params;
  const user = req.user; // from auth middleware

  try {
    // 1️⃣ Fetch lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // 2️⃣ Prevent double conversion
    if (lead.status === "converted") {
      return res.status(400).json({ error: "Lead already converted" });
    }

    // 3️⃣ Create customer from lead
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({
        business_id: lead.business_id,
        lead_id: lead.id,

        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        location: lead.location,
      })
      .single();

    if (customerError) throw customerError;

    // 4️⃣ Update lead status
    await supabaseAdmin
      .from("leads")
      .update({ status: "converted" })
      .eq("id", lead.id);

    return res.json({
      success: true,
      customer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
}

export const getLeadNotes = async (req, res) => {
  const { leadId } = req.params;
  const business_id = req.business_id;

  const { data, error } = await supabaseAdmin
    .from("lead_notes")
    .select(`
      id,
      note,
      note_date,
      created_at,
      profiles(name)
    `)
    .eq("lead_id", leadId)
    .eq("business_id", business_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ data });
};

export const addLeadNote = async (req, res) => {
  const { leadId } = req.params;
  const business_id = req.business_id;
  const user_id = req.user.id;
  const { note, noteDate } = req.body;

  const { data, error } = await supabaseAdmin
    .from("lead_notes")
    .insert({
      business_id,
      lead_id: leadId,
      user_id,
      note,
      note_date: noteDate || new Date(),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true, data });
};
