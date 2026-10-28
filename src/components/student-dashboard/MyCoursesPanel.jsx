// src/components/student-dashboard/MyCoursesPanel.jsx
import { Box, Paper, Stack, Typography, Divider, Avatar, alpha } from "@mui/material";

export default function MyCoursesPanel({ courses = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        My courses
      </Typography>

      {courses.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Not enrolled in any course yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {courses.map((c, i) => (
            <Box key={`${c.course.id}-${i}`}>
              {i > 0 && <Divider sx={{ mb: 1.5 }} />}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar
                  sx={{
                    width: 32, height: 32, fontSize: 12, fontWeight: 700,
                    bgcolor: alpha("#1976d2", 0.12), color: "#1976d2",
                  }}
                >
                  {c.course.code?.[0] || "?"}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {c.course.code} — {c.course.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {c.lecturer_name ? c.lecturer_name : "No lecturer"}
                    {c.semester ? ` · ${c.semester}` : ""}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}