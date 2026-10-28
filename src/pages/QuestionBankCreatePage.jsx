// src/pages/QuestionBankCreatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert,
  MenuItem, CircularProgress, Breadcrumbs, Link as MuiLink,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { listMyCourses } from "../api/lecturer";
import { api } from "../api/client";

export default function QuestionBankCreatePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [form, setForm] = useState({
    course_id: "",
    title: "",
    description: "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Load lecturer's courses
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
      .finally(() => setLoadingCourses(false));
  }, []);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.post("/question-banks/", {
        course_id: Number(form.course_id),
        title: form.title,
        description: form.description,
      });
      navigate("/dashboard");
    } catch (err) {
      const body = err?.response?.data;
      if (typeof body === "string") {
        setError(body);
      } else if (body?.detail) {
        setError(body.detail);
      } else if (body && typeof body === "object") {
        const msg = Object.entries(body)
          .map(
            ([field, errs]) =>
              `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`
          )
          .join(" · ");
        setError(msg || "Failed to create question bank.");
      } else {
        setError("Failed to create question bank.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          color="inherit"
        >
          Dashboard
        </MuiLink>
        <Typography color="text.primary">New question bank</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create a question bank
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Group related questions under a course. You can add questions after
          creating the bank.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <TextField
              select
              label="Course"
              name="course_id"
              value={form.course_id}
              onChange={onChange}
              required
              fullWidth
              disabled={loadingCourses}
              helperText={
                loadingCourses
                  ? "Loading courses…"
                  : courses.length === 0
                  ? "You have no courses. Create one first."
                  : "Which course does this bank belong to?"
              }
            >
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Title"
              name="title"
              value={form.title}
              onChange={onChange}
              required
              fullWidth
              placeholder="e.g. CS301 Midterm Bank"
            />

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={onChange}
              multiline
              minRows={3}
              fullWidth
              placeholder="Optional notes about this bank…"
            />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !form.course_id || !form.title}
                startIcon={
                  busy ? <CircularProgress size={18} color="inherit" /> : null
                }
              >
                {busy ? "Creating…" : "Create bank"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/dashboard")}
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