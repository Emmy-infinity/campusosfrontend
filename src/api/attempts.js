import { api } from "./client";

export const startAttempt = (examId) =>
  api.post("/attempts/start/", { exam_id: examId }).then((r) => r.data);

export const getAttempt = (id) =>
  api.get(`/attempts/${id}/`).then((r) => r.data);

export const listAttempts = () =>
  api.get("/attempts/").then((r) => r.data);

export const saveAnswer = (attemptId, payload) =>
  api.post(`/attempts/${attemptId}/save-answer/`, payload).then((r) => r.data);

export const submitAttempt = (attemptId) =>
  api.post(`/attempts/${attemptId}/submit/`).then((r) => r.data);