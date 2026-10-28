// src/pages/HomePage.jsx
import { useAuth } from "../context/AuthContext";
import LecturerDashboardPage from "./LecturerDashboardPage";
import StudentDashboardPage from "./StudentDashboardPage";

export default function HomePage({ tokensRefresh, onTokensChanged }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Lecturers and admins land on the lecturer dashboard
  if (user?.role === "LECTURER" || user?.is_superuser) {
    return <LecturerDashboardPage onTokensChanged={onTokensChanged} />;
  }

  // Students land on their own dashboard
  return <StudentDashboardPage onTokensChanged={onTokensChanged} />;
}