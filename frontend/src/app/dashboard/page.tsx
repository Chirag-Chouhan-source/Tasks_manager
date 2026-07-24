"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Box, Card, CardContent, Typography } from "@mui/material";

import { useGetDashboardStatsQuery } from "@/services/api";

import UILoader from "@/components/common/Loader";
import StatusSnackbar from "@/components/common/StatusSnackbar";

import { STATUS_CONFIG } from "@/constants/status";
import { hasToken } from "@/utils/auth";

const STATUS_COLORS = {
  backlog: "#f59e0b",
  todo: "#64748b",
  in_progress: "#2563eb",
  in_review: "#06b6d4",
  qa: "#8b5cf6",
  completed: "#22c55e",
};

export default function DashboardPage() {
  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data Fetching
  const { data, isLoading, isError } = useGetDashboardStatsQuery(undefined, {
    skip: !hasToken(),
  });

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    const status = searchParams.get("status");

    if (status === "login") {
      setSnackbar({
        open: true,
        message: "Login successful",
        severity: "success",
      });

      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Error Handling
  if (isError) {
    return <Typography color="error">Failed to load dashboard data</Typography>;
  }

  if (!data || isLoading) {
    return <UILoader type="subtask" />;
  }

  // Derived Data
  const totalUsers = data.total_users;
  const totalTasks = data.total_tasks;
  const totalSubtasks = data.total_subtasks;
  const statusCount = data.task_status_counts;

  return (
    <>
      <Box
        sx={{
          height: "100%",
          overflowY: "auto",
          p: 4,
          pb: 6,
          backgroundColor: "#f8fafc",
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              color: "#0f172a",
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Overview of users, tasks and project progress
          </Typography>
        </Box>

        {/* OVERVIEW */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(240px, 320px))",
            },
            gap: 2,
            mb: 4,
          }}
        >
          <DashboardCard
            label="Total Users"
            value={totalUsers}
            color="#2563eb"
          />

          <DashboardCard
            label="Total Tasks"
            value={totalTasks}
            color="#22c55e"
          />

          <DashboardCard
            label="Total Subtasks"
            value={totalSubtasks}
            color="#8b5cf6"
          />
        </Box>

        {/* STATUS SECTION */}
        <Box
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              mb: 3,
              fontSize: 18,
              color: "#0f172a",
            }}
          >
            Tasks by Status
          </Typography>

          <GridSection>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = statusCount[status] ?? 0;

              return (
                <DashboardCard
                  key={status}
                  label={config.label}
                  value={count}
                  color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}
                />
              );
            })}
          </GridSection>
        </Box>
      </Box>

      <StatusSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </>
  );
}

function GridSection({ children }: any) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

function DashboardCard({
  label,
  value,
  color = "#2563eb",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card
      sx={{
        height: 120,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 24px rgba(15,23,42,0.08)",
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          bgcolor: color,
        }}
      />

      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            color: "#64748b",
            fontSize: 13,
            fontWeight: 500,
            mb: 1,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1,
            color: "#0f172a",
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
