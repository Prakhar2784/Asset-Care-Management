// backend/server.js
// Polyfill process.getBuiltinModule for compatibility with older Node versions in packaged executables (e.g. pkg)
if (typeof process.getBuiltinModule !== "function") {
  process.getBuiltinModule = function() { return {}; };
}
// Polyfill global crypto for older Node versions (like Node 18.5) where globalThis.crypto is not defined
if (typeof global.crypto === "undefined") {
  global.crypto = require("crypto");
}
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
const uploadsPath = process.pkg
  ? path.join(path.dirname(process.execPath), 'uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

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
// app.use("/api/device-requests", require("./routes/deviceRequestRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/asset-assignments", require("./routes/assetAssignmentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/audit", require("./routes/auditRoutes"));
app.use("/api/enterprise", require("./routes/enterpriseRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/custom-fields", require("./routes/customFieldRoutes"));
app.use("/api/asset-loans", require("./routes/assetLoanRoutes"));
app.use("/api/maintenance", require("./routes/maintenanceRoutes"));
app.use("/api/invoices",    require("./routes/invoiceRoutes"));
app.use("/api/apikeys",     require("./routes/apiKeyRoutes"));
app.use("/api/service-centers", require("./routes/serviceCenterRoutes"));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Route to download the standalone Windows setup installer
app.get("/download/desktop-app", (req, res) => {
  // If a cloud download URL is configured in env, redirect to it directly
  if (process.env.DESKTOP_APP_DOWNLOAD_URL) {
    return res.redirect(process.env.DESKTOP_APP_DOWNLOAD_URL);
  }

  const possiblePaths = [
    path.join(__dirname, "../asset-care-setup.exe"), // Development path
    path.join(path.dirname(process.execPath), "asset-care-setup.exe"), // Next to running binary path
    path.join(__dirname, "asset-care-setup.exe"), // Inside backend/
    path.join(__dirname, "dist/asset-care-setup.exe"), // Inside backend/dist/
    path.join(path.dirname(process.execPath), "../asset-care-setup.exe") // Relative to running folder parent
  ];
  
  const fs = require('fs');
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.download(p, "asset-care-setup.exe");
    }
  }
  
  res.status(404).send("Setup file not found. Please compile the installer first.");
});


// Serve static frontend build files
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// Wildcard handler for SPA routing
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && !path.extname(req.path)) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
  next();
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
  console.log(`\n======================================================`);
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Find and display local IP addresses for Intranet access
  const os = require('os');
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  
  console.log(`Local Access: http://localhost:${PORT}`);
  if (addresses.length > 0) {
    addresses.forEach(ip => {
      console.log(`👉 Intranet Access (For Employees): http://${ip}:${PORT}`);
    });
  }
  console.log(`======================================================\n`);

  // Automatically open default browser on successful server boot
  try {
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
    exec(`${startCmd} ${url}`);
  } catch (err) {
    console.error("Could not automatically open browser:", err.message);
  }
});