const NetworkScan = require('../models/NetworkScan');
const DiscoveredDevice = require('../models/DiscoveredDevice');
const Asset = require('../models/Asset');
const { audit } = require('../services/auditService');

// Template of realistic devices to simulate discovery
const DEVICE_TEMPLATES = [
  { hostname: 'hq-firewall-core', osType: 'pfSense OS', cpu: 'Intel Atom C3558', ram: 8, storage: 64 },
  { hostname: 'sales-macbook-15', osType: 'macOS Sequoia', cpu: 'Apple M3 Pro', ram: 18, storage: 512 },
  { hostname: 'hr-laptop-12', osType: 'Windows 11 Pro', cpu: 'AMD Ryzen 5 5625U', ram: 16, storage: 512 },
  { hostname: 'finance-desktop-01', osType: 'Windows 11 Pro', cpu: 'Intel Core i5-13400', ram: 8, storage: 256 },
  { hostname: 'prod-db-replica', osType: 'CentOS Stream 9', cpu: 'Intel Xeon Silver 4314', ram: 32, storage: 1024 },
  { hostname: 'hq-wifi-ap-lobby', osType: 'OpenWrt', cpu: 'Qualcomm IPQ5018', ram: 1, storage: 2 },
  { hostname: 'eng-workstation-05', osType: 'Ubuntu 22.04 LTS', cpu: 'Intel Core i9-13900K', ram: 64, storage: 2048 }
];

// Helper to generate a random MAC address
const generateMacAddress = () => {
  return Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':').toUpperCase();
};

// @desc    Trigger mock network subnet scan
// @route   POST /api/network/scan
// @access  Private (Admin)
const triggerScan = async (req, res) => {
  try {
    const { subnet } = req.body;
    if (!subnet) {
      return res.status(400).json({ message: 'Subnet range is required.' });
    }

    // Resolve base subnet IP (e.g. "192.168.1.")
    const match = subnet.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)/);
    const ipPrefix = match ? match[1] : '192.168.1.';

    // Create Scan in progress
    const scan = await NetworkScan.create({
      subnet,
      status: 'Scanning',
      scannedBy: req.user._id,
      tenantId: req.tenantId || 'default'
    });

    // Select 3 to 5 random devices from the templates
    const shuffled = [...DEVICE_TEMPLATES].sort(() => 0.5 - Math.random());
    const countToDiscover = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    const selectedTemplates = shuffled.slice(0, countToDiscover);

    const devices = [];
    const usedHostSuffixes = new Set();

    for (const template of selectedTemplates) {
      // Find a unique random host suffix
      let suffix;
      do {
        suffix = Math.floor(Math.random() * 250) + 2; // 2 to 251
      } while (usedHostSuffixes.has(suffix));
      usedHostSuffixes.add(suffix);

      const ipAddress = `${ipPrefix}${suffix}`;
      const macAddress = generateMacAddress();

      const device = await DiscoveredDevice.create({
        scanId: scan._id,
        ipAddress,
        macAddress,
        hostname: template.hostname,
        osType: template.osType,
        cpu: template.cpu,
        ram: template.ram,
        storage: template.storage,
        status: 'Discovered',
        tenantId: req.tenantId || 'default'
      });

      devices.push(device);
    }

    // Update Scan details
    scan.status = 'Completed';
    scan.devicesFound = devices.length;
    await scan.save();

    // Log audit event
    audit({
      req,
      action: 'network_scan_executed',
      entity: 'network_scan',
      entityId: scan._id,
      entityLabel: `${subnet} (${devices.length} devices)`
    });

    res.status(201).json({ success: true, data: scan, devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get network scans history
// @route   GET /api/network/scans
// @access  Private (Admin)
const getScans = async (req, res) => {
  try {
    const scans = await NetworkScan.find({})
      .populate('scannedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: scans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get discovered devices for a specific scan
// @route   GET /api/network/scans/:id/devices
// @access  Private (Admin)
const getScanDevices = async (req, res) => {
  try {
    const devices = await DiscoveredDevice.find({ scanId: req.params.id })
      .sort({ ipAddress: 1 });

    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Import/update discovered devices in the main Asset Registry
// @route   POST /api/network/import
// @access  Private (Admin)
const importDevices = async (req, res) => {
  try {
    const { deviceIds, category, location, department } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'No devices selected for import.' });
    }
    if (!category || !department) {
      return res.status(400).json({ message: 'Category and Department are required for import.' });
    }

    const devices = await DiscoveredDevice.find({ _id: { $in: deviceIds } });
    if (devices.length === 0) {
      return res.status(404).json({ message: 'Selected discovered devices not found.' });
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const device of devices) {
      if (device.status === 'Imported') continue;

      // Check if an asset with this MAC Address (serialNumber) already exists in the tenant registry
      let asset = await Asset.findOne({ serialNumber: device.macAddress });

      const specs = {
        'IP Address': device.ipAddress,
        'MAC Address': device.macAddress,
        'Operating System': device.osType,
        'CPU': device.cpu,
        'RAM': `${device.ram} GB`,
        'Storage': `${device.storage} GB`
      };

      if (asset) {
        // Update specifications of existing asset
        asset.customFields = {
          ...(asset.customFields || {}),
          ...specs
        };
        await asset.save();
        updatedCount++;

        device.status = 'Imported';
        device.mappedAssetId = asset._id;
        await device.save();

        // Audit update
        audit({
          req,
          action: 'asset_network_specs_updated',
          entity: 'asset',
          entityId: asset._id,
          entityLabel: asset.name,
          changes: specs
        });
      } else {
        // Create a new Asset
        asset = await Asset.create({
          name: device.hostname,
          category,
          serialNumber: device.macAddress,
          department,
          location: location || 'Office HQ',
          status: 'Active',
          customFields: specs,
          tenantId: req.tenantId || 'default'
        });
        importedCount++;

        device.status = 'Imported';
        device.mappedAssetId = asset._id;
        await device.save();

        // Audit creation
        audit({
          req,
          action: 'asset_network_imported',
          entity: 'asset',
          entityId: asset._id,
          entityLabel: asset.name
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed. ${importedCount} created, ${updatedCount} updated.`,
      stats: { importedCount, updatedCount }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark discovered devices as ignored
// @route   POST /api/network/ignore
// @access  Private (Admin)
const ignoreDevices = async (req, res) => {
  try {
    const { deviceIds } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'No devices selected.' });
    }

    const result = await DiscoveredDevice.updateMany(
      { _id: { $in: deviceIds } },
      { $set: { status: 'Ignored' } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully ignored ${result.modifiedCount} devices.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  triggerScan,
  getScans,
  getScanDevices,
  importDevices,
  ignoreDevices
};
