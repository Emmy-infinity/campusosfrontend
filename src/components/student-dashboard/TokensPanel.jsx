// src/components/student-dashboard/TokensPanel.jsx
import { useNavigate } from "react-router-dom";
import { Paper, Stack, Typography, LinearProgress, Button } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

export default function TokensPanel({ tokensRemaining = 0 }) {
  const navigate = useNavigate();
  const pct = Math.min(100, (tokensRemaining / 100000) * 100);

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
        <AutoAwesomeRoundedIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          AI tokens
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {tokensRemaining.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        remaining
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ mt: 2, height: 6, borderRadius: 3 }}
      />
      <Button
        size="small"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => navigate("/tokens")}
      >
        Buy more
      </Button>
    </Paper>
  );
}