// backend/jobs/slaEscalationJob.js
const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// SLA thresholds in milliseconds (can be made configurable via DB/env later)
const SLA_THRESHOLDS_MS = {
  Critical: 2  * 60 * 60 * 1000,   //  2 hours
  High:     8  * 60 * 60 * 1000,   //  8 hours
  Medium:   24 * 60 * 60 * 1000,   // 24 hours
  Low:      72 * 60 * 60 * 1000,   // 72 hours
};

// Priority escalation ladder
const ESCALATION_MAP = {
  Low:      'Medium',
  Medium:   'High',
  High:     'Critical',
  Critical: 'Critical', // already at max – no further escalation
};

const checkSLABreaches = async () => {
  try {
    const Tenant = require('../models/Tenant');
    const { setTenantId } = require('../middleware/tenantContext');

    const tenants = await Tenant.find({ isActive: true });

    for (const tenant of tenants) {
      await setTenantId(tenant.slug, async () => {
        const now = new Date();

        // Fetch all open tickets for this tenant (tenant filter applied by plugin)
        const openTickets = await Ticket.find({
          status: { $nin: ['Resolved', 'Rejected'] }
        });

        if (openTickets.length === 0) return;

        // Lazy-load admins only when needed
        let admins = null;
        const getAdmins = async () => {
          if (!admins) {
            admins = await User.find(
              { role: { $in: ['admin', 'super_admin'] }, isActive: true },
              'name email _id'
            );
          }
          return admins;
        };

        let breachedCount = 0;

        for (const ticket of openTickets) {
          const threshold = SLA_THRESHOLDS_MS[ticket.priority];
          if (!threshold) continue;

          const ageMs = now - new Date(ticket.createdAt);
          const isBreached = ageMs > threshold;

          if (!isBreached) {
            // Not yet breached — ensure slaDeadline is stamped if missing
            if (!ticket.slaDeadline) {
              ticket.slaDeadline = new Date(new Date(ticket.createdAt).getTime() + threshold);
              await ticket.save({ validateBeforeSave: false });
            }
            continue;
          }

          // Stamp deadline regardless (idempotent)
          if (!ticket.slaDeadline) {
            ticket.slaDeadline = new Date(new Date(ticket.createdAt).getTime() + threshold);
          }

          // Already fully processed — skip
          if (ticket.slaBreached) continue;

          // === SLA BREACH DETECTED ===
          const oldPriority = ticket.priority;
          const newPriority = ESCALATION_MAP[ticket.priority] || ticket.priority;

          ticket.slaBreached = true;
          ticket.priority    = newPriority;

          await ticket.save({ validateBeforeSave: false });
          breachedCount++;

          // Notify all admins
          const adminList = await getAdmins();
          for (const admin of adminList) {
            createNotification({
              userId: admin._id,
              type:    'sla_breach',
              title:   'SLA Breach Detected',
              message: `Ticket ${ticket.ticketId} has breached its SLA. Priority escalated from ${oldPriority} to ${newPriority}.`,
              link:    '/tickets',
              meta:    { ticketId: ticket._id, oldPriority, newPriority }
            });
          }

          audit({
            req:         null,
            action:      'sla_breach_escalated',
            entity:      'ticket',
            entityId:    ticket._id,
            entityLabel: ticket.ticketId,
            changes:     { slaBreached: true, priorityBefore: oldPriority, priorityAfter: newPriority }
          });

          console.log(
            '[SLAEscalation] Breached: ' + ticket.ticketId + ' | Tenant: ' + tenant.slug +
            ' | Priority: ' + oldPriority + ' -> ' + newPriority +
            ' | Age: ' + Math.round(ageMs / 3600000) + 'h'
          );
        }

        console.log(
          '[SLAEscalation] Tenant: ' + tenant.slug + ' -- checked ' + openTickets.length +
          ' open ticket(s), ' + breachedCount + ' new breach(es) escalated.'
        );
      });
    }
  } catch (err) {
    console.error('[SLAEscalation] Error:', err.message);
  }
};

const startSLAJob = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', checkSLABreaches);
  console.log('[Scheduler] SLA escalation job started (runs every 30 minutes).');
};

module.exports = { startSLAJob, checkSLABreaches, SLA_THRESHOLDS_MS };
