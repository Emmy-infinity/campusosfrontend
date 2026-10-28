// src/pages/LecturerCourseAnalyticsPage.jsx
import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Paper, Typography, Stack, Skeleton, Alert, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Button, Chip, Breadcrumbs, Link as MuiLink,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { getCourseAnalytics } from "../api/lecturer";

const PlotlyChart = lazy(() => import("../components/PlotlyChart"));

const GREEN  = "#059669";
const AMBER  = "#d97706";
const RED    = "#dc2626";
const BLUE   = "#1976d2";

function ChartCard({ title, subtitle, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      <Box sx={{ mt: 1 }}>
        <Suspense fallback={<Skeleton variant="rounded" height={280} />}>
          {children}
        </Suspense>
      </Box>
    </Paper>
  );
}

function SummaryTile({ label, value, sub, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: color || "text.primary" }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

function bandColor(pct) {
  if (pct == null) return "#9ca3af";
  if (pct >= 75) return GREEN;
  if (pct >= 50) return AMBER;
  return RED;
}

export default function LecturerCourseAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCourseAnalytics(id)
      .then(setData)
      .catch((e) =>
        setError(e?.response?.data?.error || "Failed to load analytics.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton variant="rounded" height={400} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">No analytics available.</Alert>;

  const { summary, exams = [], students = [], charts = {} } = data;

  if (summary.exams_count === 0) {
    return (
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={RouterLink} to="/courses" underline="hover" color="inherit">
            Courses
          </MuiLink>
          <MuiLink component={RouterLink} to={`/courses/${id}`} underline="hover" color="inherit">
            {summary.course_code}
          </MuiLink>
          <Typography color="text.primary">Analytics</Typography>
        </Breadcrumbs>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/courses/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to course
        </Button>

        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <InsightsRoundedIcon
            sx={{ fontSize: 56, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary">
            Nothing to analyse yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            This course has no exams. Create one and publish it so students can
            take it — analytics will appear here.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/exams/new")}>
            Create an exam
          </Button>
        </Paper>
      </Box>
    );
  }

  // Auto-rotate labels only when there are enough bars to warrant it.
  const examTitles = charts.avg_per_exam?.x || [];
  const autoTickangle = examTitles.length > 3 ? -30 : 0;

  const avgPerExam = {
    data: [{
      x: charts.avg_per_exam?.x || [],
      y: charts.avg_per_exam?.y || [],
      text: charts.avg_per_exam?.text || [],
      type: "bar",
      marker: { color: (charts.avg_per_exam?.y || []).map((v) => bandColor(v)) },
      hovertemplate: "<b>%{x}</b> — %{text}<br>Average: %{y:.1f}%<extra></extra>",
    }],
    layout: {
      xaxis: { showgrid: false, tickangle: autoTickangle },
      yaxis: { title: "Average (%)", range: [0, 105], gridcolor: "#f3f4f6" },
      bargap: 0.35,
      margin: { l: 50, r: 20, t: 10, b: 60 },
    },
  };

  const attemptsPerExam = {
    data: [{
      x: charts.attempts_per_exam?.x || [],
      y: charts.attempts_per_exam?.y || [],
      type: "bar",
      marker: { color: BLUE },
      hovertemplate: "<b>%{x}</b><br>%{y} attempt(s)<extra></extra>",
    }],
    layout: {
      xaxis: { showgrid: false, tickangle: autoTickangle },
      yaxis: { title: "Attempts", gridcolor: "#f3f4f6" },
      bargap: 0.35,
      margin: { l: 50, r: 20, t: 10, b: 60 },
    },
  };

  const scoreTrend = {
    data: [{
      x: charts.score_trend?.x || [],
      y: charts.score_trend?.y || [],
      text: charts.score_trend?.text || [],
      type: "scatter",
      mode: "lines+markers",
      line: { color: BLUE, width: 3, shape: "spline" },
      marker: {
        size: 10,
        color: (charts.score_trend?.y || []).map((v) => bandColor(v)),
        line: { color: "#fff", width: 2 },
      },
      hovertemplate:
        "<b>%{text}</b><br>%{x|%d %b %Y}<br>Score: %{y:.1f}%<extra></extra>",
    }],
    layout: {
      xaxis: { title: "", showgrid: false, tickformat: "%d %b" },
      yaxis: { title: "Score (%)", range: [0, 105], gridcolor: "#f3f4f6" },
      shapes: [
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: 50, y1: 50,
          line: { color: RED, width: 1, dash: "dot" } },
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: 75, y1: 75,
          line: { color: GREEN, width: 1, dash: "dot" } },
      ],
    },
  };

  const studentAvg = {
    data: [{
      x: charts.student_avg?.x || [],
      y: charts.student_avg?.y || [],
      text: charts.student_avg?.labels || [],
      type: "bar",
      marker: { color: (charts.student_avg?.y || []).map((v) => bandColor(v)) },
      hovertemplate: "<b>%{x}</b> (%{text})<br>Average: %{y:.1f}%<extra></extra>",
    }],
    layout: {
      xaxis: { showgrid: false, tickangle: -30 },
      yaxis: { title: "Average (%)", range: [0, 105], gridcolor: "#f3f4f6" },
      bargap: 0.25,
      margin: { l: 50, r: 20, t: 10, b: 80 },
    },
  };

  const gradeDistribution = {
    data: [{
      labels: charts.grade_distribution?.labels || [],
      values: charts.grade_distribution?.values || [],
      type: "pie",
      hole: 0.55,
      marker: { colors: [GREEN, "#65a30d", AMBER, "#f97316", RED] },
      textinfo: "label+percent",
      hovertemplate: "<b>%{label}</b><br>%{value} attempt(s)<extra></extra>",
    }],
    layout: {
      showlegend: false,
      margin: { l: 10, r: 10, t: 10, b: 10 },
    },
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/courses" underline="hover" color="inherit">
          Courses
        </MuiLink>
        <MuiLink component={RouterLink} to={`/courses/${id}`} underline="hover" color="inherit">
          {summary.course_code}
        </MuiLink>
        <Typography color="text.primary">Analytics</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/courses/${id}`)}
        sx={{ mb: 2 }}
      >
        Back to course
      </Button>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
        <InsightsRoundedIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {summary.course_code} — {summary.course_title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {summary.exams_count} exam{summary.exams_count === 1 ? "" : "s"} ·{" "}
        {summary.students_count} student{summary.students_count === 1 ? "" : "s"} ·{" "}
        {summary.attempts_total} attempt{summary.attempts_total === 1 ? "" : "s"}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <SummaryTile
          label="Average"
          value={summary.average_percentage != null ? `${summary.average_percentage}%` : "—"}
          sub="Across all graded attempts"
        />
        <SummaryTile
          label="Pass rate"
          value={summary.pass_rate != null ? `${summary.pass_rate}%` : "—"}
          sub="≥50% per attempt"
        />
        <SummaryTile
          label="Range"
          value={
            summary.best_percentage != null
              ? `${summary.best_percentage}% / ${summary.worst_percentage}%`
              : "—"
          }
          sub="Best / worst"
        />
        <SummaryTile
          label="Attempts"
          value={summary.attempts_total}
          sub={`${summary.students_count} students`}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <ChartCard title="Average per exam" subtitle="Mean score in each exam">
          <PlotlyChart data={avgPerExam.data} layout={avgPerExam.layout} />
        </ChartCard>

        <ChartCard title="Attempts per exam" subtitle="How many students sat each exam">
          <PlotlyChart data={attemptsPerExam.data} layout={attemptsPerExam.layout} />
        </ChartCard>

        <ChartCard title="Score trend" subtitle="Every graded attempt, oldest → newest">
          <PlotlyChart data={scoreTrend.data} layout={scoreTrend.layout} />
        </ChartCard>

        <ChartCard title="Grade distribution" subtitle="Across all graded attempts">
          <PlotlyChart data={gradeDistribution.data} layout={gradeDistribution.layout} />
        </ChartCard>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ChartCard
          title="Student averages"
          subtitle="Ranked by mean score across this course"
        >
          <PlotlyChart
            data={studentAvg.data}
            layout={studentAvg.layout}
            style={{ height: 320 }}
          />
        </ChartCard>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Exams
        </Typography>
        {exams.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No exams yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Exam</TableCell>
                  <TableCell align="right">Attempts</TableCell>
                  <TableCell align="right">Graded</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="right">Best</TableCell>
                  <TableCell align="right">Worst</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.map((e) => (
                  <TableRow
                    key={e.exam_id}
                    hover
                    onClick={() => navigate(`/exams/${e.exam_id}/analytics`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {e.exam_title}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{e.attempts}</TableCell>
                    <TableCell align="right">{e.graded}</TableCell>
                    <TableCell align="right">
                      {e.average_percentage != null ? (
                        <Typography
                          sx={{ fontWeight: 600, color: bandColor(e.average_percentage) }}
                        >
                          {e.average_percentage}%
                        </Typography>
                      ) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {e.best_percentage != null ? `${e.best_percentage}%` : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {e.worst_percentage != null ? `${e.worst_percentage}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Students
          </Typography>
          <Chip size="small" label={students.length} />
        </Stack>
        {students.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No graded attempts yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell align="right">Attempts</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="right">Best</TableCell>
                  <TableCell align="right">Worst</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, i) => (
                  <TableRow key={s.student_id} hover>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {i + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {s.student_id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{s.attempts}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center", justifyContent: "flex-end" }}
                      >
                        <Box sx={{ width: 50 }}>
                          <LinearProgress
                            variant="determinate"
                            value={s.average_percentage ?? 0}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              "& .MuiLinearProgress-bar": {
                                bgcolor: bandColor(s.average_percentage),
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ minWidth: 48, textAlign: "right", fontWeight: 600 }}
                        >
                          {s.average_percentage != null ? `${s.average_percentage}%` : "—"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {s.best_percentage != null ? `${s.best_percentage}%` : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {s.worst_percentage != null ? `${s.worst_percentage}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}