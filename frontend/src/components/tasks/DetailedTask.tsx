"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import UILoader from "../common/Loader";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import {
  useCreateSubtaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from "@/services/api";

import { useGetCurrentUserQuery } from "@/services/api";
import { hasPermission } from "@/utils/permission";

import CreateSubtaskDialog from "@/components/subtasks/CreateSubtaskDialog";
import CommentInput from "../comment/CommentInput";
import CommentList from "../comment/CommentList";
import AssigneeField from "../common/AssigneeField";
import StatusField from "../common/StatusField";
import SubtaskList from "../subtasks/SubtaskList";
import DescriptionField from "./DescriptionField";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(255, "Title cannot exceed 255 characters");

type Props = {
  task: any;
};

export default function DetailedTask({ task }: Props) {
  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Permissions
  const { data: currentUser } = useGetCurrentUserQuery(undefined);

  // Task Details
  const canUpdateTask = hasPermission(currentUser?.permissions, "task.update");
  const [updateTask] = useUpdateTaskMutation();
  const [title, setTitle] = useState(task.title);
  const [savedTitle, setSavedTitle] = useState(task.title);
  const [titleError, setTitleError] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleUpdateTitle = async () => {
    const trimmed = title.trim();

    const result = titleSchema.safeParse(trimmed);

    if (!result.success) {
      setTitle(task.title);
      setTitleError(result.error.errors[0].message);
      setTimeout(() => setTitleError(""), 3000);
      return;
    }

    if (trimmed === task.title) return;

    try {
      await updateTask({
        id: task.id,
        data: { title: trimmed },
      }).unwrap();
      setTitle(trimmed);
      setSavedTitle(trimmed);
      setTitleError("");
      setIsEditingTitle(false);
    } catch (err: any) {
      setTitleError(err?.data?.detail || "Task title must be unique");
      setTimeout(() => setTitleError(""), 3000);
    }
  };

  // Subtask Management
  const [createSubtask] = useCreateSubtaskMutation();
  const [openSubtask, setOpenSubtask] = useState(false);

  const handleCreateSubtask = async (data: any) => {
    await createSubtask({
      taskId: task.id,
      data,
    }).unwrap();
  };

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (searchParams.get("subtask_deleted") === "true") {
      setSnackbar({
        open: true,
        message: "Subtask deleted successfully ",
      });

      // remove param after showing
      router.replace(`/dashboard/tasks/${task.id}`);
    }
  }, [searchParams, router, task.id]);

  // Task Deletion
  const [deleteTask] = useDeleteTaskMutation();

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleteError("");

    try {
      setIsDeleting(true);

      await deleteTask(task.id).unwrap();

      router.replace("/dashboard/tasks?deleted=true");
    } catch (err: any) {
      setIsDeleting(false);

      let message =
        err?.data?.detail || "Cannot delete task because it has subtasks";

      if (typeof message === "string") {
        message = message.replace(/^\d+:\s*/, "").trim();
      }

      setDeleteError(message);
    }
  };

  // Error Handling

  if (isDeleting) {
    return <UILoader type="full" text="Deleting task..." />;
  }

  if (!task) return null;

  return (
    <>
      <Box sx={{ height: "100%", display: "flex", p: 2, bgcolor: "#edeff0" }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1400,
            mx: "auto",
            bgcolor: "#fff",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,

              position: "sticky",
              top: 0,
              zIndex: 10,

              backgroundColor: "#fff",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            {!isEditingTitle ? (
              <Typography
                onClick={() => {
                  if (canUpdateTask) {
                    setIsEditingTitle(true);
                  }
                }}
                sx={{
                  fontWeight: 600,
                  fontSize: 18,
                  cursor: canUpdateTask ? "pointer" : "default",
                }}
              >
                {title}
              </Typography>
            ) : (
              <Box sx={{ width: "100%" }}>
                <TextField
                  autoFocus
                  variant="standard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
                  onBlur={() => {
                    setTitle(savedTitle);
                    setIsEditingTitle(false);
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      disableUnderline: true,
                    },
                  }}
                />

                {titleError && (
                  <Typography
                    color="error"
                    sx={{
                      fontSize: 12,
                      mt: 0.5,
                    }}
                  >
                    {titleError}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* MAIN */}
          <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Row label="Assignee">
                <AssigneeField
                  entityId={task.id}
                  entityType="task"
                  users={task.users}
                  disabled={!canUpdateTask}
                />
              </Row>

              <Row label="Status">
                <StatusField
                  entityId={task.id}
                  entityType="task"
                  value={task.status}
                  disabled={!canUpdateTask}
                />
              </Row>

              <Row label="Sprint">{task.sprint || "—"}</Row>

              <Divider />

              <Typography
                sx={{
                  fontSize: 16,
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                Description
              </Typography>

              <DescriptionField
                entityId={task.id}
                entityType="task"
                value={task.description}
                disabled={!canUpdateTask}
              />

              <Divider />

              <SubtaskList
                taskId={task.id}
                onAddClick={() => setOpenSubtask(true)}
                canCreateSubtask={hasPermission(
                  currentUser?.permissions,
                  "subtask.create",
                )}
                canDeleteSubtask={hasPermission(
                  currentUser?.permissions,
                  "subtask.delete",
                )}
              />

              <Divider />

              <Box
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 3,
                  p: 2,
                  bgcolor: "#fafafa",
                  mt: 1,
                }}
              >
                <CommentList comments={task.comments?.data || []} />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: "1px solid #d8d8d8",
              bgcolor: "#fafafa",
              p: 1.2,
              flexShrink: 0,
            }}
          >
            <CommentInput
              entityId={task.id}
              entityType="task"
              rightSlot={
                hasPermission(currentUser?.permissions, "task.delete") && (
                  <Button
                    sx={{
                      textTransform: "capitalize",
                      height: 40,
                      flexShrink: 0,
                    }}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlinedIcon />}
                    onClick={() => {
                      setDeleteError("");
                      setOpenDelete(true);
                    }}
                  >
                    Delete Task
                  </Button>
                )
              }
            />
          </Box>

          <CreateSubtaskDialog
            open={openSubtask}
            onClose={() => setOpenSubtask(false)}
            onCreate={handleCreateSubtask}
          />
        </Box>
      </Box>

      {/* ✅ SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* DELETE TASK DIALOG */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Task</DialogTitle>

        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            Are you sure you want to delete this task?
          </Typography>

          {deleteError && (
            <Typography color="error" mt={1}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ✅ ✅ ✅ ROW FUNCTION (UNCHANGED — INCLUDED)
function Row({ label, children }: any) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 2,
      }}
    >
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}
