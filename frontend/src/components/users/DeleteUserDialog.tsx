"use client";
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grow,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import StatusSnackbar from "@/components/common/StatusSnackbar";
import { useDeleteUserMutation } from "@/services/api";
import { User } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  user: User;
};

export default function DeleteUserDialog({ open, onClose, user }: Props) {
  const [deleteUser] = useDeleteUserMutation();

  const handleDelete = async () => {
    if (!user) return;

    try {
      await deleteUser(user.id).unwrap();

      setSnackbar({
        open: true,
        message: "User deleted successfully",
        severity: "success",
      });

      onClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.data?.message || err?.data?.detail || "Failed to delete user",
        severity: "error",
      });
    }
  };

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
            Delete User
          </Typography>

          <Typography fontSize={13} color="text.secondary">
            Delete account for <strong>{user?.username}</strong>
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ mt: 2 }}>
          <Typography>Are you sure you want to delete this user?</Typography>

          <Typography
            sx={{
              mt: 2,
              fontSize: 14,
              color: "text.secondary",
            }}
          >
            This action cannot be undone.
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: 14,
              color: "text.secondary",
            }}
          >
            Task and subtask assignments will be removed, but tasks and subtasks
            will remain.
          </Typography>
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
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleDelete}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Delete User
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
