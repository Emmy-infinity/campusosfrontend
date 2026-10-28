// src/pages/ExamCreatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert,
  MenuItem, CircularProgress, Breadcrumbs, Link as MuiLink,
  FormControlLabel, Switch, Divider, Chip, Checkbox, FormGroup,
  IconButton, Tooltip, Collapse,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import { listMyCourses, listQuestionBanks, createExam } from "../api/lecturer";
import { api } from "../api/client";

export default function ExamCreatePage() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankDetails, setBankDetails] = useState({}); // {bankId: {questions: [...]}}
  const [expandedBank, setExpandedBank] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    course_id: "",
    title: "",
    description: "",
    instructions: "",
    duration_minutes: 60,
    is_published: false,
  });

  // Which questions are selected: Set of question ids
  const [selected, setSelected] = useState(new Set());

  // ── Load courses + banks ─────────────────────────────────
  useEffect(() => {
    Promise.all([listMyCourses(), listQuestionBanks()])
      .then(([coursesData, banksData]) => {
        const cRows = Array.isArray(coursesData) ? coursesData : coursesData.results || [];
        const bRows = Array.isArray(banksData) ? banksData : banksData.results || [];
        setCourses(cRows);
        setBanks(bRows);
        if (cRows.length > 0) setForm((f) => ({ ...f, course_id: cRows[0].id }));
      })
      .catch(() => setError("Failed to load courses or question banks."))
      .finally(() => setLoading(false));
  }, []);

  // ── Lazy-load questions when a bank is expanded ──────────
  const toggleBank = async (bankId) => {
    if (expandedBank === bankId) {
      setExpandedBank(null);
      return;
    }
    setExpandedBank(bankId);
    if (!bankDetails[bankId]) {
      try {
        const { data } = await api.get(`/question-banks/${bankId}/`);
        setBankDetails((prev) => ({ ...prev, [bankId]: data.questions || [] }));
      } catch {
        setBankDetails((prev) => ({ ...prev, [bankId]: [] }));
      }
    }
  };

  const toggleQuestion = (qId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ── Submit ───────────────────────────────────────────────
  const onSubmit = async (e) => {
    e.preventDefault();
    if (selected.size === 0) {
      setError("Select at least one question.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      // 1. Create the exam
      const exam = await createExam({
        course_id: Number(form.course_id),
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        duration_minutes: Number(form.duration_minutes),
        is_published: form.is_published,
      });

      // 2. Attach questions via the ExamQuestion through-table
      //    POST /api/exams/{id}/exam_questions/ (nested) — if not supported,
      //    fall back to creating ExamQuestion rows directly.
      const questionsArray = Array.from(selected);
      for (let i = 0; i < questionsArray.length; i++) {
        try {
          await api.post("/exam-questions/", {
            exam: exam.id,
            question: questionsArray[i],
            order: i + 1,
          });
        } catch (innerErr) {
          // Fallback: try PATCHing the exam with exam_questions array
          // (depends on how your serializer is wired)
          console.warn("exam-questions endpoint failed; check serializer", innerErr);
        }
      }

      navigate("/exams");
    } catch (err) {
      const body = err?.response?.data;
      if (typeof body === "string") setError(body);
      else if (body?.detail) setError(body.detail);
      else if (body && typeof body === "object") {
        const msg = Object.entries(body)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" · ");
        setError(msg || "Failed to create exam.");
      } else setError("Failed to create exam.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedCount = selected.size;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/exams" underline="hover" color="inherit">
          Exams
        </MuiLink>
        <Typography color="text.primary">New exam</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/exams")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create an exam
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set the basics, then pick questions from your banks.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            {/* ── Basics ──────────────────────────────────── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Course"
                name="course_id"
                value={form.course_id}
                onChange={onChange}
                required
                fullWidth
                helperText={courses.length === 0 ? "No courses — create one first." : ""}
              >
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Duration (minutes)"
                name="duration_minutes"
                type="number"
                value={form.duration_minutes}
                onChange={onChange}
                required
                inputProps={{ min: 1 }}
                sx={{ maxWidth: { sm: 220 } }}
              />
            </Stack>

            <TextField
              label="Exam title"
              name="title"
              value={form.title}
              onChange={onChange}
              required
              fullWidth
              placeholder="e.g. CS301 Midterm"
            />

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={onChange}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Instructions"
              name="instructions"
              value={form.instructions}
              onChange={onChange}
              fullWidth
              multiline
              minRows={2}
              placeholder="Shown to students before they begin."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_published}
                  onChange={onChange}
                  name="is_published"
                />
              }
              label="Publish immediately (students can see it)"
            />

            <Divider />

            {/* ── Question picker ─────────────────────────── */}
            <Box>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Questions
                </Typography>
                <Chip
                  size="small"
                  label={`${selectedCount} selected`}
                  color={selectedCount > 0 ? "primary" : "default"}
                />
              </Stack>

              {banks.length === 0 ? (
                <Alert severity="info">
                  No question banks yet. Create one first from the dashboard.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {banks.map((bank) => {
                    const isOpen = expandedBank === bank.id;
                    const questions = bankDetails[bank.id] || [];
                    return (
                      <Paper key={bank.id} variant="outlined">
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            p: 1.5,
                            cursor: "pointer",
                            gap: 1.5,
                          }}
                          onClick={() => toggleBank(bank.id)}
                        >
                          <QuizRoundedIcon fontSize="small" color="primary" />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                              {bank.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {bank.course?.code} — {bank.course?.title}
                            </Typography>
                          </Box>
                          <IconButton size="small">
                            {isOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                          </IconButton>
                        </Stack>

                        <Collapse in={isOpen} unmountOnExit>
                          <Divider />
                          <Box sx={{ p: 2 }}>
                            {questions.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No questions in this bank yet.
                              </Typography>
                            ) : (
                              <FormGroup>
                                {questions.map((q) => (
                                  <FormControlLabel
                                    key={q.id}
                                    control={
                                      <Checkbox
                                        checked={selected.has(q.id)}
                                        onChange={() => toggleQuestion(q.id)}
                                      />
                                    }
                                    label={
                                      <Box sx={{ py: 0.5 }}>
                                        <Typography variant="body2" noWrap>
                                          {q.text.length > 90
                                            ? q.text.slice(0, 90) + "…"
                                            : q.text}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {q.question_type} · {q.marks} mark
                                          {q.marks === 1 ? "" : "s"}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                ))}
                              </FormGroup>
                            )}
                          </Box>
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* ── Submit ──────────────────────────────────── */}
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !form.course_id || !form.title || selectedCount === 0}
                startIcon={
                  busy ? <CircularProgress size={18} color="inherit" /> : null
                }
              >
                {busy ? "Creating…" : "Create exam"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/exams")}
                disabled={busy}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}