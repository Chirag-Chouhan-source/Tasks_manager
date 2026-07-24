"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Avatar,
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

import EmailIcon from "@mui/icons-material/Email";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { useGetRolesQuery, useUpdateUserMutation } from "@/services/api";

import InputField from "@/components/common/InputField";
import StatusSnackbar from "@/components/common/StatusSnackbar";

type Props = {
  open: boolean;
  onClose: () => void;
  user: any;
};

const editUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(255, "Username is too long"),

  email: z.string().trim().email("Invalid email address"),

  team_name: z.string().optional(),
  role_id: z.coerce.number().min(1, "Please select a role"),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function EditUserDialog({ open, onClose, user }: Props) {
  // Edit User
  const [updateUser] = useUpdateUserMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      email: "",
      team_name: "",
      role_id: 0,
    },
  });

  useEffect(() => {
    if (open && user) {
      reset({
        username: user.username || "",
        email: user.email || "",
        team_name: user.team_name || "",
        role_id: user.roles?.[0]?.id ?? 0,
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    try {
      await updateUser({
        userId: user.id,
        data,
      }).unwrap();

      setSnackbar({
        open: true,
        message: "User updated successfully",
        severity: "success",
      });

      onClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.data?.message || err?.data?.detail || "Failed to update user",
        severity: "error",
      });
    }
  };

  // Role Management
  const { data: roles } = useGetRolesQuery(undefined);

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

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
            Edit User
          </Typography>

          <Typography fontSize={13} color="text.secondary">
            Update user information
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 2 }}>
          <Box>
            <Box>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Avatar
                  sx={{
                    width: 160,
                    height: 160,
                    bgcolor: "#2563eb",
                    fontSize: 100,
                    fontWeight: 700,
                  }}
                >
                  {user?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
              </Box>

              <Box display="flex" flexDirection="column" gap={2.5}>
                <InputField
                  name="username"
                  control={control}
                  label="Username"
                  type="text"
                  icon={<PersonIcon />}
                  errors={errors}
                  required
                />

                <InputField
                  name="email"
                  control={control}
                  label="Email"
                  type="text"
                  icon={<EmailIcon />}
                  errors={errors}
                  required
                />

                <InputField
                  name="team_name"
                  control={control}
                  label="Team Name"
                  placeholder="Assign Team"
                  type="text"
                  icon={<GroupsIcon />}
                  errors={errors}
                />
                <InputField
                  name="role_id"
                  control={control}
                  label="Role"
                  type="select"
                  placeholder="Select Role"
                  errors={errors}
                  options={
                    roles?.map((role: any) => ({
                      label: role.name,
                      value: role.id,
                    })) || []
                  }
                />
              </Box>
            </Box>
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
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSubmit(onSubmit)}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              minWidth: 120,
            }}
          >
            Save
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
