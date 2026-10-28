import { api } from "./client";

export async function getTokenBalance() {
  const { data } = await api.get("/ai/balance/");
  return data;
}

export async function requestHighlight(documentId) {
  const { data } = await api.post("/ai/highlight/", { document_id: documentId });
  return data;
}

export async function getTaskStatus(taskId) {
  const { data } = await api.get(`/ai/tasks/${taskId}/`);
  return data;
}

export async function requestResearchGuidance(submissionId) {
  const { data } = await api.post("/research/guidance/", { submission_id: submissionId });
  return data;
}