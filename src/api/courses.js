// src/api/courses.js
import { api } from "./client";

export const listCourses = () =>
  api.get("/courses/").then((r) => r.data);

export const getCourse = (id) =>
  api.get(`/courses/${id}/`).then((r) => r.data);

export const createCourse = (payload) =>
  api.post("/courses/", payload).then((r) => r.data);

export const updateCourse = (id, payload) =>
  api.patch(`/courses/${id}/`, payload).then((r) => r.data);

export const deleteCourse = (id) =>
  api.delete(`/courses/${id}/`).then((r) => r.data);

export const searchAvailableStudents = (courseId, q = "", limit = 20) =>
  api
    .get(`/courses/${courseId}/available-students/`, {
      params: { q, limit },
    })
    .then((r) => r.data);

// ── Enrollments ────────────────────────────────────────────
export const listEnrollments = (params = {}) =>
  api.get("/enrollments/", { params }).then((r) => r.data);

export const createEnrollment = (payload) =>
  api.post("/enrollments/", payload).then((r) => r.data);

export const deleteEnrollment = (id) =>
  api.delete(`/enrollments/${id}/`).then((r) => r.data);