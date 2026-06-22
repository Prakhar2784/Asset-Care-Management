export const assets = [
  {
    id: "AST-2026-0001",
    name: "Dell Latitude 5420",
    category: "IT Asset",
    type: "Movable",
    department: "IT",
    location: "Head Office - Floor 2",
    vendor: "Dell Authorized Support",
    warranty: "In Warranty",
    status: "Active",
    serial: "DL-5420-9932",
    warrantyEnd: "2026-12-12",
  },
  {
    id: "AST-2026-0002",
    name: "Voltas AC 2 Ton",
    category: "Electrical",
    type: "Movable",
    department: "Administration",
    location: "Conference Room",
    vendor: "Voltas Service Partner",
    warranty: "Expired",
    status: "Under Repair",
    serial: "VT-AC-2044",
    warrantyEnd: "2025-08-20",
  },
  {
    id: "AST-2026-0003",
    name: "Canon ImageRunner Printer",
    category: "Electronic",
    type: "Movable",
    department: "Accounts",
    location: "Finance Floor",
    vendor: "Canon Printer Care",
    warranty: "In Warranty",
    status: "Active",
    serial: "CN-IR-7731",
    warrantyEnd: "2027-01-15",
  },
];

export const tickets = [
  {
    id: "TKT-10021",
    asset: "Dell Latitude 5420",
    issue: "Display flickering and heating issue",
    department: "IT",
    priority: "High",
    status: "Pending Approval",
    raisedBy: "Rohit Sharma",
  },
  {
    id: "TKT-10022",
    asset: "Voltas AC 2 Ton",
    issue: "Cooling problem in conference room",
    department: "Administration",
    priority: "Critical",
    status: "Vendor Assigned",
    raisedBy: "Neha Jain",
  },
  {
    id: "TKT-10023",
    asset: "Canon Printer",
    issue: "Paper jam and toner leakage",
    department: "Accounts",
    priority: "Medium",
    status: "Resolved",
    raisedBy: "Amit Verma",
  },
];

export const departments = [
  { name: "IT", assets: 320, pending: 8, hod: "Amit Sharma" },
  { name: "Administration", assets: 210, pending: 5, hod: "Neha Jain" },
  { name: "Accounts", assets: 95, pending: 2, hod: "Ravi Gupta" },
  { name: "Operations", assets: 410, pending: 11, hod: "Sanjay Meena" },
];

export const vendors = [
  {
    name: "Dell Authorized Support",
    category: "IT Hardware",
    phone: "+91 98765 43210",
    email: "support@dellvendor.com",
    rating: "4.8",
  },
  {
    name: "Voltas Service Partner",
    category: "Electrical / AC",
    phone: "+91 99887 77665",
    email: "care@voltaspartner.com",
    rating: "4.5",
  },
  {
    name: "Canon Printer Care",
    category: "Printer & Scanner",
    phone: "+91 91234 56780",
    email: "service@canoncare.com",
    rating: "4.6",
  },
];