import { supabaseAdmin } from "../supabase/supabaseAdmin.js";


export async function completeSignup(req, res) {
  try {
    const { userId, name } = req.body;

    // 1️⃣ Create business
    const { data: business, error } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: `${name}'s Business`,
        owner_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Create profile
    await supabaseAdmin.from("profiles").insert({
      id: userId,
      name,
      role: "superadmin",
      business_id: business.id,
    });

    // 3️⃣ Seed Chart of Accounts ✅
    await seedDefaultAccounts(business.id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
}

export async function seedDefaultAccounts(business_id) {
  const accounts = [
    { code: "1001", name: "Cash", type: "asset" },
    { code: "1002", name: "Bank", type: "asset" },
    { code: "1003", name: "Accounts Receivable", type: "asset" },
    { code: "2001", name: "Tax Payable", type: "liability" },
    { code: "4001", name: "Sales", type: "revenue" },
  ];

  await supabaseAdmin.from("accounts").insert(
    accounts.map(a => ({ ...a, business_id }))
  );
}
