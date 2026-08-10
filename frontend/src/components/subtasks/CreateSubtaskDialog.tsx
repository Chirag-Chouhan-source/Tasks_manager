"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";

import FlagIcon from "@mui/icons-material/Flag";
import TitleIcon from "@mui/icons-material/Title";

import { useGetUsersQuery } from "@/services/api";

import { STATUS_OPTIONS } from "@/constants/status";
import { User } from "@/types";
import InputField from "../common/InputField";
import StatusSnackbar from "../common/StatusSnackbar";
import UserField from "../common/UserField";

const subtaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(255, "Title cannot exceed 255 characters"),
  status: z.string(),
  users: z.array(z.number()).optional(),
});

type SubtaskFormData = z.infer<typeof subtaskSchema>;

export default function CreateSubtaskDialog({ open, onClose, onCreate }: any) {
  // Users

  const { data: users = [] } = useGetUsersQuery();

  const getUserNameById = (id: number) => {
    const user = users.find((u: User) => u.id === id);
    return user?.username || "";
  };

  // Create Subtasks
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubtaskFormData>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      title: "",
      status: "backlog",
      users: [],
    },
  });

  const [userError, setUserError] = useState("");
  const [titleError, setTitleError] = useState("");

  const onSubmit = async (data: SubtaskFormData) => {
    if (userError) return;

    try {
      await onCreate(data);

      setSnackbar({
        open: true,
        message: "Subtask created",
        severity: "success",
      });

      reset();
      setUserError("");
      setTitleError("");

      onClose();
    } catch (err: any) {
      let message = err?.data?.message || "Failed to create subtask";

      if (Array.isArray(message)) {
        message = message[0];
      }

      if (typeof message === "string") {
        message = message
          .replace(/^\d+:\s*/, "")
          .replace(/\(\d+\)/g, "")
          .trim();
      }

      setTitleError(message);
    }
  };

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Form Configuration

  const subtaskFormConfig = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      icon: <TitleIcon fontSize="small" />,
      extraError: titleError,
      onChangeExtra: () => setTitleError(""),
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      icon: <FlagIcon fontSize="small" />,
      options: STATUS_OPTIONS,
    },
  ];

  const renderField = (field: any) => {
    return (
      <InputField
        key={field.name}
        name={field.name}
        control={control}
        label={field.label}
        type={field.type}
        options={field.options}
        required={field.required}
        icon={field.icon}
        errors={errors}
        extraError={field.extraError}
        onChangeExtra={field.onChangeExtra}
      />
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              boxShadow: "0px 20px 50px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        {/* ✅ HEADER */}
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700} fontSize={18}>
            Create Subtask
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Add details for your subtask
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 2 }}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            {/* ✅ TITLE */}
            {subtaskFormConfig.map(renderField)}

            {/* ✅ USERS (SAME METHOD AS TASK) */}
            <UserField name="users" control={control} />
          </Box>
        </DialogContent>

        {/* ✅ ACTIONS */}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!!userError}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <StatusSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
