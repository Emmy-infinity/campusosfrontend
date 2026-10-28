// src/components/student-dashboard/StatCard.jsx
import { Box, Paper, Stack, Typography, alpha, useTheme } from "@mui/material";

export default function StatCard({ icon: Icon, label, value, color, onClick, sub }) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2.5,
        cursor: onClick ? "pointer" : "default",
        transition: theme.transitions.create(["border-color", "transform"]),
        ...(onClick && {
          "&:hover": {
            borderColor: alpha(color, 0.5),
            transform: "translateY(-2px)",
          },
        }),
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            display: "grid", placeItems: "center",
            width: 48, height: 48, borderRadius: 2,
            bgcolor: alpha(color, 0.12), color, flexShrink: 0,
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}