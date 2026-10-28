// src/components/student-dashboard/PerformanceStrip.jsx
import { Box, Paper, Stack, Typography } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";

export default function PerformanceStrip({ avgPct, bestPct, graded, attempted }) {
  if (avgPct == null && bestPct == null && attempted === 0) return null;

  const cards = [
    {
      icon: TrendingUpRoundedIcon,
      color: "#1976d2",
      label: "Average score",
      value: avgPct != null ? `${avgPct.toFixed(1)}%` : "—",
    },
    {
      icon: EmojiEventsRoundedIcon,
      color: "#059669",
      label: "Best score",
      value: bestPct != null ? `${bestPct.toFixed(1)}%` : "—",
    },
    {
      icon: QuizRoundedIcon,
      color: "#7c3aed",
      label: "Exams graded",
      value: `${graded}/${attempted}`,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr 1fr", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Paper key={c.label} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
              <Icon fontSize="small" sx={{ color: c.color }} />
              <Typography variant="caption" color="text.secondary">
                {c.label}
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {c.value}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
}