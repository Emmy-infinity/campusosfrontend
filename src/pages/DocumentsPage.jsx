import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Stack, Chip, IconButton, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listDocuments, deleteDocument } from "../api/documents";
import { requestHighlight } from "../api/ai";
import { usePollTask } from "../hooks/usePollTask";
import DocumentUploadDialog from "./DocumentUploadDialog";

const CATEGORY_COLORS = {
  NOTE: "default", QUESTION_BANK: "primary", SOLUTION_BANK: "secondary",
  RESEARCH: "success", PROPOSAL: "warning", OTHER: "default",
};

export default function DocumentsPage({ onTokensChanged }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busyHighlightId, setBusyHighlightId] = useState(null);

  const poll = usePollTask(2000);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listDocuments();
      setDocs(Array.isArray(data) ? data : data.results || []);
      setError(null);
    } catch (e) {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // When a highlight task finishes, refresh the doc list and balance.
  useEffect(() => {
    if (poll.result?.state === "SUCCESS") {
      setBusyHighlightId(null);
      onTokensChanged?.();
    }
    if (poll.error) {
      setBusyHighlightId(null);
      setError(poll.error);
    }
  }, [poll.result, poll.error, onTokensChanged]);

  const handleHighlight = async (doc) => {
    setError(null);
    setBusyHighlightId(doc.id);
    try {
      const { task_id } = await requestHighlight(doc.id);
      poll.setTaskId(task_id);
    } catch (e) {
      setBusyHighlightId(null);
      const data = e?.response?.data;
      setError(data?.error || "Could not start highlighting.");
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await deleteDocument(doc.id);
      refresh();
    } catch {
      setError("Delete failed.");
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload notes, question banks, or research papers. Run AI highlighting on any extracted text.
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} sx={{ ml: "auto" }}
          onClick={() => setUploadOpen(true)}
        >
          Upload
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {poll.state && poll.state !== "SUCCESS" && poll.state !== "FAILURE" && (
        <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
          AI highlighting is running ({poll.state.toLowerCase()})…
        </Alert>
      )}

      <Paper sx={{ border: 1, borderColor: "divider" }}>
        {loading ? (
          <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : docs.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <UploadFileIcon sx={{ fontSize: 56, color: "text.disabled" }} />
            <Typography variant="h6" sx={{ mt: 1 }}>No documents yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload your first document to get started.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => setUploadOpen(true)}>
              Upload document
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Visibility</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography
                        component={RouterLink} to={`/documents/${doc.id}`}
                        sx={{ color: "primary.main", textDecoration: "none", fontWeight: 500 }}
                      >
                        {doc.title}
                      </Typography>
                      {doc.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {doc.description.slice(0, 100)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={doc.category}
                            color={CATEGORY_COLORS[doc.category] || "default"} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{doc.visibility}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="AI highlight">
                        <span>
                          <IconButton
                            color="primary"
                            disabled={busyHighlightId === doc.id}
                            onClick={() => handleHighlight(doc)}
                          >
                            {busyHighlightId === doc.id
                              ? <CircularProgress size={20} />
                              : <AutoAwesomeIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      {user && (user.role === "ADMIN" || doc.uploaded_by?.id === user.id) && (
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(doc)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { refresh(); onTokensChanged?.(); }}
      />
    </>
  );
}