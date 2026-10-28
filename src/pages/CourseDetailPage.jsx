// src/pages/CourseDetailPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, Button, Alert, Skeleton, Divider,
  Chip, IconButton, Tooltip, TextField, List, ListItemButton,
  ListItemText, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, InputAdornment, CircularProgress, alpha,
  Breadcrumbs, Link as MuiLink,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import {
  getCourse, updateCourse, deleteCourse,
  listEnrollments, createEnrollment, deleteEnrollment,
  searchAvailableStudents,
} from "../api/courses";
import { useAuth } from "../context/AuthContext";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.role === "ADMIN";
  const isLecturer = user?.role === "LECTURER";
  const isStudent = user?.role === "STUDENT";

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    code: "", title: "", department: "", description: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);

  // Enrollment
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([
        getCourse(id),
        listEnrollments({ course: id }),
      ]);
      setCourse(c);
      const rows = Array.isArray(e) ? e : e.results || [];
      setEnrollments(rows);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Debounced student search
  useEffect(() => {
    if (!enrollOpen) return;
    let alive = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchAvailableStudents(id, searchQ, 25);
        if (alive) setCandidates(rows);
      } catch {
        if (alive) setCandidates([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [enrollOpen, searchQ, id]);

  const beginEdit = () => {
    setEditForm({
      code: course.code || "",
      title: course.title || "",
      department: course.department || "",
      description: course.description || "",
    });
    setEditing(true);
    setError(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const onSaveEdit = async () => {
    if (!editForm.code.trim() || !editForm.title.trim()) {
      setError("Course code and title are required.");
      return;
    }
    setSavingEdit(true);
    try {
      await updateCourse(id, {
        code: editForm.code.trim(),
        title: editForm.title.trim(),
        department: editForm.department.trim(),
        description: editForm.description.trim(),
      });
      setEditing(false);
      await load();
    } catch (e) {
      const body = e?.response?.data;
      setError(
        body?.detail ||
        (body && typeof body === "object"
          ? Object.entries(body)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : "Failed to save changes.")
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const onDeleteCourse = async () => {
    setDeletingCourse(true);
    try {
      await deleteCourse(id);
      navigate("/courses");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to delete course.");
      setDeletingCourse(false);
      setConfirmDeleteCourse(false);
    }
  };

  const onEnroll = async (student) => {
    setEnrollingId(student.id);
    try {
      await createEnrollment({
        course_id: Number(id),
        student_id: student.id,
        semester: "",
      });
      setEnrollOpen(false);
      setSearchQ("");
      setCandidates([]);
      load();
    } catch (e) {
      const body = e?.response?.data;
      const msg =
        body?.error ||
        (body && typeof body === "object"
          ? Object.entries(body).map(([k, v]) => `${k}: ${v}`).join(" · ")
          : "Could not enroll student.");
      setError(msg);
    } finally {
      setEnrollingId(null);
    }
  };

  const onRemove = async () => {
    if (!confirmRemove) return;
    try {
      await deleteEnrollment(confirmRemove.id);
      setConfirmRemove(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to remove enrollment.");
      setConfirmRemove(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={400} />;
  if (error && !course) return <Alert severity="error">{error}</Alert>;
  if (!course) return <Alert severity="warning">Course not found.</Alert>;

  const canManage = isAdmin || (isLecturer && course.lecturer?.user?.id === user?.id);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/courses" underline="hover" color="inherit">
          Courses
        </MuiLink>
        <Typography color="text.primary">{course.code}</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/courses")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Header card ───────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        {!editing ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
            <Avatar
              sx={{
                width: 56, height: 56, fontSize: 20, fontWeight: 700,
                bgcolor: alpha("#1976d2", 0.12), color: "#1976d2",
              }}
            >
              {course.code?.[0] || "?"}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {course.code}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  — {course.title}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {course.department && (
                  <Chip size="small" label={course.department} variant="outlined" />
                )}
                {course.lecturer && (
                  <Chip
                    size="small"
                    label={`Lecturer: ${
                      course.lecturer.user?.first_name ||
                      course.lecturer.user?.username ||
                      course.lecturer.staff_id
                    }`}
                    variant="outlined"
                  />
                )}
              </Stack>
              {course.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {course.description}
                </Typography>
              )}
            </Box>
            {canManage && (
              <Stack direction="row" spacing={1}>
                <Tooltip title="View analytics">
                  <IconButton
                    onClick={() => navigate(`/courses/${id}/analytics`)}
                    size="small"
                    color="primary"
                  >
                    <InsightsRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit course">
                  <IconButton onClick={beginEdit} size="small">
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete course">
                  <IconButton
                    onClick={() => setConfirmDeleteCourse(true)}
                    size="small"
                    color="error"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Course code"
                value={editForm.code}
                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                required
                size="small"
                sx={{ maxWidth: 200 }}
                disabled={savingEdit}
              />
              <TextField
                label="Title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                required
                size="small"
                fullWidth
                disabled={savingEdit}
              />
            </Stack>
            <TextField
              label="Department"
              value={editForm.department}
              onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
              size="small"
              fullWidth
              disabled={savingEdit}
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              size="small"
              fullWidth
              multiline
              minRows={2}
              disabled={savingEdit}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={onSaveEdit}
                disabled={savingEdit || !editForm.code.trim() || !editForm.title.trim()}
                startIcon={savingEdit ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={cancelEdit}
                disabled={savingEdit}
                startIcon={<CloseRoundedIcon />}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>

      {/* ── Enrolled students (staff view) ─────────────────── */}
      {!isStudent && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Enrolled students
              </Typography>
              <Chip size="small" label={enrollments.length} />
            </Stack>
            {canManage && (
              <Button
                variant="contained"
                startIcon={<PersonAddRoundedIcon />}
                onClick={() => setEnrollOpen(true)}
              >
                Enroll student
              </Button>
            )}
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {enrollments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              No students enrolled yet.
            </Typography>
          ) : (
            <List dense disablePadding>
              {enrollments.map((e) => {
                const s = e.student || {};
                const name =
                  (s.user?.first_name || s.user?.last_name)
                    ? `${s.user.first_name || ""} ${s.user.last_name || ""}`.trim()
                    : s.user?.username || s.student_id;
                return (
                  <ListItemButton key={e.id} sx={{ borderRadius: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 12 }}>
                      {name?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                    <ListItemText
                      primary={name}
                      secondary={`${s.student_id || ""}${e.semester ? ` · ${e.semester}` : ""}`}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                    {canManage && (
                      <Tooltip title="Remove from course">
                        <IconButton
                          size="small"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setConfirmRemove(e);
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Paper>
      )}

      {/* ── Student enrollment status ──────────────────────── */}
      {isStudent && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          {enrollments.length > 0 ? (
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <CheckCircleRoundedIcon sx={{ color: "success.main" }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    You're enrolled
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {enrollments[0].semester ? `Semester: ${enrollments[0].semester}` : "Active enrollment"}
                  </Typography>
                </Box>
              </Stack>
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => setConfirmRemove(enrollments[0])}
              >
                Drop this course
              </Button>
            </Stack>
          ) : (
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Not enrolled
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enroll to access course materials and exams.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PersonAddRoundedIcon />}
                onClick={async () => {
                  try {
                    await createEnrollment({ course_id: Number(id), semester: "" });
                    load();
                  } catch (e) {
                    const body = e?.response?.data;
                    setError(body?.error || "Could not enroll in this course.");
                  }
                }}
              >
                Enroll in this course
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      {/* ── Enroll dialog ──────────────────────────────────── */}
      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Enroll a student</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, ID, or email…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searching
                    ? <CircularProgress size={16} thickness={5} />
                    : <SearchRoundedIcon fontSize="small" />}
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 2 }}>
            {candidates.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                {searching ? "Searching…" : "No matching students."}
              </Typography>
            ) : (
              <List dense disablePadding>
                {candidates.map((s) => (
                  <ListItemButton
                    key={s.id}
                    disabled={enrollingId === s.id}
                    onClick={() => onEnroll(s)}
                    sx={{ borderRadius: 1 }}
                  >
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 12 }}>
                      {s.name?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                    <ListItemText
                      primary={s.name}
                      secondary={`${s.student_id} · ${s.email}`}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                    {enrollingId === s.id && <CircularProgress size={16} />}
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── Remove enrollment confirm ─────────────────────── */}
      <Dialog open={Boolean(confirmRemove)} onClose={() => setConfirmRemove(null)}>
        <DialogTitle>Remove this enrollment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will remove the enrollment record. Their submitted work and
            exam attempts are not affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={onRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete course confirm ─────────────────────────── */}
      <Dialog open={confirmDeleteCourse} onClose={() => setConfirmDeleteCourse(false)}>
        <DialogTitle>Delete this course?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will remove <strong>{course.code} — {course.title}</strong> and
            all of its enrollments. Documents, exams, question banks, and
            submissions tied to this course are set to null (they're not
            deleted).
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDeleteCourse(false)}
            disabled={deletingCourse}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onDeleteCourse}
            disabled={deletingCourse}
          >
            {deletingCourse ? "Deleting…" : "Delete course"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}