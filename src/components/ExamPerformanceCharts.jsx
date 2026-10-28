// src/components/ExamPerformanceCharts.jsx
import { Box, Paper, Typography, Stack, Chip, Alert } from "@mui/material";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PlotlyChart from "./PlotlyChart";

const GREEN = "#059669";
const AMBER = "#d97706";
const RED   = "#dc2626";
const BLUE  = "#1976d2";

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
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Paper>
  );
}

export default function ExamPerformanceCharts({ perf }) {
  if (!perf || perf.attempts_total === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
          <InsightsRoundedIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Exam performance
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          No exam attempts yet. Charts will appear after your first graded exam.
        </Typography>
      </Paper>
    );
  }

  const { charts } = perf;
  if (!charts) {
    return <Alert severity="info">Charts payload missing.</Alert>;
  }

  const trendTrace = {
    x: charts.score_trend?.x || [],
    y: charts.score_trend?.y || [],
    text: charts.score_trend?.text || [],
    type: "scatter",
    mode: "lines+markers",
    line: { color: BLUE, width: 3, shape: "spline" },
    marker: {
      size: 10,
      color: (charts.score_trend?.y || []).map((v) =>
        v >= 75 ? GREEN : v >= 50 ? AMBER : RED
      ),
      line: { color: "#fff", width: 2 },
    },
    hovertemplate:
      "<b>%{text}</b><br>%{x|%d %b %Y}<br>Score: %{y:.1f}%<extra></extra>",
  };
  const trendLayout = {
    xaxis: { title: "", showgrid: false, tickformat: "%d %b" },
    yaxis: { title: "Score (%)", range: [0, 105], gridcolor: "#f3f4f6" },
    shapes: [
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: 50, y1: 50,
        line: { color: RED, width: 1, dash: "dot" } },
      { type: "line", xref: "paper", x0: 0, x1: 1, y0: 75, y1: 75,
        line: { color: GREEN, width: 1, dash: "dot" } },
    ],
  };

  const avgTrace = {
    x: charts.per_course_avg?.x || [],
    y: charts.per_course_avg?.y || [],
    text: charts.per_course_avg?.text || [],
    type: "bar",
    marker: {
      color: (charts.per_course_avg?.y || []).map((v) =>
        v >= 75 ? GREEN : v >= 50 ? AMBER : RED
      ),
    },
    hovertemplate: "<b>%{x}</b> — %{text}<br>Average: %{y:.1f}%<extra></extra>",
  };
  const avgLayout = {
    xaxis: { title: "", showgrid: false },
    yaxis: { title: "Average (%)", range: [0, 105], gridcolor: "#f3f4f6" },
    bargap: 0.35,
  };

  const spreadTraces = [
    {
      x: charts.per_course_spread?.x || [],
      y: charts.per_course_spread?.best || [],
      name: "Best",
      type: "bar",
      marker: { color: GREEN },
      hovertemplate: "Best: %{y:.1f}%<extra></extra>",
    },
    {
      x: charts.per_course_spread?.x || [],
      y: charts.per_course_spread?.avg || [],
      name: "Average",
      type: "bar",
      marker: { color: AMBER },
      hovertemplate: "Average: %{y:.1f}%<extra></extra>",
    },
    {
      x: charts.per_course_spread?.x || [],
      y: charts.per_course_spread?.worst || [],
      name: "Worst",
      type: "bar",
      marker: { color: RED },
      hovertemplate: "Worst: %{y:.1f}%<extra></extra>",
    },
  ];
  const spreadLayout = {
    barmode: "group",
    xaxis: { title: "", showgrid: false },
    yaxis: { title: "Score (%)", range: [0, 105], gridcolor: "#f3f4f6" },
    legend: { orientation: "h", y: -0.2 },
    bargap: 0.25,
    bargroupgap: 0.1,
  };

  const distTrace = {
    labels: charts.grade_distribution?.labels || [],
    values: charts.grade_distribution?.values || [],
    type: "pie",
    hole: 0.55,
    marker: { colors: [GREEN, "#65a30d", AMBER, "#f97316", RED] },
    textinfo: "label+percent",
    hovertemplate: "<b>%{label}</b><br>%{value} attempt(s)<extra></extra>",
  };
  const distLayout = {
    margin: { l: 10, r: 10, t: 10, b: 10 },
    showlegend: false,
  };

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <InsightsRoundedIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Exam performance
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={`${perf.attempts_graded}/${perf.attempts_total} graded`}
          variant="outlined"
        />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <ChartCard title="Score trend" subtitle="Every graded attempt, oldest → newest">
          <PlotlyChart data={[trendTrace]} layout={trendLayout} />
        </ChartCard>
        <ChartCard title="Average per course" subtitle="Mean score in each course">
          <PlotlyChart data={[avgTrace]} layout={avgLayout} />
        </ChartCard>
        <ChartCard title="Best / average / worst" subtitle="Spread per course">
          <PlotlyChart data={spreadTraces} layout={spreadLayout} />
        </ChartCard>
        <ChartCard title="Grade distribution" subtitle="Attempts per grade band">
          <PlotlyChart data={[distTrace]} layout={distLayout} />
        </ChartCard>
      </Box>
    </Box>
  );
}