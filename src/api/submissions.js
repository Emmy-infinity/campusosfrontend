// src/api/submissions.js
import { api } from "./client";

export const listSubmissions = () =>
  api.get("/submissions/").then((r) => r.data);

export const createSubmission = (payload) =>
  api.post("/submissions/", payload).then((r) => r.data);

export const getSubmission = (id) =>
  api.get(`/submissions/${id}/`).then((r) => r.data);

export const evaluateSubmission = (id) =>
  api.post("/research/guidance/", { submission_id: id }).then((r) => r.data);

export const getSubmissionRoster = (courseId) =>
  api
    .get("/submissions/roster/", { params: { course_id: courseId } })
    .then((r) => r.data);

export const approveSubmission = (id, lecturer_comments = "") =>
  api
    .post(`/submissions/${id}/approve/`, { lecturer_comments })
    .then((r) => r.data);

/**
 * Revert an approved (REVIEWED) submission back to EVALUATED.
 * Backend endpoint: POST /api/submissions/<id>/unapprove/
 * Permission: only the course lecturer or the rubric author (or admin).
 */
export const unapproveSubmission = (id) =>
  api.post(`/submissions/${id}/unapprove/`).then((r) => r.data);

/**
 * Update only the lecturer comments on a submission without touching
 * the evaluation status.
 * Backend endpoint: POST /api/submissions/<id>/comments/
 * Permission: only the course lecturer or the rubric author (or admin).
 */
export const saveSubmissionComments = (id, lecturer_comments = "") =>
  api
    .post(`/submissions/${id}/comments/`, { lecturer_comments })
    .then((r) => r.data);