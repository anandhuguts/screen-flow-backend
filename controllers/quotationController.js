// backend/controllers/quotations.js
import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function createQuotation(req, res) {
  const {
    customerId,
    leadId,
    items,
    subtotal,
    discountPercent,
    taxPercent,
    validUntil,
    notes,
    status,
  } = req.body;

  const business_id = req.business_id;

  try {
    // Calculate totals
    const discountAmount = (subtotal * (discountPercent || 0)) / 100;
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * (taxPercent || 0)) / 100;
    const totalAmount = taxable + taxAmount;

    const quotationNumber = `QT-${new Date().getFullYear()}-${Date.now()}`;

    // Insert quotation header
    const { data: quotation, error } = await supabaseAdmin
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
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error("Quotation insert error:", error);
      return res.status(400).json({
        error: error.message || "Failed to create quotation"
      });
    }

    // Insert quotation items
    const itemsPayload = items.map((item) => ({
      quotation_id: quotation.id,
      description: item.description,
      width: item.width || null,
      height: item.height || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("quotation_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Quotation items insert error:", itemsError);
      // Rollback: delete the quotation we just created
      await supabaseAdmin
        .from("quotations")
        .delete()
        .eq("id", quotation.id);

      return res.status(400).json({
        error: itemsError.message || "Failed to add quotation items"
      });
    }

    res.json({ success: true, data: quotation });
  } catch (err) {
    console.error("Create quotation error:", err);
    const errorMessage = err.message || err.msg || "Failed to create quotation. Please try again.";
    res.status(500).json({ error: errorMessage });
  }
}

export async function getQuotations(req, res) {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count of quotations for this business
    const { count, error: countError } = await supabaseAdmin
      .from("quotations")
      .select("*", { count: "exact", head: true })
      .eq("business_id", req.business_id);

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from("quotations")
      .select(`
        *,
        quotation_items (
          id,
          description,
          width,
          height,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("business_id", req.business_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Map DB fields to frontend fields
    const formatted = data.map(q => ({
      id: q.id,
      business_id: q.business_id,
      quotation_number: q.quotation_number,
      customer_id: q.customer_id,
      lead_id: q.lead_id,
      status: q.status,
      subtotal: q.subtotal,
      discount_percent: q.discount_percent,
      discount_amount: q.discount_amount,
      tax_percent: q.tax_percent,
      tax_amount: q.tax_amount,
      total_amount: q.total_amount,
      valid_until: q.valid_until,
      notes: q.notes,
      created_at: q.created_at,
      updated_at: q.updated_at,
      items: q.quotation_items.map(item => ({
        id: item.id,
        description: item.description,
        width: item.width,
        height: item.height,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
      }))
    }));

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.json({
      data: formatted,
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
    console.error("Get quotations error:", err);
    res.status(500).json({ error: "Failed to load quotations" });
  }
}

export async function updateQuotation(req, res) {
  const { id } = req.params;
  const business_id = req.business_id;
  const {
    items,
    subtotal,
    discountPercent,
    taxPercent,
    validUntil,
    notes,
    customerId,
    leadId,
    status,
  } = req.body;

  try {
    // Recalculate totals
    const discountAmount = (subtotal * (discountPercent || 0)) / 100;
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * (taxPercent || 0)) / 100;
    const totalAmount = taxable + taxAmount;

    // Update quotation header
    const { error } = await supabaseAdmin
      .from("quotations")
      .update({
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
        status: status || 'draft',
      })
      .eq("id", id)
      .eq("business_id", business_id);

    if (error) throw error;

    // Delete old items
    await supabaseAdmin
      .from("quotation_items")
      .delete()
      .eq("quotation_id", id);

    // Insert new items
    const itemsPayload = items.map((item) => ({
      quotation_id: id,
      description: item.description,
      width: item.width || null,
      height: item.height || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    await supabaseAdmin
      .from("quotation_items")
      .insert(itemsPayload);

    res.json({ success: true });
  } catch (err) {
    console.error("Update quotation error:", err);
    res.status(500).json({ error: "Failed to update quotation" });
  }
}

export async function deleteQuotation(req, res) {
  const { id } = req.params;
  const business_id = req.business_id;

  try {
    // Delete quotation (items will be cascade deleted)
    const { error } = await supabaseAdmin
      .from("quotations")
      .delete()
      .eq("id", id)
      .eq("business_id", business_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Delete quotation error:", err);
    res.status(500).json({ error: "Failed to delete quotation" });
  }
}