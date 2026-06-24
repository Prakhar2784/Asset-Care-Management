import { Box, Typography } from "@mui/material";

const PageHeader = ({ label, title, text, subtitle, action }) => {
  return (
    <Box
      component="section"
      sx={{
        mb: 5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 3,
        animation: "slideDown 0.5s ease-out forwards",
        "@keyframes slideDown": { from: { opacity: 0, transform: "translateY(-10px)" }, to: { opacity: 1, transform: "none" } }
      }}
    >
      <Box sx={{ flex: 1, minWidth: "300px" }}>
        {label && (
          <Typography
            component="span"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              mb: 1,
              display: "block"
            }}
          >
            {label}
          </Typography>
        )}

        {title && (
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: "text.primary",
              fontWeight: 900,
              letterSpacing: "-1px",
              mb: 1.5
            }}
          >
            {title}
          </Typography>
        )}

        {(text || subtitle) && (
          <Typography
            component="p"
            sx={{
              color: "text.secondary",
              fontSize: 16,
              maxWidth: 700,
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            {text || subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box sx={{ display: "flex", gap: 2 }}>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
