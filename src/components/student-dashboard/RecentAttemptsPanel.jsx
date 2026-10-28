// src/components/student-dashboard/RecentAttemptsPanel.jsx
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, Chip, Divider, alpha,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import SectionHeader from "./SectionHeader";
import { ATTEMPT_STATUS_STYLES, scoreColor } from "./constants";

export default function RecentAttemptsPanel({ attempts = [] }) {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <SectionHeader
        title="Recent attempts"
        actionLabel="All attempts"
        onAction={() => navigate("/exams")}
      />

      {attempts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          You haven't attempted any exams yet.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {attempts.map((a, i) => {
            const st = ATTEMPT_STATUS_STYLES[a.status] || ATTEMPT_STATUS_STYLES.IN_PROGRESS;
            return (
              <Box key={a.attempt_id}>
                {i > 0 && <Divider />}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center", py: 1.5, px: 1 }}
                >
                  <Box
                    sx={{
                      display: "grid", placeItems: "center",
                      width: 32, height: 32, borderRadius: 1,
                      bgcolor: alpha(st.color, 0.1), color: st.color, flexShrink: 0,
                    }}
                  >
                    <EmojiEventsRoundedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {a.exam_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.course_code ? `${a.course_code} · ` : ""}
                      Attempt #{a.attempt_number} ·{" "}
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleDateString()
                        : new Date(a.start_time).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {a.percentage != null ? (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: scoreColor(a.percentage) }}
                    >
                      {a.percentage.toFixed(0)}%
                    </Typography>
                  ) : (
                    <Chip
                      size="small"
                      label={st.label}
                      sx={{
                        height: 20, fontSize: 11,
                        bgcolor: alpha(st.color, 0.1), color: st.color,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}