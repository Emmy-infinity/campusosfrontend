// src/theme.js
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#7c4dff" },
    background: { default: "#f5f7fa" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { defaultProps: { elevation: 0 } },
  },
});

// ─── Category styling (used in search UI) ──────────────────────────
// Maps a Document.category value to a friendly label + brand color.
export const CATEGORY_STYLES = {
  NOTE: { label: "Note", color: "#1976d2" },              // primary blue
  QUESTION_BANK: { label: "Question Bank", color: "#7c4dff" },  // secondary purple
  SOLUTION_BANK: { label: "Solution Bank", color: "#059669" },  // green
  RESEARCH: { label: "Research", color: "#dc2626" },      // red
  PROPOSAL: { label: "Proposal", color: "#ea580c" },      // orange
  OTHER: { label: "Other", color: "#64748b" },            // gray
};