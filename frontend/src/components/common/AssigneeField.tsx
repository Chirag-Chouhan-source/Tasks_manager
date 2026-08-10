import {
  Box,
  Chip,
  ClickAwayListener,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import {
  useGetUsersQuery,
  useUpdateSubtaskMutation,
  useUpdateTaskMutation,
} from "@/services/api";
import { User } from "@/types";

type Props = {
  entityId: number;
  entityType: "task" | "subtask";
  users: User[];
  disabled?: boolean;
};

export default function AssigneeField({
  entityId,
  entityType,
  users: currentUsers,
  disabled = false,
}: Props) {
  // API
  const { data: users = [] } = useGetUsersQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();

  // Assignee State
  const [selectedUsers, setSelectedUsers] = useState<User[]>(
    currentUsers || [],
  );

  useEffect(() => {
    setSelectedUsers(currentUsers || []);
  }, [currentUsers]);

  // Dropdown State
  const [isOpen, setIsOpen] = useState(false);
  // const [closeTimer, setCloseTimer] = useState<any>(null);

  // Assignee Action
  const updateUsers = async (updatedUsers: User[]) => {
    const ids = updatedUsers.map((u) => u.id);

    try {
      if (entityType === "task") {
        await updateTask({
          id: entityId,
          data: { users: ids },
        }).unwrap();
      } else {
        await updateSubtask({
          id: entityId,
          data: { users: ids },
        }).unwrap();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) return;

    const updated = [...selectedUsers, user];

    setSelectedUsers(updated);
    updateUsers(updated);
  };

  const handleRemoveUser = async (userId: number) => {
    const updated = selectedUsers.filter((u) => u.id !== userId);

    setSelectedUsers(updated);
    updateUsers(updated);
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {!selectedUsers.length && <Typography>No assignee</Typography>}

          {selectedUsers.map((user: User) => (
            <Chip
              key={user.id}
              label={user.username}
              size="small"
              onDelete={disabled ? undefined : () => handleRemoveUser(user.id)}
              deleteIcon={!disabled ? <CloseIcon /> : undefined}
            />
          ))}

          {!disabled && (
            <IconButton
              size="small"
              onClick={() => setIsOpen((prev) => !prev)}
              sx={{
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {!disabled && isOpen && (
          <Paper
            elevation={3}
            sx={{
              position: "absolute",
              top: "100%",
              mt: 1,
              width: 220,
              maxHeight: 240,
              overflowY: "auto",
              zIndex: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 2,
            }}
          >
            {users.length === 0 && (
              <Box sx={{ px: 1.5, py: 1.5, color: "#6b7280", fontSize: 13 }}>
                No users found
              </Box>
            )}

            {users.map((user: any) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);

              return (
                <Box
                  key={user.id}
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveUser(user.id);
                    } else {
                      handleAddUser(user);
                    }
                  }}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: isSelected ? "#e5e7eb" : "transparent",
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? "#111827" : "inherit",
                    "&:hover": {
                      backgroundColor: "#f3f4f6",
                    },
                  }}
                >
                  {user.username}
                </Box>
              );
            })}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
