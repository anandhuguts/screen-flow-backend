import { supabaseAdmin } from "../supabase/supabaseAdmin.js";
import { createJournalEntry } from "../services/accounting/createJournalEntry.js";

/**
 * Get all expenses with pagination
 */
export async function getExpenses(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const { count, error: countError } = await supabaseAdmin
            .from("expenses")
            .select("*", { count: "exact", head: true })
            .eq("business_id", req.business_id);

        if (countError) throw countError;

        // Get paginated data
        const { data, error } = await supabaseAdmin
            .from("expenses")
            .select("*")
            .eq("business_id", req.business_id)
            .order("expense_date", { ascending: false })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        const totalPages = Math.ceil(count / limit);

        res.json({
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: count,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        console.error("Get expenses error:", err);
        res.status(500).json({ error: "Failed to load expenses" });
    }
}

/**
 * Create a new expense
 */
export async function createExpense(req, res) {
    try {
        const {
            category,
            vendorName,
            amount,
            description,
            expenseDate,
            paymentMode,
            reference,
            notes,
        } = req.body;

        /* ---------------- VALIDATION ---------------- */
        if (!category || !vendorName || !amount || !description || !expenseDate) {
            return res.status(400).json({
                error: "Category, vendor name, amount, description, and expense date are required",
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                error: "Amount must be greater than 0",
            });
        }

        const validCategories = [
            "raw-materials",
            "labor",
            "utilities",
            "rent",
            "transportation",
            "maintenance",
            "office-supplies",
            "marketing",
            "salary",
            "other",
        ];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                error: "Invalid expense category",
            });
        }

        const validPaymentModes = ["cash", "upi", "bank-transfer", "cheque"];
        if (paymentMode && !validPaymentModes.includes(paymentMode)) {
            return res.status(400).json({
                error: "Invalid payment mode",
            });
        }

        /* ---------------- GENERATE EXPENSE NUMBER ---------------- */
        const expenseNumber = `EXP-${new Date().getFullYear()}-${Date.now()}`;

        /* ---------------- INSERT EXPENSE ---------------- */
        const { data: expense, error: expenseError } = await supabaseAdmin
            .from("expenses")
            .insert({
                business_id: req.business_id,
                expense_number: expenseNumber,
                category,
                vendor_name: vendorName,
                amount,
                description,
                expense_date: expenseDate,
                payment_mode: paymentMode || "cash",
                reference: reference || null,
                notes: notes || null,
                status: "pending",
                created_by: req.user.id,
            })
            .select()
            .single();

        if (expenseError) {
            console.error("Expense insert error:", expenseError);
            return res.status(400).json({
                error: expenseError.message || "Failed to create expense",
            });
        }

        /* ---------------- ACCOUNTING ENTRY ---------------- */
        // Map expense categories to account codes
        const categoryAccountMap = {
            "raw-materials": "5001",
            "labor": "5002",
            "utilities": "6001",
            "rent": "6002",
            "transportation": "6003",
            "maintenance": "6004",
            "office-supplies": "6005",
            "marketing": "6006",
            "salary": "6007",
            "other": "6008",
        };

        const expenseAccountCode = categoryAccountMap[category];

        // Determine payment account based on payment mode
        const paymentAccountMap = {
            "cash": "1001",
            "upi": "1002",
            "bank-transfer": "1002",
            "cheque": "1002",
        };

        const paymentAccountCode = paymentAccountMap[paymentMode || "cash"];

        try {
            await createJournalEntry({
                business_id: req.business_id,
                date: new Date(expenseDate),
                description: `Expense: ${description} - ${vendorName}`,
                reference_type: "expense",
                reference_id: expense.id,
                lines: [
                    { account_code: expenseAccountCode, debit: amount },
                    { account_code: paymentAccountCode, credit: amount },
                ],
            });
        } catch (journalError) {
            console.error("Journal entry error:", journalError);
            // Delete the expense if journal entry fails
            await supabaseAdmin
                .from("expenses")
                .delete()
                .eq("id", expense.id);

            return res.status(500).json({
                error: "Failed to create accounting entry. Please ensure all expense accounts are set up in your chart of accounts.",
            });
        }

        res.json({ success: true, data: expense });
    } catch (err) {
        console.error("Expense creation failed:", err);
        const errorMessage =
            err.message || err.msg || "Failed to create expense. Please try again.";
        res.status(500).json({ error: errorMessage });
    }
}

/**
 * Update an existing expense
 */
export async function updateExpense(req, res) {
    try {
        const { id } = req.params;
        const {
            category,
            vendorName,
            amount,
            description,
            expenseDate,
            paymentMode,
            reference,
            notes,
        } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Expense ID is required" });
        }

        // Fetch existing expense
        const { data: existingExpense, error: fetchError } = await supabaseAdmin
            .from("expenses")
            .select("*")
            .eq("id", id)
            .eq("business_id", req.business_id)
            .single();

        if (fetchError || !existingExpense) {
            return res.status(404).json({ error: "Expense not found" });
        }

        // Don't allow updating approved/paid expenses
        if (existingExpense.status === "approved" || existingExpense.status === "paid") {
            return res.status(400).json({
                error: "Cannot update approved or paid expenses",
            });
        }

        /* ---------------- UPDATE EXPENSE ---------------- */
        const updateData = {};
        if (category) updateData.category = category;
        if (vendorName) updateData.vendor_name = vendorName;
        if (amount !== undefined) updateData.amount = amount;
        if (description) updateData.description = description;
        if (expenseDate) updateData.expense_date = expenseDate;
        if (paymentMode) updateData.payment_mode = paymentMode;
        if (reference !== undefined) updateData.reference = reference;
        if (notes !== undefined) updateData.notes = notes;

        const { data: updatedExpense, error: updateError } = await supabaseAdmin
            .from("expenses")
            .update(updateData)
            .eq("id", id)
            .eq("business_id", req.business_id)
            .select()
            .single();

        if (updateError) {
            console.error("Expense update error:", updateError);
            return res.status(400).json({
                error: updateError.message || "Failed to update expense",
            });
        }

        res.json({ success: true, data: updatedExpense });
    } catch (err) {
        console.error("Expense update failed:", err);
        res.status(500).json({ error: "Failed to update expense" });
    }
}

/**
 * Delete an expense
 */
export async function deleteExpense(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Expense ID is required" });
        }

        // Fetch existing expense
        const { data: existingExpense, error: fetchError } = await supabaseAdmin
            .from("expenses")
            .select("*")
            .eq("id", id)
            .eq("business_id", req.business_id)
            .single();

        if (fetchError || !existingExpense) {
            return res.status(404).json({ error: "Expense not found" });
        }

        // Don't allow deleting approved/paid expenses
        if (existingExpense.status === "approved" || existingExpense.status === "paid") {
            return res.status(400).json({
                error: "Cannot delete approved or paid expenses",
            });
        }

        // Delete the expense
        const { error: deleteError } = await supabaseAdmin
            .from("expenses")
            .delete()
            .eq("id", id)
            .eq("business_id", req.business_id);

        if (deleteError) {
            console.error("Expense delete error:", deleteError);
            return res.status(400).json({
                error: deleteError.message || "Failed to delete expense",
            });
        }

        res.json({ success: true, message: "Expense deleted successfully" });
    } catch (err) {
        console.error("Expense deletion failed:", err);
        res.status(500).json({ error: "Failed to delete expense" });
    }
}

/**
 * Approve an expense (admin only)
 */
export async function approveExpense(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Expense ID is required" });
        }

        // Fetch existing expense
        const { data: existingExpense, error: fetchError } = await supabaseAdmin
            .from("expenses")
            .select("*")
            .eq("id", id)
            .eq("business_id", req.business_id)
            .single();

        if (fetchError || !existingExpense) {
            return res.status(404).json({ error: "Expense not found" });
        }

        if (existingExpense.status !== "pending") {
            return res.status(400).json({
                error: "Only pending expenses can be approved",
            });
        }

        // Update status to approved
        const { data: updatedExpense, error: updateError } = await supabaseAdmin
            .from("expenses")
            .update({
                status: "approved",
                approved_by: req.user.id,
                approved_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", req.business_id)
            .select()
            .single();

        if (updateError) {
            console.error("Expense approval error:", updateError);
            return res.status(400).json({
                error: updateError.message || "Failed to approve expense",
            });
        }

        res.json({ success: true, data: updatedExpense });
    } catch (err) {
        console.error("Expense approval failed:", err);
        res.status(500).json({ error: "Failed to approve expense" });
    }
}

/**
 * Reject an expense (admin only)
 */
export async function rejectExpense(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Expense ID is required" });
        }

        // Fetch existing expense
        const { data: existingExpense, error: fetchError } = await supabaseAdmin
            .from("expenses")
            .select("*")
            .eq("id", id)
            .eq("business_id", req.business_id)
            .single();

        if (fetchError || !existingExpense) {
            return res.status(404).json({ error: "Expense not found" });
        }

        if (existingExpense.status !== "pending") {
            return res.status(400).json({
                error: "Only pending expenses can be rejected",
            });
        }

        // Update status to rejected
        const { data: updatedExpense, error: updateError } = await supabaseAdmin
            .from("expenses")
            .update({
                status: "rejected",
                rejection_reason: reason || null,
                rejected_by: req.user.id,
                rejected_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", req.business_id)
            .select()
            .single();

        if (updateError) {
            console.error("Expense rejection error:", updateError);
            return res.status(400).json({
                error: updateError.message || "Failed to reject expense",
            });
        }

        // Delete associated journal entry if it exists
        try {
            await supabaseAdmin
                .from("journal_entries")
                .delete()
                .eq("reference_type", "expense")
                .eq("reference_id", id);
        } catch (journalError) {
            console.error("Journal entry cleanup error:", journalError);
            // Continue anyway
        }

        res.json({ success: true, data: updatedExpense });
    } catch (err) {
        console.error("Expense rejection failed:", err);
        res.status(500).json({ error: "Failed to reject expense" });
    }
}
