// src/pages/LecturerDashboardPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, Chip, Button, Divider,
  Avatar, Skeleton, Alert, alpha, useTheme, LinearProgress,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useAuth } from "../context/AuthContext";
import { getLecturerDashboard } from "../api/lecturer";
import { CATEGORY_STYLES } from "../theme";

function StatCard({ icon: Icon, label, value, color, onClick }) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        cursor: onClick ? "pointer" : "default",
        transition: theme.transitions.create(["border-color", "transform"]),
        ...(onClick && {
          "&:hover": {
            borderColor: alpha(color, 0.5),
            transform: "translateY(-2px)",
          },
        }),
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: alpha(color, 0.12),
            color,
            flexShrink: 0,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block", fontSize: 11 }}
          >
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  const theme = useTheme();
  return (
    <Button
      onClick={onClick}
      variant="outlined"
      startIcon={<Icon />}
      fullWidth
      sx={{
        justifyContent: "flex-start",
        py: 1.2,
        px: 2,
        textTransform: "none",
        fontWeight: 500,
        borderColor: theme.palette.divider,
        color: "text.primary",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      {label}
    </Button>
  );
}

function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton width="40%" height={40} />
      <Skeleton width="60%" height={24} sx={{ mb: 3 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} variant="rounded" height={80} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={200} />
    </Box>
  );
}

export default function LecturerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLecturerDashboard()
      .then(setData)
      .catch((err) =>
        setError(err?.response?.data?.error || "Failed to load dashboard.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { stats, recent_documents, recent_exams, pending_submissions } = data;
  const firstName = user?.first_name || user?.username || "Lecturer";

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Welcome back, {firstName} 👋
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Here's what's happening with your courses today.
        </Typography>
      </Box>

      {/* Stats row — 5 cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            sm: "1fr 1fr 1fr",
            md: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          icon={SchoolRoundedIcon}
          label="Courses"
          value={stats.courses}
          color="#1976d2"
          onClick={() => navigate("/courses")}
        />
        <StatCard
          icon={LibraryBooksRoundedIcon}
          label="Question banks"
          value={stats.question_banks}
          color="#0891b2"
          onClick={() => navigate("/question-banks")}
        />
        <StatCard
          icon={DescriptionOutlinedIcon}
          label="Documents"
          value={stats.documents}
          color="#059669"
          onClick={() => navigate("/documents")}
        />
        <StatCard
          icon={AssignmentRoundedIcon}
          label="Exams"
          value={`${stats.published_exams}/${stats.exams}`}
          color="#7c3aed"
          onClick={() => navigate("/exams")}
        />
        <StatCard
          icon={PendingActionsRoundedIcon}
          label="Submissions"
          value={stats.pending_submissions}
          color="#dc2626"
          onClick={() => navigate("/submissions")}
        />
      </Box>

      {/* Two-column */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        {/* LEFT column */}
        <Stack spacing={3}>
          {/* Recent documents */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent documents
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate("/documents")}
              >
                View all
              </Button>
            </Stack>

            {recent_documents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No documents yet.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {recent_documents.map((doc, i) => {
                  const cat =
                    CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.OTHER;
                  return (
                    <Box key={doc.id}>
                      {i > 0 && <Divider />}
                      <Stack
                        direction="row"
                        spacing={2}
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        sx={{
                          alignItems: "center",
                          py: 1.5,
                          px: 1,
                          borderRadius: 1,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            placeItems: "center",
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: alpha(cat.color, 0.1),
                            color: cat.color,
                            flexShrink: 0,
                          }}
                        >
                          <DescriptionOutlinedIcon fontSize="small" />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: 500 }}
                          >
                            {doc.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {new Date(doc.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={cat.label}
                          sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: alpha(cat.color, 0.1),
                            color: cat.color,
                          }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* Recent exams */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent exams
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate("/exams")}
              >
                View all
              </Button>
            </Stack>

            {recent_exams.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No exams yet.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {recent_exams.map((exam, i) => (
                  <Box key={exam.id}>
                    {i > 0 && <Divider />}
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ alignItems: "center", py: 1.5 }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ fontWeight: 500 }}
                        >
                          {exam.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {exam.course?.code} · {exam.course?.title}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={exam.is_published ? "Published" : "Draft"}
                        color={exam.is_published ? "success" : "default"}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>

        {/* RIGHT column */}
        <Stack spacing={3}>
          {/* Quick actions */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Quick actions
            </Typography>
            <Stack spacing={1}>
              <QuickAction
                icon={UploadFileRoundedIcon}
                label="Upload document"
                onClick={() => navigate("/documents")}
              />
              <QuickAction
                icon={LibraryBooksRoundedIcon}
                label="View question banks"
                onClick={() => navigate("/question-banks")}
              />
              <QuickAction
                icon={AddRoundedIcon}
                label="Create question bank"
                onClick={() => navigate("/question-banks/new")}
              />
              <QuickAction
                icon={QuizRoundedIcon}
                label="Create exam"
                onClick={() => navigate("/exams/new")}
              />
              <QuickAction
                icon={FactCheckRoundedIcon}
                label="Create rubric"
                onClick={() => navigate("/rubrics/new")}
              />
            </Stack>
          </Paper>

          {/* AI tokens */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", mb: 1.5 }}
            >
              <AutoAwesomeRoundedIcon sx={{ color: "primary.main" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                AI tokens
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.tokens_remaining.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              remaining
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (stats.tokens_remaining / 100000) * 100)}
              sx={{ mt: 2, height: 6, borderRadius: 3 }}
            />
          </Paper>

          {/* Pending submissions */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Submissions to review
              </Typography>
              {stats.pending_submissions > 0 && (
                <Chip
                  size="small"
                  label={stats.pending_submissions}
                  color="error"
                  sx={{ height: 20, fontWeight: 600 }}
                />
              )}
            </Stack>

            {pending_submissions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                All caught up ✓
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {pending_submissions.map((sub) => (
                  <Box key={sub.id}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: 500 }}
                    >
                      {sub.document_title}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", mt: 0.5 }}
                    >
                      <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                        {sub.student?.name?.[0]?.toUpperCase() || "?"}
                      </Avatar>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {sub.student?.name}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}