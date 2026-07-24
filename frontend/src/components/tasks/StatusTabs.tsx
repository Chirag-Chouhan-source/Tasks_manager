"use client";

import { Box } from "@mui/material";

import { Status } from "@/types";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import BugReportIcon from "@mui/icons-material/BugReport";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PendingIcon from "@mui/icons-material/Pending";

const STATUS_CONFIG: Record<
  Status,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  backlog: {
    label: "Backlog",
    icon: <AssignmentIcon sx={{ fontSize: 14 }} />,
  },
  todo: {
    label: "Todo",
    icon: <PendingIcon sx={{ fontSize: 14 }} />,
  },
  in_progress: {
    label: "In Progress",
    icon: <AutorenewIcon sx={{ fontSize: 14 }} />,
  },
  in_review: {
    label: "In Review",
    icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  },
  qa: {
    label: "QA",
    icon: <BugReportIcon sx={{ fontSize: 14 }} />,
  },
  completed: {
    label: "Completed",
    icon: <DoneAllIcon sx={{ fontSize: 14 }} />,
  },
};

type StatusTabsProps = {
  statusTabs: Array<Status | "">;
  activeStatus: Status | "";
  onStatusChange: (status: Status | "") => void;
};

export default function StatusTabs({
  statusTabs,
  activeStatus,
  onStatusChange,
}: StatusTabsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        whiteSpace: "nowrap",
        pb: 0.5,
        borderBottom: "1px solid #e5e7eb",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {statusTabs.map((status) => {
        const isActive = activeStatus === status;
        const config = status ? STATUS_CONFIG[status] : undefined;

        return (
          <Box
            key={status || "all"}
            onClick={() => onStatusChange(status)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              position: "relative",
              cursor: "pointer",
              pb: 1,
              px: 0.5,
              fontSize: "13px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#2563eb" : "#475569",
              flexShrink: 0,
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                bottom: 0,
                width: isActive ? "100%" : "0%",
                height: "2px",
                backgroundColor: "#2563eb",
              },
            }}
          >
            {status ? config?.icon : null}

            {status ? config?.label : "All"}
          </Box>
        );
      })}
    </Box>
  );
}
