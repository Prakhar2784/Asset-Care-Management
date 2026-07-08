const nodemailer = require('nodemailer');
const { getTenantId } = require('../middleware/tenantContext');

// ─── Base Email Template ───────────────────────────────────────────────────────
const baseTemplate = (title, bodyHtml, footerNote = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<title>${title}</title>
<style>
  body { margin:0; padding:0; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  .wrapper { max-width:600px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.10); }
  .header { background:#1E3A8A; padding:32px 36px; }
  .header-logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; }
  .header-logo span { color:#5eead4; }
  .header-title { font-size:28px; font-weight:800; color:#ffffff; margin-top:12px; letter-spacing:-0.5px; }
  .body { padding:32px 36px; }
  .label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; color:#64748b; margin-bottom:4px; }
  .value { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:16px; }
  .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin:20px 0; }
  .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; }
  .info-row:last-child { border-bottom:none; }
  .info-key { font-size:13px; color:#64748b; font-weight:600; }
  .info-val { font-size:13px; color:#0f172a; font-weight:700; text-align:right; }
  .btn { display:inline-block; background:#1E3A8A; color:#ffffff; text-decoration:none; font-weight:800; font-size:15px; padding:14px 32px; border-radius:10px; margin:24px 0 8px; }
  .status-badge { display:inline-block; padding:4px 14px; border-radius:999px; font-size:13px; font-weight:800; }
  .status-green { background:#dcfce7; color:#166534; }
  .status-red { background:#fee2e2; color:#991b1b; }
  .status-yellow { background:#fef9c3; color:#713f12; }
  .status-blue { background:#dbeafe; color:#1e40af; }
  .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 36px; text-align:center; }
  .footer-text { font-size:12px; color:#94a3b8; font-weight:500; margin-bottom:6px; }
  .footer-brand { font-size:13px; font-weight:800; color:#64748b; margin-bottom:4px; }
  .footer-address { font-size:11px; color:#cbd5e1; margin-top:8px; }
</style>
</head>
<body>
<!-- Preheader (hidden preview text for email clients) -->
<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  AssetCare Pro — ${title} — This is an automated notification from your asset management system.
</div>
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
    <div class="footer-text">${footerNote || 'This is an automated notification from your organisation\'s asset management system.'}</div>
    <div class="footer-text">You are receiving this email because you are registered on AssetCare Pro.</div>
    <div class="footer-address">AssetCare Pro &bull; IT Asset Management Platform &bull; support@assetcarepro.com</div>
  </div>
</div>
</body>
</html>`;

// ─── Transporter and Sender Resolution ──────────────────────────────────────────
const getTenantSmtpConfig = async () => {
  const tenantId = getTenantId();
  if (tenantId && tenantId !== 'default') {
    const Tenant = require('../models/Tenant');
    try {
      const tenant = await Tenant.findOne({ slug: tenantId });
      if (tenant && tenant.smtp && tenant.smtp.host && tenant.smtp.user && tenant.smtp.pass) {
        return tenant.smtp;
      }
    } catch (err) {
      console.error('[EMAIL SMTP CONFIG ERROR]', err.message);
    }
  }
  return null;
};

// ─── Send Email Utility ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const smtpConfig = await getTenantSmtpConfig();

  const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = smtpConfig?.port || parseInt(process.env.SMTP_PORT) || 587;
  const user = smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.pass || process.env.SMTP_PASS;
  const fromEmail = smtpConfig?.fromEmail || user;

  if (!user || !pass) {
    console.log(`[EMAIL SKIPPED] No SMTP config. Would send to: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      // Force STARTTLS on port 587; prevents plaintext fallback
      requireTLS: port !== 465,
      auth: { user, pass },
      tls: {
        // Accept self-signed certs (common on private SMTP servers)
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
    });

    // Unique Message-ID prevents duplicate-detection false positives
    const domain = fromEmail.includes('@') ? fromEmail.split('@')[1] : 'assetcarepro.com';
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 10)}@${domain}>`;

    await transporter.sendMail({
      from: `"AssetCare Pro" <${fromEmail}>`,
      replyTo: fromEmail,
      to,
      subject,
      html,
      // Always provide a real plain-text body — missing it is a strong spam signal
      text: text || subject,
      messageId,
      headers: {
        // Required by Gmail bulk-sender policy (Feb 2024) for transactional mail
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        // Tells receivers this is automated bulk/transactional mail, not personal
        'Precedence': 'bulk',
        // Normal priority — avoid 1 (high) which spam filters flag
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'AssetCare Pro Notification System',
        // Prevents auto-replies / out-of-office loops back to this sender
        'X-Auto-Response-Suppress': 'All',
      },
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject} (${smtpConfig ? 'Tenant SMTP' : 'Global SMTP'})`);
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
    subject: 'Reset Your AssetCare Pro Password',
    text: `Hello ${user.name}, click this link to reset your password: ${body.match(/href="([^"]+)"/)?.[1] || ''}. This link expires in 15 minutes.`,
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
    subject: `Ticket Raised: ${ticket.ticketId}`,
    text: `Hello ${user.name}, your ticket ${ticket.ticketId} has been submitted and is pending approval. Issue: ${ticket.issue}. Priority: ${ticket.priority}.`,
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
    subject: `Ticket Update: ${ticket.ticketId} is now ${ticket.status}`,
    text: `Hello ${user.name}, your ticket ${ticket.ticketId} status has changed from ${oldStatus} to ${ticket.status}.`,
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
    subject: `Ticket Resolved: ${ticket.ticketId}`,
    text: `Hello ${user.name}, your ticket ${ticket.ticketId} has been resolved. Issue: ${ticket.issue}. If you continue to experience issues, please raise a new ticket.`,
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
    subject: `Asset Assigned: ${asset.name}`,
    text: `Hello ${user.name}, a new asset has been assigned to you. Asset: ${asset.name} (${asset.serialNumber}), Department: ${asset.department}.`,
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
    subject: `Asset Revoked: ${asset.name} - Action Required`,
    text: `Hello ${user.name}, the asset ${asset.name} (${asset.serialNumber}) has been revoked from your account. Please return it to the IT department at the earliest.`,
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
    subject: `Request Approved: ${request.requestId}`,
    text: `Hello ${user.name}, your device request ${request.requestId} for ${request.itemRequested} has been approved. The procurement process will now begin.`,
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
    subject: `Request Update: ${request.requestId} was not approved`,
    text: `Hello ${user.name}, your device request ${request.requestId} for ${request.itemRequested} was not approved. ${request.adminRemarks ? 'Reason: ' + request.adminRemarks : ''}`,
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
    subject: `Warranty Alert: ${asset.name} expires in ${daysLeft} days`,
    text: `Warranty expiry alert: Asset ${asset.name} (${asset.serialNumber}) in department ${asset.department} has ${daysLeft} days left on warranty. Warranty end date: ${new Date(asset.warrantyEnd).toLocaleDateString()}.`,
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
    subject: 'Welcome to AssetCare Pro - Your Account is Ready',
    text: `Hello ${user.name}, welcome to AssetCare Pro! Your account has been created. Email: ${user.email}, Role: ${user.role}, Department: ${user.department}.${tempPassword ? ' Temporary password: ' + tempPassword + ' - Please change it after your first login.' : ''}`,
    html: baseTemplate('Welcome to AssetCare Pro', body)
  });
};

// 11. Password Changed Notification
const sendPasswordChangedEmail = async (user) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Your AssetCare Pro account password was successfully changed.
      If you made this change, no action is required.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Account</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-key">Changed At</span><span class="info-val">${new Date().toLocaleString('en-IN')}</span></div>
    </div>
    <p style="font-size:13px;color:#dc2626;font-weight:700;margin-top:16px;">
      If you did NOT make this change, please contact your system administrator immediately or use Forgot Password to secure your account.
    </p>`;
  await sendEmail({
    to: user.email,
    subject: 'Your AssetCare Pro Password Has Been Changed',
    text: `Hello ${user.name}, your AssetCare Pro password was changed on ${new Date().toLocaleString('en-IN')}. If you did not make this change, contact your administrator immediately.`,
    html: baseTemplate('Password Changed Successfully', body, 'If you did not initiate this change, contact your admin immediately.')
  });
};

// 12. Contact Form Inquiry
const sendContactEmail = async ({ company, name, email, phone, orgSize, inquiryType, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      A new contact/demo request has been submitted via the AssetCare Pro website.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Company</span><span class="info-val">${company}</span></div>
      <div class="info-row"><span class="info-key">Contact Name</span><span class="info-val">${name}</span></div>
      <div class="info-row"><span class="info-key">Email</span><span class="info-val">${email}</span></div>
      <div class="info-row"><span class="info-key">Phone</span><span class="info-val">${phone}</span></div>
      <div class="info-row"><span class="info-key">Organisation Size</span><span class="info-val">${orgSize}</span></div>
      <div class="info-row"><span class="info-key">Inquiry Type</span><span class="info-val">${inquiryType}</span></div>
    </div>
    <div style="margin-top:16px;padding:16px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:#64748b;margin-bottom:8px;">Message</div>
      <p style="font-size:14px;color:#0f172a;font-weight:500;margin:0;line-height:1.6;">${message}</p>
    </div>`;
  await sendEmail({
    to: adminEmail,
    subject: `New Contact Request: ${inquiryType} from ${company}`,
    text: `New contact request from ${name} (${company}). Email: ${email}, Phone: ${phone}, Type: ${inquiryType}. Message: ${message}`,
    html: baseTemplate('New Demo / Contact Request', body, 'Sent from the AssetCare Pro public contact form.')
  });
};

// HOD Department Ticket Notification
const sendHodTicketNotificationEmail = async (hod, ticket, asset, raisedByUser) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${hod.name}</strong>,<br><br>
      A new breakdown ticket has been raised in your department and requires your authorization.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Ticket ID</span><span class="info-val">${ticket.ticketId}</span></div>
      <div class="info-row"><span class="info-key">Raised By</span><span class="info-val">${raisedByUser?.name || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Department</span><span class="info-val">${raisedByUser?.department || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Asset</span><span class="info-val">${asset?.name || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Issue</span><span class="info-val">${ticket.issue}</span></div>
      <div class="info-row"><span class="info-key">Priority</span><span class="info-val">${ticket.priority}</span></div>
      <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="status-badge status-yellow">Pending HOD Approval</span></span></div>
    </div>
    <p style="font-size:13px;color:#64748b;margin-top:16px;">Please log in to AssetCare Pro to review and authorize this ticket.</p>`;
  await sendEmail({
    to: hod.email,
    subject: `Action Required: New Ticket in Your Department — ${ticket.ticketId}`,
    text: `Hello ${hod.name}, a new ticket ${ticket.ticketId} was raised by ${raisedByUser?.name || 'an employee'} (${raisedByUser?.department || 'your department'}) for asset "${asset?.name || 'N/A'}". Issue: ${ticket.issue}. Priority: ${ticket.priority}. Please log in to authorize.`,
    html: baseTemplate('New Department Ticket — Action Required', body, 'You are receiving this because you are the Head of Department for the affected department.')
  });
};

// Account Deactivated Notification
const sendDeactivationEmail = async (user) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      Your <strong>AssetCare Pro</strong> account has been <strong style="color:#dc2626;">deactivated</strong> by your administrator.
      You will no longer be able to log in to the system.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Account</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-key">Department</span><span class="info-val">${user.department || 'N/A'}</span></div>
      <div class="info-row"><span class="info-key">Deactivated At</span><span class="info-val">${new Date().toLocaleString('en-IN')}</span></div>
    </div>
    <p style="font-size:13px;color:#64748b;font-weight:600;margin-top:16px;">
      If you believe this is a mistake or need assistance, please contact your IT administrator.
    </p>`;
  await sendEmail({
    to: user.email,
    subject: 'Your AssetCare Pro Account Has Been Deactivated',
    text: `Hello ${user.name}, your AssetCare Pro account (${user.email}) has been deactivated by your administrator on ${new Date().toLocaleString('en-IN')}. You will no longer be able to log in. If this is a mistake, contact your IT administrator.`,
    html: baseTemplate('Account Deactivated', body, 'This is an automated notification from AssetCare Pro.')
  });
};

// Invite Email (admin-sent invite link)
const sendInviteEmail = async (user, inviteLink) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      You've been invited to join <strong>AssetCare Pro</strong> by your administrator.
      Click the button below to set your password and activate your account.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Name</span><span class="info-val">${user.name}</span></div>
      <div class="info-row"><span class="info-key">Email</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-key">Role</span><span class="info-val">${user.role}</span></div>
      <div class="info-row"><span class="info-key">Department</span><span class="info-val">${user.department}</span></div>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;font-weight:800;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:-0.3px;">
        Set My Password &amp; Activate Account
      </a>
    </div>
    <p style="font-size:13px;color:#94a3b8;text-align:center;">
      This invite link expires in <strong>48 hours</strong>. If you did not expect this email, you can safely ignore it.
    </p>`;
  await sendEmail({
    to: user.email,
    subject: `You're invited to AssetCare Pro`,
    text: `Hello ${user.name}, you've been invited to AssetCare Pro. Set your password here: ${inviteLink}. This link expires in 48 hours.`,
    html: baseTemplate('You\'re Invited to AssetCare Pro', body, 'Invite link expires in 48 hours.')
  });
};

// OTP Password Reset Email
const sendOtpEmail = async (user, otp) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hello <strong>${user.name}</strong>,<br><br>
      We received a request to reset the password for your AssetCare Pro account.
      Use the OTP below to verify your identity. This code expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:16px;padding:24px 48px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px;">Your OTP Code</div>
        <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#1E3A8A;font-family:monospace;">${otp}</div>
      </div>
    </div>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Account</span><span class="info-val">${user.email}</span></div>
      <div class="info-row"><span class="info-key">Expires In</span><span class="info-val">10 minutes</span></div>
    </div>
    <p style="font-size:13px;color:#94a3b8;margin-top:16px;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      Never share this OTP with anyone.
    </p>`;
  await sendEmail({
    to: user.email,
    subject: 'AssetCare Pro Password Reset OTP',
    text: `Hello ${user.name}, your OTP to reset your AssetCare Pro password is: ${otp}. This code expires in 10 minutes. Do not share this with anyone.`,
    html: baseTemplate('Password Reset OTP', body, 'This OTP expires in 10 minutes and can only be used once.')
  });
};

const sendContactAutoReply = async ({ name, email, company, inquiryType }) => {
  const body = `
    <p style="font-size:15px;color:#334155;font-weight:600;margin-bottom:20px;">
      Hi ${name},
    </p>
    <p style="font-size:14px;color:#334155;line-height:1.7;margin-bottom:16px;">
      Thank you for reaching out to <strong>AssetCare Pro</strong>. We have received your <strong>${inquiryType}</strong> request from <strong>${company}</strong> and our team will get back to you within <strong>1 business day</strong>.
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Inquiry Type</span><span class="info-val">${inquiryType}</span></div>
      <div class="info-row"><span class="info-key">Company</span><span class="info-val">${company}</span></div>
    </div>
    <p style="font-size:14px;color:#334155;line-height:1.7;margin-top:20px;">
      In the meantime, you can explore our product at <strong>assetcarepro.com</strong> or reach us directly:
    </p>
    <div class="info-box">
      <div class="info-row"><span class="info-key">Email</span><span class="info-val">support@assetcarepro.com</span></div>
      <div class="info-row"><span class="info-key">Phone</span><span class="info-val">+91 800-456-7890</span></div>
    </div>`;
  await sendEmail({
    to: email,
    subject: `We received your request — AssetCare Pro`,
    text: `Hi ${name}, thank you for contacting AssetCare Pro. We have received your ${inquiryType} request from ${company} and will get back to you within 1 business day.`,
    html: baseTemplate('Thank You for Reaching Out', body, 'You are receiving this because you submitted a contact form on assetcarepro.com.')
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendContactEmail,
  sendContactAutoReply,
  sendOtpEmail,
  sendTicketCreatedEmail,
  sendTicketStatusEmail,
  sendTicketResolvedEmail,
  sendAssetAssignedEmail,
  sendAssetRevokedEmail,
  sendApprovalApprovedEmail,
  sendApprovalRejectedEmail,
  sendWarrantyExpiryEmail,
  sendWelcomeEmail,
  sendInviteEmail,
  sendDeactivationEmail,
  sendHodTicketNotificationEmail,
};
