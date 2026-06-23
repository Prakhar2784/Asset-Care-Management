const nodemailer = require('nodemailer');

// ─── Transporter ───────────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// ─── Base Email Template ───────────────────────────────────────────────────────
const baseTemplate = (title, bodyHtml, footerNote = '') => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; }
  .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.10); }
  .header { background:linear-gradient(135deg,#1E3A8A,#0F766E); padding:32px 36px; }
  .header-logo { font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px; }
  .header-logo span { color:#5eead4; }
  .header-title { font-size:28px; font-weight:800; color:#fff; margin-top:12px; letter-spacing:-0.5px; }
  .body { padding:32px 36px; }
  .label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; color:#64748b; margin-bottom:4px; }
  .value { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:16px; }
  .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin:20px 0; }
  .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; }
  .info-row:last-child { border-bottom:none; }
  .info-key { font-size:13px; color:#64748b; font-weight:600; }
  .info-val { font-size:13px; color:#0f172a; font-weight:700; text-align:right; }
  .btn { display:inline-block; background:linear-gradient(135deg,#1E3A8A,#0F766E); color:#fff; text-decoration:none; font-weight:800; font-size:15px; padding:14px 32px; border-radius:10px; margin:24px 0 8px; }
  .status-badge { display:inline-block; padding:4px 14px; border-radius:999px; font-size:13px; font-weight:800; }
  .status-green { background:#dcfce7; color:#166534; }
  .status-red { background:#fee2e2; color:#991b1b; }
  .status-yellow { background:#fef9c3; color:#713f12; }
  .status-blue { background:#dbeafe; color:#1e40af; }
  .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 36px; text-align:center; }
  .footer-text { font-size:12px; color:#94a3b8; font-weight:500; }
  .footer-brand { font-size:13px; font-weight:800; color:#64748b; margin-bottom:4px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-logo">Asset<span>Care</span> Pro</div>
    <div class="header-title">${title}</div>
  </div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="footer">
    <div class="footer-brand">AssetCare Pro — Enterprise Asset Management</div>
    <div class="footer-text">${footerNote || 'This is an automated notification. Do not reply to this email.'}</div>
  </div>
</div>
</body>
</html>`;

// ─── Send Email Utility ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIPPED] No SMTP config. Would send to: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"AssetCare Pro" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | ${err.message}`);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATE FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

// 1. Password Reset
const sendPasswordResetEmail = async (user, resetUrl) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      We received a request to reset the password for your AssetCare Pro account.
      Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
    </p>
    <div style="text-align:center;">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>
    <div class="info-box" style="margin-top:24px;">
      <div class="info-row"><span class="info-key">Account</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-key">Link Expires</span><span class="info-val">15 minutes</span></div>
    </div>
    <p style="font-size:13px;color:#94a3b8;margin-top:16px;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>`;
  await sendEmail({
    to: user.email,
    subject: '🔐 Reset Your AssetCare Pro Password',
    html: baseTemplate('Password Reset Request', body, 'This link expires in 15 minutes and can only be used once.')
  });
};

// 2. Ticket Created
const sendTicketCreatedEmail = async (user, ticket, asset) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Your breakdown ticket has been successfully raised and is now pending authorization.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Ticket ID</span><span class="info-val">${ticket.ticketId}</span></div>
      <div class="info-row"><span class="info-key">Asset</span><span class="info-val">${asset?.name || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Issue</span><span class="info-val">${ticket.issue}</span></div>
      <div class="info-row"><span class="info-key">Priority</span><span class="info-val">${ticket.priority}</span></div>
      <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="status-badge status-yellow">Pending Approval</span></span></div>
    </div>
    <p style="font-size:13px;color:#64748b;">You will receive updates as your ticket progresses through the service workflow.</p>`;
  await sendEmail({
    to: user.email,
    subject: `🎫 Ticket Raised — ${ticket.ticketId}`,
    html: baseTemplate('Ticket Raised Successfully', body)
  });
};

// 3. Ticket Status Updated
const sendTicketStatusEmail = async (user, ticket, asset, oldStatus) => {
  const statusClass = {
    'Resolved': 'status-green', 'Rejected': 'status-red',
    'Vendor Assigned': 'status-blue', 'Under Repair': 'status-yellow'
  }[ticket.status] || 'status-blue';

  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      The status of your breakdown ticket has been updated.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Ticket ID</span><span class="info-val">${ticket.ticketId}</span></div>
      <div class="info-row"><span class="info-key">Asset</span><span class="info-val">${asset?.name || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Previous Status</span><span class="info-val">${oldStatus}</span></div>
      <div class="info-row"><span class="info-key">New Status</span><span class="info-val"><span class="status-badge ${statusClass}">${ticket.status}</span></span></div>
    </div>`;
  await sendEmail({
    to: user.email,
    subject: `📋 Ticket Update — ${ticket.ticketId} is now ${ticket.status}`,
    html: baseTemplate('Ticket Status Updated', body)
  });
};

// 4. Ticket Resolved
const sendTicketResolvedEmail = async (user, ticket, asset) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Great news! Your breakdown ticket has been <strong style="color:#16a34a;">resolved</strong>.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Ticket ID</span><span class="info-val">${ticket.ticketId}</span></div>
      <div class="info-row"><span class="info-key">Asset</span><span class="info-val">${asset?.name || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Issue</span><span class="info-val">${ticket.issue}</span></div>
      <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="status-badge status-green">✓ Resolved</span></span></div>
      ${ticket.estimatedCost ? `<div class="info-row"><span class="info-key">Repair Cost</span><span class="info-val">₹ ${ticket.estimatedCost.toLocaleString()}</span></div>` : ''}
    </div>
    <p style="font-size:13px;color:#64748b;">If you continue to experience issues, please raise a new ticket from your employee portal.</p>`;
  await sendEmail({
    to: user.email,
    subject: `✅ Ticket Resolved — ${ticket.ticketId}`,
    html: baseTemplate('Your Issue Has Been Resolved', body)
  });
};

// 5. Asset Assigned
const sendAssetAssignedEmail = async (user, asset) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      A new asset has been assigned to you. Please inspect the asset and confirm its condition.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Asset Name</span><span class="info-val">${asset.name}</span></div>
      <div class="info-row"><span class="info-key">Serial Number</span><span class="info-val">${asset.serialNumber}</span></div>
      <div class="info-row"><span class="info-key">Category</span><span class="info-val">${asset.category}</span></div>
      <div class="info-row"><span class="info-key">Department</span><span class="info-val">${asset.department}</span></div>
      <div class="info-row"><span class="info-key">Assigned On</span><span class="info-val">${new Date().toLocaleDateString()}</span></div>
    </div>
    <p style="font-size:13px;color:#64748b;">You are responsible for the safe use and maintenance of this asset. Report any issues immediately.</p>`;
  await sendEmail({
    to: user.email,
    subject: `🖥️ Asset Assigned — ${asset.name}`,
    html: baseTemplate('Asset Assigned to You', body)
  });
};

// 6. Asset Revoked
const sendAssetRevokedEmail = async (user, asset) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      The following asset has been <strong>revoked</strong> from your account. Please return it to the IT department at the earliest.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Asset Name</span><span class="info-val">${asset.name}</span></div>
      <div class="info-row"><span class="info-key">Serial Number</span><span class="info-val">${asset.serialNumber}</span></div>
      <div class="info-row"><span class="info-key">Category</span><span class="info-val">${asset.category}</span></div>
      <div class="info-row"><span class="info-key">Return Status</span><span class="info-val"><span class="status-badge status-yellow">Return Pending</span></span></div>
    </div>`;
  await sendEmail({
    to: user.email,
    subject: `⚠️ Asset Revoked — ${asset.name}`,
    html: baseTemplate('Asset Revoked from Your Account', body)
  });
};

// 7. Approval Approved
const sendApprovalApprovedEmail = async (user, request) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Your device request has been <strong style="color:#16a34a;">approved</strong> by the admin.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Request ID</span><span class="info-val">${request.requestId}</span></div>
      <div class="info-row"><span class="info-key">Item Requested</span><span class="info-val">${request.itemRequested}</span></div>
      <div class="info-row"><span class="info-key">Request Type</span><span class="info-val">${request.requestType}</span></div>
      <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="status-badge status-green">✓ Approved</span></span></div>
      ${request.adminRemarks ? `<div class="info-row"><span class="info-key">Admin Remarks</span><span class="info-val">${request.adminRemarks}</span></div>` : ''}
    </div>
    <p style="font-size:13px;color:#64748b;">The procurement process will now begin. You will be notified when the asset is ready for assignment.</p>`;
  await sendEmail({
    to: user.email,
    subject: `✅ Request Approved — ${request.requestId}`,
    html: baseTemplate('Your Request Has Been Approved', body)
  });
};

// 8. Approval Rejected
const sendApprovalRejectedEmail = async (user, request) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Unfortunately, your device request has been <strong style="color:#dc2626;">rejected</strong>.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Request ID</span><span class="info-val">${request.requestId}</span></div>
      <div class="info-row"><span class="info-key">Item Requested</span><span class="info-val">${request.itemRequested}</span></div>
      <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="status-badge status-red">✗ Rejected</span></span></div>
      ${request.adminRemarks ? `<div class="info-row"><span class="info-key">Reason</span><span class="info-val">${request.adminRemarks}</span></div>` : ''}
    </div>
    <p style="font-size:13px;color:#64748b;">If you believe this is incorrect, please contact your department head or raise a new request with additional justification.</p>`;
  await sendEmail({
    to: user.email,
    subject: `❌ Request Rejected — ${request.requestId}`,
    html: baseTemplate('Your Request Was Rejected', body)
  });
};

// 9. Warranty Expiry Alert
const sendWarrantyExpiryEmail = async (adminEmail, asset, daysLeft) => {
  const urgencyColor = daysLeft <= 7 ? 'status-red' : daysLeft <= 15 ? 'status-yellow' : 'status-blue';
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      This is an automated reminder that the warranty for the following asset is expiring soon.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Asset Name</span><span class="info-val">${asset.name}</span></div>
      <div class="info-row"><span class="info-key">Serial Number</span><span class="info-val">${asset.serialNumber}</span></div>
      <div class="info-row"><span class="info-key">Department</span><span class="info-val">${asset.department}</span></div>
      <div class="info-row"><span class="info-key">Warranty End</span><span class="info-val">${new Date(asset.warrantyEnd).toLocaleDateString()}</span></div>
      <div class="info-row"><span class="info-key">Days Remaining</span><span class="info-val"><span class="status-badge ${urgencyColor}">${daysLeft} days</span></span></div>
    </div>
    <p style="font-size:13px;color:#64748b;">Please take action to renew the AMC or arrange replacement before expiry.</p>`;
  await sendEmail({
    to: adminEmail,
    subject: `⏰ Warranty Expiring in ${daysLeft} Days — ${asset.name}`,
    html: baseTemplate(`Warranty Expiry Alert`, body, 'Automated warranty monitoring — AssetCare Pro')
  });
};

// 10. Welcome / Account Created
const sendWelcomeEmail = async (user, tempPassword) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Welcome to <strong>AssetCare Pro</strong>! Your account has been created successfully.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Name</span><span class="info-val">${user.name}</span></div>
      <div class="info-row"><span class="info-key">Email</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-key">Role</span><span class="info-val">${user.role}</span></div>
      <div class="info-row"><span class="info-key">Department</span><span class="info-val">${user.department}</span></div>
      ${tempPassword ? `<div class="info-row"><span class="info-key">Temp Password</span><span class="info-val" style="font-family:monospace;background:#f1f5f9;padding:2px 8px;border-radius:4px;">${tempPassword}</span></div>` : ''}
    </div>
    ${tempPassword ? '<p style="font-size:13px;color:#dc2626;font-weight:700;">⚠️ Please change your password after your first login.</p>' : ''}`;
  await sendEmail({
    to: user.email,
    subject: '👋 Welcome to AssetCare Pro',
    html: baseTemplate('Welcome to AssetCare Pro', body)
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendTicketCreatedEmail,
  sendTicketStatusEmail,
  sendTicketResolvedEmail,
  sendAssetAssignedEmail,
  sendAssetRevokedEmail,
  sendApprovalApprovedEmail,
  sendApprovalRejectedEmail,
  sendWarrantyExpiryEmail,
  sendWelcomeEmail
};
