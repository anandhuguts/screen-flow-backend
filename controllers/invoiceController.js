import { createJournalEntry } from "../services/accounting/createJournalEntry.js";
import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function createInvoice(req, res) {
  try {
    const {
      customerId,
      quotationId,
      items,
      subtotal,
      taxPercent = 0,
      dueDate,
      isGstInvoice,
      notes,
    } = req.body;

    /* ---------------- VALIDATION ---------------- */

    if (!customerId && !quotationId) {
      return res.status(400).json({
        error: "Either customerId or quotationId is required",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        error: "Due date is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Invoice items are required",
      });
    }

    for (const item of items) {
      if (!item.description || item.quantity <= 0 || item.unitPrice <= 0) {
        return res.status(400).json({
          error: "Invalid invoice item data",
        });
      }
    }

    /* ---------------- PREVENT DUPLICATE INVOICE ---------------- */

    if (quotationId) {
      const { data: existingInvoice } = await supabaseAdmin
        .from("invoices")
        .select("id")
        .eq("quotation_id", quotationId)
        .maybeSingle();

      if (existingInvoice) {
        return res.status(400).json({
          error: "Invoice already exists for this quotation",
        });
      }
    }

    /* ---------------- RESOLVE CUSTOMER ---------------- */

    let finalCustomerId = customerId;

    if (!finalCustomerId && quotationId) {
      const { data: quotation } = await supabaseAdmin
        .from("quotations")
        .select("customer_id")
        .eq("id", quotationId)
        .single();

      if (!quotation?.customer_id) {
        return res.status(400).json({
          error: "Quotation has no customer linked",
        });
      }

      finalCustomerId = quotation.customer_id;
    }

    /* ---------------- CALCULATIONS ---------------- */

    const tax_amount = isGstInvoice
      ? (subtotal * taxPercent) / 100
      : 0;

    const total_amount = subtotal + tax_amount;

    const invoice_number = `INV-${new Date().getFullYear()}-${Date.now()}`;

    /* ---------------- INSERT INVOICE ---------------- */

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .insert({
        business_id: req.business_id,
        customer_id: finalCustomerId,
        quotation_id: quotationId || null,
        invoice_number,
        subtotal,
        tax_percent: taxPercent,
        tax_amount,
        total_amount,
        paid_amount: 0,
        balance_amount: total_amount,
        status: "pending",
        due_date: dueDate,
        is_gst_invoice: isGstInvoice,
        notes,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    /* ---------------- INSERT ITEMS ---------------- */

    const invoiceItems = items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) throw itemsError;

    /* ---------------- JOURNAL ENTRY ---------------- */

    await createJournalEntry({
      business_id: req.business_id,
      description: `Invoice ${invoice_number}`,
      reference_type: "invoice",
      reference_id: invoice.id,
      lines: [
        { account_code: "1003", debit: total_amount },
        { account_code: "4001", credit: subtotal },
        { account_code: "2001", credit: tax_amount },
      ],
    });

    res.json({ success: true, data: invoice });
  } catch (err) {
    console.error("Invoice creation failed:", err);
    res.status(500).json({ error: err.message });
  }
}




export async function getInvoices(req, res) {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count of invoices for this business
    const { count, error: countError } = await supabaseAdmin
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("business_id", req.business_id);

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("business_id", req.business_id)
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
  } catch {
    res.status(500).json({ error: "Failed to load invoices" });
  }
}
export async function recordPayment(req, res) {
  const { invoiceId, amount, paymentMethod, reference } = req.body;
  const business_id = req.business_id;

  if (!invoiceId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment data" });
  }

  try {
    // 1️⃣ Fetch invoice
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("business_id", business_id)
      .single();

    if (invErr || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // 2️⃣ Prevent overpayment
    if (amount > invoice.balance_amount) {
      return res.status(400).json({ error: "Payment exceeds balance amount" });
    }

    const newPaid = invoice.paid_amount + amount;
    const newBalance = invoice.total_amount - newPaid;

    let status = "pending";
    if (newBalance === 0) status = "paid";
    else if (newPaid > 0) status = "partially-paid";

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Date.now()}`;

    // 3️⃣ Insert payment
    await supabaseAdmin.from("payments").insert({
      business_id,
      invoice_id: invoiceId,
      customer_id: invoice.customer_id,
      amount,
      payment_method: paymentMethod,
      reference,
      receipt_number: receiptNumber,
    });

    // 4️⃣ Update invoice
    await supabaseAdmin
      .from("invoices")
      .update({
        paid_amount: newPaid,
        balance_amount: newBalance,
        status,
      })
      .eq("id", invoiceId);

    res.json({ success: true, receiptNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
}

