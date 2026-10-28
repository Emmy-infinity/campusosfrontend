import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Stack, Chip, Button, Divider, CircularProgress,
  Alert, IconButton, Tooltip
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DownloadIcon from "@mui/icons-material/Download";
import { getDocument } from "../api/documents";
import { requestHighlight } from "../api/ai";
import { usePollTask } from "../hooks/usePollTask";

export default function DocumentDetailPage({ onTokensChanged }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlighting, setHighlighting] = useState(false);

  const poll = usePollTask(2000);

  const load = async () => {
    setLoading(true);
    try {
      setDoc(await getDocument(id));
      setError(null);
    } catch {
      setError("Could not load document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (poll.result?.state === "SUCCESS") {
      setHighlighting(false);
      onTokensChanged?.();
      load();
    }
    if (poll.error) {
      setHighlighting(false);
      setError(poll.error);
    }
  }, [poll.result, poll.error, onTokensChanged]);

  const handleHighlight = async () => {
    setError(null);
    setHighlighting(true);
    try {
      const { task_id } = await requestHighlight(Number(id));
      poll.setTaskId(task_id);
    } catch (e) {
      setHighlighting(false);
      setError(e?.response?.data?.error || "Could not start highlighting.");
    }
  };

  if (loading) {
    return <Box sx={{ p: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }
  if (!doc) {
    return <Alert severity="error">Document not found.</Alert>;
  }

  return (
    <>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ mb: 2 }}>
        Back
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper sx={{ p: 3, border: 1, borderColor: "divider", mb: 3 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>{doc.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap">
              <Chip size="small" label={doc.category} color="primary" variant="outlined" />
              <Chip size="small" label={doc.visibility} variant="outlined" />
              {doc.course && <Chip size="small" label={doc.course.code} variant="outlined" />}
            </Stack>
            {doc.description && (
              <Typography variant="body2" color="text.secondary">{doc.description}</Typography>
            )}
          </Box>

          <Stack spacing={1}>
            <Button
              variant="contained"
              startIcon={highlighting ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleHighlight}
              disabled={highlighting}
            >
              {highlighting ? "Highlighting…" : "AI highlight"}
            </Button>
            {doc.file && (
              <Button variant="outlined" startIcon={<DownloadIcon />}
                      href={doc.file} target="_blank" rel="noreferrer">
                Download
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h6" gutterBottom>Extracted text</Typography>
        <Divider sx={{ mb: 2 }} />
        {doc.content_text ? (
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.7 }}
          >
            {doc.content_text.slice(0, 4000)}
            {doc.content_text.length > 4000 && "…"}
          </Typography>
        ) : (
          <Alert severity="info">
            No text has been extracted yet. Text extraction runs in the background after upload.
          </Alert>
        )}
      </Paper>
    </>
  );
}