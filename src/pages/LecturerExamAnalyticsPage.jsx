// src/pages/LecturerExamAnalyticsPage.jsx
import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Stack, Skeleton, Alert, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Button, Chip, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TimerOffRoundedIcon from "@mui/icons-material/TimerOffRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import { getExamAnalytics } from "../api/lecturer";

const PlotlyChart = lazy(() => import("../components/PlotlyChart"));

const GREEN = "#059669";
const AMBER = "#d97706";
const RED   = "#dc2626";
const BLUE  = "#1976d2";
const PURPLE = "#7c3aed";

function ChartCard({ title, subtitle, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
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
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: color || "text.primary" }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      )}
    </Paper>
  );
}

export default function LecturerExamAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getExamAnalytics(id)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.error || "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton variant="rounded" height={400} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">No analytics available.</Alert>;

  const { summary, students = [], questions = [], charts = {} } = data;

  const histogram = {
    data: [{
      x: charts.score_histogram?.x || [],
      y: charts.score_histogram?.y || [],
      type: "bar",
      marker: { color: BLUE },
      hovertemplate: "%{x}: %{y} student(s)<extra></extra>",
    }],
    layout: {
      xaxis: { title: "Score band", showgrid: false },
      yaxis: { title: "Students", gridcolor: "#f3f4f6" },
      bargap: 0.15,
    },
  };

  const ranked = {
    data: [{
      x: charts.ranked_students?.x || [],
      y: charts.ranked_students?.y || [],
      text: charts.ranked_students?.labels || [],
      type: "bar",
      marker: {
        color: (charts.ranked_students?.y || []).map((v) =>
          v >= 75 ? GREEN : v >= 50 ? AMBER : RED
        ),
      },
      hovertemplate: "<b>%{x}</b> (%{text})<br>%{y:.1f}%<extra></extra>",
    }],
    layout: {
      xaxis: { showgrid: false, tickangle: -30 },
      yaxis: { title: "Score (%)", range: [0, 105], gridcolor: "#f3f4f6" },
      bargap: 0.25,
    },
  };

  const difficulty = {
    data: [{
      x: charts.question_difficulty?.x || [],
      y: charts.question_difficulty?.y || [],
      text: charts.question_difficulty?.text || [],
      type: "bar",
      marker: {
        color: (charts.question_difficulty?.y || []).map((v) =>
          v == null ? "#9ca3af" : v >= 75 ? GREEN : v >= 50 ? AMBER : RED
        ),
      },
      hovertemplate: "<b>%{x}</b><br>%{text}<br>%{y:.1f}% correct<extra></extra>",
    }],
    layout: {
      xaxis: { showgrid: false },
      yaxis: { title: "% correct", range: [0, 105], gridcolor: "#f3f4f6" },
      bargap: 0.25,
    },
  };

  const distribution = {
    data: [{
      labels: charts.grade_distribution?.labels || [],
      values: charts.grade_distribution?.values || [],
      type: "pie",
      hole: 0.55,
      marker: { colors: [GREEN, "#65a30d", AMBER, "#f97316", RED] },
      textinfo: "label+percent",
    }],
    layout: { showlegend: false, margin: { l: 10, r: 10, t: 10, b: 10 } },
  };

  const status = {
    data: [{
      labels: charts.status_breakdown?.labels || [],
      values: charts.status_breakdown?.values || [],
      type: "pie",
      hole: 0.55,
      marker: { colors: [BLUE, AMBER, GREEN] },
      textinfo: "label+value",
    }],
    layout: { showlegend: false, margin: { l: 10, r: 10, t: 10, b: 10 } },
  };

  const flagged = students.filter((s) => s.is_flagged);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/exams")} sx={{ mb: 2 }}>
        Back to exams
      </Button>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
        <InsightsRoundedIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{summary.exam_title}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {summary.course_code} · {summary.total_marks} marks · {summary.students_count} student(s)
      </Typography>

      {/* ── Summary strip ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2, mb: 3,
        }}
      >
        <SummaryTile
          label="Average"
          value={summary.average_percentage != null ? `${summary.average_percentage}%` : "—"}
          sub={summary.median_percentage != null ? `Median ${summary.median_percentage}%` : null}
        />
        <SummaryTile
          label="Pass rate"
          value={summary.pass_rate != null ? `${summary.pass_rate}%` : "—"}
          sub={`${summary.passes} pass · ${summary.failures} fail`}
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
          value={`${summary.attempts_graded}/${summary.attempts_total}`}
          sub={`${summary.attempts_in_progress} in progress`}
        />
      </Box>

      {/* ── Session integrity strip ── */}
      {(summary.attempts_flagged > 0
        || summary.attempts_timed_out > 0
        || summary.attempts_abandoned > 0) && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2, mb: 3,
          }}
        >
          <SummaryTile
            label="Timed out"
            value={summary.attempts_timed_out}
            sub="Deadline passed, auto-submitted"
            color={summary.attempts_timed_out > 0 ? RED : undefined}
          />
          <SummaryTile
            label="Abandoned"
            value={summary.attempts_abandoned}
            sub="Student left without submitting"
            color={summary.attempts_abandoned > 0 ? AMBER : undefined}
          />
          <SummaryTile
            label="Flagged total"
            value={summary.attempts_flagged}
            sub="Needs review"
            color={summary.attempts_flagged > 0 ? PURPLE : undefined}
          />
        </Box>
      )}

      {/* ── Flagged attempts table ── */}
      {flagged.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
            <FlagRoundedIcon sx={{ color: AMBER }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Flagged attempts
            </Typography>
            <Chip size="small" label={flagged.length} color="warning" />
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flagged.map((s) => (
                  <TableRow key={s.student_id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {s.student_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {s.timed_out && (
                          <Tooltip title="Deadline passed">
                            <Chip
                              size="small"
                              icon={<TimerOffRoundedIcon />}
                              label="Timed out"
                              color="error"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          </Tooltip>
                        )}
                        {s.abandoned && (
                          <Tooltip title="Student left the exam">
                            <Chip
                              size="small"
                              icon={<LogoutRoundedIcon />}
                              label="Abandoned"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{s.score ?? "—"}</TableCell>
                    <TableCell align="right">
                      {s.percentage != null ? (
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: s.percentage >= 75 ? GREEN
                                 : s.percentage >= 50 ? AMBER : RED,
                          }}
                        >
                          {s.percentage}%
                        </Typography>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Charts grid ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2, mb: 3,
        }}
      >
        <ChartCard title="Score distribution" subtitle="Students per 10% band">
          <PlotlyChart data={histogram.data} layout={histogram.layout} />
        </ChartCard>
        <ChartCard title="Ranked students" subtitle="Best attempt per student">
          <PlotlyChart data={ranked.data} layout={ranked.layout} />
        </ChartCard>
        <ChartCard title="Question difficulty" subtitle="% who got each question right">
          <PlotlyChart data={difficulty.data} layout={difficulty.layout} />
        </ChartCard>
        <ChartCard title="Grade distribution" subtitle="Across all graded attempts">
          <PlotlyChart data={distribution.data} layout={distribution.layout} />
        </ChartCard>
      </Box>

      {/* ── Status + students table ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
          gap: 2, mb: 3,
        }}
      >
        <ChartCard title="Attempt status" subtitle="Where students are in the flow">
          <PlotlyChart data={status.data} layout={status.layout} style={{ height: 220 }} />
        </ChartCard>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Students</Typography>
          <Divider sx={{ mb: 1 }} />
          {students.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No graded attempts yet.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell align="center">Flag</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {s.student_id}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {s.is_flagged ? (
                          <Tooltip
                            title={
                              s.timed_out && s.abandoned
                                ? "Timed out and abandoned"
                                : s.timed_out
                                ? "Timed out"
                                : "Abandoned"
                            }
                          >
                            <FlagRoundedIcon sx={{ color: AMBER, fontSize: 18 }} />
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell align="right">{s.score}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: s.percentage >= 75 ? GREEN
                                 : s.percentage >= 50 ? AMBER : RED,
                          }}
                        >
                          {s.percentage}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* ── Question breakdown ── */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Question breakdown</Typography>
        {questions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No questions recorded.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell align="right">Answered</TableCell>
                  <TableCell align="right">Correct</TableCell>
                  <TableCell align="right">Correct rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.question_id}>
                    <TableCell>Q{q.order}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" noWrap>{q.text}</Typography>
                    </TableCell>
                    <TableCell align="right">{q.answered}</TableCell>
                    <TableCell align="right">{q.correct}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                        <Box sx={{ width: 60 }}>
                          <LinearProgress
                            variant="determinate"
                            value={q.correct_rate ?? 0}
                            sx={{
                              height: 6, borderRadius: 3,
                              "& .MuiLinearProgress-bar": {
                                bgcolor:
                                  (q.correct_rate ?? 0) >= 75 ? GREEN
                                  : (q.correct_rate ?? 0) >= 50 ? AMBER
                                  : RED,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 44, textAlign: "right" }}>
                          {q.correct_rate != null ? `${q.correct_rate}%` : "—"}
                        </Typography>
                      </Stack>
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