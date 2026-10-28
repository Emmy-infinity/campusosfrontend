// src/api/documents.js
import { api, uploadApi } from "./client";

// ─── List ──────────────────────────────────────────────────────────
export async function listDocuments(params = {}) {
  const { data } = await api.get("/documents/", { params });
  return data;
}

// ─── Detail ────────────────────────────────────────────────────────
export async function getDocument(id) {
  const { data } = await api.get(`/documents/${id}/`);
  return data;
}

// ─── Upload ────────────────────────────────────────────────────────
export async function uploadDocument({
  file,
  title,
  description,
  courseId,
  category,
  visibility,
  onProgress,
}) {
  const form = new FormData();

  // Required fields
  form.append("file", file);
  form.append("title", title);

  // Optional fields — only append when they have a value
  if (description) form.append("description", description);
  if (courseId) form.append("course_id", courseId);
  if (category) form.append("category", category);
  if (visibility) form.append("visibility", visibility);

  // Do NOT set Content-Type — the browser adds the multipart boundary
  const { data } = await uploadApi.post("/documents/", form, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  return data;
}

// ─── Delete ────────────────────────────────────────────────────────
export async function deleteDocument(id) {
  await api.delete(`/documents/${id}/`);
}

// ─── Search (full-text, ranked, with snippets) ─────────────────────
export async function searchDocuments(params = {}) {
  // params: { q, category, visibility, course_id, uploaded_by, ordering, page }
  const { data } = await api.get("/documents/search/", { params });
  return data;   // { count, next, previous, results, facets }
}

// ─── Autocomplete suggestions ──────────────────────────────────────
export async function suggestDocuments(prefix, limit = 10) {
  const { data } = await api.get("/documents/suggest/", {
    params: { q: prefix, limit },
  });
  return data.suggestions || [];   // [{ id, title, category }, ...]
}