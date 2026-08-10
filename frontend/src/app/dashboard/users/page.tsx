"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { useGetCurrentUserQuery, useGetUsersQuery } from "@/services/api";

import { hasPermission } from "@/utils/permission";

import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import EditUserDialog from "@/components/users/EditUserDialog";

import { ROLE_CONFIG } from "@/constants/roles";

import { CurrentUser, User } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data, isError } = useGetUsersQuery();

  const { data: currentUser, isLoading: isUserLoading } =
    useGetCurrentUserQuery(undefined) as {
      data?: CurrentUser;
      isLoading: boolean;
    };

  const canEditUsers = hasPermission(currentUser?.permissions, "user.update");

  const canDeleteUsers = hasPermission(currentUser?.permissions, "user.delete");

  const canManageUsers = canEditUsers || canDeleteUsers;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [openEditDialog, setOpenEditDialog] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const gridColumns = canManageUsers ? "2fr 2fr 1fr 1fr" : "2fr 2fr 1fr";

  useEffect(() => {
    if (
      !isUserLoading &&
      currentUser &&
      !hasPermission(currentUser.permissions, "user.view")
    ) {
      router.replace("/dashboard");
    }
  }, [currentUser, isUserLoading, router]);

  if (
    !isUserLoading &&
    currentUser &&
    !hasPermission(currentUser.permissions, "user.view")
  ) {
    return null;
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Error fetching users</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100%",
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          background: "linear-gradient(to bottom, #f8fafc, #ffffff)",
        }}
      >
        {/* PAGE HEADER */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: "#0f172a",
              fontSize: {
                xs: "1.6rem",
                sm: "2rem",
                md: "2.25rem",
              },
            }}
          >
            User Management
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#64748b",
              fontSize: {
                xs: 13,
                sm: 14,
              },
            }}
          >
            Manage user accounts, profile information, and security settings.
          </Typography>
        </Box>

        <Box
          sx={{
            background: "#fff",
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
          }}
        >
          {/* Desktop Header */}
          {!isMobile && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: gridColumns,
                px: 3,
                py: 2,
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                fontWeight: 600,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              <Box>User</Box>
              <Box>Email</Box>
              <Box>Role</Box>
              {canManageUsers && <Box>Actions</Box>}
            </Box>
          )}

          {/* USERS */}
          <Box>
            {data
              ?.filter((user: User) => user.id !== currentUser?.id)
              .map((user: User) => {
                const roleName = user.roles?.[0]?.name;

                const roleConfig = ROLE_CONFIG[roleName] ?? ROLE_CONFIG.default;

                return (
                  <Box key={user.id}>
                    {/* MOBILE CARD */}
                    {isMobile ? (
                      <Box
                        sx={{
                          p: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 2,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              fontWeight: 600,
                              background:
                                "linear-gradient(135deg,#2563eb,#7c3aed)",
                            }}
                          >
                            {user.username?.charAt(0)?.toUpperCase()}
                          </Avatar>

                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: "#0f172a",
                              }}
                            >
                              {user.username}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#64748b",
                                wordBreak: "break-word",
                              }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label={roleName || "Assign Role"}
                          size="small"
                          sx={{
                            mb: 2,
                            bgcolor: roleName ? roleConfig.bg : "#f8fafc",
                            color: roleName ? roleConfig.color : "#94a3b8",
                            border: `1px solid ${
                              roleName ? `${roleConfig.color}20` : "#cbd5e1"
                            }`,
                            fontWeight: 600,
                          }}
                        />

                        {canManageUsers && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            {canEditUsers && (
                              <Button
                                startIcon={<EditOutlinedIcon />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenEditDialog(true);
                                }}
                                sx={{
                                  minWidth: 80,
                                  height: 40,
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 500,
                                  background:
                                    "linear-gradient(135deg,#2563eb,#3b82f6)",
                                  color: "#fff",

                                  "&:hover": {
                                    background:
                                      "linear-gradient(135deg,#1d4ed8,#2563eb)",
                                  },
                                }}
                              >
                                Edit
                              </Button>
                            )}

                            {canDeleteUsers && (
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenDeleteDialog(true);
                                }}
                                sx={{
                                  minWidth: 80,
                                  height: 40,
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 500,
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      /* DESKTOP ROW */
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: gridColumns,
                          alignItems: "center",
                          px: 3,
                          py: 2,
                          transition: "all .2s ease",

                          "&:hover": {
                            background: "#f8fafc",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              fontWeight: 600,
                              background:
                                "linear-gradient(135deg,#2563eb,#7c3aed)",
                            }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>

                          <Typography
                            sx={{
                              fontWeight: 600,
                            }}
                          >
                            {user.username}
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: 14,
                          }}
                        >
                          {user.email}
                        </Typography>

                        <Chip
                          label={roleName || "Assign Role"}
                          size="small"
                          sx={{
                            width: "fit-content",
                            bgcolor: roleName ? roleConfig.bg : "#f8fafc",

                            color: roleName ? roleConfig.color : "#94a3b8",

                            border: `1px solid ${
                              roleName ? `${roleConfig.color}20` : "#cbd5e1"
                            }`,

                            fontWeight: 600,
                          }}
                        />

                        {canManageUsers && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                            }}
                          >
                            {canEditUsers && (
                              <Button
                                size="small"
                                startIcon={<EditOutlinedIcon />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenEditDialog(true);
                                }}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 2,
                                }}
                              >
                                Edit
                              </Button>
                            )}

                            {canDeleteUsers && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenDeleteDialog(true);
                                }}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 2,
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    <Divider />
                  </Box>
                );
              })}
          </Box>
        </Box>
      </Box>

      {selectedUser && (
        <DeleteUserDialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          user={selectedUser}
        />
      )}

      {selectedUser && (
        <EditUserDialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </>
  );
}
