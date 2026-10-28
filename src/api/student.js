import { api } from "./client";

export const getStudentDashboard = () =>
  api.get("/student/dashboard/").then((r) => r.data);