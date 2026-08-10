import { Box, TextField, Typography } from "@mui/material";

import { useEffect, useState } from "react";

import {
  useUpdateSubtaskMutation,
  useUpdateTaskMutation,
} from "@/services/api";

type Props = {
  entityId: number;
  entityType: "task" | "subtask";
  value: string | null;
  disabled: boolean;
};

export default function DescriptionField({
  entityId,
  entityType,
  value,
  disabled,
}: Props) {
  const [updateTask] = useUpdateTaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(value || "");

  useEffect(() => {
    setDescription(value || "");
  }, [value]);

  const handleSave = async () => {
    const trimmed = description.trim();

    if (trimmed === value) {
      setIsEditing(false);
      return;
    }

    try {
      if (entityType === "task") {
        await updateTask({
          id: entityId,
          data: { description: trimmed },
        }).unwrap();
      } else {
        await updateSubtask({
          id: entityId,
          data: { description: trimmed },
        }).unwrap();
      }

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setDescription(value ?? "");
      setIsEditing(false);
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        bgcolor: isEditing ? "#fff" : "#f9fafb",
        cursor: disabled ? "default" : "pointer",

        "&:hover": {
          backgroundColor: disabled
            ? undefined
            : !isEditing
              ? "#f3f4f6"
              : "#fff",
        },
      }}
      onClick={() => {
        if (!disabled && !isEditing) setIsEditing(true);
      }}
    >
      {!isEditing ? (
        <Typography
          sx={{
            fontSize: 14,
            whiteSpace: "pre-line",
            color: description ? "inherit" : "#6b7280",
          }}
        >
          {description ||
            (disabled ? "No description" : "Add a description...")}
        </Typography>
      ) : (
        <TextField
          multiline
          fullWidth
          autoFocus
          minRows={3}
          maxRows={3}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDescription(value ?? "");
              setIsEditing(false);
            }

            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              handleSave();
            }
          }}
          inputRef={(el) => {
            if (el) {
              const length = el.value.length;
              el.setSelectionRange(length, length);
            }
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },

            "& .MuiInputBase-root": {
              padding: 0,
            },

            "& textarea": {
              padding: 0,
              fontSize: 14,
              lineHeight: "1.5",
              resize: "vertical",
            },
          }}
        />
      )}
    </Box>
  );
}
