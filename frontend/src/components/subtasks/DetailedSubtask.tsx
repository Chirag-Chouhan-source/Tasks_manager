"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import {
  useDeleteSubtaskMutation,
  useGetCurrentUserQuery,
  useUpdateSubtaskMutation,
} from "@/services/api";

import { hasPermission } from "@/utils/permission";

import { CurrentUser, Subtask } from "@/types";
import CommentInput from "../comment/CommentInput";
import CommentList from "../comment/CommentList";
import AssigneeField from "../common/AssigneeField";
import StatusField from "../common/StatusField";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(255, "Title cannot exceed 255 characters");

type Props = {
  subtask: Subtask;
};

export default function DetailedSubtask({ subtask }: Props) {
  // Navigation
  const router = useRouter();

  // API
  const [deleteSubtask] = useDeleteSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const { data: currentUser } = useGetCurrentUserQuery(undefined) as {
    data?: CurrentUser;
  };

  // Permissions
  const canUpdateSubtask = hasPermission(
    currentUser?.permissions,
    "subtask.update",
  );

  const canDeleteSubtask = hasPermission(
    currentUser?.permissions,
    "subtask.delete",
  );

  // Edit Title
  const [title, setTitle] = useState(subtask.title);
  const [titleError, setTitleError] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleUpdateTitle = async () => {
    const trimmed = title.trim();

    const result = titleSchema.safeParse(trimmed);

    if (!result.success) {
      setTitle(subtask.title);
      setTitleError(result.error.errors[0].message);

      setTimeout(() => {
        setTitleError("");
      }, 3000);

      return;
    }

    if (trimmed === subtask.title) {
      setIsEditingTitle(false);
      return;
    }

    const previousTitle = subtask.title;

    try {
      await updateSubtask({
        id: subtask.id,
        data: { title: trimmed },
      }).unwrap();

      setTitleError("");
      setIsEditingTitle(false);
    } catch (err: any) {
      let message =
        err?.data?.message || err?.error || "Subtask title must be unique";

      if (typeof message === "string") {
        message = message.replace(/^\d+:\s*/, "").trim();
      }

      setTitle(previousTitle);
      setTitleError(message);
      setIsEditingTitle(false);

      setTimeout(() => {
        setTitleError("");
      }, 3000);
    }
  };

  // Delete Subtask
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setDeleteError("");

    try {
      await deleteSubtask(subtask.id).unwrap();
      router.replace(
        `/dashboard/tasks/${subtask.task_id}?subtask_deleted=true`,
      );
      router.refresh();
    } catch (err: any) {
      let message = err?.data?.message || "Cannot delete subtask";

      if (typeof message === "string") {
        message = message.replace(/^\d+:\s*/, "").trim();
      }

      setDeleteError(message);
    }
  };

  // Error Handling
  if (!subtask) return null;

  return (
    <>
      <Box
        sx={{
          height: "100%",
          display: "flex",
          overflow: "hidden",
          backgroundColor: "#edeff0",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>

            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {!isEditingTitle ? (
                <Typography
                  onClick={() => {
                    if (canUpdateSubtask) {
                      setIsEditingTitle(true);
                      setTitle(subtask.title);
                    }
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: 18,
                    cursor: canUpdateSubtask ? "pointer" : "default",
                  }}
                >
                  {title}
                </Typography>
              ) : (
                <TextField
                  autoFocus
                  variant="standard"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateTitle();
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={() => {
                    setTitle(subtask.title);
                    setIsEditingTitle(false);
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      disableUnderline: true,
                    },
                  }}
                  sx={{
                    fontSize: 18,
                    fontWeight: 400,
                  }}
                />
              )}

              {titleError && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#dc2626",
                    mt: 0.5,
                  }}
                >
                  {titleError}
                </Typography>
              )}
            </Box>
          </Box>

          {/* MAIN CONTENT (UNCHANGED) */}
          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflowY: "auto",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Row label="Assignee">
                  <AssigneeField
                    entityId={subtask.id}
                    entityType="subtask"
                    users={subtask.users}
                    disabled={!canUpdateSubtask}
                  />
                </Row>

                <Row label="Status">
                  <StatusField
                    entityId={subtask.id}
                    entityType="subtask"
                    value={subtask.status}
                    disabled={!canUpdateSubtask}
                  />
                </Row>

                <Row label="Sprint">{subtask.sprint || "—"}</Row>
              </Box>

              <Divider />
            </Box>

            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 3,
                p: 2,
                bgcolor: "#fafafa",
                mt: 2,
              }}
            >
              <CommentList comments={subtask.comments?.data || []} />
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
              entityId={subtask.id}
              entityType="subtask"
              rightSlot={
                canDeleteSubtask && (
                  <Button
                    sx={{
                      textTransform: "capitalize",
                      height: "auto",
                    }}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlinedIcon />}
                    onClick={() => {
                      setDeleteError("");
                      setOpenDelete(true);
                    }}
                  >
                    Delete Subtask
                  </Button>
                )
              }
            />
          </Box>
        </Box>
      </Box>

      {/* DELETE DIALOG */}
      <Dialog
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setDeleteError("");
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Subtask</DialogTitle>

        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            Are you sure you want to delete this subtask? This action cannot be
            undone.
          </Typography>

          {deleteError && (
            <Box
              sx={{
                mt: 2,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: "#fee2e2",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "#dc2626" }}>
                {deleteError}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenDelete(false);
              setDeleteError("");
            }}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ textTransform: "none" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Row({ label, children }: any) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        alignItems: "center",
        columnGap: 2,
      }}
    >
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
        {label}
      </Typography>

      <Box sx={{ fontSize: 14 }}>{children}</Box>
    </Box>
  );
}
