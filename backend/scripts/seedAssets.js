require('dotenv').config();
const mongoose = require('mongoose');
const Asset = require('../models/Asset');

const sampleAssets = [
  {
    name: 'Dell Laptop',
    category: 'IT Asset',
    formFactor: 'Movable',
    vendor: 'Dell Technologies',
    modelNumber: 'Latitude 5540',
    serialNumber: 'DL-001-2024',
    procurementDate: new Date('2024-01-15'),
    purchaseCost: 65000,
    warrantyStart: new Date('2024-01-15'),
    warrantyEnd: new Date('2027-01-15'),
    department: 'Information Technology',
    location: 'IT Room - Floor 2',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'HP LaserJet Printer',
    category: 'IT Asset',
    formFactor: 'Fixed',
    vendor: 'HP Inc.',
    modelNumber: 'LaserJet Pro M404n',
    serialNumber: 'HP-PRT-002',
    procurementDate: new Date('2023-06-10'),
    purchaseCost: 28000,
    warrantyStart: new Date('2023-06-10'),
    warrantyEnd: new Date('2025-06-10'),
    department: 'Administration',
    location: 'Admin Office - Ground Floor',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Cisco IP Phone',
    category: 'Electronic',
    formFactor: 'Fixed',
    vendor: 'Cisco Systems',
    modelNumber: 'CP-8841',
    serialNumber: 'CS-PHN-003',
    procurementDate: new Date('2023-03-20'),
    purchaseCost: 12000,
    warrantyStart: new Date('2023-03-20'),
    warrantyEnd: new Date('2024-03-20'),
    department: 'Operations',
    location: 'Operations Desk - Floor 1',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Samsung 27" Monitor',
    category: 'IT Asset',
    formFactor: 'Fixed',
    vendor: 'Samsung Electronics',
    modelNumber: 'S27A600NWU',
    serialNumber: 'SM-MON-004',
    procurementDate: new Date('2024-02-01'),
    purchaseCost: 22000,
    warrantyStart: new Date('2024-02-01'),
    warrantyEnd: new Date('2027-02-01'),
    department: 'Finance & Accounts',
    location: 'Finance Office - Floor 3',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Lenovo ThinkPad',
    category: 'IT Asset',
    formFactor: 'Movable',
    vendor: 'Lenovo',
    modelNumber: 'ThinkPad E15 Gen 4',
    serialNumber: 'LN-TP-005',
    procurementDate: new Date('2023-11-05'),
    purchaseCost: 72000,
    warrantyStart: new Date('2023-11-05'),
    warrantyEnd: new Date('2026-11-05'),
    department: 'Information Technology',
    location: 'IT Room - Floor 2',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'UPS Power Backup',
    category: 'Electrical',
    formFactor: 'Fixed',
    vendor: 'APC by Schneider',
    modelNumber: 'Back-UPS 1500VA',
    serialNumber: 'APC-UPS-006',
    procurementDate: new Date('2022-09-15'),
    purchaseCost: 18000,
    warrantyStart: new Date('2022-09-15'),
    warrantyEnd: new Date('2024-09-15'),
    department: 'Information Technology',
    location: 'Server Room - Basement',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Office Projector',
    category: 'Electronic',
    formFactor: 'Movable',
    vendor: 'Epson',
    modelNumber: 'EB-X51',
    serialNumber: 'EP-PRJ-007',
    procurementDate: new Date('2023-08-22'),
    purchaseCost: 45000,
    warrantyStart: new Date('2023-08-22'),
    warrantyEnd: new Date('2025-08-22'),
    department: 'Administration',
    location: 'Conference Room - Floor 1',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Executive Office Chair',
    category: 'Furniture',
    formFactor: 'Movable',
    vendor: 'Godrej Interio',
    modelNumber: 'Ergo Pro',
    serialNumber: 'GI-CHR-008',
    procurementDate: new Date('2022-05-10'),
    purchaseCost: 8500,
    department: 'Administration',
    location: 'Director Cabin - Floor 4',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Network Switch 24-Port',
    category: 'IT Asset',
    formFactor: 'Fixed',
    vendor: 'D-Link',
    modelNumber: 'DGS-1024D',
    serialNumber: 'DL-SW-009',
    procurementDate: new Date('2021-12-01'),
    purchaseCost: 14000,
    warrantyStart: new Date('2021-12-01'),
    warrantyEnd: new Date('2024-12-01'),
    department: 'Information Technology',
    location: 'Server Room - Basement',
    status: 'Active',
    assignedStatus: 'Unassigned',
  },
  {
    name: 'Canon Scanner',
    category: 'IT Asset',
    formFactor: 'Fixed',
    vendor: 'Canon India',
    modelNumber: 'DR-C225 II',
    serialNumber: 'CN-SCN-010',
    procurementDate: new Date('2023-04-18'),
    purchaseCost: 32000,
    warrantyStart: new Date('2023-04-18'),
    warrantyEnd: new Date('2025-04-18'),
    department: 'Finance & Accounts',
    location: 'Finance Office - Floor 3',
    status: 'Under Repair',
    assignedStatus: 'Unassigned',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Skip assets that already have the same serial number
    let added = 0;
    for (const asset of sampleAssets) {
      const exists = await Asset.findOne({ serialNumber: asset.serialNumber });
      if (!exists) {
        await Asset.create(asset);
        console.log(`✓ Added: ${asset.name}`);
        added++;
      } else {
        console.log(`- Skipped (exists): ${asset.name}`);
      }
    }

    console.log(`\nDone. ${added} assets added.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
