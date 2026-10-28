// src/pages/MySubmissionsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Stack, Chip, Button, Alert, Skeleton,
  CircularProgress, alpha,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import { listSubmissions } from "../api/submissions";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import CorrectionDownloadButton from "../components/CorrectionDownloadButton";
import ReviewSubmissionDialog from "../components/ReviewSubmissionDialog";

const STATUS_STYLES = {
  PENDING:   { label: "Evaluating…", color: "#1976d2" },
  EVALUATED: { label: "Evaluated",   color: "#d97706" },
  REVIEWED:  { label: "Reviewed",    color: "#059669" },
};

const PENDING_POLL_MS = 4000;
const MAX_POLL_MS = 5 * 60 * 1000;

function isActivelyPending(s) {
  return s.evaluation_status === "PENDING" && !s.ai_feedback?.error;
}

function getSubmissionError(s) {
  const fb = s.ai_feedback;
  if (!fb || typeof fb !== "object" || !fb.error) return null;
  return {
    code: fb.error,
    message: fb.message || "Evaluation failed.",
    requiredTokens: fb.required_tokens,
    availableTokens: fb.available_tokens,
    shortfall: fb.shortfall,
  };
}

export default function MySubmissionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [liveBalance, setLiveBalance] = useState(null);
  const [reviewId, setReviewId] = useState(null);

  const isStudent = user?.role === "STUDENT";
  const isLecturerViewing =
    user?.role === "LECTURER" || user?.is_superuser === true;

  const fetchLiveBalance = async () => {
    try {
      const { data } = await api.get("/ai/balance/");
      setLiveBalance(data.remaining_tokens ?? 0);
    } catch {
      setLiveBalance(null);
    }
  };

  const loadSubmissions = async () => {
    try {
      const data = await listSubmissions();
      const rows = Array.isArray(data) ? data : data.results || [];
      setSubs(rows);
      return rows;
    } catch {
      setError("Failed to load submissions.");
      return [];
    }
  };

  useEffect(() => {
    Promise.all([loadSubmissions(), fetchLiveBalance()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const anyPending = subs.some(isActivelyPending);

  useEffect(() => {
    if (!anyPending) return;

    let cancelled = false;
    let timer = null;
    const startedAt = Date.now();

    const tick = async () => {
      if (Date.now() - startedAt > MAX_POLL_MS) return;
      const rows = await loadSubmissions();
      if (cancelled) return;
      if (rows.some(isActivelyPending)) {
        timer = setTimeout(tick, PENDING_POLL_MS);
      }
    };

    timer = setTimeout(tick, PENDING_POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [anyPending]);

  const handleRetry = async (submission) => {
    setError(null);
    setRetryingId(submission.id);
    try {
      await api.post(`/submissions/${submission.id}/retry-eval/`);
      setTimeout(async () => {
        await loadSubmissions();
        await fetchLiveBalance();
      }, 1200);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not retry evaluation.");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={300} />;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 2 }}
      >
        Back to dashboard
      </Button>

      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {isStudent ? "My submissions" : "Research submissions"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isStudent
              ? "Track your research evaluations and download correction reports."
              : "All submissions across your courses."}
          </Typography>
        </Box>
        {isStudent && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/submissions/new")}
          >
            New submission
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {subs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <DescriptionOutlinedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="h6" sx={{ mt: 1 }}>
            No submissions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isStudent
              ? "Upload a research PDF and submit it for AI evaluation."
              : "Students haven't submitted anything yet."}
          </Typography>
          {isStudent && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate("/submissions/new")}
            >
              Submit research
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {subs.map((s) => {
            const st = STATUS_STYLES[s.evaluation_status] || STATUS_STYLES.PENDING;
            const isPending = s.evaluation_status === "PENDING";
            const isRetrying = retryingId === s.id;
            const subError = getSubmissionError(s);
            const needsTokens = subError?.code === "insufficient_tokens";

            const required = subError?.requiredTokens ?? null;
            const available =
              liveBalance != null ? liveBalance : subError?.availableTokens ?? 0;
            const liveShortfall =
              required != null
                ? Math.max(0, required - available)
                : subError?.shortfall ?? 0;
            const readyToRetry = needsTokens && liveShortfall === 0;

            const hasEvaluation =
              s.evaluation_status === "EVALUATED" ||
              s.evaluation_status === "REVIEWED" ||
              s.overall_score != null;

            const canReview =
              isLecturerViewing &&
              (s.evaluation_status === "EVALUATED" ||
                s.evaluation_status === "REVIEWED");

            return (
              <Paper key={s.id} variant="outlined" sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center", flexWrap: "wrap" }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", mb: 0.5, flexWrap: "wrap" }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                        {s.document?.title || "Untitled"}
                      </Typography>

                      {isPending && !subError && (
                        <>
                          <Chip
                            size="small"
                            label={st.label}
                            sx={{
                              height: 20,
                              fontSize: 11,
                              bgcolor: alpha(st.color, 0.1),
                              color: st.color,
                            }}
                          />
                          <CircularProgress size={12} sx={{ color: st.color }} />
                        </>
                      )}

                      {isPending && needsTokens && !readyToRetry && (
                        <Chip
                          size="small"
                          icon={<BoltRoundedIcon />}
                          label={`Needs ${liveShortfall.toLocaleString()} more tokens`}
                          color="warning"
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      )}

                      {isPending && needsTokens && readyToRetry && (
                        <Chip
                          size="small"
                          icon={<CheckCircleRoundedIcon />}
                          label="Ready to evaluate"
                          color="success"
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      )}

                      {isPending && subError && !needsTokens && (
                        <Chip
                          size="small"
                          icon={<WarningAmberRoundedIcon />}
                          label="Evaluation failed"
                          color="error"
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      )}

                      {!isPending && (
                        <Chip
                          size="small"
                          label={st.label}
                          sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: alpha(st.color, 0.1),
                            color: st.color,
                          }}
                        />
                      )}
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ color: "text.secondary", flexWrap: "wrap" }}
                    >
                      {s.student && (
                        <Typography variant="caption">
                          {s.student.user?.first_name}{" "}
                          {s.student.user?.last_name}
                        </Typography>
                      )}
                      {s.course && (
                        <Typography variant="caption">
                          {s.course.code} — {s.course.title}
                        </Typography>
                      )}
                      {s.rubric && (
                        <Typography variant="caption">
                          Rubric: {s.rubric.title}
                        </Typography>
                      )}
                      <Typography variant="caption">
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </Typography>
                    </Stack>

                    {isPending && needsTokens && !readyToRetry && (
                      <Alert severity="warning" sx={{ mt: 1.5, py: 0.5 }}>
                        This document needs approximately{" "}
                        <strong>{required?.toLocaleString() ?? "?"} tokens</strong>{" "}
                        to evaluate. You have{" "}
                        <strong>{available.toLocaleString()}</strong>. Top up by{" "}
                        <strong>{liveShortfall.toLocaleString()}</strong> to
                        continue.
                      </Alert>
                    )}

                    {isPending && needsTokens && readyToRetry && (
                      <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
                        You now have enough tokens ({available.toLocaleString()}{" "}
                        available). Click <strong>Recheck</strong> to run the
                        evaluation.
                      </Alert>
                    )}

                    {isPending && subError && !needsTokens && (
                      <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
                        {subError.message}
                      </Alert>
                    )}
                  </Box>

                  {s.overall_score != null && (
                    <Box sx={{ textAlign: "right", mr: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {Number(s.overall_score).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        score
                      </Typography>
                    </Box>
                  )}

                  {isPending && needsTokens && !readyToRetry && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<BoltRoundedIcon />}
                        onClick={() => navigate("/tokens")}
                      >
                        Top up
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={
                          isRetrying ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <RefreshRoundedIcon />
                          )
                        }
                        disabled={isRetrying}
                        onClick={() => handleRetry(s)}
                      >
                        {isRetrying ? "Checking…" : "Recheck"}
                      </Button>
                    </>
                  )}

                  {isPending && needsTokens && readyToRetry && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={
                        isRetrying ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <RefreshRoundedIcon />
                        )
                      }
                      disabled={isRetrying}
                      onClick={() => handleRetry(s)}
                    >
                      {isRetrying ? "Rechecking…" : "Recheck"}
                    </Button>
                  )}

                  {isPending && subError && !needsTokens && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        isRetrying ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <RefreshRoundedIcon />
                        )
                      }
                      disabled={isRetrying}
                      onClick={() => handleRetry(s)}
                    >
                      {isRetrying ? "Retrying…" : "Retry"}
                    </Button>
                  )}

                  {isPending && !subError && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        isRetrying ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <RefreshRoundedIcon />
                        )
                      }
                      disabled={isRetrying}
                      onClick={() => handleRetry(s)}
                    >
                      {isRetrying ? "Retrying…" : "Retry"}
                    </Button>
                  )}

                  {canReview && (
                    <Button
                      size="small"
                      variant={
                        s.evaluation_status === "EVALUATED"
                          ? "contained"
                          : "outlined"
                      }
                      color={
                        s.evaluation_status === "EVALUATED"
                          ? "success"
                          : "primary"
                      }
                      startIcon={<RateReviewRoundedIcon />}
                      onClick={() => setReviewId(s.id)}
                    >
                      {s.evaluation_status === "EVALUATED"
                        ? "Review"
                        : "View review"}
                    </Button>
                  )}

                  <CorrectionDownloadButton
                    submissionId={s.id}
                    hasEvaluation={hasEvaluation}
                  />
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <ReviewSubmissionDialog
        submissionId={reviewId}
        open={Boolean(reviewId)}
        onClose={() => setReviewId(null)}
        onApproved={() => {
          setReviewId(null);
          loadSubmissions();
        }}
      />
    </Box>
  );
}