import { Chip } from "@mui/material";

const StatusChip = ({ label }) => {
  const getStyle = (status) => {
    switch (status) {
      case "Active":
      case "In Warranty":
      case "Resolved":
        return { bgcolor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }; // Emerald
      case "Expired":
      case "Critical":
        return { bgcolor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }; // Rose
      case "Under Repair":
      case "Pending Approval":
      case "High":
        return { bgcolor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }; // Amber
      case "Vendor Assigned":
      case "Medium":
        return { bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }; // Blue
      default: // Low or unknown
        return { bgcolor: "#F5F5F4", color: "#6B6B65", border: "1px solid rgba(17,17,17,0.12)" }; // Warm gray
    }
  };

  const style = getStyle(label);

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 12,
        borderRadius: "100px", // Pill shape
        px: 1,
        bgcolor: style.bgcolor,
        color: style.color,
        border: style.border,
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
      }}
    />
  );
};

export default StatusChip;