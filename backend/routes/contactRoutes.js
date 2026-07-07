const express = require('express');
const router = express.Router();
const { sendContactEmail, sendContactAutoReply } = require('../services/emailService');
const ContactLead = require('../models/ContactLead');

// POST /api/contact — public, saves lead and sends emails
router.post('/', async (req, res) => {
  try {
    const { company, name, email, phone, orgSize, inquiryType, message } = req.body;
    if (!company || !name || !email || !message) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // Persist the lead regardless of email outcome
    const lead = await ContactLead.create({
      company, name, email,
      phone: phone || '',
      orgSize: orgSize || '',
      inquiryType: inquiryType || 'General Inquiry',
      message,
    });

    // Fire both emails in parallel — don't block response on failure
    const emailPayload = { company, name, email, phone: phone || '—', orgSize: orgSize || '—', inquiryType: inquiryType || 'General Inquiry', message };
    Promise.all([
      sendContactEmail(emailPayload),
      sendContactAutoReply({ name, email, company, inquiryType: inquiryType || 'General Inquiry' }),
    ]).catch(() => {});

    res.status(200).json({ message: 'Your request has been submitted. We will get back to you soon.', leadId: lead._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
