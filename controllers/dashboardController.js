import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function getDashboardData(req, res) {
  const business_id = req.business_id;

  try {
    /* ---------------- BASIC COUNTS ---------------- */
    const [
      leadsCount,
      customersCount,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business_id),

      supabaseAdmin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business_id),

      supabaseAdmin
        .from("invoices")
        .select("balance_amount", { count: "exact", head: true })
        .eq("business_id", business_id)
        .gt("balance_amount", 0),

      supabaseAdmin
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business_id)
        .eq("status", "overdue"),
    ]);

    /* ---------------- SALES THIS MONTH ---------------- */
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const { data: sales } = await supabaseAdmin
      .from("payments")
      .select("amount")
      .eq("business_id", business_id)
      .gte("payment_date", startOfMonth.toISOString());

    const salesThisMonth = sales?.reduce((s, p) => s + Number(p.amount), 0) || 0;

    /* ---------------- FOLLOW UPS TODAY ---------------- */
    const today = new Date().toISOString().split("T")[0];

    const { count: followUpsToday } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business_id)
      .eq("follow_up_date", today);

    /* ---------------- RECENT LEADS ---------------- */
    const { data: recentLeads } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(5);

    /* ---------------- RECENT INVOICES ---------------- */
    const { data: recentInvoices } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(5);

    /* ---------------- LEAD SOURCE CHART ---------------- */
    const { data: leadSources } = await supabaseAdmin
      .from("leads")
      .select("source, count:source", { group: "source" })
      .eq("business_id", business_id);

    /* ---------------- MONTHLY SALES CHART ---------------- */
    const { data: monthlySales } = await supabaseAdmin.rpc(
      "monthly_sales_summary",
      { b_id: business_id }
    );

    res.json({
      stats: {
        totalLeads: leadsCount.count || 0,
        totalCustomers: customersCount.count || 0,
        pendingPayments: pendingInvoices.count || 0,
        overdueInvoices: overdueInvoices.count || 0,
        salesThisMonth,
        followUpsToday: followUpsToday || 0,
      },
      recentLeads,
      recentInvoices,
      charts: {
        sales: monthlySales || [],
        leadSources: leadSources || [],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
}
