// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Apply global multi-tenant query isolation plugin to Mongoose
const mongoose = require('mongoose');
const tenantPlugin = require('./middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

// Connect to Database, then start background jobs
const { startWarrantyScheduler }    = require('./jobs/warrantyScheduler');
const { startSLAJob }               = require('./jobs/slaEscalationJob');
const { startRecurringTicketJob }   = require('./jobs/recurringTicketJob');
connectDB().then(() => {
  startWarrantyScheduler();
  startSLAJob();
  startRecurringTicketJob();
});

const { resolveTenantContext } = require("./middleware/tenantMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(resolveTenantContext);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/procurement", require("./routes/procurementRoutes"));
app.use("/api/device-requests", require("./routes/deviceRequestRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/asset-assignments", require("./routes/assetAssignmentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/audit", require("./routes/auditRoutes"));
app.use("/api/enterprise", require("./routes/enterpriseRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/sla", require("./routes/slaRoutes"));
app.use("/api/custom-fields", require("./routes/customFieldRoutes"));
app.use("/api/network", require("./routes/networkRoutes"));
app.use("/api/ocr",          require("./routes/ocrRoutes"));
app.use("/api/asset-loans", require("./routes/assetLoanRoutes"));
app.use("/api/maintenance", require("./routes/maintenanceRoutes"));
app.use("/api/invoices",    require("./routes/invoiceRoutes"));
app.use("/api/apikeys",     require("./routes/apiKeyRoutes"));
app.use("/api/service-centers", require("./routes/serviceCenterRoutes"));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("AssetCare API is running...");
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});