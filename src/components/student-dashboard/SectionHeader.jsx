// src/components/student-dashboard/SectionHeader.jsx
import { Button, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
      {onAction && (
        <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={onAction}>
          {actionLabel || "View all"}
        </Button>
      )}
    </Stack>
  );
}