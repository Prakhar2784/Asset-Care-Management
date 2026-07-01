const CustomField = require('../models/CustomField');

// @desc    Get custom fields configurations
// @route   GET /api/custom-fields
// @access  Private (Admin / HOD)
const getCustomFields = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }
    const fields = await CustomField.find(filter).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: fields });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new custom field configuration
// @route   POST /api/custom-fields
// @access  Private (Admin)
const createCustomField = async (req, res) => {
  try {
    const { category, name, type, isRequired, options } = req.body;

    if (!category || !name || !type) {
      return res.status(400).json({ message: 'Category, Name, and Type are required.' });
    }

    // Check for existing field in same category for this tenant
    const existing = await CustomField.findOne({ category, name });
    if (existing) {
      return res.status(400).json({ message: `A custom field named '${name}' already exists in category '${category}'.` });
    }

    const field = await CustomField.create({
      category,
      name,
      type,
      isRequired: !!isRequired,
      options: type === 'Select' ? (options || []) : [],
      tenantId: req.tenantId || 'default'
    });

    res.status(201).json({ success: true, data: field });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete custom field configuration
// @route   DELETE /api/custom-fields/:id
// @access  Private (Admin)
const deleteCustomField = async (req, res) => {
  try {
    const field = await CustomField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Custom field configuration not found.' });
    }

    await field.deleteOne();
    res.status(200).json({ success: true, message: 'Custom field configuration deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomFields,
  createCustomField,
  deleteCustomField
};
