import { Chip } from "@mui/material";

const StatusChip = ({ label }) => {
  const getStyle = (status) => {
    switch (status) {
      case "Active":
      case "In Warranty":
      case "Resolved":
        return { bgcolor: "rgba(22,163,74,0.13)", color: "#4ADE80", border: "1px solid rgba(22,163,74,0.25)" };
      case "Expired":
      case "Critical":
        return { bgcolor: "rgba(220,38,38,0.13)", color: "#F87171", border: "1px solid rgba(220,38,38,0.25)" };
      case "Under Repair":
      case "Pending Approval":
      case "High":
        return { bgcolor: "rgba(217,119,6,0.13)", color: "#FBBF24", border: "1px solid rgba(217,119,6,0.25)" };
      case "Vendor Assigned":
      case "Medium":
        return { bgcolor: "rgba(37,99,235,0.13)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.25)" };
      default:
        return { bgcolor: "rgba(71,85,105,0.13)", color: "#94A3B8", border: "1px solid rgba(71,85,105,0.25)" };
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