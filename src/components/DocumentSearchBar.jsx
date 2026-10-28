// src/components/DocumentSearchBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  InputAdornment,
  CircularProgress,
  Typography,
  Divider,
  IconButton,
  Fade,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { suggestDocuments } from "../api/documents";
import { CATEGORY_STYLES } from "../theme";

const RECENT_KEY = "campusos_recent_searches";
const MAX_RECENT = 5;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(term) {
  const trimmed = (term || "").trim();
  if (!trimmed) return;
  const list = loadRecent().filter((t) => t !== trimmed);
  list.unshift(trimmed);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export default function DocumentSearchBar({ width = 560, autoFocus = false }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState(() => loadRecent());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const debounceRef = useRef();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Row count (for keyboard nav): suggestions OR recent
  const items = useMemo(
    () => (query.trim().length >= 2 ? suggestions : recent),
    [query, suggestions, recent]
  );

  // Debounced suggestion fetch
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setHighlighted(-1);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await suggestDocuments(q, 8);
        setSuggestions(items);
        setHighlighted(items.length > 0 ? 0 : -1);
      } catch {
        setSuggestions([]);
        setHighlighted(-1);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commitSearch = (term) => {
    const q = (term || "").trim();
    if (!q) return;
    saveRecent(q);
    setRecent(loadRecent());
    setOpen(false);
    setQuery("");
    setHighlighted(-1);
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const pickSuggestion = (item) => {
    setOpen(false);
    setQuery("");
    setHighlighted(-1);
    navigate(`/documents/${item.id}`);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && highlighted >= 0 && items[highlighted]) {
        if (query.trim().length >= 2) {
          pickSuggestion(items[highlighted]);
        } else {
          commitSearch(items[highlighted]);
        }
      } else {
        commitSearch(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
      inputRef.current?.blur();
    }
  };

  const showRecent = query.trim().length < 2 && recent.length > 0;
  const showSuggestions = query.trim().length >= 2 && suggestions.length > 0;

  return (
    <Box
      ref={containerRef}
      sx={{ position: "relative", width: "100%", maxWidth: width }}
    >
      <TextField
        inputRef={inputRef}
        fullWidth
        size="small"
        autoFocus={autoFocus}
        placeholder="Search documents…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={16} thickness={5} />
              ) : (
                <SearchRoundedIcon fontSize="small" color="action" />
              )}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setHighlighted(-1);
                  inputRef.current?.focus();
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: {
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha("#fff", 0.04)
                : alpha("#000", 0.02),
            borderRadius: 2,
            transition: theme.transitions.create(["background-color", "box-shadow"]),
            "&.Mui-focused": {
              bgcolor: "background.paper",
              boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
            },
          },
        }}
      />

      <Fade in={open && (showRecent || showSuggestions)} unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 1300,
            overflow: "hidden",
            maxHeight: 420,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {showRecent && (
            <>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  color: "text.secondary",
                  letterSpacing: 1,
                }}
              >
                Recent searches
              </Typography>
              <List dense disablePadding>
                {recent.map((term, i) => (
                  <ListItemButton
                    key={`recent-${term}`}
                    selected={highlighted === i}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => commitSearch(term)}
                    sx={{ py: 1 }}
                  >
                    <HistoryRoundedIcon
                      fontSize="small"
                      sx={{ mr: 1.5, color: "text.secondary" }}
                    />
                    <ListItemText
                      primary={term}
                      primaryTypographyProps={{ variant: "body2", noWrap: true }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
              <ListItemButton
                onClick={() => {
                  localStorage.removeItem(RECENT_KEY);
                  setRecent([]);
                }}
                sx={{ py: 1 }}
              >
                <ListItemText
                  primary="Clear recent searches"
                  primaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
              </ListItemButton>
            </>
          )}

          {showSuggestions && (
            <>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  color: "text.secondary",
                  letterSpacing: 1,
                }}
              >
                Documents
              </Typography>
              <List dense disablePadding>
                {suggestions.map((item, i) => {
                  const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.OTHER;
                  return (
                    <ListItemButton
                      key={item.id}
                      selected={highlighted === i}
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => pickSuggestion(item)}
                      sx={{ py: 1.25, gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          placeItems: "center",
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: alpha(cat.color, 0.1),
                          color: cat.color,
                          flexShrink: 0,
                        }}
                      >
                        <DescriptionOutlinedIcon fontSize="small" />
                      </Box>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          variant: "body2",
                          noWrap: true,
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        size="small"
                        label={cat.label}
                        sx={{
                          height: 20,
                          fontSize: 11,
                          bgcolor: alpha(cat.color, 0.1),
                          color: cat.color,
                          fontWeight: 600,
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
              <Divider />
              <ListItemButton onClick={() => commitSearch(query)} sx={{ py: 1.25 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
                  <SearchRoundedIcon fontSize="small" color="primary" />
                  <Typography variant="body2" color="primary" fontWeight={500}>
                    See all results for "{query.trim()}"
                  </Typography>
                </Stack>
                <Box sx={{ flexGrow: 1 }} />
                <ArrowForwardRoundedIcon fontSize="small" color="primary" />
              </ListItemButton>
            </>
          )}
        </Paper>
      </Fade>
    </Box>
  );
}