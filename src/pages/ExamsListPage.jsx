// src/pages/ExamsListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, Chip, Button, Alert, Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import { getStudentDashboard } from "../api/student";
import { startAttempt } from "../api/attempts";

export default function ExamsListPage() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyExamId, setBusyExamId] = useState(null);

  const load = () => {
    setLoading(true);
    getStudentDashboard()
      .then((d) => {
        setAvailable(d.available_exams || []);
        setInProgress(d.in_progress_attempts || []);
      })
      .catch(() => setError("Failed to load exams."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const start = async (examId) => {
    setBusyExamId(examId);
    setError(null);
    try {
      const attempt = await startAttempt(examId);
      navigate(`/exams/attempt/${attempt.id}`);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not start the exam.");
      setBusyExamId(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={300} />;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ mb: 2 }}>
        Back to dashboard
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Exams</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Start new attempts or resume ones you've already opened.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {inProgress.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>In progress</Typography>
          <Stack spacing={1}>
            {inProgress.map((a) => (
              <Stack
                key={a.attempt_id}
                direction="row"
                spacing={2}
                sx={{ alignItems: "center", p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.exam_title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.course_code} · Attempt #{a.attempt_number} · {a.answered_count} answers · {a.total_marks} marks
                  </Typography>
                </Box>
                <Button
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
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <QuizRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Available</Typography>
        </Stack>

        {available.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No published exams you can start right now.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {available.map((e) => (
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
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{e.title}</Typography>
                    <Chip size="small" label={e.status === "in_progress" ? "In progress" : "Not started"} />
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ color: "text.secondary" }}>
                    <Typography variant="caption">{e.course_code}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <ScheduleRoundedIcon sx={{ fontSize: 12 }} />
                      <Typography variant="caption">{e.duration_minutes} min</Typography>
                    </Stack>
                    <Typography variant="caption">{e.total_marks} marks</Typography>
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  disabled={busyExamId === e.id}
                  startIcon={<PlayArrowRoundedIcon />}
                  onClick={() => start(e.id)}
                >
                  {busyExamId === e.id ? "…" : "Start"}
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}