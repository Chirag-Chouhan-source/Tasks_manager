"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Avatar,
  Box,
  Divider,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

import { Manrope } from "next/font/google";

import { useGetCurrentUserQuery, useLogoutUserMutation } from "@/services/api";
import { hasToken } from "@/utils/auth";

import { CurrentUser } from "@/types";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function UserAvatarMenu() {
  // Navigation
  const router = useRouter();

  // User Account
  const { data: user } = useGetCurrentUserQuery(undefined, {
    skip: !hasToken(),
  }) as { data?: CurrentUser };

  // User Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Logout
  const [logoutUser] = useLogoutUserMutation();

  const handleLogout = async () => {
    handleClose();

    const refreshToken = localStorage.getItem("refresh_token");

    try {
      await logoutUser(refreshToken).unwrap();
    } catch {}

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.replace("/login?status=logout");
  };

  // Error Handling
  if (!user) {
    return null;
  }

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.5,
          py: 0.8,
          borderRadius: 2,
          cursor: "pointer",

          transition: "all 0.15s ease",

          "&:hover": {
            backgroundColor: "#f3f4f6",
          },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: 14,
            backgroundColor: "#2563eb",
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </Avatar>

        <Typography
          className={manrope.className}
          sx={{
            fontSize: "14px",
            color: "#374151",
            fontWeight: 500,
          }}
        >
          {user.username}
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: "0px 10px 30px rgba(0,0,0,0.1)",
              minWidth: 200,
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {user.username}
          </Typography>

          <Typography
            sx={{
              fontSize: 12,
              color: "#64748b",
            }}
          >
            {user.email}
          </Typography>
        </Box>

        <Divider />

        <MenuItem
          onClick={() => {
            handleClose();
            router.push("/dashboard/users/account");
          }}
        >
          My Account
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: "#ef4444",
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
