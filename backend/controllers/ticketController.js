const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Asset = require('../models/Asset');
const mongoose = require('mongoose');
const { getHodScope } = require('../utils/hodScope');
const { ADMIN_TIER_ROLES } = require('../middleware/authMiddleware');
const {
  sendTicketCreatedEmail,
  sendTicketStatusEmail,
  sendTicketResolvedEmail,
  sendHodTicketNotificationEmail,
} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route   POST /api/tickets
// @access  Private (any logged-in user)
const createTicket = async (req, res) => {
  try {
    const { issue, priority, assetId, deviceRequestId, itemLabel } = req.body;

    if (!assetId && !deviceRequestId) {
      return res.status(400).json({ message: 'Either an asset or an approved device request must be selected.' });
    }

    const ticketId = `SRV-${Math.floor(10000 + Math.random() * 90000)}`;

    let initialStatus = 'Pending HOD Approval';
    let autoApprover = null;
 
    if (req.user.role === 'admin' || req.user.role === 'hod') {
      initialStatus = 'Assigned to Technician';
      autoApprover = req.user._id;
    }
 
    const ticket = await Ticket.create({
      ticketId,
      issue,
      priority: priority || 'Medium',
      asset: assetId || null,
      deviceRequestRef: deviceRequestId || null,
      itemLabel: itemLabel || null,
      raisedBy: req.user._id,
      status: initialStatus,
      approvedBy: autoApprover
    });
 
    const populated = await Ticket.findById(ticket._id)
      .populate('asset', 'name serialNumber department')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy', 'name email department');
 
    // Fire-and-forget email + notification + audit
    sendTicketCreatedEmail(populated.raisedBy, populated, populated.asset)
      .catch(err => console.error('[TICKET EMAIL ERROR] Created:', err.message));
    audit({ req, action: 'ticket_created', entity: 'ticket', entityId: ticket._id, entityLabel: ticketId });
 
    // Notify the employee who raised the ticket
    createNotification({
      userId: req.user._id,
      type: 'ticket_created',
      title: 'Ticket Raised',
      message: `Your ticket ${ticketId} has been submitted${initialStatus === 'Assigned to Technician' ? ' and auto-approved to Technician' : ' and is pending HOD approval'}.`,
      link: `/tickets?highlight=${ticket._id}`
    });
 
    const itemName = populated.asset?.name || populated.itemLabel || ticketId;
 
    if (initialStatus === 'Pending HOD Approval') {
      // 1. Notify Department HODs (in-app + email) — routed by the asset's
      // assigned department, falling back to the raiser's department only
      // for device-request tickets that have no asset yet.
      const ticketDept = populated.asset?.department || req.user.department;
      User.find({ role: 'hod', department: ticketDept, isActive: true }).then(hods => {
        hods.forEach(hod => {
          createNotification({
            userId: hod._id,
            type: 'ticket_created',
            title: 'New Department Ticket',
            message: `${req.user.name} raised ticket ${ticketId} for "${itemName}" pending your approval.`,
            link: `/tickets?highlight=${ticket._id}`
          });
          sendHodTicketNotificationEmail(hod, populated, populated.asset, populated.raisedBy)
            .catch(() => {});
        });
      }).catch(() => {});
 
      // 2. Notify Admins
      User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }).then(admins => {
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'ticket_created',
            title: 'New Ticket (Pending HOD)',
            message: `${req.user.name} raised ticket ${ticketId} (Pending HOD Approval).`,
            link: `/tickets?highlight=${ticket._id}`
          });
        });
      }).catch(() => {});
    } else {
      // Auto-approved ticket — notify Admins
      User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }).then(admins => {
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'ticket_created',
            title: 'New Auto-Approved Ticket',
            message: `${req.user.name} raised ticket ${ticketId} (Assigned to Technician).`,
            link: `/tickets?highlight=${ticket._id}`
          });
        });
      }).catch(() => {});
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/tickets
// @access  Admin / HOD / Technician (technicians only see their assigned tickets)
const getTickets = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'technician') {
      filter = {
        $or: [
          { assignedTechnician: req.user._id },
          { status: { $in: ['Assigned to Technician', 'Service Center Required'] }, assignedTechnician: null }
        ]
      };
    } else if (req.user.role === 'hod' && req.user.department) {
      // Tickets route by the asset's assigned department. Device-request
      // tickets (no asset yet) fall back to the raiser's own department.
      const { deptUserIds, deptAssetIds } = await getHodScope(req.user);
      filter.$or = [
        { asset: { $in: deptAssetIds } },
        { asset: null, raisedBy: { $in: deptUserIds } },
      ];
    }

    const tickets = await Ticket.find(filter)
      .populate('asset', 'name serialNumber department')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy', 'name department role')
      .populate('approvedBy', 'name')
      .populate('assignedTechnician', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/tickets/mytickets
// @access  Employee (own tickets only)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ raisedBy: req.user._id })
      .populate('asset', 'name serialNumber department')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy', 'name email department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/tickets/:id/status
// @access  Admin / HOD / Technician
const updateTicketStatus = async (req, res) => {
  try {
    const { status, estimatedCost, assignedTechnicianId, assignedVendor } = req.body;

    const ticket = await Ticket.findById(req.params.id)
      .populate('raisedBy', 'name email department')
      .populate('asset', 'name serialNumber department');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // HOD department approval constraint — the asset's assigned department
    // decides ownership; raiser's department is only used as a fallback for
    // device-request tickets that have no asset yet.
    if (req.user.role === 'hod' && status === 'Assigned to Technician') {
      const ticketDept = ticket.asset?.department || ticket.raisedBy?.department;
      if (ticketDept !== req.user.department) {
        return res.status(403).json({ message: `Access denied. You can only approve tickets for the ${req.user.department} department.` });
      }
    }

    // Technician can only update their own assigned tickets (or resolve/escalate)
    if (req.user.role === 'technician') {
      // Allow if explicitly assigned to this technician OR if no technician is set (legacy unowned ticket)
      const isAssigned =
        !ticket.assignedTechnician ||  // unowned legacy ticket — any technician can act
        ticket.assignedTechnician.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ message: 'You can only act on tickets assigned to you.' });
      }
      // Technicians can only move to Resolved or Service Center Required
      if (!['Resolved', 'Service Center Required'].includes(status)) {
        return res.status(403).json({ message: 'Technicians can only mark tickets as Resolved or Service Center Required.' });
      }
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    if (estimatedCost !== undefined) ticket.estimatedCost = estimatedCost;

    // HOD assigns a technician when approving
    if (status === 'Assigned to Technician' && assignedTechnicianId) {
      ticket.assignedTechnician = assignedTechnicianId;
      ticket.approvedBy = req.user._id;
    } else if (['Vendor Assigned', 'Under Repair', 'Assigned to Technician'].includes(status)) {
      ticket.approvedBy = req.user._id;
    }

    if (assignedVendor !== undefined) {
      ticket.assignedVendor = assignedVendor;
    }

    // HOD assigns service center after technician escalation
    if (status === 'Sent to Service Center') {
      ticket.approvedBy = req.user._id;
    }


    const updated = await ticket.save();

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

    // 1. Notify ALL admins / super_admins for every ticket event
    User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }).then(admins => {
      admins.forEach(admin => {
        if (admin._id.toString() === req.user._id.toString()) return;
        createNotification({
          userId: admin._id,
          type: 'ticket_status',
          title: `Ticket ${ticket.ticketId} — ${status}`,
          message: `Status changed from "${oldStatus}" → "${status}" by ${req.user.name}.`,
          link: `/tickets?highlight=${ticket._id}`
        });
      });
    }).catch(() => {});

    // 2. Notify the department HOD for EVERY status change on their department's tickets
    //    (HOD should know everything happening with tickets they oversee)
    //    Routed by the asset's assigned department, falling back to the
    //    raiser's department for device-request tickets with no asset.
    User.find({ role: 'hod', department: ticket.asset?.department || ticket.raisedBy?.department, isActive: true }).then(hods => {
      hods.forEach(hod => {
        if (hod._id.toString() === req.user._id.toString()) return; // skip if HOD is the actor
        let hodTitle = `Ticket ${ticket.ticketId} — ${status}`;
        let hodMessage = `Ticket ${ticket.ticketId} status changed to "${status}" by ${req.user.name}.`;

        // Customise message for key events
        if (status === 'Resolved') {
          hodTitle = `Ticket Resolved — ${ticket.ticketId}`;
          hodMessage = `Technician ${req.user.name} resolved ticket ${ticket.ticketId}.`;
        } else if (status === 'Service Center Required') {
          hodTitle = `⚠️ Service Center Required — ${ticket.ticketId}`;
          hodMessage = `Technician ${req.user.name} could not resolve ticket ${ticket.ticketId}. Please assign a service center.`;
        } else if (status === 'Sent to Service Center') {
          hodTitle = `Ticket Sent to Service Center — ${ticket.ticketId}`;
          hodMessage = `Ticket ${ticket.ticketId} has been escalated to a service center.`;
        }

        createNotification({
          userId: hod._id,
          type: 'ticket_status',
          title: hodTitle,
          message: hodMessage,
          link: `/tickets?highlight=${ticket._id}`
        });
      });
    }).catch(() => {});

    // 3. Notify assigned technician when ticket is assigned to them
    if (status === 'Assigned to Technician' && assignedTechnicianId) {
      createNotification({
        userId: assignedTechnicianId,
        type: 'ticket_assigned',
        title: '🔧 New Ticket Assigned To You',
        message: `Ticket ${ticket.ticketId} has been assigned to you by ${req.user.name}. Issue: "${ticket.issue}"`,
        link: `/tickets?highlight=${ticket._id}`
      });
    }

    // Auto-sync Asset and MaintenanceLog based on Ticket Status
    if (ticket.asset) {
      const AssetModel = mongoose.model('Asset');
      const MaintenanceLogModel = mongoose.model('MaintenanceLog');
      
      if (status === 'Under Repair' && oldStatus !== 'Under Repair') {
        await AssetModel.findByIdAndUpdate(ticket.asset._id, { status: 'Under Repair' });
        const existingLog = await MaintenanceLogModel.findOne({
          asset: ticket.asset._id,
          status: { $in: ['Scheduled', 'In Progress'] }
        });
        if (!existingLog) {
          await MaintenanceLogModel.create({
            asset: ticket.asset._id,
            type: 'Corrective',
            description: `Automatically logged from ticket resolution: ${ticket.issue}`,
            status: 'In Progress',
            serviceDate: new Date(),
            loggedBy: req.user?._id || null,
            tenantId: req.tenantId || 'default'
          });
        }
      } else if (status === 'Resolved' && oldStatus !== 'Resolved') {
        await AssetModel.findByIdAndUpdate(ticket.asset._id, { status: 'Active' });
        await MaintenanceLogModel.updateMany(
          { asset: ticket.asset._id, status: { $in: ['Scheduled', 'In Progress'] } },
          { status: 'Completed', notes: `Completed automatically via resolved ticket: ${ticket.ticketId}` }
        );
      }
    }

    audit({ req, action: 'ticket_status_changed', entity: 'ticket', entityId: ticket._id, entityLabel: ticket.ticketId, changes: { from: oldStatus, to: status } });

    // Email + notification to ticket raiser
    if (ticket.raisedBy) {
      if (status === 'Resolved') {
        sendTicketResolvedEmail(ticket.raisedBy, ticket, ticket.asset)
          .catch(err => console.error('[TICKET EMAIL ERROR] Resolved:', err.message));
        createNotification({
          userId: ticket.raisedBy._id,
          type: 'ticket_resolved',
          title: 'Ticket Resolved',
          message: `Your ticket ${ticket.ticketId} has been marked as Resolved.`,
          link: `/tickets?highlight=${ticket._id}`
        });
      } else if (status !== oldStatus) {
        sendTicketStatusEmail(ticket.raisedBy, ticket, ticket.asset, oldStatus)
          .catch(err => console.error('[TICKET EMAIL ERROR] Status:', err.message));
        createNotification({
          userId: ticket.raisedBy._id,
          type: 'ticket_status',
          title: 'Ticket Status Updated',
          message: `Your ticket ${ticket.ticketId} status changed from ${oldStatus} to ${status}.`,
          link: `/tickets?highlight=${ticket._id}`
        });
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// @route   PUT /api/tickets/:id/priority
// @access  Admin / HOD
const updateTicketPriority = async (req, res) => {
  try {
    const { priority } = req.body;

    const ticket = await Ticket.findById(req.params.id)
      .populate('raisedBy', 'department')
      .populate('asset', 'department');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'hod' && req.user.department) {
      const ticketDept = ticket.asset?.department || ticket.raisedBy?.department;
      if (ticketDept !== req.user.department) {
        return res.status(403).json({ message: 'Not authorized to modify tickets outside your department.' });
      }
    }

    ticket.priority = priority;
    const updated = await ticket.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/tickets/:id/confirm
// @access  Ticket raiser only, once repair is Resolved
const confirmResolution = async (req, res) => {
  try {
    const { remarks } = req.body;
    const ticket = await Ticket.findById(req.params.id)
      .populate('raisedBy', 'name email department')
      .populate('asset', 'department');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.raisedBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the ticket raiser can confirm resolution.' });
    }
    if (ticket.status !== 'Resolved') {
      return res.status(400).json({ message: 'Ticket must be marked Resolved before it can be confirmed.' });
    }
    if (ticket.userConfirmed) {
      return res.status(400).json({ message: 'Resolution already confirmed.' });
    }

    ticket.userConfirmed = true;
    ticket.userConfirmedAt = new Date();
    if (remarks?.trim()) {
      ticket.comments.push({ text: `Resolution confirmed: ${remarks.trim()}`, author: req.user._id, authorName: req.user.name });
    }
    await ticket.save();

    // Return the ticket with the same populations the list/detail views use,
    // since the frontend replaces its state with this response
    const updated = await Ticket.findById(ticket._id)
      .populate('asset', 'name serialNumber department')
      .populate('deviceRequestRef', 'requestId itemRequested requestType')
      .populate('raisedBy', 'name email department');

    audit({ req, action: 'ticket_resolution_confirmed', entity: 'ticket', entityId: ticket._id, entityLabel: ticket.ticketId });

    // Notify admins + the specific dept HOD that the user has confirmed resolution
    User.find({ role: { $in: ['admin', 'super_admin'] } }).then(admins => {
      admins.forEach(admin => {
        createNotification({
          userId: admin._id,
          type: 'ticket_resolution_confirmed',
          title: 'Resolution Confirmed',
          message: `${ticket.raisedBy?.name || 'The user'} confirmed ticket ${ticket.ticketId} is resolved. It can now be closed.`,
          link: `/tickets?highlight=${ticket._id}`
        });
      });
    }).catch(() => {});

    const resolveDept = ticket.asset?.department || ticket.raisedBy?.department;
    if (resolveDept) {
      User.find({ role: 'hod', department: resolveDept, isActive: true }).then(hods => {
        hods.forEach(hod => {
          createNotification({
            userId: hod._id,
            type: 'ticket_resolution_confirmed',
            title: 'Resolution Confirmed',
            message: `${ticket.raisedBy?.name || 'The user'} confirmed ticket ${ticket.ticketId} is resolved. It can now be closed.`,
            link: `/tickets?highlight=${ticket._id}`
          });
        });
      }).catch(() => {});
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/tickets/:id
// @access  Admin
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('raisedBy', 'department')
      .populate('asset', 'department');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const isOwner = ticket.raisedBy?._id?.toString() === req.user._id.toString();

    if (!ADMIN_TIER_ROLES.includes(req.user.role) && !isOwner)
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });

    if (isOwner && !ADMIN_TIER_ROLES.includes(req.user.role) && !['Pending HOD Approval', 'Pending Approval'].includes(ticket.status)) {
      return res.status(400).json({ message: 'Only tickets pending approval can be withdrawn' });
    }

    if (req.user.role === 'hod' && req.user.department) {
      const ticketDept = ticket.asset?.department || ticket.raisedBy?.department;
      if (ticketDept !== req.user.department) {
        return res.status(403).json({ message: 'Not authorized to delete tickets outside your department.' });
      }
    }

    await ticket.deleteOne();
    res.status(200).json({ message: 'Ticket removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getMyTickets,
  updateTicketStatus,
  updateTicketPriority,
  confirmResolution,
  deleteTicket
};
