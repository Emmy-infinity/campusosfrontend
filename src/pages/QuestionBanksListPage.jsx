// src/pages/QuestionBanksListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Stack, Chip, Button, Alert, Skeleton,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { api } from "../api/client";

export default function QuestionBanksListPage() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/question-banks/")
      .then((r) => {
        const rows = Array.isArray(r.data) ? r.data : r.data.results || [];
        setBanks(rows);
      })
      .catch((e) =>
        setError(e?.response?.data?.error || "Failed to load question banks.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton variant="rounded" height={300} />;

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Question banks</Typography>
          <Typography variant="body2" color="text.secondary">
            Group questions by course, then reuse them across exams.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate("/question-banks/new")}
        >
          Create bank
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {banks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <QuizRoundedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="h6" sx={{ mt: 1 }}>No question banks yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first bank to start adding questions.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/question-banks/new")}
          >
            Create bank
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {banks.map((b) => {
            const count = Array.isArray(b.questions) ? b.questions.length : 0;
            return (
              <Paper
                key={b.id}
                variant="outlined"
                onClick={() => navigate(`/question-banks/${b.id}`)}
                sx={{
                  p: 2.5,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", gap: 2, flexWrap: "wrap" }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                        {b.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${count} question${count === 1 ? "" : "s"}`}
                        color={count > 0 ? "primary" : "default"}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ color: "text.secondary" }}>
                      {b.course && (
                        <Typography variant="caption">
                          {b.course.code} — {b.course.title}
                        </Typography>
                      )}
                      {b.description && (
                        <Typography variant="caption" noWrap sx={{ maxWidth: 400 }}>
                          {b.description}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <ArrowForwardRoundedIcon sx={{ color: "text.disabled" }} />
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}