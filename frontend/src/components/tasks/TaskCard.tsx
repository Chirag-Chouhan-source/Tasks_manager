"use client";

import { useState } from "react";

import { STATUS_CONFIG } from "@/constants/status";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import UILoader from "@/components/common/Loader";

type TaskCardProps = {
  task: any;
  onClick?: () => void;
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  // Navigation
  const router = useRouter();

  // Task Overview
  const users = task.users || [];
  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];

  // Subtask Management
  const [expanded, setExpanded] = useState(false);
  const [loadingSubtaskId, setLoadingSubtaskId] = useState<number | null>(null);

  return (
    <>
      {loadingSubtaskId && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UILoader type="full" text="Opening subtask..." />
        </Box>
      )}

      <Card
        onClick={onClick}
        sx={{
          mb: 1.5,
          borderRadius: 2.5,
          width: "100%",
          height: "100%",

          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",

          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",

          cursor: "pointer",
          transition: "all 0.18s ease",

          "&:hover": {
            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
            transform: "translateY(-2px)",
          },
        }}
      >
        <CardContent sx={{ p: 1.6 }}>
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: 1.3,
                color: "#111827",
              }}
            >
              {task.title}
            </Typography>

            <Chip
              label={statusConfig?.label ?? task.status}
              color={statusConfig?.color ?? "default"}
              size="small"
              sx={{
                height: "20px",
                fontSize: "10px",
                borderRadius: "6px",
                fontWeight: 500,
              }}
            />
          </Box>

          {/* DESCRIPTION */}
          {task.description && (
            <Typography
              sx={{
                mt: 0.6,
                fontSize: "12px",
                color: "#6b7280",
                lineHeight: 1.3,
              }}
            >
              {task.description}
            </Typography>
          )}

          {/* ✅ ASSIGNEES (FIXED EMPTY STATE) */}
          <Box
            sx={{
              mt: 1.2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "11.5px",
                color: "#94a3b8",
              }}
            >
              Assignees
            </Typography>

            <Stack direction="row" spacing={-0.6} alignItems="center">
              {users.length === 0 ? (
                <>
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: "10px",
                      bgcolor: "#f1f5f9",
                      color: "#94a3b8",
                      border: "2px solid #fff",
                    }}
                  >
                    —
                  </Avatar>

                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      ml: 0.5,
                    }}
                  >
                    Unassigned
                  </Typography>
                </>
              ) : (
                <>
                  {users.slice(0, 3).map((user: any, i: number) => (
                    <Avatar
                      key={i}
                      sx={{
                        width: 22,
                        height: 22,
                        fontSize: "10px",
                        bgcolor: "#e2e8f0",
                        color: "#111827",
                        border: "2px solid #fff",
                      }}
                    >
                      {user.username[0]?.toUpperCase()}
                    </Avatar>
                  ))}

                  {users.length > 3 && (
                    <Avatar
                      sx={{
                        width: 22,
                        height: 22,
                        fontSize: "10px",
                        bgcolor: "#cbd5f5",
                        border: "2px solid #fff",
                      }}
                    >
                      +{users.length - 3}
                    </Avatar>
                  )}
                </>
              )}
            </Stack>
          </Box>

          {/* SUBTASK TOGGLE */}
          <Box
            onClick={(e) => {
              if (task.subtasks?.length > 0) {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }
            }}
            sx={{
              mt: 1,
              px: 1.2,
              py: 0.7,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: 1.8,
              backgroundColor: "#f8fafc",

              cursor: task.subtasks?.length ? "pointer" : "default",

              "&:hover": {
                backgroundColor:
                  task.subtasks?.length > 0 ? "#eef2f7" : "#f8fafc",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#334155",
              }}
            >
              {task.subtasks?.length > 0
                ? `Subtasks • ${task.subtasks.length}`
                : "No subtasks"}
            </Typography>

            {task.subtasks?.length > 0 && (
              <ExpandMoreIcon
                sx={{
                  fontSize: 16,
                  color: "#64748b",
                  transition: "transform 0.25s ease",
                  transform: expanded ? "rotate(180deg)" : "rotate(0)",
                }}
              />
            )}
          </Box>

          {/* SUBTASK LIST */}
          {task.subtasks?.length > 0 && (
            <Box
              sx={{
                maxHeight: expanded ? 280 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}
            >
              <Box sx={{ mt: 0.8 }}>
                {task.subtasks.map((sub: any) => (
                  <Box
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoadingSubtaskId(sub.id);
                      router.push(`/dashboard/subtasks/${sub.id}`);
                    }}
                    sx={{
                      px: 1.2,
                      py: 0.6,
                      borderRadius: 1.5,
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      mb: 0.5,
                      cursor: "pointer",

                      "&:hover": {
                        backgroundColor: "#eef2f7",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#334155",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      • {sub.title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
