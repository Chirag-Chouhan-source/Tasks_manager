"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { STATUS_COLUMNS, StatusKey } from "@/constants/status";
import { useGetKanbanTasksQuery } from "@/services/api";

import { Task } from "@/types";
import UILoader from "../common/Loader";
import { SortValue } from "../common/SortDropdown";
import TaskCard from "./TaskCard";

type TaskListProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  grouped?: boolean;
  onAddTask?: (status?: StatusKey) => void;
  canCreateTask: boolean;
  filters?: any;
  sort?: SortValue;
};

export default function TaskList({
  tasks,
  onTaskClick,
  grouped = true,
  onAddTask,
  canCreateTask,
  filters,
  sort,
}: TaskListProps) {
  // Task Board View
  const columns = STATUS_COLUMNS;

  const [columnPages, setColumnPages] = useState<Record<StatusKey, number>>({
    backlog: 1,
    todo: 1,
    in_progress: 1,
    in_review: 1,
    qa: 1,
    completed: 1,
  });

  const [columnData, setColumnData] = useState<Record<StatusKey, Task[]>>({
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    qa: [],
    completed: [],
  });

  const { data, isLoading, isFetching, error } = useGetKanbanTasksQuery({
    ...filters,

    sort_by: sort?.sort_by,
    sort_order: sort?.sort_order,

    backlog_page: columnPages.backlog,
    todo_page: columnPages.todo,
    in_progress_page: columnPages.in_progress,
    in_review_page: columnPages.in_review,
    qa_page: columnPages.qa,
    completed_page: columnPages.completed,
  });

  // Column Pagination
  const [loadingColumn, setLoadingColumn] = useState<StatusKey | null>(null);
  useEffect(() => {
    if (!isFetching) {
      setLoadingColumn(null);
    }
  }, [isFetching]);
  const [isRefreshingBoard, setIsRefreshingBoard] = useState(false);

  // Board Data Management
  const mergeUnique = (oldList: Task[] = [], newList: Task[] = []) => {
    const map = new Map();
    [...oldList, ...newList].forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!data) return;
    if (isFetching) return;
    setColumnData((prev) => ({
      backlog:
        columnPages.backlog === 1
          ? data.backlog.tasks
          : mergeUnique(prev.backlog, data.backlog.tasks),

      todo:
        columnPages.todo === 1
          ? data.todo.tasks
          : mergeUnique(prev.todo, data.todo.tasks),

      in_progress:
        columnPages.in_progress === 1
          ? data.in_progress.tasks
          : mergeUnique(prev.in_progress, data.in_progress.tasks),

      in_review:
        columnPages.in_review === 1
          ? data.in_review.tasks
          : mergeUnique(prev.in_review, data.in_review.tasks),

      qa:
        columnPages.qa === 1
          ? data.qa.tasks
          : mergeUnique(prev.qa, data.qa.tasks),

      completed:
        columnPages.completed === 1
          ? data.completed.tasks
          : mergeUnique(prev.completed, data.completed.tasks),
    }));
    setIsRefreshingBoard(false);
  }, [data, columnPages]);

  useEffect(() => {
    setIsRefreshingBoard(true);

    setColumnPages({
      backlog: 1,
      todo: 1,
      in_progress: 1,
      in_review: 1,
      qa: 1,
      completed: 1,
    });

    setColumnData({
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      qa: [],
      completed: [],
    });
  }, [filters, sort]);

  // Error handling
  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        Failed to load tasks
      </Box>
    );
  }

  if (!grouped) {
    return (
      <Box
        sx={{
          height: "100%",
          overflowY: "auto",
          pr: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignContent: "flex-start",
        }}
      >
        {tasks.map((task: Task) => (
          <Box
            key={task.id}
            sx={{
              width: {
                xs: "100%",
                sm: "280px",
              },
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            <TaskCard task={task} onClick={() => onTaskClick(task)} />
          </Box>
        ))}
      </Box>
    );
  }

  if (isLoading && !data) {
    return <UILoader type="task" text="Loading board..." />;
  }

  return (
    <Box
      className="kanban-container"
      sx={{
        display: "flex",
        gap: 2,
        height: "100%",
        px: 1,
        alignItems: "flex-start",
      }}
    >
      {columns.map((col) => {
        const colTasks = columnData[col.key] ?? [];
        const totalCount = data?.[col.key]?.count ?? 0;

        return (
          <Box
            className="kanban-column"
            key={col.key}
            sx={{
              backgroundColor: "#f1f5f9",
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              pt: 0,
              pb: 1,
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04), 0 4px 10px rgba(0,0,0,0.03)",
              alignSelf: "flex-start",

              "&::-webkit-scrollbar": {
                width: "0px",
              },
            }}
          >
            {/* HEADER */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                px: 1.5,
                mt: -1,
                pt: 1.2,
                pb: 0.8,
                backgroundColor: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <Box display="flex" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography sx={{ fontWeight: 600, fontSize: "13.5px" }}>
                    {col.title}
                  </Typography>
                  <Box sx={{ fontSize: "11px", px: 1.2, py: 0.3 }}>
                    {totalCount}
                  </Box>
                </Box>

                {canCreateTask && (
                  <Box
                    sx={{
                      cursor: "pointer",
                      px: 0.5,
                      borderRadius: 1,
                      "&:hover": { backgroundColor: "#e2e8f0" },
                    }}
                    onClick={() => onAddTask?.(col.key)}
                  >
                    +
                  </Box>
                )}
              </Box>
            </Box>

            {/* CONTENT */}
            <Box sx={{ px: 1, pt: 2, pb: 2 }}>
              {colTasks.length === 0 ? (
                <Box>No tasks</Box>
              ) : (
                <Box className="kanban-tasks">
                  {colTasks.map((task: Task) => (
                    <Box key={task.id} className="kanban-task-card">
                      <TaskCard task={task} onClick={() => onTaskClick(task)} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            {colTasks.length < totalCount && (
              <Box
                sx={{
                  mx: 1,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  borderRadius: 2,
                  border: "1px dashed #cbd5e1",
                  backgroundColor: "#f8fafc",
                  cursor: loadingColumn === col.key ? "default" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",

                  "&:hover": {
                    backgroundColor:
                      loadingColumn === col.key ? "#f8fafc" : "#e2e8f0",
                    borderColor:
                      loadingColumn === col.key ? "#cbd5e1" : "#94a3b8",
                    color: loadingColumn === col.key ? "#475569" : "#0f172a",
                  },
                }}
                onClick={() => {
                  if (loadingColumn) return;

                  setLoadingColumn(col.key);

                  setColumnPages((prev) => ({
                    ...prev,
                    [col.key]: prev[col.key] + 1,
                  }));
                }}
              >
                {loadingColumn === col.key ? "Loading" : "Load More Tasks"}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
