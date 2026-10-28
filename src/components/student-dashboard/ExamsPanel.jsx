// src/components/student-dashboard/ExamsPanel.jsx
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, Chip, Button, Tooltip, alpha,
} from "@mui/material";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import { EXAM_STATUS_STYLES } from "./constants";

export default function ExamsPanel({ availableExams = [], inProgress = [], onStart, busyExamId }) {
  const navigate = useNavigate();
  const hasAny = availableExams.length > 0 || inProgress.length > 0;
  const total = availableExams.length + inProgress.length;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <QuizRoundedIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Exams</Typography>
          {total > 0 && (
            <Chip
              size="small"
              label={total}
              color="primary"
              sx={{ height: 20, fontWeight: 600 }}
            />
          )}
        </Stack>
        <Button
          size="small"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => navigate("/exams")}
        >
          View all
        </Button>
      </Stack>

      {!hasAny && (
        <Typography variant="body2" color="text.secondary">
          No active exams right now. New ones appear here when your lecturers publish them.
        </Typography>
      )}

      {inProgress.length > 0 && (
        <Box sx={{ mb: availableExams.length > 0 ? 2.5 : 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
            IN PROGRESS
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {inProgress.map((a) => (
              <Stack
                key={a.attempt_id}
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center", p: 1.5, borderRadius: 1,
                  bgcolor: alpha("#d97706", 0.06),
                  border: `1px solid ${alpha("#d97706", 0.3)}`,
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {a.exam_title}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ color: "text.secondary" }}>
                    {a.course_code && <Typography variant="caption">{a.course_code}</Typography>}
                    <Typography variant="caption">Attempt #{a.attempt_number}</Typography>
                    <Typography variant="caption">{a.answered_count} answer(s)</Typography>
                    <Typography variant="caption">{a.total_marks} marks</Typography>
                  </Stack>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<ReplayRoundedIcon />}
                  onClick={() => navigate(`/exams/attempt/${a.attempt_id}`)}
                >
                  Resume
                </Button>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {availableExams.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
            AVAILABLE
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {availableExams.map((e) => {
              const style = EXAM_STATUS_STYLES[e.status] || EXAM_STATUS_STYLES.not_started;
              const isBusy = busyExamId === e.id;
              const isResume = e.status === "in_progress";
              return (
                <Stack
                  key={e.id}
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: "center", p: 1.5, borderRadius: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {e.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={style.label}
                        sx={{
                          height: 18, fontSize: 10,
                          bgcolor: alpha(style.color, 0.1), color: style.color,
                        }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1.5} sx={{ color: "text.secondary" }}>
                      {e.course_code && <Typography variant="caption">{e.course_code}</Typography>}
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <ScheduleRoundedIcon sx={{ fontSize: 12 }} />
                        <Typography variant="caption">{e.duration_minutes} min</Typography>
                      </Stack>
                      <Typography variant="caption">{e.total_marks} marks</Typography>
                      {e.end_time && (
                        <Typography variant="caption">
                          Closes {new Date(e.end_time).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Tooltip title={isResume ? "Resume attempt" : "Start attempt"}>
                    <span>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={isBusy}
                        startIcon={isResume ? <ReplayRoundedIcon /> : <PlayArrowRoundedIcon />}
                        onClick={() => onStart(e.id)}
                      >
                        {isBusy ? "…" : isResume ? "Resume" : "Start"}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}