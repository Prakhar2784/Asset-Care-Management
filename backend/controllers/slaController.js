// backend/controllers/slaController.js
const Ticket = require('../models/Ticket');

// SLA thresholds (mirrors slaEscalationJob.js — source of truth)
const SLA_CONFIG = {
  Critical: { hours: 2,  label: 'Critical',  description: 'Must be resolved within 2 hours'  },
  High:     { hours: 8,  label: 'High',       description: 'Must be resolved within 8 hours'  },
  Medium:   { hours: 24, label: 'Medium',     description: 'Must be resolved within 24 hours' },
  Low:      { hours: 72, label: 'Low',        description: 'Must be resolved within 72 hours' },
};

// @desc    Get SLA configuration / thresholds
// @route   GET /api/sla/config
// @access  Private (Admin / HOD)
const getSLAConfig = (req, res) => {
  try {
    const config = Object.entries(SLA_CONFIG).map(([priority, data]) => ({
      priority,
      thresholdHours: data.hours,
      thresholdMs:    data.hours * 60 * 60 * 1000,
      label:          data.label,
      description:    data.description,
    }));

    res.status(200).json({
      success: true,
      data: config,
      meta: {
        description: 'SLA thresholds define the maximum resolution time per priority level. Breached tickets are auto-escalated every 30 minutes.',
        escalationSchedule: 'Every 30 minutes',
        escalationLadder: { Low: 'Medium', Medium: 'High', High: 'Critical', Critical: 'Critical (max)' },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all currently SLA-breached tickets for this tenant
// @route   GET /api/sla/breaches
// @access  Private (Admin / HOD)
const getSLABreaches = async (req, res) => {
  try {
    const now = new Date();

    // Pull breached tickets (either flagged already OR calculable on the fly)
    const breachedTickets = await Ticket.find({
      status:     { $nin: ['Resolved', 'Rejected'] },
      slaBreached: true,
    })
      .populate('asset',            'name serialNumber department')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy',         'name email department')
      .populate('approvedBy',       'name')
      .sort({ createdAt: 1 }); // oldest first — most urgent

    // Enrich each ticket with age and overdue duration
    const enriched = breachedTickets.map(ticket => {
      const ageMs         = now - new Date(ticket.createdAt);
      const thresholdMs   = (SLA_CONFIG[ticket.priority]?.hours ?? 24) * 60 * 60 * 1000;
      const overdueMs     = ageMs - thresholdMs;

      return {
        ...ticket.toObject(),
        _sla: {
          ageHours:     +(ageMs / 3600000).toFixed(2),
          overdueHours: +(Math.max(0, overdueMs) / 3600000).toFixed(2),
          threshold:    SLA_CONFIG[ticket.priority] || null,
        },
      };
    });

    res.status(200).json({
      success: true,
      count:   enriched.length,
      data:    enriched,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSLAConfig, getSLABreaches };
