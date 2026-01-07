import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

export async function getLedger(req, res) {
  const { accountCode } = req.params;
  const business_id = req.business_id;

  try {
    const { data: account, error: accErr } = await supabaseAdmin
      .from("accounts")
      .select("id, name, code")
      .eq("business_id", business_id)
      .eq("code", accountCode)
      .single();

    if (accErr || !account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const { data: lines, error: lineErr } = await supabaseAdmin
      .from("journal_lines")
      .select(`
        debit,
        credit,
        journal_entries (
          date,
          description
        )
      `)
      .eq("account_id", account.id)
      .order("journal_entries.date", { ascending: true });

    if (lineErr) throw lineErr;

    res.json({ account, lines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load ledger" });
  }
}

export async function getTrialBalance(req, res) {
  const business_id = req.business_id;

  try {
    const { data, error } = await supabaseAdmin.rpc("trial_balance", {
      biz_id: business_id,
    });

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load trial balance" });
  }
}


export async function getProfitLoss(req, res) {
  const business_id = req.business_id;

  try {
    const { data, error } = await supabaseAdmin.rpc("profit_loss", {
      biz_id: business_id,
    });

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error("P&L error:", err);
    res.status(500).json({ error: err.message || err });
  }
}



export async function getBalanceSheet(req, res) {
  const business_id = req.business_id;

  try {
    const { data, error } = await supabaseAdmin.rpc("balance_sheet", {
      biz_id: business_id,
    });
   if (error) throw error;
    res.json({ data });
  } catch (err) {
    console.error("P&L error:", err);
    res.status(500).json({ error: err.message || err });
  }
}


export async function getDayBook(req, res) {
  const business_id = req.business_id;
  const { date } = req.query;

  try {
    const targetDate = date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .select(`
        id,
        date,
        description,
        reference_type,
        reference_id,
        journal_lines (
          debit,
          credit,
          accounts (
            code,
            name,
            type
          )
        )
      `)
      .eq("business_id", business_id)
      .eq("date", targetDate)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json({
      date: targetDate,
      entries: data || [],
    });
  } catch (err) {
    console.error("Day book error:", err);
    res.status(500).json({ error: "Failed to load day book" });
  }
}
