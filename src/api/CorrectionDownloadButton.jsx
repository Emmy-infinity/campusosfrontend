// src/components/CorrectionDownloadButton.jsx
import { useEffect, useRef, useState } from "react";
import {
  Button, CircularProgress, Tooltip, Alert,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import {
  requestCorrection, getCorrectionStatus,
} from "../api/corrections";

const POLL_MS = 2500;
const MAX_POLLS = 40;   // ~100 s

export default function CorrectionDownloadButton({
  submissionId,
  hasEvaluation,
  size = "small",
  variant = "outlined",
}) {
  const [state, setState] = useState("idle");   // idle | requesting | polling | ready | error
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const pollsRef = useRef(0);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // If a READY report already exists, we don't know until the user
  // clicks. That's fine — one click returns it instantly.
  const startPolling = (submissionId) => {
    pollsRef.current = 0;
    setState("polling");

    const tick = async () => {
      pollsRef.current += 1;
      try {
        const data = await getCorrectionStatus(submissionId);
        if (data.status === "READY" && data.file_url) {
          setUrl(data.file_url);
          setState("ready");
          return;
        }
        if (data.status === "FAILED") {
          setError(data.error || "PDF generation failed.");
          setState("error");
          return;
        }
        if (pollsRef.current >= MAX_POLLS) {
          setError("Timed out waiting for the PDF. Try again.");
          setState("error");
          return;
        }
        timerRef.current = setTimeout(tick, POLL_MS);
      } catch (e) {
        if (e?.response?.status === 404) {
          // Report row was never created — treat as failure.
          setError("Correction report not found.");
          setState("error");
          return;
        }
        setError(e?.response?.data?.error || "Could not check report status.");
        setState("error");
      }
    };

    tick();
  };

  const handleClick = async () => {
    setError(null);
    setState("requesting");
    try {
      const data = await requestCorrection(submissionId);
      if (data.file_url && data.status === "READY") {
        // Already generated — open immediately.
        setUrl(data.file_url);
        setState("ready");
        return;
      }
      // 202 → poll until READY
      startPolling(submissionId);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 202) {
        startPolling(submissionId);
        return;
      }
      setError(e?.response?.data?.error || "Could not request a PDF.");
      setState("error");
    }
  };

  const disabled = !hasEvaluation || state === "requesting" || state === "polling";

  const tooltip = !hasEvaluation
    ? "AI evaluation is required before a correction PDF can be generated."
    : state === "ready"
    ? "Open the correction PDF"
    : "Generate a correction PDF";

  if (state === "ready" && url) {
    return (
      <Tooltip title="Open the correction PDF">
        <Button
          size={size}
          variant="contained"
          color="success"
          startIcon={<DownloadRoundedIcon />}
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Download PDF
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title={tooltip}>
        <span>
          <Button
            size={size}
            variant={variant}
            disabled={disabled}
            startIcon={
              state === "requesting" || state === "polling"
                ? <CircularProgress size={16} color="inherit" />
                : <PictureAsPdfRoundedIcon />
            }
            onClick={handleClick}
          >
            {state === "requesting"
              ? "Requesting…"
              : state === "polling"
              ? "Generating…"
              : state === "error"
              ? "Retry PDF"
              : "Correction PDF"}
          </Button>
        </span>
      </Tooltip>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 1, py: 0 }}
          onClose={() => { setError(null); setState("idle"); }}
        >
          {error}
        </Alert>
      )}
    </>
  );
}