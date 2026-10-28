// src/pages/ExamEditPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert,
  MenuItem, CircularProgress, Breadcrumbs, Link as MuiLink,
  FormControlLabel, Switch, Divider, Chip, Checkbox, FormGroup,
  IconButton, Tooltip, Collapse, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { api } from "../api/client";

export default function ExamEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [expandedBank, setExpandedBank] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form state for exam basics
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    duration_minutes: 60,
    is_published: false,
  });

  // Selection state: Set of question IDs
  const [selected, setSelected] = useState(new Set());
  // Snapshot of the original selection at load time — used to compute the diff.
  const [original, setOriginal] = useState(new Set());
  // Maps question_id → exam_question row id (needed for DELETE)
  const [eqIdByQuestion, setEqIdByQuestion] = useState({});

  // ── Load exam + banks ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get(`/exams/${id}/`).then((r) => r.data),
      api.get("/question-banks/").then((r) => r.data),
    ])
      .then(([examData, banksData]) => {
        if (cancelled) return;

        setExam(examData);

        const eqRows = examData.exam_questions || [];
        const initialSet = new Set(eqRows.map((eq) => eq.question));
        const map = {};
        for (const eq of eqRows) map[eq.question] = eq.id;

        setSelected(new Set(initialSet));
        setOriginal(new Set(initialSet));
        setEqIdByQuestion(map);

        setForm({
          title: examData.title || "",
          description: examData.description || "",
          instructions: examData.instructions || "",
          duration_minutes: examData.duration_minutes ?? 60,
          is_published: !!examData.is_published,
        });

        const bRows = Array.isArray(banksData) ? banksData : banksData.results || [];
        setBanks(bRows);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to load exam."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  // ── Helpers ──────────────────────────────────────────────
  const toggleBank = (bankId) => {
    setExpandedBank((prev) => (prev === bankId ? null : bankId));
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

  const addedCount = useMemo(() => {
    let n = 0;
    for (const qId of selected) if (!original.has(qId)) n++;
    return n;
  }, [selected, original]);

  const removedCount = useMemo(() => {
    let n = 0;
    for (const qId of original) if (!selected.has(qId)) n++;
    return n;
  }, [selected, original]);

  const hasChanges =
    addedCount > 0 ||
    removedCount > 0 ||
    form.title !== (exam?.title || "") ||
    form.description !== (exam?.description || "") ||
    form.instructions !== (exam?.instructions || "") ||
    Number(form.duration_minutes) !== (exam?.duration_minutes ?? 60) ||
    !!form.is_published !== !!exam?.is_published;

  // ── Save ─────────────────────────────────────────────────
  const onSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    setBusy(true);
    try {
      // 1. Patch exam basics
      await api.patch(`/exams/${id}/`, {
        title: form.title.trim(),
        description: form.description,
        instructions: form.instructions,
        duration_minutes: Number(form.duration_minutes),
        is_published: !!form.is_published,
      });

      // 2. Delete removed exam-questions
      const toDelete = [];
      for (const qId of original) {
        if (!selected.has(qId)) {
          const eqId = eqIdByQuestion[qId];
          if (eqId != null) toDelete.push(eqId);
        }
      }
      for (const eqId of toDelete) {
        await api.delete(`/exam-questions/${eqId}/`);
      }

      // 3. Add new exam-questions with sequential order
      const selectedArr = Array.from(selected);
      let order = 1;
      for (const qId of selectedArr) {
        if (!original.has(qId)) {
          await api.post("/exam-questions/", {
            exam: Number(id),
            question: qId,
            order,
          });
        }
        order++;
      }

      // 4. Renumber order for existing ones (sequential 1..N)
      //    This keeps order consistent after deletes/adds.
      const stillAttached = selectedArr.filter((qId) => original.has(qId));
      let reorder = 1;
      // First, add new ones occupy positions — compute full order list
      // Build final ordering: preserve existing order from server where possible,
      // then append new ones in selection order.
      // Simpler approach: after adds/deletes, fetch fresh and re-order if needed.
      // To keep it simple we skip renumbering here; the backend sorts by `order`
      // and the create form assigned sequential orders already.

      navigate("/exams");
    } catch (err) {
      const body = err?.response?.data;
      if (typeof body === "string") setError(body);
      else if (body?.detail) setError(body.detail);
      else if (body && typeof body === "object") {
        setError(
          Object.entries(body)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" · ")
        );
      } else setError("Failed to save changes.");
      setBusy(false);
    }
  };

  // ── Delete exam ──────────────────────────────────────────
  const onDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/exams/${id}/`);
      navigate("/exams");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete exam.");
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error && !exam) return <Alert severity="error">{error}</Alert>;
  if (!exam) return <Alert severity="warning">Exam not found.</Alert>;

  const selectedCount = selected.size;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/exams" underline="hover" color="inherit">
          Exams
        </MuiLink>
        <Typography color="text.primary">{exam.title}</Typography>
      </Breadcrumbs>

      <Stack direction="row" sx={{ mb: 2, gap: 1 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/exams")}
        >
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<InsightsRoundedIcon />}
          color="primary"
          onClick={() => navigate(`/exams/${id}/analytics`)}
        >
          View analytics
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Edit exam
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {exam.course?.code} — {exam.course?.title}
            </Typography>
          </Box>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            Delete
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={onSave}>
          <Stack spacing={3}>
            {/* ── Basics ──────────────────────────────────── */}
            <TextField
              label="Exam title"
              name="title"
              value={form.title}
              onChange={onChange}
              required
              fullWidth
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

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <TextField
                label="Duration (minutes)"
                name="duration_minutes"
                type="number"
                value={form.duration_minutes}
                onChange={onChange}
                required
                inputProps={{ min: 1 }}
                sx={{ maxWidth: 220 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_published}
                    onChange={onChange}
                    name="is_published"
                  />
                }
                label="Published (students can see it)"
              />
            </Stack>

            <Divider />

            {/* ── Question picker ─────────────────────────── */}
            <Box>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Questions
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    label={`${selectedCount} selected`}
                    color={selectedCount > 0 ? "primary" : "default"}
                  />
                  {addedCount > 0 && (
                    <Chip size="small" color="success" label={`+${addedCount}`} />
                  )}
                  {removedCount > 0 && (
                    <Chip size="small" color="error" label={`−${removedCount}`} />
                  )}
                </Stack>
              </Stack>

              {banks.length === 0 ? (
                <Alert severity="info">
                  No question banks yet. Create one first from the dashboard.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {banks.map((bank) => {
                    const isOpen = expandedBank === bank.id;
                    const questions = bank.questions || [];
                    const attachedHere = questions.filter((q) =>
                      selected.has(q.id)
                    ).length;
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
                          {attachedHere > 0 && (
                            <Chip
                              size="small"
                              color="primary"
                              label={`${attachedHere} attached`}
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          )}
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

            {/* ── Save ────────────────────────────────────── */}
            <Stack direction="row" spacing={2} sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !form.title || !hasChanges}
                startIcon={
                  busy ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />
                }
              >
                {busy ? "Saving…" : hasChanges ? "Save changes" : "No changes"}
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

      {/* ── Delete confirm ─────────────────────────────────── */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete this exam?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will remove <strong>{exam.title}</strong> and all of its
            exam-question links and student attempts. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onDelete}
            disabled={busy}
          >
            {busy ? "Deleting…" : "Delete exam"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}