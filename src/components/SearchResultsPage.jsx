// src/pages/SearchResultsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Link, Stack, Divider, Alert,
  FormControl, InputLabel, Select, MenuItem, Skeleton, Pagination,
  useMediaQuery, useTheme, IconButton, Drawer, Button, alpha,
  List, ListItemButton, ListItemText, Badge,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import { searchDocuments } from "../api/documents";
import { CATEGORY_STYLES } from "../theme";

const ORDERING_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title (A–Z)" },
];

const PAGE_SIZE = 10;

// ─── Facet sidebar ────────────────────────────────────────────────
function FacetList({ facets, selected, onSelect }) {
  const total = facets.reduce((sum, f) => sum + f.count, 0);
  return (
    <List dense disablePadding>
      <ListItemButton
        selected={!selected}
        onClick={() => onSelect("")}
        sx={{ borderRadius: 1.5, mb: 0.5 }}
      >
        <ListItemText
          primary="All categories"
          primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
        />
        <Badge
          badgeContent={total}
          color="default"
          sx={{ "& .MuiBadge-badge": { bgcolor: "action.selected", color: "text.secondary" } }}
        />
      </ListItemButton>
      {facets.map((f) => {
        const cat = CATEGORY_STYLES[f.category] || CATEGORY_STYLES.OTHER;
        return (
          <ListItemButton
            key={f.category}
            selected={selected === f.category}
            onClick={() => onSelect(f.category)}
            sx={{ borderRadius: 1.5, mb: 0.5, gap: 1.5 }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: cat.color,
                flexShrink: 0,
              }}
            />
            <ListItemText
              primary={cat.label}
              primaryTypographyProps={{ variant: "body2" }}
            />
            <Typography variant="caption" color="text.secondary">
              {f.count}
            </Typography>
          </ListItemButton>
        );
      })}
    </List>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────
function ResultSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Skeleton width="60%" height={24} />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Skeleton variant="rounded" width={60} height={20} />
        <Skeleton variant="rounded" width={80} height={20} />
      </Stack>
      <Skeleton width="100%" height={16} sx={{ mt: 1.5 }} />
      <Skeleton width="85%" height={16} />
    </Paper>
  );
}

// ─── Result card ──────────────────────────────────────────────────
function ResultCard({ doc }) {
  const cat = CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.OTHER;
  return (
    <Paper variant="outlined" sx={{ p: 2.5, "&:hover": { transform: "translateY(-1px)" } }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(cat.color, 0.1),
            color: cat.color,
            flexShrink: 0,
          }}
        >
          <DescriptionOutlinedIcon />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Link
              component={RouterLink}
              to={`/documents/${doc.id}`}
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                textDecoration: "none",
                "&:hover": { color: "primary.main" },
              }}
            >
              {doc.title}
            </Link>
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
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 0.5, color: "text.secondary" }}
            alignItems="center"
          >
            {doc.uploaded_by?.username && (
              <Typography variant="caption">
                {doc.uploaded_by.username}
              </Typography>
            )}
            {doc.created_at && (
              <Typography variant="caption">
                · {new Date(doc.created_at).toLocaleDateString()}
              </Typography>
            )}
            {typeof doc.rank === "number" && (
              <Typography variant="caption">
                · score {doc.rank.toFixed(2)}
              </Typography>
            )}
          </Stack>

          {doc.snippet && (
            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                color: "text.secondary",
                "& mark": {
                  bgcolor: alpha("#facc15", 0.45),
                  color: "inherit",
                  px: 0.4,
                  borderRadius: 0.5,
                  fontWeight: 500,
                },
              }}
              dangerouslySetInnerHTML={{ __html: doc.snippet }}
            />
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const ordering = params.get("ordering") || "relevance";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));

  const [data, setData] = useState({ results: [], count: 0, facets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => {
    if (!q.trim()) {
      setData({ results: [], count: 0, facets: [] });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchDocuments({
      q,
      category: category || undefined,
      ordering,
      page,
      page_size: PAGE_SIZE,
    })
      .then((d) => !cancelled && setData(d))
      .catch(
        (err) =>
          !cancelled &&
          setError(err?.response?.data?.detail || "Search failed.")
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [q, category, ordering, page]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    // reset page when filters change
    if (!("page" in updates)) next.delete("page");
    setParams(next);
  };

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil((data.count || 0) / PAGE_SIZE)),
    [data.count]
  );

  // ── Empty state: no query ────────────────────────────────────────
  if (!q.trim()) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="info">
          Type something in the search bar above to find documents.
        </Alert>
      </Box>
    );
  }

  const filterContent = (
    <>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
        Filter by category
      </Typography>
      <Box sx={{ mt: 1 }}>
        <FacetList
          facets={data.facets || []}
          selected={category}
          onSelect={(v) => {
            updateParams({ category: v });
            if (!isDesktop) setFilterOpen(false);
          }}
        />
      </Box>
    </>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5">Results for "{q}"</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {loading
              ? "Searching…"
              : `${data.count} document${data.count === 1 ? "" : "s"} found`}
            {category && ` in ${CATEGORY_STYLES[category]?.label || category}`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {!isDesktop && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListRoundedIcon />}
              onClick={() => setFilterOpen(true)}
            >
              Filters
            </Button>
          )}
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>
              <SortRoundedIcon
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 0.5, mt: -0.3 }}
              />
              Sort
            </InputLabel>
            <Select
              label="Sort"
              value={ordering}
              onChange={(e) => updateParams({ ordering: e.target.value })}
            >
              {ORDERING_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Sidebar filters (desktop) */}
        {isDesktop && (
          <Box sx={{ width: 260, flexShrink: 0 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, position: "sticky", top: 88, borderRadius: 2 }}
            >
              {filterContent}
            </Paper>
          </Box>
        )}

        {/* Mobile filter drawer */}
        <Drawer
          anchor="left"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          PaperProps={{ sx: { width: 280, p: 2 } }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setFilterOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          {filterContent}
        </Drawer>

        {/* Main results */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3, 4, 5].map((n) => (
                <ResultSkeleton key={n} />
              ))}
            </Stack>
          ) : data.results.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                No documents found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try different keywords or remove filters.
              </Typography>
            </Paper>
          ) : (
            <>
              <Stack spacing={2}>
                {data.results.map((doc) => (
                  <ResultCard key={doc.id} doc={doc} />
                ))}
              </Stack>

              {pageCount > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <Pagination
                    count={pageCount}
                    page={page}
                    onChange={(_, p) => updateParams({ page: p })}
                    shape="rounded"
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Stack>
    </Box>
  );
}