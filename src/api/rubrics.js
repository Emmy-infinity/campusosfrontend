// src/api/rubrics.js
import { api } from "./client";

export const listRubrics = () =>
  api.get("/rubrics/").then((r) => r.data);

export const getRubric = (id) =>
  api.get(`/rubrics/${id}/`).then((r) => r.data);

export const createRubric = (payload) =>
  api.post("/rubrics/", payload).then((r) => r.data);

export const updateRubric = (id, payload) =>
  api.patch(`/rubrics/${id}/`, payload).then((r) => r.data);

export const deleteRubric = (id) =>
  api.delete(`/rubrics/${id}/`).then((r) => r.data);