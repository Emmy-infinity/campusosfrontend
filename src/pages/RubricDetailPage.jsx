// src/pages/RubricDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert,
  MenuItem, CircularProgress, Breadcrumbs, Link as MuiLink,
  Divider, IconButton, Tooltip, Slider, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { listMyCourses } from "../api/lecturer";
import {
  getRubric, updateRubric, deleteRubric,
} from "../api/rubrics";

const emptyCriterion = () => ({ name: "", description: "", weight: 20 });

export default function RubricDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
  });
  const [criteria, setCriteria] = useState([emptyCriterion()]);

  // ── Load rubric + courses ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getRubric(id), listMyCourses()])
      .then(([rubric, courseData]) => {
        if (cancelled) return;
        const cRows = Array.isArray(courseData)
          ? courseData
          : courseData.results || [];
        setCourses(cRows);

        setForm({
          title: rubric.title || "",
          description: rubric.description || "",
          // If the rubric has no course (legacy data), fall back to the
          // first course so the required field is pre-populated.
          course_id: rubric.course?.id || (cRows[0]?.id ?? ""),
        });

        const crit = Array.isArray(rubric.criteria) && rubric.criteria.length > 0
          ? rubric.criteria.map((c) => ({
              name: c.name || "",
              description: c.description || "",
              weight: Number(c.weight) || 0,
            }))
          : [emptyCriterion()];
        setCriteria(crit);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.response?.data?.error ||
            e?.response?.data?.detail ||
            "Failed to load rubric."
          );
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [id]);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const updateCriterion = (i, key, value) =>
    setCriteria((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [key]: value } : c))
    );

  const addCriterion = () =>
    setCriteria((prev) => [...prev, emptyCriterion()]);

  const removeCriterion = (i) =>
    setCriteria((prev) => prev.filter((_, idx) => idx !== i));

  const totalWeight = criteria.reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0
  );

  // ── Save ─────────────────────────────────────────────────
  const onSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    // Course is required (matches backend RubricSerializer)
    if (!form.course_id) {
      setError("Please select a course. Rubrics must be tied to a course.");
      return;
    }
    if (criteria.length === 0) {
      setError("Add at least one criterion.");
      return;
    }
    if (criteria.some((c) => !c.name.trim())) {
      setError("Every criterion needs a name.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        course_id: Number(form.course_id),   // ← always sent, never null
        criteria: criteria.map((c) => ({
          name: c.name.trim(),
          description: (c.description || "").trim(),
          weight: Number(c.weight) || 0,
        })),
      };

      await updateRubric(id, payload);
      navigate("/rubrics");
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
      } else setError("Failed to save rubric.");
      setBusy(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const onDelete = async () => {
    setBusy(true);
    try {
      await deleteRubric(id);
      navigate("/rubrics");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete rubric.");
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={400} />;
  if (error && !form.title) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/rubrics" underline="hover" color="inherit">
          Rubrics
        </MuiLink>
        <Typography color="text.primary">{form.title || "Edit"}</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/rubrics")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Edit rubric
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update the title, criteria, and weights. Changes apply to future
              evaluations only.
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

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={onSave}>
          <Stack spacing={3}>
            <TextField
              label="Title"
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
              select
              label="Course"
              name="course_id"
              value={form.course_id}
              onChange={onChange}
              required
              fullWidth
              helperText="A rubric must be tied to a course."
            >
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </MenuItem>
              ))}
            </TextField>

            <Divider />

            <Box>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Criteria
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total weight: <strong>{totalWeight}</strong>
                    {totalWeight !== 100 && <span> (will be normalized)</span>}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={addCriterion}
                  disabled={busy}
                >
                  Add criterion
                </Button>
              </Stack>

              <Stack spacing={2}>
                {criteria.map((c, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                        <TextField
                          label={`Criterion ${i + 1} name`}
                          value={c.name}
                          onChange={(e) => updateCriterion(i, "name", e.target.value)}
                          required
                          fullWidth
                          size="small"
                        />
                        {criteria.length > 1 && (
                          <Tooltip title="Remove criterion">
                            <IconButton
                              onClick={() => removeCriterion(i)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>

                      <TextField
                        label="Description"
                        value={c.description}
                        onChange={(e) => updateCriterion(i, "description", e.target.value)}
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                      />

                      <Box>
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Weight
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {c.weight}
                          </Typography>
                        </Stack>
                        <Slider
                          value={Number(c.weight) || 0}
                          onChange={(_, v) => updateCriterion(i, "weight", v)}
                          min={0}
                          max={100}
                          step={5}
                          marks={[
                            { value: 0, label: "0" },
                            { value: 50, label: "50" },
                            { value: 100, label: "100" },
                          ]}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !form.title || !form.course_id || criteria.length === 0}
                startIcon={
                  busy ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />
                }
              >
                {busy ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/rubrics")}
                disabled={busy}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete this rubric?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This cannot be undone. Submissions that were already evaluated
            against this rubric keep their scores (the evaluation stores a
            snapshot of the rubric at grading time).
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
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}