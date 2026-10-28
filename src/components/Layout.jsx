// src/components/Layout.jsx
import { useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, Box, Container,
  Avatar, IconButton, Drawer, Stack, Menu, MenuItem, ListItemIcon,
  useMediaQuery, useTheme, alpha, Divider, ListItemText,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TokenBalance from "./TokenBalance";
import DocumentSearchBar from "./DocumentSearchBar";

export default function Layout({ children, tokensRefresh = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [avatarAnchor, setAvatarAnchor] = useState(null);

  const isLecturer = user?.role === "LECTURER" || user?.is_superuser;

  // ── Nav links by role ────────────────────────────────────
  const navItems = isLecturer
    ? [
        { label: "Dashboard",      to: "/",                icon: DashboardRoundedIcon },
        { label: "Courses",        to: "/courses",         icon: SchoolRoundedIcon },
        { label: "Question banks", to: "/question-banks",  icon: LibraryBooksRoundedIcon },
        { label: "Exams",          to: "/exams",           icon: QuizRoundedIcon },
        { label: "Rubrics",        to: "/rubrics",         icon: FactCheckRoundedIcon },
        { label: "Submissions",    to: "/submissions",     icon: AssignmentTurnedInRoundedIcon },
        { label: "Documents",      to: "/documents",       icon: DescriptionOutlinedIcon },
      ]
    : [
        { label: "Dashboard",      to: "/",                icon: DashboardRoundedIcon },
        { label: "Courses",        to: "/courses",         icon: SchoolRoundedIcon },
        { label: "Exams",          to: "/exams",           icon: QuizRoundedIcon },
        { label: "Submissions",    to: "/submissions",     icon: AssignmentTurnedInRoundedIcon },
        { label: "Documents",      to: "/documents",       icon: DescriptionOutlinedIcon },
      ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: "blur(8px)",
        }}
      >
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1 } }}>
          {!isDesktop && user && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: "none",
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Campus&nbsp;Os
          </Typography>

          {isDesktop && user && (
            <Stack direction="row" spacing={0.25} sx={{ ml: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color="inherit"
                  startIcon={<item.icon fontSize="small" />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    px: 1.25,
                    minWidth: 0,
                    color: isActive(item.to) ? "primary.main" : "text.primary",
                    bgcolor: isActive(item.to)
                      ? alpha(theme.palette.primary.main, 0.08)
                      : "transparent",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}

          {isDesktop && user && (
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", px: 1.5 }}>
              <DocumentSearchBar width={300} />
            </Box>
          )}

          {(!isDesktop || !user) && <Box sx={{ flexGrow: 1 }} />}

          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
            {!isDesktop && user && (
              <IconButton
                color="inherit"
                aria-label="Open search"
                onClick={() => setMobileSearchOpen(true)}
              >
                <SearchRoundedIcon />
              </IconButton>
            )}

            {user && (
              <Box sx={{ ml: { xs: 0, sm: 0.5 } }}>
                <TokenBalance refreshKey={tokensRefresh} />
              </Box>
            )}

            {user && (
              <>
                <Avatar
                  onClick={(e) => setAvatarAnchor(e.currentTarget)}
                  sx={{
                    ml: { xs: 0.5, sm: 1 },
                    width: 32, height: 32,
                    bgcolor: "primary.main",
                    fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {user.username?.[0]?.toUpperCase()}
                </Avatar>
                <Menu
                  anchorEl={avatarAnchor}
                  open={Boolean(avatarAnchor)}
                  onClose={() => setAvatarAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user.first_name || user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setAvatarAnchor(null);
                      handleLogout();
                    }}
                  >
                    <ListItemIcon>
                      <LogoutRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile search drawer */}
      <Drawer
        anchor="top"
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        PaperProps={{ sx: { p: 2, pt: 3 } }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ flexGrow: 1 }}>
            <DocumentSearchBar autoFocus />
          </Box>
          <IconButton onClick={() => setMobileSearchOpen(false)} aria-label="Close search">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Drawer>

      {/* Mobile nav drawer */}
      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        PaperProps={{ sx: { width: 260, p: 2 } }}
      >
        <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
            Campus&nbsp;Os
          </Typography>
          <IconButton
            sx={{ ml: "auto" }}
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 1 }} />

        <Stack spacing={0.5}>
          {navItems.map((item) => (
            <Button
              key={item.to}
              component={RouterLink}
              to={item.to}
              startIcon={<item.icon />}
              fullWidth
              onClick={() => setMobileNavOpen(false)}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 500,
                color: isActive(item.to) ? "primary.main" : "text.primary",
                bgcolor: isActive(item.to)
                  ? alpha(theme.palette.primary.main, 0.08)
                  : "transparent",
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}