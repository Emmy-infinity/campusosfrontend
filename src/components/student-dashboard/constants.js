// src/components/student-dashboard/constants.js

export const STATUS_STYLES = {
  PENDING:   { label: "Pending",   color: "#dc2626" },
  EVALUATED: { label: "Evaluated", color: "#d97706" },
  REVIEWED:  { label: "Reviewed",  color: "#059669" },
};

export const EXAM_STATUS_STYLES = {
  not_started: { label: "Not started", color: "#1976d2" },
  in_progress: { label: "In progress", color: "#d97706" },
};

export const ATTEMPT_STATUS_STYLES = {
  IN_PROGRESS: { label: "In progress", color: "#d97706" },
  SUBMITTED:   { label: "Submitted",   color: "#1976d2" },
  GRADED:      { label: "Graded",      color: "#059669" },
};

export function scoreColor(pct) {
  if (pct == null) return "#6b7280";
  if (pct >= 75) return "#059669";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
}