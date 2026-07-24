"use client";

import SendIcon from "@mui/icons-material/Send";
import { Avatar, Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";

import {
  useAddSubtaskCommentMutation,
  useAddTaskCommentMutation,
  useGetCurrentUserQuery,
} from "@/services/api";

import { CurrentUser } from "@/types";

type Props = {
  entityId: number;
  entityType: "task" | "subtask";
  rightSlot?: React.ReactNode;
};

export default function CommentInput({
  entityId,
  entityType,
  rightSlot,
}: Props) {
  // API
  const [addTaskComment, { isLoading: isAddingTask }] =
    useAddTaskCommentMutation();
  const [addSubtaskComment, { isLoading: isAddingSubtask }] =
    useAddSubtaskCommentMutation();
  const { data: currentUser } = useGetCurrentUserQuery(undefined) as {
    data?: CurrentUser;
  };

  // Comment State
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // Derived Data
  const isLoading = isAddingTask || isAddingSubtask;

  // Comment Action
  const handleAddComment = async () => {
    if (!text.trim()) return;

    const trimmed = text.trim();

    if (!trimmed) {
      setError("Comment cannot be empty");
      return;
    }

    if (trimmed.length > 500) {
      setError("Comment cannot exceed 500 characters");
      return;
    }

    setError("");

    try {
      if (entityType === "task") {
        await addTaskComment({
          taskId: entityId,
          data: {
            content: text,
            user_id: currentUser?.id,
          },
        }).unwrap();
      } else {
        await addSubtaskComment({
          subtaskId: entityId,
          data: {
            content: text,
            user_id: currentUser?.id,
          },
        }).unwrap();
      }

      setText("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flex: 1,
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: 14,
            bgcolor: "#2563eb",
            mt: 0.5,
            flexShrink: 0,
          }}
        >
          {currentUser?.username?.charAt(0).toUpperCase() || "U"}
        </Avatar>
        <TextField
          multiline
          minRows={1}
          maxRows={3}
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          fullWidth
          size="small"
          error={!!error}
          helperText={error}
          slotProps={{
            input: {
              endAdornment: (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "text.secondary",
                    alignSelf: "flex-end",
                    mb: 0.5,
                  }}
                >
                  {text.length}/500
                </Typography>
              ),
            },
          }}
        />

        <Button
          sx={{
            textTransform: "capitalize",
            height: 40,

            minWidth: 120,
            flexShrink: 0,
          }}
          variant="contained"
          disabled={isLoading}
          onClick={handleAddComment}
          startIcon={<SendIcon />}
        >
          {isLoading ? "Posting..." : "Post"}
        </Button>
      </Box>

      {rightSlot && (
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {rightSlot}
        </Box>
      )}
    </Box>
  );
}
