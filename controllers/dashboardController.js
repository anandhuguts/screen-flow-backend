import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function getDashboardData(req, res) {
  const business_id = req.business_id;
  const userId = req.user.id;
  const role = req.profile?.role;

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
        .select("id", { count: "exact", head: true })
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

    const salesThisMonth =
      sales?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    /* ---------------- FOLLOW UPS TODAY (COUNT + LIST) ---------------- */
    const today = new Date().toISOString().split("T")[0];

    let followUpQuery = supabaseAdmin
      .from("leads")
      .select("id, name, phone, status, follow_up_date")
      .eq("business_id", business_id)
      .eq("follow_up_date", today)
      .neq("status", "lost");

    // 👇 Staff sees only their follow-ups
    if (role !== "superadmin") {
      followUpQuery = followUpQuery.eq("assigned_to", userId);
    }

    const { data: todayFollowUps } = await followUpQuery;

    /* ---------------- RECENT LEADS ---------------- */
    const { data: recentLeads } = await supabaseAdmin
      .from("leads")
      .select("id, name, phone, status, created_at")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(5);

    /* ---------------- RECENT INVOICES ---------------- */
    const { data: recentInvoices } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_number, status, total_amount, due_date")
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

    /* ---------------- RESPONSE ---------------- */
    res.json({
      stats: {
        totalLeads: leadsCount.count || 0,
        totalCustomers: customersCount.count || 0,
        pendingPayments: pendingInvoices.count || 0,
        overdueInvoices: overdueInvoices.count || 0,
        salesThisMonth,
        followUpsToday: todayFollowUps?.length || 0,
      },
      todayFollowUps, // 👈 NEW (used by dashboard UI)
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
