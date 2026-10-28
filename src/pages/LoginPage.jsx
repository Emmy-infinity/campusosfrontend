import { useState } from "react";
import {
  Box, Paper, TextField, Button, Typography, Alert, Stack, Link,
  InputAdornment, IconButton, Divider, Chip,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import FolderCopyRoundedIcon from "@mui/icons-material/FolderCopyRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InstallPWA from "../components/student-dashboard/InstallPWA";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=80";

const CAPABILITIES = [
  {
    icon: <AutoAwesomeRoundedIcon fontSize="small" />,
    title: "AI-assisted research evaluation",
    text: "Rubric-anchored scores and justifications in ~30 seconds per submission.",
  },
  {
    icon: <TimerRoundedIcon fontSize="small" />,
    title: "Secure timed examinations",
    text: "Server-enforced deadlines that browser refreshes cannot compromise.",
  },
  {
    icon: <FolderCopyRoundedIcon fontSize="small" />,
    title: "Full-text document repository",
    text: "Course materials and past papers, indexed and searchable in PostgreSQL.",
  },
  {
    icon: <InsightsRoundedIcon fontSize="small" />,
    title: "Granular academic analytics",
    text: "Per-question difficulty metrics that expose cohort-wide conceptual gaps.",
  },
];

const STATS = [
  { value: "80%", label: "Less admin overhead" },
  { value: "30s", label: "Per submission evaluated" },
  { value: "100%", label: "On-premise data residency" },
];

function LogoMark({ size = 44 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2.5,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg,#6366F1 0%,#22D3EE 100%)",
        boxShadow: "0 10px 26px -10px rgba(99,102,241,0.9)",
        fontWeight: 900,
        fontSize: size * 0.5,
        color: "#fff",
        letterSpacing: -1,
      }}
    >
      C
    </Box>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "rgba(255,255,255,0.04)",
      borderRadius: 2,
      color: "#fff",
      transition: "background-color .2s ease",
      "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
      "&.Mui-focused": { bgcolor: "rgba(255,255,255,0.06)" },
      "&.Mui-focused fieldset": { borderColor: "#818CF8", borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.55)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#A5B4FC" },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #101527 inset",
      WebkitTextFillColor: "#fff",
      caretColor: "#fff",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#070B18",
        color: "#fff",
      }}
    >
      {/* ================= LEFT — INSTITUTIONAL HERO ================= */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1.15,
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 6, lg: 8 },
          backgroundImage: `linear-gradient(150deg, rgba(7,11,24,0.95) 0%, rgba(11,16,32,0.80) 45%, rgba(6,78,89,0.55) 100%), url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(circle at 30% 35%, #000 0%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle at 30% 35%, #000 0%, transparent 72%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 460,
            height: 460,
            top: -150,
            right: -130,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.38), transparent 68%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 380,
            height: 380,
            bottom: -160,
            left: -110,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
          <LogoMark />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1, letterSpacing: -0.4 }}>
              CampusOS
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: 1.6 }}>
              SOVEREIGN ACADEMIC PLATFORM
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 570 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { md: 40, lg: 50 },
              lineHeight: 1.1,
              letterSpacing: -1.6,
              mb: 2.5,
            }}
          >
            Your campus. Your data.{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(120deg,#A5B4FC 0%,#22D3EE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your platform.
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.68)", fontSize: 16.5, mb: 4.5, maxWidth: 490 }}
          >
            One unified, on-premise architecture for course administration, automated
            research evaluation, secure examinations and academic analytics — built for
            East African universities.
          </Typography>

          <Stack spacing={2.25}>
            {CAPABILITIES.map((f) => (
              <Stack key={f.title} direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    mt: 0.25,
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    color: "#A5B4FC",
                    bgcolor: "rgba(99,102,241,0.16)",
                    border: "1px solid rgba(129,140,248,0.28)",
                  }}
                >
                  {f.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{f.title}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", fontSize: 13.5 }}>
                    {f.text}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 4 }}>
            {[
              { label: "Uganda DPPA (2019)", icon: <ShieldRoundedIcon sx={{ fontSize: 15 }} /> },
              { label: "NITA-U aligned", icon: <ShieldRoundedIcon sx={{ fontSize: 15 }} /> },
              { label: "On-premise residency", icon: <ShieldRoundedIcon sx={{ fontSize: 15 }} /> },
            ].map((c) => (
              <Chip
                key={c.label}
                icon={c.icon}
                label={c.label}
                size="small"
                sx={{
                  color: "#C7D2FE",
                  bgcolor: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(129,140,248,0.28)",
                  fontSize: 11.5,
                  letterSpacing: 0.3,
                  "& .MuiChip-icon": { color: "#818CF8" },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={{ md: 4, lg: 6 }}
          sx={{ position: "relative", zIndex: 1, pt: 4, borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {STATS.map((s) => (
            <Box key={s.label}>
              <Typography sx={{ fontWeight: 800, fontSize: 23, letterSpacing: -0.6 }}>
                {s.value}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 0.4 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ================= RIGHT — LOGIN ================= */}
      <Box
        sx={{
          width: { xs: "100%", md: 520 },
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 5, md: 6 },
          position: "relative",
          background:
            "radial-gradient(circle at 15% 0%, rgba(99,102,241,0.20), transparent 55%), radial-gradient(circle at 95% 100%, rgba(34,211,238,0.14), transparent 55%), #070B18",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {/* mobile brand */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="center"
            sx={{ display: { xs: "flex", md: "none" }, mb: 4 }}
          >
            <LogoMark size={38} />
            <Typography sx={{ fontWeight: 800, fontSize: 19, letterSpacing: -0.4 }}>
              CampusOS
            </Typography>
          </Stack>

          {/* 👇 PWA INSTALL BUTTON ADDED HERE 👇 */}
          <InstallPWA />
          {/* 👆 PWA INSTALL BUTTON ADDED HERE 👆 */}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.045)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 30px 70px -30px rgba(0,0,0,0.9)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.6 }}>
              Sign in
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mb: 3.5 }}>
              Access your CampusOS portal — student, lecturer or administrator.
            </Typography>

            <form onSubmit={submit}>
              <Stack spacing={2.25}>
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      bgcolor: "rgba(244,63,94,0.12)",
                      color: "#FDA4AF",
                      border: "1px solid rgba(244,63,94,0.3)",
                      "& .MuiAlert-icon": { color: "#FB7185" },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                  required
                  autoComplete="username"
                  sx={fieldSx}
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  autoComplete="current-password"
                  sx={fieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          sx={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: "right", mt: -1 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    underline="hover"
                    sx={{ fontSize: 13, color: "#A5B4FC" }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={busy}
                  sx={{
                    py: 1.5,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: 15,
                    textTransform: "none",
                    letterSpacing: 0.2,
                    color: "#fff",
                    background: "linear-gradient(135deg,#6366F1 0%,#22D3EE 100%)",
                    boxShadow: "0 14px 34px -14px rgba(99,102,241,0.95)",
                    transition: "all .2s ease",
                    "&:hover": {
                      background: "linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 18px 40px -14px rgba(99,102,241,1)",
                    },
                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.7)",
                      background: "linear-gradient(135deg,#6366F1 0%,#22D3EE 100%)",
                      opacity: 0.55,
                    },
                  }}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", px: 1 }}>
                NEW TO CAMPUSOS?
              </Typography>
            </Divider>

            <Button
              component={RouterLink}
              to="/register"
              fullWidth
              size="large"
              startIcon={<PersonAddAlt1RoundedIcon />}
              sx={{
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: 14.5,
                textTransform: "none",
                color: "#E0E7FF",
                border: "1px solid rgba(129,140,248,0.4)",
                bgcolor: "rgba(99,102,241,0.10)",
                transition: "all .2s ease",
                "&:hover": {
                  bgcolor: "rgba(99,102,241,0.2)",
                  borderColor: "rgba(129,140,248,0.7)",
                },
              }}
            >
              Create an account
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 2.5,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
              }}
            >
              Students and lecturers can self-register. Administrator accounts are
              provisioned by your institution's ICT Directorate.
            </Typography>
          </Paper>

          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "center", mt: 3, color: "rgba(255,255,255,0.35)" }}
          >
            © {new Date().getFullYear()} CampusOS · Built for East African universities
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}