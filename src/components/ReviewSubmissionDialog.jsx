// src/components/ReviewSubmissionDialog.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Stack, Chip, Button, Alert, Divider,
  TextField, CircularProgress, Skeleton, Tooltip,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  getSubmission,
  approveSubmission,
  unapproveSubmission,
  saveSubmissionComments,
} from "../api/submissions";
import { requestCorrection } from "../api/corrections";

/**
 * The backend stores ai_feedback as an OBJECT keyed by criterion name:
 *   {
 *     "Criterion 4 — Methodology": { status, page, paragraph, issue, suggestion },
 *     "Criterion 2 — Introduction": { ... }
 *   }
 *
 * Older revisions stored it as an ARRAY of {name, status, ...}. This
 * function normalizes both shapes into a flat array the UI can render.
 */
function extractCriteria(aiFeedback) {
  if (!aiFeedback || typeof aiFeedback !== "object") return [];

  // Shape 1: already an array
  if (Array.isArray(aiFeedback)) return aiFeedback;

  // Shape 2: object keyed by criterion name — the CURRENT backend shape
  const looksLikeCriteriaMap = Object.entries(aiFeedback).some(
    ([key, value]) =>
      typeof value === "object" &&
      value !== null &&
      (value.status != null ||
        value.issue != null ||
        value.suggestion != null ||
        key.toLowerCase().includes("criterion"))
  );
  if (looksLikeCriteriaMap) {
    return Object.entries(aiFeedback).map(([name, details]) => ({
      name,
      ...(typeof details === "object" && details !== null ? details : {}),
    }));
  }

  // Shape 3: { criteria: [...] } or { findings: [...] } etc.
  const candidates = [
    aiFeedback.criteria,
    aiFeedback.findings,
    aiFeedback.results,
    aiFeedback.evaluation,
    aiFeedback.feedback?.criteria,
    aiFeedback.feedback?.findings,
    aiFeedback.data?.criteria,
    aiFeedback.data?.findings,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }

  return [];
}

/**
 * Build a human-readable citation from the criterion object. The backend
 * stores `page` and `paragraph` as separate numeric fields, not as a
 * combined `citation` string.
 */
function buildCitation(item) {
  if (item.citation) return item.citation;
  if (item.location) return item.location;
  if (item.page_reference) return item.page_reference;

  const page = item.page ?? item.page_number;
  const paragraph = item.paragraph;

  if (page != null && paragraph != null) {
    return `Page ${page}, Paragraph ${paragraph}`;
  }
  if (page != null) return `Page ${page}`;
  if (paragraph != null) return `Paragraph ${paragraph}`;
  return null;
}

function CriterionRow({ index, item }) {
  const passed =
    item.status === "PASS" ||
    item.passed === true ||
    item.result === "PASS" ||
    item.verdict === "PASS";
  const color = passed ? "success" : "error";
  const Icon = passed ? CheckCircleRoundedIcon : CancelRoundedIcon;

  const name = item.name || item.criterion || item.title || `Criterion ${index + 1}`;
  const score =
    item.score != null
      ? item.score
      : item.marks_awarded != null
      ? item.marks_awarded
      : null;
  const maxScore =
    item.max_score != null
      ? item.max_score
      : item.marks_total != null
      ? item.marks_total
      : null;

  const citation = buildCitation(item);
  const issue = item.issue || item.problem || item.finding;
  const suggestion = item.suggestion || item.recommendation || item.fix;

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: passed ? "#f0fdf4" : "#fef2f2",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}>
        <Icon color={color} fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Chip
          size="small"
          label={passed ? "PASS" : "FAIL"}
          color={color}
          sx={{ height: 20, fontSize: 11 }}
        />
        {score != null && (
          <Chip
            size="small"
            label={maxScore != null ? `${score} / ${maxScore}` : `${score}`}
            variant="outlined"
            sx={{ height: 20, fontSize: 11 }}
          />
        )}
      </Stack>

      {citation && citation !== "Location not identified" && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          <strong>Location:</strong> {citation}
        </Typography>
      )}

      {issue && (
        <Typography variant="body2" sx={{ mb: 0.75 }}>
          <strong>Issue:</strong> {issue}
        </Typography>
      )}

      {suggestion && (
        <Typography variant="body2" color="text.secondary">
          <strong>Suggestion:</strong> {suggestion}
        </Typography>
      )}
    </Box>
  );
}

export default function ReviewSubmissionDialog({
  submissionId,
  open,
  onClose,
  onApproved,
}) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState("");
  const [correctionUrl, setCorrectionUrl] = useState(null);
  const [correctionBusy, setCorrectionBusy] = useState(false);

  useEffect(() => {
    if (!open || !submissionId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSubmission(null);
    setComments("");
    setCorrectionUrl(null);

    getSubmission(submissionId)
      .then((data) => {
        if (cancelled) return;
        setSubmission(data);
        setComments(data.lecturer_comments || "");
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.response?.data?.error ||
              e?.response?.data?.detail ||
              "Failed to load submission."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, submissionId]);

  const isEvaluated = submission?.evaluation_status === "EVALUATED";
  const isReviewed = submission?.evaluation_status === "REVIEWED";

  const commentsChanged = useMemo(
    () => (submission?.lecturer_comments || "") !== comments,
    [submission?.lecturer_comments, comments]
  );

  const handleApprove = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await approveSubmission(submissionId, comments);
      onApproved?.(updated);
      onClose?.();
    } catch (e) {
      const body = e?.response?.data;
      const msg =
        body?.error ||
        body?.detail ||
        (body && typeof body === "object"
          ? Object.entries(body)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : "Failed to approve submission.");
      setError(msg);
    } finally {
      // ALWAYS reset — this was the source of the stuck-modal bug.
      setBusy(false);
    }
  };

  const handleUnapprove = async () => {
    if (
      !window.confirm(
        "Revert this approval? The submission will go back to EVALUATED " +
          "and the student's approval badge will be removed."
      )
    )
      return;

    setBusy(true);
    setError(null);
    try {
      const updated = await unapproveSubmission(submissionId);
      setSubmission(updated);
      onApproved?.(updated);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to revert approval."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveComments = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await saveSubmissionComments(submissionId, comments);
      setSubmission(updated);
      onApproved?.(updated);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to save comments."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCorrection = async () => {
    setCorrectionBusy(true);
    setError(null);
    try {
      const data = await requestCorrection(submissionId);
      if (data?.file_url) {
        setCorrectionUrl(data.file_url);
      } else if (data?.status === "PENDING" || data?.status === "GENERATING") {
        setError("PDF is being generated. Click again in a few seconds.");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Could not generate correction PDF.");
    } finally {
      setCorrectionBusy(false);
    }
  };

  const criteria = extractCriteria(submission?.ai_feedback);

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Review submission
        {submission?.document?.title && (
          <Typography variant="body2" color="text.secondary">
            {submission.document.title}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Skeleton variant="rounded" height={300} />
        ) : !submission ? (
          <Alert severity="error">{error || "Submission not found."}</Alert>
        ) : (
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Chip
                size="small"
                label={submission.evaluation_status}
                color={isReviewed ? "success" : isEvaluated ? "warning" : "info"}
              />
              {submission.overall_score != null && (
                <Chip
                  size="small"
                  label={`Score: ${Number(submission.overall_score).toFixed(1)}%`}
                  variant="outlined"
                />
              )}
              {submission.student && (
                <Typography variant="caption" color="text.secondary">
                  {submission.student.user?.first_name}{" "}
                  {submission.student.user?.last_name}
                  {submission.student.student_id &&
                    ` (${submission.student.student_id})`}
                </Typography>
              )}
              {submission.rubric && (
                <Typography variant="caption" color="text.secondary">
                  Rubric: {submission.rubric.title}
                </Typography>
              )}
            </Stack>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                AI evaluation
              </Typography>
              {criteria.length === 0 ? (
                <>
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    No structured per-criterion feedback was found. Raw AI
                    output is shown below.
                  </Alert>
                  <Box
                    component="pre"
                    sx={{
                      p: 1.5,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      fontSize: 12,
                      maxHeight: 300,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {JSON.stringify(submission.ai_feedback, null, 2)}
                  </Box>
                </>
              ) : (
                <Stack spacing={1.5}>
                  {criteria.map((c, i) => (
                    <CriterionRow key={i} index={i} item={c} />
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  correctionBusy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <DownloadRoundedIcon />
                  )
                }
                onClick={handleCorrection}
                disabled={correctionBusy}
                href={correctionUrl || undefined}
                target={correctionUrl ? "_blank" : undefined}
                rel={correctionUrl ? "noreferrer" : undefined}
                component={correctionUrl ? "a" : "button"}
              >
                {correctionUrl
                  ? "Open correction PDF"
                  : correctionBusy
                  ? "Generating…"
                  : "Generate correction PDF"}
              </Button>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Comments for the student (optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any feedback you want to add on top of the AI's evaluation…"
                disabled={busy}
              />
              {commentsChanged && !busy && (
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  You have unsaved comment changes.
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>
          Close
        </Button>

        {isEvaluated && (
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={busy || loading}
            startIcon={
              busy ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {busy ? "Approving…" : "Approve submission"}
          </Button>
        )}

        {isReviewed && (
          <>
            {commentsChanged && (
              <Button
                variant="contained"
                onClick={handleSaveComments}
                disabled={busy}
                startIcon={
                  busy ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveRoundedIcon />
                  )
                }
              >
                {busy ? "Saving…" : "Save comments"}
              </Button>
            )}
            <Tooltip
              title={`Approved by ${
                submission?.approved_by?.username || "—"
              }`}
            >
              <Chip label="Approved" color="success" size="small" />
            </Tooltip>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleUnapprove}
              disabled={busy}
              startIcon={<UndoRoundedIcon />}
            >
              Revert approval
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}