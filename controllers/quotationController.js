import { supabaseAdmin } from "../supabase/supabaseAdmin.js";


export async function createQuotation(req, res) {
  const {
    customerId,
    leadId,
    subtotal,
    discountPercent,
    taxPercent,
    validUntil,
    notes,
  } = req.body;

  const business_id = req.business_id;

  try {
    const discountAmount = (subtotal * (discountPercent || 0)) / 100;
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * (taxPercent || 0)) / 100;
    const totalAmount = taxable + taxAmount;

    const quotationNumber = `QT-${new Date().getFullYear()}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from("quotations")
      .insert({
        business_id,
        quotation_number: quotationNumber,

        customer_id: customerId || null,
        lead_id: leadId || null,

        subtotal,
        discount_percent: discountPercent || 0,
        discount_amount: discountAmount,
        tax_percent: taxPercent || 0,
        tax_amount: taxAmount,
        total_amount: totalAmount,

        valid_until: validUntil,
        notes,
      })
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create quotation" });
  }
}

export async function getQuotations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("quotations")
      .select("*")
      .eq("business_id", req.business_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to load quotations" });
  }
}

export async function updateQuotation(req, res) {
  const { id } = req.params;
  const body = req.body;

  try {
    const { error } = await supabase
      .from("quotations")
      .update(body)
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update quotation" });
  }
}

export async function deleteQuotation(req, res) {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from("quotations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete quotation" });
  }
}
