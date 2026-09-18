import { Chip } from "@mui/material";

const STATUS_COLORS = {
  Active: { bg: "#E5F5EF", text: "#1F8A70", border: "#C2E8DB" },
  "In Warranty": { bg: "#E5F5EF", text: "#1F8A70", border: "#C2E8DB" },
  Resolved: { bg: "#E5F5EF", text: "#1F8A70", border: "#C2E8DB" },
  Completed: { bg: "#E5F5EF", text: "#1F8A70", border: "#C2E8DB" },
  Critical: { bg: "#FDEAEA", text: "#C63F3F", border: "#F8BDBD" },
  High: { bg: "#FDEAEA", text: "#C63F3F", border: "#F8BDBD" },
  Medium: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  Low: { bg: "#EEEEFA", text: "#5D5DA8", border: "#C9C9EA" },
  "Pending Approval": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Pending HOD": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Pending IT": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Under Repair": { bg: "#EBF2FF", text: "#2563EB", border: "#BFDBFE" },
  "In Progress": { bg: "#EBF2FF", text: "#2563EB", border: "#BFDBFE" },
  Open: { bg: "#EEEEFA", text: "#5D5DA8", border: "#C9C9EA" },
  Assigned: { bg: "#EEEEFA", text: "#5D5DA8", border: "#C9C9EA" },
  Unassigned: { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" },
  Closed: { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" },
  Decommissioned: { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" },
  "In Storage": { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  "Out of Warranty": { bg: "#FDEAEA", text: "#C63F3F", border: "#F8BDBD" },
  Expired: { bg: "#FDEAEA", text: "#C63F3F", border: "#F8BDBD" },
  Rejected: { bg: "#FDEAEA", text: "#C63F3F", border: "#F8BDBD" },
};

const StatusChip = ({ label }) => {
  const conf = STATUS_COLORS[label] || {
    bg: "#EEEEFA",
    text: "#5D5DA8",
    border: "#C9C9EA",
  };

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 11.5,
        borderRadius: "8px",
        px: 0.5,
        bgcolor: conf.bg,
        color: conf.text,
        border: `1px solid ${conf.border}`,
      }}
    />
  );
};

export default StatusChip;
