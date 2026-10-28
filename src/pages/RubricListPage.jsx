// src/pages/RubricListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Stack, Chip, Alert,
  Skeleton, IconButton, Tooltip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { listRubrics } from "../api/rubrics";

export default function RubricListPage() {
  const navigate = useNavigate();
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listRubrics()
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.results || [];
        setRubrics(rows);
      })
      .catch(() => setError("Failed to load rubrics."))
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
            Rubrics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Define grading criteria for research submissions and essays.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate("/rubrics/new")}
        >
          Create rubric
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rounded" height={80} />
          ))}
        </Stack>
      ) : rubrics.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <FactCheckRoundedIcon
            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary">
            No rubrics yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 3 }}
          >
            Create your first rubric to start evaluating student work.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/rubrics/new")}
          >
            Create rubric
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rubrics.map((r) => {
            const criteriaCount = Array.isArray(r.criteria)
              ? r.criteria.length
              : 0;
            return (
              <Paper
                key={r.id}
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
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600 }}
                        noWrap
                      >
                        {r.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${criteriaCount} criteria`}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ color: "text.secondary" }}
                    >
                      {r.course && (
                        <Typography variant="caption">
                          {r.course.code} — {r.course.title}
                        </Typography>
                      )}
                      {r.description && (
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ maxWidth: 400 }}
                        >
                          {r.description}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Tooltip title="Edit rubric">
                    <IconButton
                      onClick={() => navigate(`/rubrics/${r.id}`)}
                      size="small"
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}