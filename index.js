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

const app = express();

app.use(cors({
  origin: "http://localhost:8080", // your React URL
  credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/quotations", quotationsRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountRoutes);


app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
