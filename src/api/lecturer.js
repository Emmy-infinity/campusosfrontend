// src/api/lecturer.js
import { api } from "./client";

export const getLecturerDashboard = () =>
  api.get("/lecturer/dashboard/").then((r) => r.data);

export const listMyCourses = () =>
  api.get("/courses/").then((r) => r.data);

export const listQuestionBanks = () =>
  api.get("/question-banks/").then((r) => r.data);

export const createQuestionBank = (payload) =>
  api.post("/question-banks/", payload).then((r) => r.data);

export const listMyExams = () =>
  api.get("/exams/").then((r) => r.data);

export const createExam = (payload) =>
  api.post("/exams/", payload).then((r) => r.data);

export const getExam = (id) =>
  api.get(`/exams/${id}/`).then((r) => r.data);

export const getExamAnalytics = (id) =>
  api.get(`/exams/${id}/analytics/`).then((r) => r.data);

export const getCourseAnalytics = (id) =>
  api.get(`/courses/${id}/analytics/`).then((r) => r.data);

export const listRubrics = () =>
  api.get("/rubrics/").then((r) => r.data);

export const createRubric = (payload) =>
  api.post("/rubrics/", payload).then((r) => r.data);

export const getRubric = (id) =>
  api.get(`/rubrics/${id}/`).then((r) => r.data);

export const listSubmissions = () =>
  api.get("/submissions/").then((r) => r.data);

export const getSubmissionRoster = (courseId) =>
  api.get("/submissions/roster/", { params: { course_id: courseId } }).then((r) => r.data);

export const approveSubmission = (id, lecturer_comments = "") =>
  api.post(`/submissions/${id}/approve/`, { lecturer_comments }).then((r) => r.data);