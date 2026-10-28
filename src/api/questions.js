// src/api/questions.js
import { api } from "./client";

export const listQuestions = (bankId) =>
  api
    .get("/questions/", { params: bankId ? { bank: bankId } : {} })
    .then((r) => r.data);

export const getQuestion = (id) =>
  api.get(`/questions/${id}/`).then((r) => r.data);

export const createQuestion = (payload) =>
  api.post("/questions/", payload).then((r) => r.data);

export const updateQuestion = (id, payload) =>
  api.patch(`/questions/${id}/`, payload).then((r) => r.data);

export const deleteQuestion = (id) =>
  api.delete(`/questions/${id}/`).then((r) => r.data);