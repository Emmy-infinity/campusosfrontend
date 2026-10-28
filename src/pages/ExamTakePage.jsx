// src/pages/ExamTakePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, Button, Alert, Skeleton,
  Radio, RadioGroup, FormControlLabel, TextField, Chip,
  LinearProgress, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getAttempt, saveAnswer, submitAttempt } from "../api/attempts";

export default function ExamTakePage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedIds, setSavedIds] = useState({});
  const [localAnswers, setLocalAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saveTimers = useRef({});

  useEffect(() => {
    getAttempt(attemptId)
      .then((data) => {
        setAttempt(data);
        const initial = {};
        (data.answers || []).forEach((a) => {
          initial[a.question.id] = {
            selected_option: a.selected_option,
            answer_text: a.answer_text || "",
          };
        });
        setLocalAnswers(initial);
      })
      .catch((e) => setError(e?.response?.data?.error || "Failed to load attempt."))
      .finally(() => setLoading(false));
  }, [attemptId]);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    const start = new Date(attempt.start_time).getTime();
    const limitMs = (attempt.exam.duration_minutes || 60) * 60 * 1000;
    const deadline = start + limitMs;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) handleSubmit(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [attempt?.id, attempt?.status]);

  const questions = useMemo(() => {
    if (!attempt?.exam?.exam_questions) return [];
    return [...attempt.exam.exam_questions].sort((a, b) => a.order - b.order);
  }, [attempt]);

  const answeredCount = useMemo(
    () =>
      Object.values(localAnswers).filter(
        (a) => a?.selected_option != null || (a?.answer_text || "").trim().length > 0
      ).length,
    [localAnswers]
  );

  const doSave = async (questionId, payload) => {
    try {
      await saveAnswer(attemptId, {
        question_id: Number(questionId),
        selected_option: payload.selected_option ?? null,
        answer_text: payload.answer_text ?? "",
      });
      setSavedIds((prev) => ({ ...prev, [questionId]: true }));
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save answer.");
    }
  };

  const scheduleSave = (questionId, payload) => {
    if (saveTimers.current[questionId]) clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => doSave(questionId, payload), 600);
  };

  const updateAnswer = (questionId, patch) => {
    const current = localAnswers[questionId] || { selected_option: null, answer_text: "" };
    const next = { ...current, ...patch };
    setLocalAnswers((prev) => ({ ...prev, [questionId]: next }));
    scheduleSave(questionId, next);
  };

  const handleSubmit = async (auto = false) => {
    if (!auto) setConfirmOpen(false);
    setBusy(true);
    setError(null);
    try {
      Object.entries(saveTimers.current).forEach(([qid, t]) => {
        clearTimeout(t);
        const payload = localAnswers[qid];
        if (payload) doSave(qid, payload);
      });
      await submitAttempt(attemptId);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to submit.");
      setBusy(false);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={400} />;
  if (error && !attempt) return <Alert severity="error">{error}</Alert>;
  if (!attempt) return <Alert severity="warning">Attempt not found.</Alert>;

  const isEditable = attempt.status === "IN_PROGRESS";
  const mm = String(Math.floor((secondsLeft ?? 0) / 60)).padStart(2, "0");
  const ss = String((secondsLeft ?? 0) % 60).padStart(2, "0");
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/exams")} sx={{ mb: 2 }}>
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, position: "sticky", top: 16, zIndex: 10 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{attempt.exam.title}</Typography>
            <Stack direction="row" spacing={1.5} sx={{ color: "text.secondary", mt: 0.5 }}>
              <Typography variant="caption">{attempt.exam.course?.code}</Typography>
              <Typography variant="caption">Attempt #{attempt.attempt_number}</Typography>
              <Typography variant="caption">{answeredCount}/{questions.length} answered</Typography>
            </Stack>
          </Box>
          {isEditable && secondsLeft != null && (
            <Chip
              icon={<TimerIcon />}
              label={`${mm}:${ss}`}
              color={secondsLeft < 300 ? "error" : secondsLeft < 900 ? "warning" : "primary"}
              sx={{ fontSize: 16, fontWeight: 700, px: 1 }}
            />
          )}
          {!isEditable && <Chip label={attempt.status} color="success" />}
        </Stack>
        <LinearProgress variant="determinate" value={progressPct} sx={{ mt: 2, height: 6, borderRadius: 3 }} />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Stack spacing={2}>
        {questions.map((eq) => {
          const q = eq.question;
          const ans = localAnswers[q.id] || {};
          const isSaved = savedIds[q.id];
          return (
            <Paper key={eq.id} variant="outlined" sx={{ p: 2.5 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Question {eq.order}</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip size="small" label={`${eq.marks ?? q.marks} mark(s)`} />
                  {isSaved && (
                    <Chip size="small" icon={<CheckCircleIcon />} label="Saved" color="success" variant="outlined" />
                  )}
                </Stack>
              </Stack>

              <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>{q.text}</Typography>

              {q.question_type === "MCQ" ? (
                <RadioGroup
                  value={ans.selected_option != null ? String(ans.selected_option) : ""}
                  onChange={(e) => updateAnswer(q.id, { selected_option: Number(e.target.value) })}
                >
                  {(q.options || []).map((opt, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={String(idx)}
                      disabled={!isEditable}
                      control={<Radio />}
                      label={opt}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  value={ans.answer_text || ""}
                  onChange={(e) => updateAnswer(q.id, { answer_text: e.target.value })}
                  disabled={!isEditable}
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="Write your answer here…"
                />
              )}
            </Paper>
          );
        })}
      </Stack>

      {isEditable && (
        <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => navigate("/exams")} disabled={busy}>
            Save & exit
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {busy ? "Submitting…" : "Submit exam"}
          </Button>
        </Stack>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Submit exam?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You've answered {answeredCount} of {questions.length} questions.
            {answeredCount < questions.length && " Unanswered questions will be marked as blank."}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Once submitted, you cannot edit your answers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={() => handleSubmit(false)} disabled={busy}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}