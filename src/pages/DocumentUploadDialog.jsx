import { useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField,
  MenuItem, LinearProgress, Box, Typography, Alert, IconButton
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import { uploadDocument } from "../api/documents";

const CATEGORIES = [
  { value: "NOTE", label: "Note" },
  { value: "QUESTION_BANK", label: "Question Bank" },
  { value: "SOLUTION_BANK", label: "Solution Bank" },
  { value: "RESEARCH", label: "Research" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "OTHER", label: "Other" },
];

const VISIBILITIES = [
  { value: "PRIVATE", label: "Private (only me)" },
  { value: "COURSE", label: "Course (enrolled students)" },
  { value: "PUBLIC", label: "Public (all users)" },
];

export default function DocumentUploadDialog({ open, onClose, onUploaded }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("NOTE");
  const [visibility, setVisibility] = useState("COURSE");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setFile(null); setTitle(""); setDescription("");
    setCategory("NOTE"); setVisibility("COURSE");
    setProgress(0); setError(null); setBusy(false);
  };

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError("A file and a title are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const doc = await uploadDocument({
        file, title: title.trim(), description,
        category, visibility, onProgress: setProgress,
      });
      onUploaded?.(doc);
      reset();
      onClose?.();
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.file?.[0] || data?.title?.[0] || data?.error || "Upload failed.");
      setBusy(false);
    }
  };

  const handleClose = () => { if (!busy) { reset(); onClose?.(); } };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        Upload document
        <IconButton onClick={handleClose} sx={{ ml: "auto" }} disabled={busy}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            onClick={() => !busy && fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (busy) return;
              const f = e.dataTransfer.files?.[0];
              if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }
            }}
            sx={{
              border: "2px dashed", borderColor: file ? "primary.main" : "divider",
              borderRadius: 2, p: 4, textAlign: "center",
              cursor: busy ? "not-allowed" : "pointer",
              bgcolor: file ? "action.hover" : "transparent",
              transition: "all .15s ease",
            }}
          >
            <CloudUploadIcon color={file ? "primary" : "disabled"} sx={{ fontSize: 44 }} />
            <Typography variant="body1" sx={{ mt: 1 }}>
              {file ? file.name : "Click or drop a file here"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PDF, DOCX, TXT, MD, PPT, PPTX — up to 25 MB
            </Typography>
            <input ref={fileRef} type="file" hidden
                   accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                   onChange={handlePick} />
          </Box>

          {busy && <LinearProgress variant="determinate" value={progress} />}

          <TextField label="Title" value={title} fullWidth required
                     onChange={(e) => setTitle(e.target.value)} disabled={busy} />
          <TextField label="Description" value={description} fullWidth multiline rows={2}
                     onChange={(e) => setDescription(e.target.value)} disabled={busy} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Category" value={category} fullWidth
                       onChange={(e) => setCategory(e.target.value)} disabled={busy}>
              {CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
            <TextField select label="Visibility" value={visibility} fullWidth
                       onChange={(e) => setVisibility(e.target.value)} disabled={busy}>
              {VISIBILITIES.map((v) => <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>)}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleUpload} disabled={busy || !file || !title.trim()}>
          {busy ? `Uploading… ${progress}%` : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}