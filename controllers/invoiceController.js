import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function createInvoice(req, res) {
  const {
    customerId,
    quotationId,
    items,
    dueDate,
    isGstInvoice,
  } = req.body;

  const business_id = req.business_id;

  try {
    // 1️⃣ Calculate totals server-side
    const subtotal = items.reduce(
      (sum, i) => sum + i.quantity * i.unit_price,
      0
    );

    const taxAmount = isGstInvoice ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + taxAmount;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;

    // 2️⃣ Insert invoice
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        business_id,
        customer_id: customerId,
        quotation_id: quotationId || null,
        invoice_number: invoiceNumber,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount,
        due_date: dueDate,
        is_gst_invoice: isGstInvoice,
      })
      .single();

    if (error) throw error;

    // 3️⃣ Insert items
    const itemsToInsert = items.map((i) => ({
      invoice_id: invoice.id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.quantity * i.unit_price,
    }));

    await supabaseAdmin.from("invoice_items").insert(itemsToInsert);

    res.json({ success: true, data: invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
}
export async function getInvoices(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("business_id", req.business_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to load invoices" });
  }
}
export async function recordPayment(req, res) {
  const { invoiceId, amount, paymentMethod, reference } = req.body;
  const business_id = req.business_id;

  try {
    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    const newPaid = invoice.paid_amount + amount;
    const newBalance = invoice.total_amount - newPaid;

    let status = "pending";
    if (newBalance <= 0) status = "paid";
    else if (newPaid > 0) status = "partially-paid";

    // 1️⃣ Insert payment
    await supabaseAdmin.from("payments").insert({
      business_id,
      invoice_id: invoiceId,
      customer_id: invoice.customer_id,
      amount,
      payment_method: paymentMethod,
      reference,
    });

    // 2️⃣ Update invoice
    await supabaseAdmin
      .from("invoices")
      .update({
        paid_amount: newPaid,
        balance_amount: newBalance,
        status,
      })
      .eq("id", invoiceId);

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to record payment" });
  }
}
