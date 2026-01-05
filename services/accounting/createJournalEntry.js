import { supabaseAdmin } from "../../supabase/supabaseAdmin.js";

export async function createJournalEntry({
  business_id,
  date = new Date(),
  description,
  reference_type,
  reference_id,
  lines,
}) {
  /* 1️⃣ Create journal entry */
  const { data: entry, error: entryError } = await supabaseAdmin
    .from("journal_entries")
    .insert({
      business_id,
      date,
      description,
      reference_type,
      reference_id,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  /* 2️⃣ Fetch accounts */
  const accountCodes = lines.map(l => l.account_code);

  const { data: accounts, error: accError } = await supabaseAdmin
    .from("accounts")
    .select("id, code")
    .eq("business_id", business_id)
    .in("code", accountCodes);

  if (accError) throw accError;

  const accountMap = {};
  accounts.forEach(a => {
    accountMap[a.code] = a.id;
  });

  /* 🔴 VALIDATION — REQUIRED */
  const missingAccounts = accountCodes.filter(
    code => !accountMap[code]
  );

  if (missingAccounts.length > 0) {
    throw new Error(
      `Missing accounts: ${missingAccounts.join(", ")}`
    );
  }

  /* 3️⃣ Insert journal lines */
  const journalLines = lines.map(line => ({
    journal_entry_id: entry.id,
    account_id: accountMap[line.account_code],
    debit: line.debit || 0,
    credit: line.credit || 0,
  }));

  const { error: lineError } = await supabaseAdmin
    .from("journal_lines")
    .insert(journalLines);

  if (lineError) throw lineError;

  return entry;
}
