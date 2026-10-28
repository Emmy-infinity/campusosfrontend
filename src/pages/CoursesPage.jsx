// src/pages/CoursesPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, Chip, Alert, Skeleton, Avatar,
  Button, alpha,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useAuth } from "../context/AuthContext";
import { listCourses } from "../api/courses";
import { getStudentDashboard } from "../api/student";

export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLecturer = user?.role === "LECTURER" || user?.is_superuser;
  const isAdmin = user?.is_superuser || user?.role === "ADMIN";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetcher = isLecturer
      ? listCourses().then((data) =>
          Array.isArray(data) ? data : data.results || []
        )
      : getStudentDashboard().then((d) =>
          (d.courses || []).map((c) => ({
            id: c.course?.id,
            code: c.course?.code,
            title: c.course?.title,
            department: c.course?.department,
            lecturer_name: c.lecturer_name,
            semester: c.semester,
          }))
        );

    fetcher
      .then((rows) => { if (!cancelled) setCourses(rows); })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.error || "Failed to load courses.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isLecturer]);

  if (loading) return <Skeleton variant="rounded" height={300} />;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 2 }}
      >
        Back to dashboard
      </Button>

      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <SchoolRoundedIcon sx={{ color: "primary.main" }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {isLecturer ? "My courses" : "Enrolled courses"}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isLecturer
              ? "Courses you're teaching this semester."
              : "Courses you're currently enrolled in."}
          </Typography>
        </Box>
        {(isLecturer || isAdmin) && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/courses/new")}
          >
            Create course
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {courses.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <SchoolRoundedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="h6" sx={{ mt: 1 }}>No courses yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isLecturer
              ? "Create your first course to get started."
              : "You aren't enrolled in any courses yet."}
          </Typography>
          {(isLecturer || isAdmin) && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate("/courses/new")}
            >
              Create course
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {courses.map((c) => (
            <Paper
              key={c.id}
              variant="outlined"
              onClick={() => navigate(`/courses/${c.id}`)}
              sx={{
                p: 2.5,
                cursor: "pointer",
                transition: "border-color 0.15s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar
                  sx={{
                    width: 48, height: 48, fontSize: 16, fontWeight: 700,
                    bgcolor: alpha("#1976d2", 0.12), color: "#1976d2",
                  }}
                >
                  {c.code?.[0] || "?"}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {c.code} — {c.title}
                    </Typography>
                    {c.department && (
                      <Chip size="small" label={c.department} sx={{ height: 20, fontSize: 11 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {isLecturer
                      ? (c.semester ? `Semester: ${c.semester}` : "—")
                      : (c.lecturer_name ? `Lecturer: ${c.lecturer_name}` : "No lecturer")}
                    {!isLecturer && c.semester ? ` · ${c.semester}` : ""}
                  </Typography>
                </Box>
                <ArrowForwardRoundedIcon sx={{ color: "text.disabled" }} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}