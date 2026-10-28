// src/pages/RubricCreatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert,
  MenuItem, CircularProgress, Breadcrumbs, Link as MuiLink,
  Divider, IconButton, Tooltip, Slider,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { listMyCourses } from "../api/lecturer";
import { createRubric } from "../api/rubrics";

const emptyCriterion = () => ({
  name: "",
  description: "",
  weight: 20,
});

export default function RubricCreatePage() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
  });

  const [criteria, setCriteria] = useState([
    emptyCriterion(),
    emptyCriterion(),
  ]);

  // ── Load courses ───────────────────────────────────────
  // Auto-select the first course so the required field is never
  // empty for a lecturer who has at least one course.
  useEffect(() => {
    listMyCourses()
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.results || [];
        setCourses(rows);
        if (rows.length > 0) {
          setForm((f) => ({ ...f, course_id: rows[0].id }));
        }
      })
      .catch(() => setError("Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Criteria management ──────────────────────────────────
  const updateCriterion = (index, key, value) => {
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c))
    );
  };

  const addCriterion = () => {
    setCriteria((prev) => [...prev, emptyCriterion()]);
  };

  const removeCriterion = (index) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute total weight
  const totalWeight = criteria.reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0
  );

  // ── Submit ───────────────────────────────────────────────
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Course is required (matches backend RubricSerializer)
    if (!form.course_id) {
      setError("Please select a course. Rubrics must be tied to a course.");
      return;
    }
    if (criteria.length === 0) {
      setError("Add at least one criterion.");
      return;
    }
    const invalid = criteria.find((c) => !c.name.trim());
    if (invalid) {
      setError("Every criterion needs a name.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        course_id: Number(form.course_id),   // ← always sent, always a number
        criteria: criteria.map((c) => ({
          name: c.name.trim(),
          description: c.description.trim(),
          weight: Number(c.weight),
        })),
      };

      await createRubric(payload);
      navigate("/rubrics");
    } catch (err) {
      const body = err?.response?.data;
      if (typeof body === "string") setError(body);
      else if (body?.detail) setError(body.detail);
      else if (body && typeof body === "object") {
        const msg = Object.entries(body)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" · ");
        setError(msg || "Failed to create rubric.");
      } else setError("Failed to create rubric.");
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

  // If the lecturer has no courses, they can't create rubrics at all.
  // Show a clear message instead of a broken form.
  if (courses.length === 0) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={RouterLink} to="/rubrics" underline="hover" color="inherit">
            Rubrics
          </MuiLink>
          <Typography color="text.primary">New rubric</Typography>
        </Breadcrumbs>

        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/rubrics")}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            You don't have any courses yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Rubrics must belong to a course. Create a course first, then come
            back to add a rubric for it.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/courses/new")}
          >
            Create a course
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component={RouterLink}
          to="/rubrics"
          underline="hover"
          color="inherit"
        >
          Rubrics
        </MuiLink>
        <Typography color="text.primary">New rubric</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/rubrics")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create a rubric
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Rubrics define the criteria used to grade research submissions.
          Each rubric belongs to one of your courses.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            {/* ── Basics ──────────────────────────────────── */}
            <TextField
              label="Title"
              name="title"
              value={form.title}
              onChange={onChange}
              required
              fullWidth
              placeholder="e.g. Research Paper Rubric"
            />

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={onChange}
              fullWidth
              multiline
              minRows={2}
              placeholder="Optional context for this rubric."
            />

            <TextField
              select
              label="Course"
              name="course_id"
              value={form.course_id}
              onChange={onChange}
              required
              fullWidth
              helperText="Which course does this rubric belong to?"
            >
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </MenuItem>
              ))}
            </TextField>

            <Divider />

            {/* ── Criteria ────────────────────────────────── */}
            <Box>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Criteria
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total weight: <strong>{totalWeight}</strong>
                    {totalWeight !== 100 && (
                      <span> (will be normalized)</span>
                    )}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={addCriterion}
                >
                  Add criterion
                </Button>
              </Stack>

              <Stack spacing={2}>
                {criteria.map((c, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{ p: 2, position: "relative" }}
                  >
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ alignItems: "flex-start" }}
                      >
                        <TextField
                          label={`Criterion ${i + 1} name`}
                          value={c.name}
                          onChange={(e) =>
                            updateCriterion(i, "name", e.target.value)
                          }
                          required
                          fullWidth
                          size="small"
                          placeholder="e.g. Clarity of argument"
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
                        onChange={(e) =>
                          updateCriterion(i, "description", e.target.value)
                        }
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        placeholder="What should the student do to earn this?"
                      />

                      <Box>
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Weight
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
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

            {/* ── Submit ──────────────────────────────────── */}
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !form.title || !form.course_id || criteria.length === 0}
                startIcon={
                  busy ? <CircularProgress size={18} color="inherit" /> : null
                }
              >
                {busy ? "Creating…" : "Create rubric"}
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
    </Box>
  );
}