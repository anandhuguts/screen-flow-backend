import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import staffRoutes from "./routes/staffRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import quotationsRoutes from "./routes/quotationsRoutes.js";
import invoiceRoutes from "./routes/invoiceController.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import notificationRoutes from "./routes/notificationRouter.js";
import expenseRoutes from "./routes/expenseRoutes.js";

// Subscription system routes
import superadminRoutes from "./routes/superadminRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:3000",
  "https://screenflow-accounting.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(express.json());

// Core routes
app.use("/api/auth", authRoutes);

// Subscription system routes (NEW)
app.use("/api/superadmin", superadminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/invitations", invitationRoutes);

// Business feature routes
app.use("/api/staff", staffRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/quotations", quotationsRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/expenses", expenseRoutes);



app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
