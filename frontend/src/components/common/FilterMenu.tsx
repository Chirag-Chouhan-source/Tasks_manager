import { useEffect, useState } from "react";

import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import Popover from "@mui/material/Popover";

import { STATUS_OPTIONS } from "@/constants/status";
import {
  useGetSprintsQuery,
  useGetUsersQuery,
  useGetTasksQuery,
} from "@/services/api";
import { User } from "@/types";

type Props = {
  filters?: any;
  onChange: (filters: any) => void;
  onClear: () => void;
  type?: "task" | "subtask";
};

export default function FilterMenu({
  filters,
  onChange,
  onClear,
  type = "task",
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpenFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const defaultFilters = {
    status: "",
    user_id: "",
    ...(type === "task" ? { sprint: "" } : {}),
  };

  const { data: sprints } = useGetSprintsQuery(undefined, {
    skip: type !== "task",
  });

  const [localFilters, setLocalFilters] = useState(filters || defaultFilters);

  const sprint = localFilters.sprint || "";

  const { data: directoryUsers } = useGetUsersQuery(undefined, {
    skip: !!sprint,
  });

  const { data: tasksForAssignees } = useGetTasksQuery({
    ...(sprint ? { sprint } : {}),
    page: 1,
    page_size: 100,
  });

  const usersFromTasks: User[] = Array.from(
    new Map<number, User>(
      (tasksForAssignees?.results || [])
        .flatMap((task: any) => task.users || [])
        .filter((user: any) => user?.id != null)
        .map((user: any) => [user.id as number, user as User]),
    ).values(),
  );

  const users: User[] = (() => {
    if (sprint) return usersFromTasks;

    const byId = new Map<number, User>();

    if (Array.isArray(directoryUsers)) {
      for (const user of directoryUsers as User[]) {
        byId.set(user.id, user);
      }
    }

    for (const user of usersFromTasks) {
      byId.set(user.id, user);
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.username.localeCompare(b.username),
    );
  })();

  useEffect(() => {
    setLocalFilters(filters || defaultFilters);
  }, [filters]);

  const handleChange = (key: string, value: any) => {
    const updated = {
      ...localFilters,
      [key]: value,
    };

    if (key === "sprint") {
      updated.user_id = "";
    }

    setLocalFilters(updated);
    onChange(updated);
  };

  return (
    <>
      <Button
        onClick={handleOpenFilter}
        sx={{
          minWidth: "auto",
          p: 1,
        }}
      >
        <TuneIcon />
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box p={2} width={280}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography sx={{ fontWeight: 600 }}>Filters</Typography>

              <IconButton size="small" onClick={handleCloseFilter}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {type === "subtask" && (
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>

                <Select
                  value={localFilters.status || ""}
                  label="Status"
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>

                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {type === "task" && (
              <FormControl fullWidth size="small">
                <InputLabel>Sprint</InputLabel>

                <Select
                  value={localFilters.sprint || ""}
                  label="Sprint"
                  onChange={(e) => handleChange("sprint", e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>

                  {sprints?.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>

              <Select
                value={localFilters.user_id || ""}
                label="Assignee"
                onChange={(e) => handleChange("user_id", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>

                {users.map((user: User) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" justifyContent="flex-end">
              <Button
                size="small"
                color="error"
                onClick={() => {
                  const cleared = {
                    status: "",
                    user_id: "",
                    ...(type === "task" ? { sprint: "" } : {}),
                  };

                  setLocalFilters(cleared);
                  onClear();
                  handleCloseFilter();
                }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
