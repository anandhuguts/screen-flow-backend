import { supabaseAdmin } from "../supabase/supabaseAdmin.js";

// ========================================
// DEPRECATED: completeSignup
// ========================================
// This function is deprecated. Signup is now invitation-only.
// Users must receive an invitation from a system superadmin or business owner.
// Use invitationController.acceptInvitation() instead.

// Keep this function temporarily for backwards compatibility
// TODO: Remove after frontend is updated
export async function completeSignup(req, res) {
  return res.status(410).json({ 
    error: "Self-service signup is no longer available",
    message: "Please contact your administrator for an invitation to join",
    action: "invitation_required"
  });
}

// ========================================
// Helper: Seed Default Chart of Accounts
// ========================================
// This function is used by superadminController when creating new businesses
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


