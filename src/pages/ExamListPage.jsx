// src/pages/ExamListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Stack, Chip, Divider,
  Alert, Skeleton, IconButton, Tooltip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import { listMyExams } from "../api/lecturer";

export default function ExamListPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listMyExams()
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.results || [];
        setExams(rows);
      })
      .catch(() => setError("Failed to load exams."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Exams
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Build exams from your question banks and publish them to students.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate("/exams/new")}
        >
          Create exam
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rounded" height={80} />
          ))}
        </Stack>
      ) : exams.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <AssignmentRoundedIcon
            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary">
            No exams yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 3 }}
          >
            Create your first exam to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/exams/new")}
          >
            Create exam
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {exams.map((exam) => (
            <Paper
              key={exam.id}
              variant="outlined"
              sx={{
                p: 2.5,
                transition: "border-color 0.15s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: "center", gap: 2, flexWrap: "wrap" }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", mb: 0.5 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                      {exam.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={exam.is_published ? "Published" : "Draft"}
                      color={exam.is_published ? "success" : "default"}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ color: "text.secondary" }}
                  >
                    <Typography variant="caption">
                      {exam.course?.code} — {exam.course?.title}
                    </Typography>
                    <Typography variant="caption">
                      {exam.duration_minutes} min
                    </Typography>
                    {exam.total_marks != null && (
                      <Typography variant="caption">
                        {exam.total_marks} marks
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Tooltip title="Edit exam">
                  <IconButton
                    onClick={() => navigate(`/exams/${exam.id}`)}
                    size="small"
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}