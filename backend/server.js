// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to Database, then start background jobs
const { startWarrantyScheduler } = require('./jobs/warrantyScheduler');
connectDB().then(() => {
  startWarrantyScheduler();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/device-requests", require("./routes/deviceRequestRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/asset-assignments", require("./routes/assetAssignmentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/audit", require("./routes/auditRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));

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