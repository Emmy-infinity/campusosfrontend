// src/pages/SubmissionCreatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button,
  Alert, CircularProgress, Divider, Breadcrumbs, Link as MuiLink,
  Chip,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { listDocuments } from "../api/documents";
import { listRubrics } from "../api/rubrics";
import { createSubmission } from "../api/submissions";
import { useAuth } from "../context/AuthContext";

export default function SubmissionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [documentId, setDocumentId] = useState("");
  const [rubricId, setRubricId] = useState("");

  useEffect(() => {
    Promise.all([listDocuments(), listRubrics()])
      .then(([docsData, rubricsData]) => {
        const docRows = Array.isArray(docsData) ? docsData : docsData.results || [];
        const rRows = Array.isArray(rubricsData) ? rubricsData : rubricsData.results || [];

        // Only the current user's RESEARCH / PROPOSAL documents
        const eligibleDocs = docRows.filter(
          (d) =>
            d.uploaded_by?.id === user?.id &&
            ["RESEARCH", "PROPOSAL"].includes(d.category)
        );

        // Only rubrics tied to a course are eligible — the backend
        // rejects course-less rubrics at submit time, so filtering
        // them here prevents a dead-end UX.
        const eligibleRubrics = rRows.filter((r) => r.course != null);

        setDocuments(eligibleDocs);
        setRubrics(eligibleRubrics);
      })
      .catch(() => setError("Failed to load documents or rubrics."))
      .finally(() => setLoading(false));
  }, [user]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!documentId) {
      setError("Please select a document.");
      return;
    }
    if (!rubricId) {
      setError("Please select a rubric. Your submission must be graded against one.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = {
        document_id: Number(documentId),
        rubric_id: Number(rubricId),
      };
      await createSubmission(payload);
      navigate("/submissions");
    } catch (err) {
      const body = err?.response?.data;
      if (typeof body === "string") setError(body);
      else if (body?.error) setError(body.error);
      else if (body?.detail) setError(body.detail);
      else if (body && typeof body === "object") {
        setError(
          Object.entries(body)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" · ")
        );
      } else {
        setError("Failed to create submission.");
      }
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
          Dashboard
        </MuiLink>
        <Typography color="text.primary">New research submission</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Submit research for evaluation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Pick one of your uploaded research PDFs and a rubric. The AI will
          evaluate your paper against that rubric's criteria.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {documents.length === 0 ? (
          <Alert severity="info">
            You have no eligible documents. Upload a PDF with category{" "}
            <strong>Research</strong> or <strong>Proposal</strong> first.
          </Alert>
        ) : rubrics.length === 0 ? (
          <Alert severity="info">
            No rubrics are available for your enrolled courses. Your lecturer
            must create a rubric tied to a course you're enrolled in.
          </Alert>
        ) : (
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={3}>
              <TextField
                select
                label="Document"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                required
                fullWidth
                helperText="Only your own Research/Proposal documents appear here."
              >
                {documents.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", width: "100%" }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }} noWrap>
                        {d.title}
                      </Typography>
                      <Chip size="small" label={d.category} />
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Rubric"
                value={rubricId}
                onChange={(e) => setRubricId(e.target.value)}
                required
                fullWidth
                helperText="Rubrics for the courses you're enrolled in."
              >
                {rubrics.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.title}
                    {r.course ? ` — ${r.course.code}` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <Divider />

              <Stack direction="row" spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={busy || !documentId || !rubricId}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {busy ? "Submitting…" : "Submit for evaluation"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
}