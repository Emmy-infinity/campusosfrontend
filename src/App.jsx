// src/App.jsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Auth
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Dispatchers
import HomePage from "./pages/HomePage";

// Shared
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import CoursesPage from "./pages/CoursesPage";
import CourseCreatePage from "./pages/CourseCreatePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import TokensPage from "./pages/TokensPage";                       // ← NEW

// Lecturer
import LecturerDashboardPage from "./pages/LecturerDashboardPage";
import QuestionBankCreatePage from "./pages/QuestionBankCreatePage";
import QuestionBanksListPage from "./pages/QuestionBanksListPage";
import QuestionBankDetailPage from "./pages/QuestionBankDetailPage";
import ExamListPage from "./pages/ExamListPage";
import ExamCreatePage from "./pages/ExamCreatePage";
import ExamEditPage from "./pages/ExamEditPage";
import RubricListPage from "./pages/RubricListPage";
import RubricCreatePage from "./pages/RubricCreatePage";
import RubricDetailPage from "./pages/RubricDetailPage";
import LecturerExamAnalyticsPage from "./pages/LecturerExamAnalyticsPage";
import LecturerCourseAnalyticsPage from "./pages/LecturerCourseAnalyticsPage";

// Student
import StudentExamsPage from "./pages/ExamsListPage";
import ExamTakePage from "./pages/ExamTakePage";

// Research submissions
import SubmissionCreatePage from "./pages/SubmissionCreatePage";
import MySubmissionsPage from "./pages/MySubmissionsPage";

// ────────────────────────────────────────────────────────────
// PrivateRoute — wraps children in Layout when authenticated
// ────────────────────────────────────────────────────────────
function PrivateRoute({ children, tokensRefresh, requireRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole && !user.is_superuser) {
    return <Navigate to="/" replace />;
  }
  return <Layout tokensRefresh={tokensRefresh}>{children}</Layout>;
}

// ────────────────────────────────────────────────────────────
// Exams route — dispatches by role
// ────────────────────────────────────────────────────────────
function ExamsRoute({ tokensRefresh }) {
  const { user } = useAuth();
  const isLecturer = user?.role === "LECTURER" || user?.is_superuser;
  return (
    <Layout tokensRefresh={tokensRefresh}>
      {isLecturer ? <ExamListPage /> : <StudentExamsPage />}
    </Layout>
  );
}

// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────
function AppRoutes() {
  const [tokensRefresh, setTokensRefresh] = useState(0);
  const bump = () => setTokensRefresh((n) => n + 1);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Home */}
      <Route
        path="/"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <HomePage tokensRefresh={tokensRefresh} onTokensChanged={bump} />
          </PrivateRoute>
        }
      />

      {/* Lecturer dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <LecturerDashboardPage onTokensChanged={bump} />
          </PrivateRoute>
        }
      />

      {/* ── Courses ─────────────────────────────────────────── */}
      <Route
        path="/courses"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <CoursesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/courses/new"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <CourseCreatePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <CourseDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/courses/:id/analytics"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <LecturerCourseAnalyticsPage />
          </PrivateRoute>
        }
      />

      {/* ── Exams ─────────────────────────────────────────── */}
      <Route path="/exams" element={<ExamsRoute tokensRefresh={tokensRefresh} />} />

      <Route
        path="/exams/attempt/:attemptId"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <ExamTakePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exams/new"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <ExamCreatePage />
          </PrivateRoute>
        }
      />

      {/* Edit existing exam — declared before /:id/analytics for readability */}
      <Route
        path="/exams/:id"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <ExamEditPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exams/:id/analytics"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <LecturerExamAnalyticsPage />
          </PrivateRoute>
        }
      />

      {/* ── Question banks ──────────────────────────────────── */}
      <Route
        path="/question-banks"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <QuestionBanksListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/question-banks/new"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <QuestionBankCreatePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/question-banks/:id"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <QuestionBankDetailPage />
          </PrivateRoute>
        }
      />

      {/* ── Rubrics ─────────────────────────────────────────── */}
      <Route
        path="/rubrics"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <RubricListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/rubrics/new"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <RubricCreatePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/rubrics/:id"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh} requireRole="LECTURER">
            <RubricDetailPage />
          </PrivateRoute>
        }
      />

      {/* ── Submissions ─────────────────────────────────────── */}
      <Route
        path="/submissions"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <MySubmissionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/submissions/new"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <SubmissionCreatePage />
          </PrivateRoute>
        }
      />

      {/* ── Documents ───────────────────────────────────────── */}
      <Route
        path="/documents"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <DocumentsPage onTokensChanged={bump} />
          </PrivateRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <DocumentDetailPage onTokensChanged={bump} />
          </PrivateRoute>
        }
      />

      {/* ── Tokens (Pesapal purchase flow) ─────────────────── */}
      <Route
        path="/tokens"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <TokensPage onTokensChanged={bump} />
          </PrivateRoute>
        }
      />

      {/* ── Search ──────────────────────────────────────────── */}
      <Route
        path="/search"
        element={
          <PrivateRoute tokensRefresh={tokensRefresh}>
            <SearchResultsPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}