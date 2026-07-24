"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, Box, Button, Chip, Divider, Typography } from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { useGetCurrentUserQuery, useGetUsersQuery } from "@/services/api";

import { hasPermission } from "@/utils/permission";

import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import EditUserDialog from "@/components/users/EditUserDialog";

import { ROLE_CONFIG } from "@/constants/roles";

import { CurrentUser, User } from "@/types";

export default function UsersPage() {
  // Navigation
  const router = useRouter();

  // API
  const { data, isError } = useGetUsersQuery();
  const { data: currentUser, isLoading: isUserLoading } =
    useGetCurrentUserQuery(undefined) as {
      data?: CurrentUser;
      isLoading: boolean;
    };

  // Permission
  const canEditUsers = hasPermission(currentUser?.permissions, "user.update");
  const canDeleteUsers = hasPermission(currentUser?.permissions, "user.delete");
  const canManageUsers = canEditUsers || canDeleteUsers;

  // User Action
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Layout
  const gridColumns = canManageUsers
    ? "300px 300px 300px 300px"
    : "500px 500px 500px";

  // Security and Redirects
  useEffect(() => {
    if (
      !isUserLoading &&
      currentUser &&
      !hasPermission(currentUser.permissions, "user.view")
    ) {
      router.replace("/dashboard");
    }
  }, [currentUser, isUserLoading, router]);

  // Error Handling
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
          height: "100%",
          p: 3,
          background: "linear-gradient(to bottom, #edeeef, #ffffff)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            User Management
          </Typography>

          <Typography
            sx={{
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Manage user accounts, profile information, and security settings.
          </Typography>
        </Box>

        {/* CONTAINER */}
        <Box
          sx={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              px: 3,
              py: 2,
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              fontSize: 13,
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            <Box>User</Box>
            <Box>Email</Box>
            <Box>Role</Box>
            {canManageUsers && <Box>Actions</Box>}
          </Box>

          {/* LIST */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",

              "&::-webkit-scrollbar": {
                width: "8px",
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#cbd5e1",
                borderRadius: "999px",
              },
            }}
          >
            {data?.map((user: User) => {
              const roleName = user.roles?.[0]?.name;

              const roleConfig = ROLE_CONFIG[roleName] ?? ROLE_CONFIG.default;

              return (
                <Box key={user.id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: gridColumns,
                      alignItems: "center",
                      px: 3,
                      py: 1,
                      transition: "all 0.2s ease",

                      "&:hover": {
                        backgroundColor: "#f8fafc",
                        boxShadow: "inset 0 0 0 1px #e2e8f0",
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
                          width: 32,
                          height: 32,
                          background:
                            "linear-gradient(135deg, #2563eb, #7c3aed)",
                          boxShadow: "0 6px 16px rgba(37,99,235,0.25)",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {user.username.charAt(0)?.toUpperCase()}
                      </Avatar>

                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "#0f172a",
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
                    <Box>
                      {user.roles?.[0]?.name ? (
                        <Chip
                          label={roleName}
                          size="small"
                          sx={{
                            width: 100,

                            height: 26,
                            fontSize: 12,
                            fontWeight: 600,

                            bgcolor: roleConfig.bg,
                            color: roleConfig.color,

                            border: `1px solid ${roleConfig.color}20`,

                            justifyContent: "center",

                            "& .MuiChip-label": {
                              px: 0,
                              width: "100%",
                              textAlign: "center",
                            },
                          }}
                        />
                      ) : (
                        <Chip
                          label="Assign Role"
                          size="small"
                          variant="outlined"
                          sx={{
                            width: 110,
                            cursor: "default",

                            height: 26,

                            color: "#94a3b8",
                            borderColor: "#cbd5e1",

                            bgcolor: "#f8fafc",

                            "& .MuiChip-label": {
                              width: "100%",
                              textAlign: "center",
                              fontStyle: "italic",
                            },
                          }}
                        />
                      )}
                    </Box>
                    {canManageUsers && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
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
                              textTransform: "none",
                              minWidth: 80,
                              height: 32,

                              borderRadius: "10px",

                              background:
                                "linear-gradient(135deg, #2563eb, #3b82f6)",

                              color: "#fff",

                              fontWeight: 600,

                              boxShadow: "0 4px 12px rgba(37,99,235,0.25)",

                              "&:hover": {
                                background:
                                  "linear-gradient(135deg, #1d4ed8, #2563eb)",

                                boxShadow: "0 8px 18px rgba(37,99,235,0.35)",
                              },
                            }}
                          >
                            Edit
                          </Button>
                        )}

                        {canDeleteUsers && (
                          <Button
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenDeleteDialog(true);
                            }}
                            sx={{
                              textTransform: "none",

                              minWidth: 80,
                              height: 32,

                              borderRadius: "10px",

                              borderWidth: "1.5px",

                              fontWeight: 600,

                              "&:hover": {
                                borderWidth: "1.5px",
                                backgroundColor: "#fef2f2",
                              },
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>

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
