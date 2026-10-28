// src/components/student-dashboard/QuickActionsPanel.jsx
import { useNavigate } from "react-router-dom";
import { Paper, Stack, Typography } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import QuickAction from "./QuickAction";

export default function QuickActionsPanel() {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Quick actions
      </Typography>
      <Stack spacing={1}>
        <QuickAction
          icon={UploadFileRoundedIcon}
          label="Upload document"
          onClick={() => navigate("/documents")}
        />
        <QuickAction
          icon={AutoAwesomeRoundedIcon}
          label="Submit research"
          onClick={() => navigate("/submissions/new")}
        />
        <QuickAction
          icon={QuizRoundedIcon}
          label="Browse exams"
          onClick={() => navigate("/exams")}
        />
        <QuickAction
          icon={AddRoundedIcon}
          label="Browse rubrics"
          onClick={() => navigate("/rubrics")}
        />
      </Stack>
    </Paper>
  );
}