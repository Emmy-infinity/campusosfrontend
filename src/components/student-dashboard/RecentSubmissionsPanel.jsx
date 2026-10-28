// src/components/student-dashboard/RecentSubmissionsPanel.jsx
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, Chip, Divider, alpha,
} from "@mui/material";
import SectionHeader from "./SectionHeader";
import { STATUS_STYLES } from "./constants";

export default function RecentSubmissionsPanel({ submissions = [] }) {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <SectionHeader
        title="Recent submissions"
        actionLabel="View all"
        onAction={() => navigate("/submissions")}
      />

      {submissions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No submissions yet. Upload a research paper to get started.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {submissions.map((s, i) => {
            const st = STATUS_STYLES[s.evaluation_status] || STATUS_STYLES.PENDING;
            return (
              <Box key={s.id}>
                {i > 0 && <Divider />}
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", py: 1.5, px: 1 }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {s.document_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.course ? `${s.course.code} · ` : ""}
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {s.overall_score != null && (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Number(s.overall_score).toFixed(0)}%
                    </Typography>
                  )}
                  <Chip
                    size="small"
                    label={st.label}
                    sx={{
                      height: 20, fontSize: 11,
                      bgcolor: alpha(st.color, 0.1), color: st.color,
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}