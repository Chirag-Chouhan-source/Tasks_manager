"use client";

import {
  Avatar,
  Box,
  Button,
  Chip,
  TextField,
  Typography,
} from "@mui/material";

import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

import { useEffect, useState } from "react";

import StatusSnackbar from "@/components/common/StatusSnackbar";
import ChangePasswordDialog from "@/components/users/ChangePasswordDialog";
import { ROLE_CONFIG } from "@/constants/roles";
import { useGetCurrentUserQuery, useUpdateMeMutation } from "@/services/api";

import { CurrentUser } from "@/types";

export default function AccountPage() {
  // API
  const { data: user } = useGetCurrentUserQuery(undefined) as {
    data?: CurrentUser;
  };
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  // Profile Editing
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateMe({
        username,
        email,
      }).unwrap();
      setIsEditing(false);

      setSnackbar({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || "Failed to update profile",
        severity: "error",
      });
    }
  };

  // Security
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Guard Cluase
  if (!user) return null;

  // Derived Values
  const hasChanges = username !== user.username || email !== user.email;
  const roleName = user.roles?.[0] || "No Role";
  const roleConfig = ROLE_CONFIG[roleName] ?? ROLE_CONFIG.default;

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100%",
        background: "linear-gradient(180deg, #f8fafc 0%, #edf4ff 100%)",
      }}
    >
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          My Account
        </Typography>

        <Typography
          sx={{
            color: "#64748b",
            fontSize: 14,
          }}
        >
          Manage your profile and workspace settings.
        </Typography>
      </Box>

      {/* MAIN PROFILE HERO */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",

          p: 4,

          borderRadius: 6,

          background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)",

          color: "#fff",

          boxShadow: "0 24px 60px rgba(37,99,235,.25)",

          mb: 3,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -50,
            top: -50,

            width: 220,
            height: 220,

            borderRadius: "50%",

            background: "rgba(255,255,255,.08)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <Avatar
            sx={{
              width: 90,
              height: 90,

              fontSize: 40,
              fontWeight: 700,

              bgcolor: "rgba(255,255,255,.15)",

              border: "3px solid rgba(255,255,255,.25)",

              mb: 2,
            }}
          >
            {user.username.charAt(0)?.toUpperCase()}
          </Avatar>

          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {user.username}
          </Typography>

          <Typography
            sx={{
              opacity: 0.85,
              mt: 1,
            }}
          >
            {user.email}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={roleName}
              sx={{
                bgcolor: "rgba(255,255,255,.15)",
                color: "#fff",

                border: "1px solid rgba(255,255,255,.15)",
              }}
            />

            <Chip
              label={user.team_name || "No Team Assigned"}
              sx={{
                bgcolor: "rgba(255,255,255,.15)",

                color: "#fff",

                border: "1px solid rgba(255,255,255,.15)",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* STATS GRID */}
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },

          gap: 3,

          mb: 3,
        }}
      >
        {/* PROFILE */}
        <Box
          sx={{
            p: 3,

            borderRadius: 5,

            bgcolor: "#fff",

            border: "1px solid #e2e8f0",

            boxShadow: "0 10px 30px rgba(15,23,42,.04)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PersonOutlineRoundedIcon color="primary" />

              <Typography fontWeight={700}>Profile</Typography>
            </Box>
            {!isEditing && (
              <Button
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{
                  textTransform: "none",
                }}
              >
                Edit
              </Button>
            )}
          </Box>
          {!isEditing ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Username
              </Typography>

              <Typography fontWeight={600} mb={3}>
                {user.username}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>

              <Typography fontWeight={600}>{user.email}</Typography>
            </>
          ) : (
            <>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />

              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 2,
                }}
              >
                <Button
                  onClick={() => {
                    setUsername(user.username);
                    setEmail(user.email);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* ORGANIZATION */}
        <Box
          sx={{
            p: 3,

            borderRadius: 5,

            bgcolor: "#fff",

            border: "1px solid #e2e8f0",

            boxShadow: "0 10px 30px rgba(15,23,42,.04)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <GroupsRoundedIcon color="primary" />

            <Typography fontWeight={700}>Organization</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Team
          </Typography>

          <Typography fontWeight={600} mb={3}>
            {user.team_name || "Not Assigned"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Role
          </Typography>

          <Box mt={1}>
            <Chip
              label={roleName}
              size="small"
              sx={{
                bgcolor: roleConfig.bg,
                color: roleConfig.color,

                border: `1px solid ${roleConfig.color}20`,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* QUICK ACTIONS */}
      <Box
        sx={{
          bgcolor: "#fff",

          border: "1px solid #e2e8f0",

          borderRadius: 5,

          boxShadow: "0 10px 30px rgba(15,23,42,.04)",

          overflow: "hidden",
        }}
      >
        <Box
          onClick={() => setPasswordOpen(true)}
          sx={{
            p: 3,

            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",

            cursor: "pointer",

            transition: "background .2s ease",

            "&:hover": {
              background: "#f8fafc",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <SecurityRoundedIcon color="primary" />

            <Box>
              <Typography fontWeight={700}>Security</Typography>

              <Typography variant="body2" color="text.secondary">
                Password and authentication settings
              </Typography>
            </Box>
          </Box>

          <ArrowForwardIosRoundedIcon
            sx={{
              fontSize: 16,
              color: "#94a3b8",
            }}
          />
        </Box>
      </Box>
      <ChangePasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
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
    </Box>
  );
}
