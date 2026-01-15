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
    // Asset Accounts
    { code: "1001", name: "Cash", type: "asset" },
    { code: "1002", name: "Bank Account", type: "asset" },
    { code: "1003", name: "Accounts Receivable", type: "asset" },

    // Liability Accounts
    { code: "2001", name: "Tax Payable", type: "liability" },

    // Revenue Accounts
    { code: "4001", name: "Sales", type: "revenue" },

    // Expense Accounts - COGS
    { code: "5001", name: "Cost of Goods Sold - Raw Materials", type: "expense" },
    { code: "5002", name: "Cost of Goods Sold - Labor", type: "expense" },

    // Expense Accounts - Operating
    { code: "6001", name: "Operating Expenses - Utilities", type: "expense" },
    { code: "6002", name: "Operating Expenses - Rent", type: "expense" },
    { code: "6003", name: "Operating Expenses - Transportation", type: "expense" },
    { code: "6004", name: "Operating Expenses - Maintenance", type: "expense" },
    { code: "6005", name: "Operating Expenses - Office Supplies", type: "expense" },
    { code: "6006", name: "Operating Expenses - Marketing", type: "expense" },
    { code: "6007", name: "Operating Expenses - Salaries", type: "expense" },
    { code: "6008", name: "Operating Expenses - Miscellaneous", type: "expense" },
  ];

  await supabaseAdmin.from("accounts").insert(
    accounts.map(a => ({ ...a, business_id }))
  );
}

