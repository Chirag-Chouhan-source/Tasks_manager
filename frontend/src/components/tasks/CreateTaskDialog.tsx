"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
  Grow,
  Typography,
} from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";
import FlagIcon from "@mui/icons-material/Flag";
import TimelineIcon from "@mui/icons-material/Timeline";
import TitleIcon from "@mui/icons-material/Title";

import { STATUS_OPTIONS } from "@/constants/status";
import InputField from "../common/InputField";
import StatusSnackbar from "../common/StatusSnackbar";
import UserField from "../common/UserField";

// ✅ TYPES
type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  defaultStatus?: string; // ✅ already added earlier
};

// ✅ SCHEMA
const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot be that long"),
  description: z.string().optional(),
  status: z.string(),
  sprint: z.string().optional(),
  users: z.array(z.number()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function CreateTaskDialog({
  open,
  onClose,
  onCreate,
  defaultStatus,
}: Props) {
  // Create Tasks
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "backlog",
      sprint: "",
      users: [],
    },
  });

  const [userError, setUserError] = useState("");
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        description: "",
        status: defaultStatus || "backlog",
        sprint: "",
        users: [],
      });

      setUserError("");
      setTitleError("");
    }
  }, [open, defaultStatus, reset]);

  useEffect(() => {
    if (!titleError) return;

    const timer = setTimeout(() => {
      setTitleError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [titleError]);

  const onSubmit = async (data: TaskFormData) => {
    if (userError) return;

    try {
      await onCreate(data);

      setSnackbar({
        open: true,
        message: "Task created",
        severity: "success",
      });

      reset();
      setUserError("");
      setTitleError("");

      onClose();
    } catch (err: any) {
      let message = err?.data?.detail || "Failed to create task";

      if (Array.isArray(message)) message = message[0];

      if (typeof message === "string") {
        message = message.replace(/^\d+:\s*/, "").trim();
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

  // Form configuration
  const taskFormConfig = [
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
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      icon: <DescriptionIcon fontSize="small" />,
    },

    // ✅ grouped fields (very important)
    {
      type: "group",
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select",
          icon: <FlagIcon fontSize="small" />,
          options: STATUS_OPTIONS,
        },
        {
          name: "sprint",
          label: "Sprint",
          type: "text",
          icon: <TimelineIcon fontSize="small" />,
        },
      ],
    },
  ];

  const renderField = (field: any) => {
    if (field.type === "group") {
      return (
        <Box key={field.name || Math.random()} display="flex" gap={2}>
          {field.fields.map((subField: any) => renderField(subField))}
        </Box>
      );
    }

    return (
      <InputField
        key={field.name}
        name={field.name}
        control={control}
        label={field.label}
        type={field.type}
        options={field.options}
        required={field.required}
        rows={field.rows}
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
        slots={{
          transition: Grow,
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              boxShadow: "0px 20px 50px rgba(0,0,0,0.15)",
            },
          },

          backdrop: {
            sx: {
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0,0,0,0.25)",
            },
          },
        }}
      >
        {/* ✅ HEADER */}
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700} fontSize={18}>
            Create Task
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Add details for your task
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 2 }}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            {taskFormConfig.map(renderField)}
            <UserField name="users" control={control} />
          </Box>
        </DialogContent>

        {/* ✅ ACTIONS */}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!!userError}
            sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
          >
            Create Task
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
