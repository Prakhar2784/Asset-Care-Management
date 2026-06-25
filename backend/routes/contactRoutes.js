const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/emailService');

// POST /api/contact — public, sends inquiry to admin
router.post('/', async (req, res) => {
  try {
    const { company, name, email, phone, orgSize, inquiryType, message } = req.body;
    if (!company || !name || !email || !message) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }
    await sendContactEmail({ company, name, email, phone: phone || '—', orgSize: orgSize || '—', inquiryType: inquiryType || 'General Inquiry', message });
    res.status(200).json({ message: 'Your request has been submitted. We will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
