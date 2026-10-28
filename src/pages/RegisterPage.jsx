// src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Typography,
  MenuItem, Divider, Alert, Link, CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
  role: "STUDENT",
  student_id: "",
  department: "",
  enrollment_year: new Date().getFullYear(),
  staff_id: "",
  designation: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth(); // Uses the new register function from AuthContext
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // ─── Frontend Validation ───────────────────────────────────────────
    if (form.password !== form.password_confirm) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    // Trim strings
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      payload[k] = typeof v === "string" ? v.trim() : v;
    });

    // Drop irrelevant fields for the chosen role
    if (payload.role === "STUDENT") {
      delete payload.staff_id;
      delete payload.designation;
    } else {
      delete payload.student_id;
      delete payload.enrollment_year;
    }

    try {
      // This calls apiRegister and updates the AuthContext user state
      await register(payload);
      
      // Navigate to dashboard. 
      // The ProtectedRoute will now see `user` is populated and let them in.
      navigate("/", { replace: true });
    } catch (err) {
      const body = err.response?.data;
      
      // Format error messages cleanly (handles both detail and field-level errors)
      let errorMessage = "Registration failed. Please try again.";
      if (typeof body === "string") {
        errorMessage = body;
      } else if (body?.detail) {
        errorMessage = body.detail;
      } else if (body && typeof body === "object") {
        errorMessage = Object.entries(body)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" · ");
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isStudent = form.role === "STUDENT";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 520 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join CampusOS as a student or lecturer
          </Typography>

          <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
            <TextField
              select
              label="I am a"
              name="role"
              value={form.role}
              onChange={onChange}
              fullWidth
              disabled={loading}
            >
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="LECTURER">Lecturer</MenuItem>
            </TextField>

            <Divider />

            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={onChange}
              required
              fullWidth
              autoComplete="username"
              disabled={loading}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              fullWidth
              autoComplete="email"
              disabled={loading}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="First name"
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Last name"
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                fullWidth
                disabled={loading}
              />
            </Box>

            {isStudent ? (
              <>
                <TextField
                  label="Student ID"
                  name="student_id"
                  value={form.student_id}
                  onChange={onChange}
                  placeholder="e.g. 2024-CS-001"
                  required
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={onChange}
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="Enrollment year"
                  name="enrollment_year"
                  type="number"
                  value={form.enrollment_year}
                  onChange={onChange}
                  fullWidth
                  disabled={loading}
                />
              </>
            ) : (
              <>
                <TextField
                  label="Staff ID"
                  name="staff_id"
                  value={form.staff_id}
                  onChange={onChange}
                  placeholder="e.g. STF-102"
                  required
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={onChange}
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="Designation"
                  name="designation"
                  value={form.designation}
                  onChange={onChange}
                  placeholder="e.g. Senior Lecturer"
                  fullWidth
                  disabled={loading}
                />
              </>
            )}

            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              fullWidth
              helperText="Minimum 8 characters"
              autoComplete="new-password"
              disabled={loading}
            />

            <TextField
              label="Confirm password"
              name="password_confirm"
              type="password"
              value={form.password_confirm}
              onChange={onChange}
              required
              fullWidth
              autoComplete="new-password"
              disabled={loading}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Create account"}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Already have an account?{" "}
              <Link component={RouterLink} to="/login">
                Log in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
