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

import LockResetIcon from "@mui/icons-material/LockReset";

import { useChangePasswordMutation } from "@/services/api";

import InputField from "@/components/common/InputField";
import StatusSnackbar from "@/components/common/StatusSnackbar";

type Props = {
  open: boolean;
  onClose: () => void;
};

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),

    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain a special character",
      ),

    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordDialog({ open, onClose }: Props) {
  const [changePassword] = useChangePasswordMutation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      }).unwrap();

      setSnackbar({
        open: true,
        message: "Password changed successfully",
        severity: "success",
      });

      reset();

      onClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.data?.message ||
          err?.data?.detail ||
          "Failed to change password",
        severity: "error",
      });
    }
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const fields: {
    name: "current_password" | "new_password" | "confirm_password";
    label: string;
    type: "password";
    required: boolean;
    icon: React.ReactNode;
  }[] = [
    {
      name: "current_password",
      label: "Current Password",
      type: "password",
      required: true,
      icon: <LockResetIcon fontSize="small" />,
    },
    {
      name: "new_password",
      label: "New Password",
      type: "password",
      required: true,
      icon: <LockResetIcon fontSize="small" />,
    },
    {
      name: "confirm_password",
      label: "Confirm Password",
      type: "password",
      required: true,
      icon: <LockResetIcon fontSize="small" />,
    },
  ];

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
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700} fontSize={18}>
            Change Password
          </Typography>

          <Typography fontSize={13} color="text.secondary">
            Update your account password
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 2 }}>
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: "1px solid #bfdbfe",
              bgcolor: "#eff6ff",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                color: "#1e40af",
              }}
            >
              After changing your password, use the new password for future
              logins.
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2.5}>
            {fields.map((field) => (
              <InputField
                key={field.name}
                name={field.name}
                control={control}
                label={field.label}
                type={field.type}
                icon={field.icon}
                required={field.required}
                errors={errors}
              />
            ))}
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Typography fontWeight={600} fontSize={13} mb={1}>
              Password Requirements
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              • At least 8 characters
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              • One uppercase letter
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              • One lowercase letter
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              • One number
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              • One special character
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            startIcon={<LockResetIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

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
