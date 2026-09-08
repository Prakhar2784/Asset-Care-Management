import { Chip } from "@mui/material";

const StatusChip = ({ label }) => {
  const getStyle = (status) => {
    switch (status) {
      case "Active":
      case "In Warranty":
      case "Resolved":
      case "Critical":
      case "High":
        // Strong/positive-or-urgent states — solid fill
        return { variant: "filled" };
      default:
        // Neutral/pending/in-progress states — outlined
        return { variant: "outlined" };
    }
  };

  const style = getStyle(label);
  const isDark = style.variant === "filled";

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 12,
        borderRadius: "100px",
        px: 1,
        bgcolor: isDark ? "#051C12" : "transparent",
        color: isDark ? "#FFFFFF" : "text.primary",
        border: "1px solid",
        borderColor: isDark ? "#051C12" : "divider",
      }}
    />
  );
};

export default StatusChip;
