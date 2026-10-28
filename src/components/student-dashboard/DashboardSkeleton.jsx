// src/components/student-dashboard/DashboardSkeleton.jsx
import { Box, Skeleton } from "@mui/material";

export default function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton width="40%" height={40} />
      <Skeleton width="60%" height={24} sx={{ mb: 3 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2, mb: 3,
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} variant="rounded" height={88} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={240} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={280} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={200} />
    </Box>
  );
}