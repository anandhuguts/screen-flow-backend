import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function getPayments(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        invoice_id,
        customer_id,
        amount,
        payment_method,
        payment_date,
        reference,
        created_at
      `)
      .eq("business_id", req.business_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payments" });
  }
}


export async function recordPayment(req, res) {
  const { invoiceId, amount, paymentMethod, reference } = req.body;
  const business_id = req.business_id;

  try {
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const newPaid = Number(invoice.paid_amount) + Number(amount);
    const newBalance = Number(invoice.total_amount) - newPaid;

    let status = "pending";
    if (newBalance <= 0) status = "paid";
    else if (newPaid > 0) status = "partially-paid";

    // ✅ 1️⃣ INSERT PAYMENT
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        business_id,
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        amount,
        payment_method: paymentMethod,
        reference,
      });

    if (paymentError) {
      console.error("Payment insert failed:", paymentError);
      return res.status(400).json({
        error: "Payment insert failed",
        details: paymentError.message,
      });
    }

    await createJournalEntry({
  business_id,
  description: `Payment received for ${invoice.invoice_number}`,
  reference_type: "payment",
  reference_id: invoiceId,
  lines: [
    {
      account_code:
        paymentMethod === "cash" ? "1001" : "1002", // Cash or Bank
      debit: amount,
    },
    {
      account_code: "1003", // Accounts Receivable
      credit: amount,
    },
  ],
});


    // ✅ 2️⃣ UPDATE INVOICE ONLY AFTER PAYMENT SUCCESS
    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        paid_amount: newPaid,
        balance_amount: newBalance,
        status,
      })
      .eq("id", invoiceId);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
}

