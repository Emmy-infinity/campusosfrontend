// src/pages/StudentDashboardPage.jsx
import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, Button, Skeleton, Alert, alpha,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import { useAuth } from "../context/AuthContext";
import { getStudentDashboard } from "../api/student";
import { startAttempt } from "../api/attempts";

import StatCard from "../components/student-dashboard/StatCard";
import DashboardSkeleton from "../components/student-dashboard/DashboardSkeleton";
import ExamsPanel from "../components/student-dashboard/ExamsPanel";
import RecentAttemptsPanel from "../components/student-dashboard/RecentAttemptsPanel";
import RecentDocumentsPanel from "../components/student-dashboard/RecentDocumentsPanel";
import RecentSubmissionsPanel from "../components/student-dashboard/RecentSubmissionsPanel";
import QuickActionsPanel from "../components/student-dashboard/QuickActionsPanel";
import TokensPanel from "../components/student-dashboard/TokensPanel";
import MyCoursesPanel from "../components/student-dashboard/MyCoursesPanel";
import PerformanceStrip from "../components/student-dashboard/PerformanceStrip";

const ExamPerformanceCharts = lazy(() =>
  import("../components/ExamPerformanceCharts")
);

export default function StudentDashboardPage({ onTokensChanged }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyExamId, setBusyExamId] = useState(null);

  const load = () => {
    setLoading(true);
    getStudentDashboard()
      .then(setData)
      .catch((err) =>
        setError(err?.response?.data?.error || "Failed to load dashboard.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleStartExam = async (examId) => {
    setError(null);
    setBusyExamId(examId);
    try {
      const attempt = await startAttempt(examId);
      navigate(`/exams/attempt/${attempt.id}`);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not start the exam.");
      setBusyExamId(null);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error && !data) return <Alert severity="error">{error}</Alert>;

  const {
    stats, courses = [], recent_documents = [], recent_submissions = [],
    exam_performance, available_exams = [], in_progress_attempts = [],
  } = data;

  const firstName = user?.first_name || user?.username || "Student";
  const recentAttempts = exam_performance?.recent_attempts || [];
  const avgPct = exam_performance?.average_percentage;
  const bestPct = exam_performance?.best_percentage;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Welcome back, {firstName} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track your research submissions, exams, and course progress.
        </Typography>
      </Box>

      {/* ── Top stats ─────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2, mb: 4,
        }}
      >
        <StatCard
          icon={SchoolRoundedIcon}
          label="Courses"
          value={stats.enrolled_courses}
          color="#1976d2"
          onClick={() => navigate("/courses")}
        />
        <StatCard
          icon={DescriptionOutlinedIcon}
          label="Documents"
          value={stats.documents}
          color="#059669"
          onClick={() => navigate("/documents")}
        />
        <StatCard
          icon={AssignmentTurnedInRoundedIcon}
          label="Reviewed"
          value={`${stats.reviewed}/${stats.submissions}`}
          color="#7c3aed"
          onClick={() => navigate("/submissions")}
        />
        <StatCard
          icon={PendingActionsRoundedIcon}
          label="Pending"
          value={stats.pending_evaluation}
          color="#dc2626"
          onClick={() => navigate("/submissions")}
        />
      </Box>

      {/* ── Performance strip ─────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <PerformanceStrip
          avgPct={avgPct}
          bestPct={bestPct}
          graded={stats.exams_graded}
          attempted={stats.exams_attempted}
        />
      </Box>

      {/* ── Exams panel ───────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <ExamsPanel
          availableExams={available_exams}
          inProgress={in_progress_attempts}
          onStart={handleStartExam}
          busyExamId={busyExamId}
        />
      </Box>

      {/* ── Charts ────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Suspense fallback={<Skeleton variant="rounded" height={280} />}>
          <ExamPerformanceCharts perf={exam_performance} />
        </Suspense>
      </Box>

      {/* ── Two-column lower section ──────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        <Stack spacing={3}>
          <RecentAttemptsPanel attempts={recentAttempts} />
          <RecentSubmissionsPanel submissions={recent_submissions} />
          <RecentDocumentsPanel documents={recent_documents} />
        </Stack>

        <Stack spacing={3}>
          <QuickActionsPanel />
          <TokensPanel tokensRemaining={stats.tokens_remaining} />
          <MyCoursesPanel courses={courses} />
        </Stack>
      </Box>
    </Box>
  );
}