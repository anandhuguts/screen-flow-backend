import { createJournalEntry } from "../services/accounting/createJournalEntry.js";
import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function createInvoice(req, res) {
  try {
    const {
      customerId,
      quotationId,
      subtotal,
      taxPercent,
      dueDate,
      isGstInvoice,
      notes,
    } = req.body;

    if (!subtotal) {
      return res.status(400).json({ error: "Subtotal is required" });
    }

    const tax_amount = isGstInvoice
      ? (subtotal * (taxPercent || 0)) / 100
      : 0;

    const total_amount = subtotal + tax_amount;

    const invoice_number = `INV-${new Date().getFullYear()}-${Date.now()}`;

 const { data, error } = await supabaseAdmin
  .from("invoices")
  .insert({
    business_id: req.business_id,
    customer_id: customerId,
    quotation_id: quotationId || null,
    invoice_number,
    subtotal,
    tax_percent: taxPercent || 0,
    tax_amount,
    total_amount,
    paid_amount: 0,
    balance_amount: total_amount,
    status: "pending",
    due_date: dueDate,
    is_gst_invoice: isGstInvoice,
    notes,
  })
  .select()     // ✅ REQUIRED
  .single();


    if (error) throw error;
    
    
    await createJournalEntry({
  business_id: req.business_id,
  description: `Invoice ${invoice_number}`,
  reference_type: "invoice",
  reference_id: data.id,
  lines: [
    {
      account_code: "1003", // Accounts Receivable
      debit: total_amount,
    },
    {
      account_code: "4001", // Sales
      credit: subtotal,
    },
    {
      account_code: "2001", // Tax Payable
      credit: tax_amount,
    },
  ],
});


    res.json({ success: true, data });
  }catch (err) {
  console.error("Invoice creation failed:", err.message);
  res.status(500).json({ error: err.message });
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

