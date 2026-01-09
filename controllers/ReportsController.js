import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function leadReport(req, res) {
  const { from, to } = req.query;

  const { data, error } = await supabaseAdmin.rpc("report_leads", {
    biz_id: req.business_id,
    from_date: from,
    to_date: to,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function salesSummary(req, res) {
  const { from, to } = req.query;

  const { data, error } = await supabaseAdmin.rpc("report_sales_summary", {
    biz_id: req.business_id,
    from_date: from,
    to_date: to,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function paymentReport(req, res) {
  const { from, to } = req.query;

  const { data, error } = await supabaseAdmin.rpc("report_payments", {
    biz_id: req.business_id,
    from_date: from,
    to_date: to,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function outstandingReport(req, res) {
  const { data, error } = await supabaseAdmin.rpc("report_outstanding", {
    biz_id: req.business_id,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
}

export async function profitLossReport(req, res) {
  const { from, to } = req.query;

  const { data, error } = await supabaseAdmin.rpc("report_profit_loss", {
    biz_id: req.business_id,
    from_date: from,
    to_date: to,
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ data });
}
