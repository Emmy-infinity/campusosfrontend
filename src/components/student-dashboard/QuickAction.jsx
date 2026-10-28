// src/components/student-dashboard/QuickAction.jsx
import { Button, alpha, useTheme } from "@mui/material";

export default function QuickAction({ icon: Icon, label, onClick }) {
  const theme = useTheme();
  return (
    <Button
      onClick={onClick}
      variant="outlined"
      startIcon={<Icon />}
      fullWidth
      sx={{
        justifyContent: "flex-start", py: 1.5, px: 2,
        textTransform: "none", fontWeight: 500,
        borderColor: theme.palette.divider, color: "text.primary",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      {label}
    </Button>
  );
}