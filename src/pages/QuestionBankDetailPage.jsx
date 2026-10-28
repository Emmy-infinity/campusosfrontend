// src/pages/QuestionBankDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Paper, Typography, Stack, Button, Alert, Skeleton, Divider,
  Chip, IconButton, Tooltip, TextField, MenuItem, Radio,
  FormControlLabel, RadioGroup, Breadcrumbs, Link as MuiLink,
  Dialog, DialogTitle, DialogContent, DialogActions, Collapse, alpha,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import { api } from "../api/client";
import {
  listQuestions, createQuestion, updateQuestion, deleteQuestion,
} from "../api/questions";

const emptyMCQ = () => ({
  question_type: "MCQ",
  text: "",
  options: ["", "", "", ""],
  correct_option: 0,
  marks: 1,
  explanation: "",
  model_answer: "",
});

const emptyStructured = () => ({
  question_type: "STRUCTURED",
  text: "",
  marks: 5,
  explanation: "",
  model_answer: "",
});

function QuestionForm({ bankId, initial, onSaved, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        question_type: initial.question_type,
        text: initial.text || "",
        options: initial.options || ["", "", "", ""],
        correct_option: initial.correct_option ?? 0,
        marks: initial.marks ?? 1,
        explanation: initial.explanation || "",
        model_answer: initial.model_answer || "",
      };
    }
    return emptyMCQ();
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isMCQ = form.question_type === "MCQ";

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onOptionChange = (idx, value) => {
    setForm((p) => {
      const next = [...p.options];
      next[idx] = value;
      return { ...p, options: next };
    });
  };

  const addOption = () => setForm((p) => ({ ...p, options: [...p.options, ""] }));

  const removeOption = (idx) =>
    setForm((p) => {
      const next = p.options.filter((_, i) => i !== idx);
      const correct = p.correct_option >= next.length ? 0 : p.correct_option;
      return { ...p, options: next, correct_option: correct };
    });

  const switchType = (newType) => {
    if (newType === form.question_type) return;
    if (newType === "MCQ") {
      setForm({ ...emptyMCQ(), text: form.text, marks: form.marks, explanation: form.explanation });
    } else {
      setForm({ ...emptyStructured(), text: form.text, marks: form.marks, explanation: form.explanation });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.text.trim()) { setError("Question text is required."); return; }
    if (isMCQ) {
      const filled = form.options.filter((o) => o.trim().length > 0);
      if (filled.length < 2) { setError("MCQ needs at least 2 non-empty options."); return; }
      if (!form.options[form.correct_option]?.trim()) {
        setError("The selected correct option cannot be empty.");
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        bank: bankId,
        question_type: form.question_type,
        text: form.text.trim(),
        marks: Number(form.marks) || 1,
        explanation: form.explanation || "",
        model_answer: form.model_answer || "",
      };
      if (isMCQ) {
        payload.options = form.options.map((o) => o.trim());
        payload.correct_option = form.correct_option;
      } else {
        payload.options = null;
        payload.correct_option = null;
      }
      if (isEdit) await updateQuestion(initial.id, payload);
      else await createQuestion(payload);
      onSaved();
    } catch (err) {
      const body = err?.response?.data;
      setError(
        typeof body === "string" ? body
        : body && typeof body === "object"
          ? Object.entries(body).map(([k, v]) =>
              `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" · ")
          : "Failed to save question."
      );
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, bgcolor: alpha("#1976d2", 0.02) }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {isEdit ? "Edit question" : "New question"}
        </Typography>
        <TextField select size="small" value={form.question_type}
          onChange={(e) => switchType(e.target.value)} sx={{ width: 180 }}>
          <MenuItem value="MCQ">Multiple choice</MenuItem>
          <MenuItem value="STRUCTURED">Structured (essay)</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <TextField label="Question text" value={form.text}
            onChange={(e) => onChange("text", e.target.value)}
            required fullWidth multiline minRows={2} />

          {isMCQ && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Options — select the correct one</Typography>
              <RadioGroup value={String(form.correct_option)}
                onChange={(e) => onChange("correct_option", Number(e.target.value))}>
                <Stack spacing={1}>
                  {form.options.map((opt, idx) => (
                    <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <FormControlLabel value={String(idx)} control={<Radio size="small" />} label="" sx={{ m: 0 }} />
                      <TextField value={opt} onChange={(e) => onOptionChange(idx, e.target.value)}
                        size="small" fullWidth placeholder={`Option ${String.fromCharCode(65 + idx)}`} />
                      {form.options.length > 2 && (
                        <Tooltip title="Remove option">
                          <IconButton size="small" onClick={() => removeOption(idx)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ))}
                </Stack>
              </RadioGroup>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addOption} sx={{ mt: 1 }}>
                Add option
              </Button>
            </Box>
          )}

          {!isMCQ && (
            <TextField label="Model answer / rubric notes" value={form.model_answer}
              onChange={(e) => onChange("model_answer", e.target.value)}
              fullWidth multiline minRows={3} />
          )}

          <Stack direction="row" spacing={2}>
            <TextField label="Marks" type="number" value={form.marks}
              onChange={(e) => onChange("marks", e.target.value)}
              inputProps={{ min: 1 }} sx={{ maxWidth: 140 }} />
            <TextField label="Explanation (optional)" value={form.explanation}
              onChange={(e) => onChange("explanation", e.target.value)} fullWidth />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Add question"}
            </Button>
            <Button variant="outlined" onClick={onCancel} disabled={busy}>Cancel</Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

function QuestionCard({ question, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const isMCQ = question.question_type === "MCQ";
  return (
    <Paper variant="outlined" sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.5, cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}>
        <Chip size="small" label={isMCQ ? "MCQ" : "Structured"}
          color={isMCQ ? "primary" : "secondary"} sx={{ height: 20, fontSize: 11 }} />
        <Typography variant="body2" noWrap sx={{ flexGrow: 1, fontWeight: 500 }}>
          {question.text.length > 90 ? question.text.slice(0, 90) + "…" : question.text}
        </Typography>
        <Chip size="small" label={`${question.marks} mark${question.marks === 1 ? "" : "s"}`}
          sx={{ height: 20, fontSize: 11 }} />
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(question); }}>
          <EditRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(question); }}>
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small">
          {open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        </IconButton>
      </Stack>
      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>{question.text}</Typography>
          {isMCQ && question.options && (
            <Stack spacing={0.5}>
              {question.options.map((opt, idx) => (
                <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Chip size="small" label={String.fromCharCode(65 + idx)}
                    color={idx === question.correct_option ? "success" : "default"}
                    sx={{ height: 20, minWidth: 28 }} />
                  <Typography variant="body2"
                    sx={{ fontWeight: idx === question.correct_option ? 600 : 400,
                      color: idx === question.correct_option ? "success.main" : "text.primary" }}>
                    {opt}
                  </Typography>
                  {idx === question.correct_option && (
                    <Typography variant="caption" color="success.main">← correct</Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
          {!isMCQ && question.model_answer && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Model answer:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{question.model_answer}</Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function QuestionBankDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bank, setBank] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bankData, questionData] = await Promise.all([
        api.get(`/question-banks/${id}/`).then((r) => r.data),
        listQuestions(id),
      ]);
      setBank(bankData);
      const qRows = Array.isArray(questionData) ? questionData : questionData.results || [];
      setQuestions(qRows);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load question bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const onSaved = () => { setShowForm(false); setEditing(null); load(); };

  const onDeleteConfirm = async () => {
    try {
      await deleteQuestion(confirmDelete.id);
      setConfirmDelete(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete question.");
      setConfirmDelete(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={300} />;
  if (error && !bank) return <Alert severity="error">{error}</Alert>;
  if (!bank) return <Alert severity="warning">Question bank not found.</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">Dashboard</MuiLink>
        <MuiLink component={RouterLink} to="/question-banks" underline="hover" color="inherit">Question banks</MuiLink>
        <Typography color="text.primary">{bank.title}</Typography>
      </Breadcrumbs>

      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/question-banks")} sx={{ mb: 2 }}>
        Back to banks
      </Button>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{bank.title}</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, color: "text.secondary" }}>
          {bank.course && <Typography variant="body2">{bank.course.code} — {bank.course.title}</Typography>}
          <Typography variant="body2">{questions.length} question{questions.length === 1 ? "" : "s"}</Typography>
        </Stack>
        {bank.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{bank.description}</Typography>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {!showForm && !editing && (
        <Button variant="contained" startIcon={<AddRoundedIcon />}
          onClick={() => setShowForm(true)} sx={{ mb: 2 }}>
          Add question
        </Button>
      )}

      {(showForm || editing) && (
        <QuestionForm bankId={Number(id)} initial={editing} onSaved={onSaved}
          onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      {questions.length === 0 && !showForm ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">No questions in this bank yet.</Typography>
        </Paper>
      ) : (
        questions.map((q) => (
          <QuestionCard key={q.id} question={q}
            onEdit={(question) => { setEditing(question); setShowForm(false); }}
            onDelete={(question) => setConfirmDelete(question)} />
        ))
      )}

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete this question?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{confirmDelete?.text?.slice(0, 120)}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This cannot be undone. Any exams using it will lose this question.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={onDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
