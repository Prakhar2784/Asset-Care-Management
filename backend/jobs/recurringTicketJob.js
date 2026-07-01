const cron  = require('node-cron');
const Ticket = require('../models/Ticket');

// Runs every day at 07:00 — creates new tickets from recurring templates
const startRecurringTicketJob = () => {
  cron.schedule('0 7 * * *', async () => {
    console.log('[RecurringTickets] Checking for due recurring tickets...');
    try {
      const now  = new Date();
      const due  = await Ticket.find({
        isRecurring: true,
        recurringNextDate: { $lte: now },
        status: { $in: ['Resolved', 'Pending Approval'] },
      });

      for (const template of due) {
        // Create new ticket from template
        const ticketId = `SRV-${Math.floor(10000 + Math.random() * 90000)}`;
        await Ticket.create({
          ticketId,
          issue:         template.issue,
          priority:      template.priority,
          asset:         template.asset,
          raisedBy:      template.raisedBy,
          status:        'Pending Approval',
          isRecurring:   false, // the new instance is not itself recurring
          parentTicket:  template._id,
          tenantId:      template.tenantId,
        });

        // Advance the next-due date
        const next = new Date(template.recurringNextDate);
        if (template.recurringInterval === 'daily')   next.setDate(next.getDate() + 1);
        if (template.recurringInterval === 'weekly')  next.setDate(next.getDate() + 7);
        if (template.recurringInterval === 'monthly') next.setMonth(next.getMonth() + 1);

        template.recurringNextDate = next;
        await template.save();

        console.log(`[RecurringTickets] Created ${ticketId} from recurring template ${template.ticketId}`);
      }
    } catch (err) {
      console.error('[RecurringTickets] Error:', err.message);
    }
  });

  console.log('[RecurringTickets] Scheduler registered.');
};

module.exports = { startRecurringTicketJob };
