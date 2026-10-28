// src/pages/CourseCreatePage.jsx
import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert,
  CircularProgress, Breadcrumbs, Link as MuiLink,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { createCourse } from "../api/courses";
import { useAuth } from "../context/AuthContext";

export default function CourseCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.role === "ADMIN";

  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    department: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createCourse({
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        department: form.department.trim(),
      });
      navigate("/courses");
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
      } else setError("Failed to create course.");
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/courses" underline="hover" color="inherit">
          Courses
        </MuiLink>
        <Typography color="text.primary">New course</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/courses")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create a course
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isAdmin
            ? "The course will be created without an instructor — assign one from the admin panel afterward."
            : "You'll be set as the instructor of this course automatically."}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Course code"
              name="code"
              value={form.code}
              onChange={onChange}
              required
              fullWidth
              placeholder="e.g. CS301"
            />
            <TextField
              label="Title"
              name="title"
              value={form.title}
              onChange={onChange}
              required
              fullWidth
              placeholder="e.g. Introduction to Machine Learning"
            />
            <TextField
              label="Department"
              name="department"
              value={form.department}
              onChange={onChange}
              fullWidth
              placeholder="e.g. Computer Science"
            />
            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={onChange}
              fullWidth
              multiline
              minRows={3}
            />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !form.code.trim() || !form.title.trim()}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {busy ? "Creating…" : "Create course"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/courses")}
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