const nodemailer = require('nodemailer');
const { getTenantId } = require('../middleware/tenantContext');

// ─── Status Badge Generator ───────────────────────────────────────────────────
const makeBadge = (text, type = 'blue') => {
  const styles = {
    green:  'background-color:#dcfce7;color:#166534;border:1px solid #bbf7d0;',
    red:    'background-color:#fee2e2;color:#991b1b;border:1px solid #fecaca;',
    yellow: 'background-color:#fef9c3;color:#854d0e;border:1px solid #fef08a;',
    blue:   'background-color:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;',
    purple: 'background-color:#f3e8ff;color:#6b21a8;border:1px solid #e9d5ff;'
  };
  const style = styles[type] || styles.blue;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:0.3px;line-height:1.3;${style}">${text}</span>`;
};

// ─── Email Client-Safe 2-Column Info Table ─────────────────────────────────────
const makeInfoTable = (rows) => {
  const rowHtml = rows
    .filter(r => r && r.val !== undefined && r.val !== null && r.val !== '')
    .map((r, idx, arr) => {
      const isLast = idx === arr.length - 1;
      const borderBottom = isLast ? '' : 'border-bottom:1px solid #edf2f7;';
      return `
        <tr>
          <td style="padding:11px 16px;font-size:13px;font-weight:700;color:#64748b;width:38%;vertical-align:top;${borderBottom}white-space:nowrap;">
            ${r.key} <span style="color:#cbd5e1;margin-left:6px;font-weight:400;">—</span>
          </td>
          <td style="padding:11px 16px;font-size:13.5px;font-weight:700;color:#0f172a;vertical-align:top;${borderBottom}text-align:left;word-break:break-word;">
            ${r.val}
          </td>
        </tr>
      `;
    }).join('');

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;margin:20px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tbody>
        ${rowHtml}
      </tbody>
    </table>
  `;
};

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
  body { margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  .wrapper { max-width:600px; margin:32px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.08); border:1px solid #e2e8f0; }
  .header { background-color:#072F1F; padding:32px 36px; border-bottom:3px solid #B4F105; }
  .header-logo { font-size:22px; font-weight:900; color:#ffffff; letter-spacing:-0.5px; }
  .header-logo span { color:#B4F105; }
  .header-title { font-size:24px; font-weight:800; color:#ffffff; margin-top:10px; letter-spacing:-0.4px; line-height:1.25; }
  .body { padding:32px 36px; background-color:#ffffff; }
  p { margin:0 0 16px 0; font-size:15px; color:#334155; line-height:1.65; font-weight:500; }
  p:last-child { margin-bottom:0; }
  .btn { display:inline-block; background-color:#072F1F; color:#ffffff !important; text-decoration:none; font-weight:800; font-size:14px; padding:14px 32px; border-radius:10px; margin:20px 0 8px; letter-spacing:0.3px; }
  .footer { background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:24px 36px; text-align:center; }
  .footer-brand { font-size:13px; font-weight:800; color:#475569; margin-bottom:6px; letter-spacing:-0.2px; }
  .footer-text { font-size:12px; color:#64748b; font-weight:500; margin-bottom:6px; line-height:1.55; }
  .footer-contact { font-size:12px; color:#334155; font-weight:600; margin-top:8px; }
  .footer-contact a { color:#059669; text-decoration:none; font-weight:700; }
  .footer-address { font-size:11px; color:#94a3b8; margin-top:8px; line-height:1.4; }
</style>
</head>
<body>
<!-- Preheader for email clients -->
<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  IAssetCare — ${title} — Official Notification
</div>
<div class="wrapper">
  <div class="header">
    <div class="header-logo">IAsset<span>Care</span></div>
    <div class="header-title">${title}</div>
  </div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="footer">
    <div class="footer-brand">IAssetCare — Enterprise IT Asset Management</div>
    <div class="footer-text">${footerNote || 'This is an automated notification from your organisation\'s asset management system.'}</div>
    <div class="footer-text">You are receiving this email because you are a registered user on IAssetCare.</div>
    <div class="footer-contact">
      Email: <a href="mailto:iassetcare@icpljpr.com">iassetcare@icpljpr.com</a> &bull; Helpline: <strong>+91 90270 07508</strong>
    </div>
    <div class="footer-address">
      IAssetCare &bull; Tech Park, Block B, Jaipur, Rajasthan, India – 302022
    </div>
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
  const fromEmail = smtpConfig?.fromEmail || user || 'iassetcare@icpljpr.com';

  if (!user || !pass) {
    console.log(`[EMAIL SKIPPED] No SMTP config. Would send to: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
    });

    const domain = fromEmail.includes('@') ? fromEmail.split('@')[1] : 'icpljpr.com';
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 10)}@${domain}>`;

    await transporter.sendMail({
      from: `"IAssetCare Notifications" <${fromEmail}>`,
      replyTo: 'iassetcare@icpljpr.com',
      to,
      subject,
      html,
      text: text || subject,
      messageId,
      headers: {
        'List-Unsubscribe': `<mailto:iassetcare@icpljpr.com?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'IAssetCare Notification System',
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
  const infoTable = makeInfoTable([
    { key: 'Account', val: user.email },
    { key: 'Security Type', val: 'One-Time Password Reset' },
    { key: 'Link Validity', val: makeBadge('15 Minutes', 'yellow') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      We received a request to reset the password for your IAssetCare account. 
      Click the button below to set a new password. This secure link expires in <strong>15 minutes</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" class="btn" style="color:#ffffff;">Reset My Password</a>
    </div>
    ${infoTable}
    <p style="font-size:13px;color:#94a3b8;margin-top:16px;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: 'Reset Your IAssetCare Password',
    text: `Hello ${user.name}, click this link to reset your password: ${resetUrl}. This link expires in 15 minutes.`,
    html: baseTemplate('Password Reset Request', body, 'This link expires in 15 minutes and can only be used once.')
  });
};

// 2. Ticket Created
const sendTicketCreatedEmail = async (user, ticket, asset) => {
  const infoTable = makeInfoTable([
    { key: 'Ticket ID', val: `<span style="font-family:monospace;font-weight:800;color:#072F1F;">${ticket.ticketId}</span>` },
    { key: 'Asset', val: asset?.name || 'N/A' },
    { key: 'Issue Description', val: ticket.issue },
    { key: 'Priority Level', val: makeBadge(ticket.priority, ticket.priority === 'High' ? 'red' : ticket.priority === 'Medium' ? 'yellow' : 'blue') },
    { key: 'Current Status', val: makeBadge('Pending Approval', 'yellow') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Your service request has been successfully registered and is now pending authorization.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      You will receive automated updates as your service request progresses through diagnosis, approval, and resolution.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Service Request Registered: ${ticket.ticketId}`,
    text: `Hello ${user.name}, your service request ${ticket.ticketId} has been submitted and is pending approval. Issue: ${ticket.issue}. Priority: ${ticket.priority}.`,
    html: baseTemplate('Service Request Registered Successfully', body)
  });
};

// 3. Ticket Status Updated
const sendTicketStatusEmail = async (user, ticket, asset, oldStatus) => {
  const statusTypeMap = {
    'Resolved': 'green',
    'Rejected': 'red',
    'Assigned to Technician': 'blue',
    'Vendor Assigned': 'blue',
    'Under Repair': 'yellow',
    'Pending Approval': 'yellow',
    'Pending HOD Approval': 'yellow'
  };
  const statusType = statusTypeMap[ticket.status] || 'blue';

  const infoTable = makeInfoTable([
    { key: 'Ticket ID', val: `<span style="font-family:monospace;font-weight:800;color:#072F1F;">${ticket.ticketId}</span>` },
    { key: 'Asset', val: asset?.name || 'N/A' },
    { key: 'Previous Status', val: oldStatus || 'N/A' },
    { key: 'Updated Status', val: makeBadge(ticket.status, statusType) }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      The status of your service request has been updated in the system.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      You can track real-time progress by logging into your employee portal dashboard.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Service Request Update: ${ticket.ticketId} is now ${ticket.status}`,
    text: `Hello ${user.name}, your service request ${ticket.ticketId} status has changed from ${oldStatus} to ${ticket.status}.`,
    html: baseTemplate('Service Request Status Updated', body)
  });
};

// 4. Ticket Resolved
const sendTicketResolvedEmail = async (user, ticket, asset) => {
  const rows = [
    { key: 'Ticket ID', val: `<span style="font-family:monospace;font-weight:800;color:#072F1F;">${ticket.ticketId}</span>` },
    { key: 'Asset', val: asset?.name || 'N/A' },
    { key: 'Issue Resolved', val: ticket.issue },
    { key: 'Final Status', val: makeBadge('✓ Resolved', 'green') }
  ];

  if (ticket.estimatedCost) {
    rows.push({ key: 'Repair Cost', val: `₹ ${Number(ticket.estimatedCost).toLocaleString('en-IN')}` });
  }

  const infoTable = makeInfoTable(rows);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Great news! Your service request has been <strong style="color:#16a34a;">resolved</strong> successfully.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      Please inspect your device. If you continue to experience any issues, you may raise a new service request from your employee portal.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Service Request Resolved: ${ticket.ticketId}`,
    text: `Hello ${user.name}, your service request ${ticket.ticketId} has been resolved. Issue: ${ticket.issue}.`,
    html: baseTemplate('Your Service Request Has Been Resolved', body)
  });
};

// 5. Asset Assigned
const sendAssetAssignedEmail = async (user, asset) => {
  const infoTable = makeInfoTable([
    { key: 'Asset Name', val: asset.name },
    { key: 'Serial Number', val: `<span style="font-family:monospace;font-weight:700;">${asset.serialNumber || 'N/A'}</span>` },
    { key: 'Category', val: asset.category || 'Hardware' },
    { key: 'Department', val: asset.department || 'General' },
    { key: 'Assigned Date', val: new Date().toLocaleDateString('en-IN') },
    { key: 'Assignment Status', val: makeBadge('Active Custody', 'green') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      A new hardware asset has been assigned to you. Please inspect the asset and verify its physical condition and serial number.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      You are responsible for the custody, safe operation, and maintenance of this device. Report any defects or damage immediately.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Asset Assigned: ${asset.name}`,
    text: `Hello ${user.name}, a new asset has been assigned to you. Asset: ${asset.name} (${asset.serialNumber}), Department: ${asset.department}.`,
    html: baseTemplate('Asset Assigned to You', body)
  });
};

// 6. Asset Revoked
const sendAssetRevokedEmail = async (user, asset) => {
  const infoTable = makeInfoTable([
    { key: 'Asset Name', val: asset.name },
    { key: 'Serial Number', val: `<span style="font-family:monospace;font-weight:700;">${asset.serialNumber || 'N/A'}</span>` },
    { key: 'Category', val: asset.category || 'Hardware' },
    { key: 'Action Required', val: makeBadge('Return Pending', 'yellow') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      The following asset has been <strong style="color:#dc2626;">revoked</strong> from your account custody. Please return the physical device and all accessories to the IT department at the earliest.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      If you have questions regarding this hand-back request, please reach out to your IT administrator.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Asset Revoked: ${asset.name} — Hand-back Required`,
    text: `Hello ${user.name}, the asset ${asset.name} (${asset.serialNumber}) has been revoked from your account. Please return it to the IT department.`,
    html: baseTemplate('Asset Revoked from Your Account', body)
  });
};

// 7. Approval Approved
const sendApprovalApprovedEmail = async (user, request) => {
  const rows = [
    { key: 'Request ID', val: `<span style="font-family:monospace;font-weight:800;color:#072F1F;">${request.requestId}</span>` },
    { key: 'Item Requested', val: request.itemRequested },
    { key: 'Request Type', val: request.requestType || 'Device Request' },
    { key: 'Decision', val: makeBadge('✓ Approved', 'green') }
  ];

  if (request.adminRemarks) {
    rows.push({ key: 'Admin Remarks', val: request.adminRemarks });
  }

  const infoTable = makeInfoTable(rows);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Your device request has been <strong style="color:#16a34a;">approved</strong> by the administrator.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      The fulfillment and assignment process will now proceed. You will receive an automated notification once the asset is ready for pickup/delivery.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Request Approved: ${request.requestId}`,
    text: `Hello ${user.name}, your device request ${request.requestId} for ${request.itemRequested} has been approved.`,
    html: baseTemplate('Your Request Has Been Approved', body)
  });
};

// 8. Approval Rejected
const sendApprovalRejectedEmail = async (user, request) => {
  const rows = [
    { key: 'Request ID', val: `<span style="font-family:monospace;font-weight:800;color:#072F1F;">${request.requestId}</span>` },
    { key: 'Item Requested', val: request.itemRequested },
    { key: 'Decision', val: makeBadge('✗ Rejected', 'red') }
  ];

  if (request.adminRemarks) {
    rows.push({ key: 'Rejection Reason', val: request.adminRemarks });
  }

  const infoTable = makeInfoTable(rows);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Your device request has been <strong style="color:#dc2626;">rejected</strong> upon review.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      If you believe this decision requires re-evaluation, please contact your department head or submit a new request with detailed business justification.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Request Update: ${request.requestId} was not approved`,
    text: `Hello ${user.name}, your device request ${request.requestId} for ${request.itemRequested} was not approved.`,
    html: baseTemplate('Your Request Was Rejected', body)
  });
};

// 9. Warranty Expiry Alert
const sendWarrantyExpiryEmail = async (adminEmail, asset, daysLeft) => {
  const urgencyColor = daysLeft <= 7 ? 'red' : daysLeft <= 15 ? 'yellow' : 'blue';
  const infoTable = makeInfoTable([
    { key: 'Asset Name', val: asset.name },
    { key: 'Serial Number', val: `<span style="font-family:monospace;font-weight:700;">${asset.serialNumber || 'N/A'}</span>` },
    { key: 'Department', val: asset.department || 'General' },
    { key: 'Warranty Expiry', val: new Date(asset.warrantyEnd).toLocaleDateString('en-IN') },
    { key: 'Days Remaining', val: makeBadge(`${daysLeft} days left`, urgencyColor) }
  ]);

  const body = `
    <p>
      This is an automated reminder that the manufacturer warranty / AMC for the following asset is expiring soon.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      Please take appropriate action to renew coverage, schedule preventive inspection, or budget for replacement before expiration.
    </p>`;

  await sendEmail({
    to: adminEmail,
    subject: `Warranty Alert: ${asset.name} expires in ${daysLeft} days`,
    text: `Warranty expiry alert: Asset ${asset.name} has ${daysLeft} days left on warranty.`,
    html: baseTemplate(`Warranty Expiry Alert`, body, 'Automated warranty monitoring — IAssetCare')
  });
};

// 10. Welcome / Account Created
const sendWelcomeEmail = async (user, tempPassword) => {
  const rows = [
    { key: 'Full Name', val: user.name },
    { key: 'Login Email', val: user.email },
    { key: 'Assigned Role', val: makeBadge(user.role?.toUpperCase() || 'EMPLOYEE', 'blue') },
    { key: 'Department', val: user.department || 'General' }
  ];

  if (tempPassword) {
    rows.push({
      key: 'Temporary Password',
      val: `<code style="font-family:monospace;font-size:14px;background-color:#e2e8f0;padding:4px 10px;border-radius:6px;font-weight:800;letter-spacing:0.5px;color:#0f172a;">${tempPassword}</code>`
    });
  }

  const infoTable = makeInfoTable(rows);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Welcome to <strong>IAssetCare</strong>! Your enterprise workspace account is now active and ready to use.
    </p>
    ${infoTable}
    ${tempPassword ? '<p style="font-size:13.5px;color:#dc2626;font-weight:700;margin-top:16px;">⚠️ For security, please change your temporary password immediately upon your first login.</p>' : ''}`;

  await sendEmail({
    to: user.email,
    subject: 'Welcome to IAssetCare — Your Account is Ready',
    text: `Hello ${user.name}, welcome to IAssetCare! Your account has been created. Email: ${user.email}, Role: ${user.role}, Department: ${user.department}.`,
    html: baseTemplate('Welcome to IAssetCare', body)
  });
};

// 11. Password Changed Notification
const sendPasswordChangedEmail = async (user) => {
  const infoTable = makeInfoTable([
    { key: 'Account Email', val: user.email },
    { key: 'Timestamp', val: new Date().toLocaleString('en-IN') },
    { key: 'Security Status', val: makeBadge('Password Updated', 'green') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Your IAssetCare account password was successfully changed. If you made this change, no further action is required.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#dc2626;font-weight:700;margin-top:16px;">
      If you did NOT make this change, please contact your system administrator immediately or use Forgot Password to protect your account.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: 'Your IAssetCare Password Has Been Changed',
    text: `Hello ${user.name}, your IAssetCare password was changed on ${new Date().toLocaleString('en-IN')}.`,
    html: baseTemplate('Password Changed Successfully', body, 'If you did not initiate this change, contact your admin immediately.')
  });
};

// 12. Contact Form Inquiry
const sendContactEmail = async ({ company, name, email, phone, orgSize, inquiryType, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'iassetcare@icpljpr.com';
  const infoTable = makeInfoTable([
    { key: 'Company Name', val: company },
    { key: 'Contact Person', val: name },
    { key: 'Email Address', val: email },
    { key: 'Phone Number', val: phone || 'N/A' },
    { key: 'Organisation Size', val: orgSize || 'N/A' },
    { key: 'Inquiry Type', val: makeBadge(inquiryType || 'General', 'purple') }
  ]);

  const body = `
    <p>
      A new contact/demo inquiry has been submitted via the IAssetCare website.
    </p>
    ${infoTable}
    <div style="margin-top:16px;padding:16px 20px;background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:#64748b;margin-bottom:8px;">Inquiry Message</div>
      <p style="font-size:14px;color:#0f172a;font-weight:500;margin:0;line-height:1.65;">${message}</p>
    </div>`;

  await sendEmail({
    to: adminEmail,
    subject: `New Inbound Inquiry: ${inquiryType} from ${company}`,
    text: `New contact request from ${name} (${company}). Email: ${email}, Type: ${inquiryType}. Message: ${message}`,
    html: baseTemplate('New Demo / Contact Request', body, 'Sent from the IAssetCare public contact form.')
  });
};

// 13. Contact Auto-Reply
const sendContactAutoReply = async ({ name, email, company, inquiryType }) => {
  const infoTable = makeInfoTable([
    { key: 'Inquiry Type', val: makeBadge(inquiryType || 'General Inquiry', 'blue') },
    { key: 'Organisation', val: company },
    { key: 'Response SLA', val: 'Within 1 Business Day' },
    { key: 'Official Contact', val: '<a href="mailto:iassetcare@icpljpr.com" style="color:#059669;text-decoration:none;font-weight:700;">iassetcare@icpljpr.com</a>' },
    { key: 'Support Helpline', val: '<strong>+91 90270 07508</strong>' }
  ]);

  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>
      Thank you for reaching out to <strong>IAssetCare</strong>. We have received your <strong>${inquiryType}</strong> request on behalf of <strong>${company}</strong>, and our enterprise team will connect with you within <strong>1 business day</strong>.
    </p>
    ${infoTable}
    <p style="margin-top:20px;font-size:13.5px;color:#64748b;">
      For immediate queries or urgent requests, feel free to call us or reply directly to this email.
    </p>`;

  await sendEmail({
    to: email,
    subject: `We received your inquiry — IAssetCare`,
    text: `Hi ${name}, thank you for contacting IAssetCare. We have received your ${inquiryType} request from ${company}.`,
    html: baseTemplate('Thank You for Reaching Out', body, 'You are receiving this because you submitted a contact inquiry on IAssetCare.')
  });
};

// 14. HOD Department Ticket Notification
const sendHodTicketNotificationEmail = async (hod, ticket, asset, raisedByUser) => {
  const infoTable = makeInfoTable([
    { key: 'Ticket ID', val: `<span style="font-family:monospace;font-weight:800;color:#072F1F;">${ticket.ticketId}</span>` },
    { key: 'Raised By', val: `${raisedByUser?.name || 'Employee'} (${raisedByUser?.email || ''})` },
    { key: 'Department', val: raisedByUser?.department || 'N/A' },
    { key: 'Asset', val: asset?.name || 'N/A' },
    { key: 'Issue Reported', val: ticket.issue },
    { key: 'Priority Level', val: makeBadge(ticket.priority, ticket.priority === 'High' ? 'red' : ticket.priority === 'Medium' ? 'yellow' : 'blue') },
    { key: 'Action Required', val: makeBadge('Pending HOD Authorization', 'yellow') }
  ]);

  const body = `
    <p>Hello <strong>${hod.name}</strong>,</p>
    <p>
      A new service request has been registered by a member of your department and requires your review and authorization.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;margin-top:16px;">
      Please log in to IAssetCare to review, assign priority, or authorize this service request.
    </p>`;

  await sendEmail({
    to: hod.email,
    subject: `Action Required: New Service Request in Your Department — ${ticket.ticketId}`,
    text: `Hello ${hod.name}, a new service request ${ticket.ticketId} was registered by ${raisedByUser?.name || 'an employee'} for asset "${asset?.name || 'N/A'}". Please log in to authorize.`,
    html: baseTemplate('New Department Service Request — Action Required', body, 'You are receiving this because you are the Head of Department for the affected department.')
  });
};

// 15. Account Deactivated Notification
const sendDeactivationEmail = async (user) => {
  const infoTable = makeInfoTable([
    { key: 'Account Email', val: user.email },
    { key: 'Department', val: user.department || 'N/A' },
    { key: 'Deactivated At', val: new Date().toLocaleString('en-IN') },
    { key: 'Account Status', val: makeBadge('Deactivated', 'red') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      Your <strong>IAssetCare</strong> workspace account has been <strong style="color:#dc2626;">deactivated</strong> by your administrator. You will no longer be able to log in to the portal.
    </p>
    ${infoTable}
    <p style="font-size:13.5px;color:#64748b;font-weight:600;margin-top:16px;">
      If you believe this is in error or require support, please contact your system administrator.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: 'Your IAssetCare Account Has Been Deactivated',
    text: `Hello ${user.name}, your IAssetCare account (${user.email}) has been deactivated.`,
    html: baseTemplate('Account Deactivated', body, 'This is an automated notification from IAssetCare.')
  });
};

// 16. Invite Email
const sendInviteEmail = async (user, inviteLink) => {
  const infoTable = makeInfoTable([
    { key: 'Full Name', val: user.name },
    { key: 'Email Address', val: user.email },
    { key: 'Assigned Role', val: makeBadge(user.role?.toUpperCase() || 'EMPLOYEE', 'blue') },
    { key: 'Department', val: user.department || 'General' },
    { key: 'Link Expiry', val: makeBadge('48 Hours', 'yellow') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      You have been invited to join <strong>IAssetCare</strong> by your administrator. Click the button below to set your password and activate your account.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${inviteLink}" class="btn" style="color:#ffffff;">Set Password &amp; Activate Account</a>
    </div>
    ${infoTable}
    <p style="font-size:13px;color:#94a3b8;margin-top:16px;">
      This invite link is valid for <strong>48 hours</strong>. If you did not expect this invitation, you can safely ignore this email.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `You're invited to IAssetCare`,
    text: `Hello ${user.name}, you've been invited to IAssetCare. Set your password here: ${inviteLink}.`,
    html: baseTemplate('You\'re Invited to IAssetCare', body, 'Invite link expires in 48 hours.')
  });
};

// 17. OTP Password Reset Email
const sendOtpEmail = async (user, otp) => {
  const infoTable = makeInfoTable([
    { key: 'Account Email', val: user.email },
    { key: 'OTP Validity', val: makeBadge('10 Minutes', 'yellow') }
  ]);

  const body = `
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>
      We received a request to reset the password for your IAssetCare account. Use the one-time verification code below to verify your identity.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background-color:#f8fafc;border:2px dashed #94a3b8;border-radius:16px;padding:20px 44px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px;">Verification Code</div>
        <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#072F1F;font-family:monospace;">${otp}</div>
      </div>
    </div>
    ${infoTable}
    <p style="font-size:13px;color:#94a3b8;margin-top:16px;">
      This OTP expires in <strong>10 minutes</strong>. Never share your verification code with anyone.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: 'IAssetCare Password Reset OTP',
    text: `Hello ${user.name}, your OTP to reset your IAssetCare password is: ${otp}. This code expires in 10 minutes.`,
    html: baseTemplate('Password Reset OTP', body, 'This OTP expires in 10 minutes and can only be used once.')
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
