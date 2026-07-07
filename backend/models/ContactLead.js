const mongoose = require('mongoose');

const contactLeadSchema = new mongoose.Schema({
  company:     { type: String, required: true, trim: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, trim: true, lowercase: true },
  phone:       { type: String, trim: true, default: '' },
  orgSize:     { type: String, default: '' },
  inquiryType: { type: String, default: 'General Inquiry' },
  message:     { type: String, required: true },
  status:      { type: String, enum: ['New', 'Contacted', 'Demo Scheduled', 'Converted', 'Not Interested'], default: 'New' },
  notes:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ContactLead', contactLeadSchema);
