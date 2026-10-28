// src/api/corrections.js
import { api } from "./client";

/** Request (or fetch an existing) correction PDF for a submission. */
export const requestCorrection = (submissionId) =>
  api.post(`/submissions/${submissionId}/correction/`).then((r) => r.data);

/** Poll the newest correction report for a submission. */
export const getCorrectionStatus = (submissionId) =>
  api.get(`/submissions/${submissionId}/correction/status/`).then((r) => r.data);