// src/components/student-dashboard/RecentDocumentsPanel.jsx
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, Chip, Divider, alpha,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SectionHeader from "./SectionHeader";
import { CATEGORY_STYLES } from "../../theme";

export default function RecentDocumentsPanel({ documents = [] }) {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <SectionHeader
        title="Recent documents"
        actionLabel="View all"
        onAction={() => navigate("/documents")}
      />

      {documents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No documents yet.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {documents.map((doc, i) => {
            const cat = CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.OTHER;
            return (
              <Box key={doc.id}>
                {i > 0 && <Divider />}
                <Stack
                  direction="row"
                  spacing={2}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  sx={{
                    alignItems: "center", py: 1.5, px: 1,
                    borderRadius: 1, cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid", placeItems: "center",
                      width: 32, height: 32, borderRadius: 1,
                      bgcolor: alpha(cat.color, 0.1), color: cat.color, flexShrink: 0,
                    }}
                  >
                    <DescriptionOutlinedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {doc.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={cat.label}
                    sx={{
                      height: 20, fontSize: 11,
                      bgcolor: alpha(cat.color, 0.1), color: cat.color,
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}