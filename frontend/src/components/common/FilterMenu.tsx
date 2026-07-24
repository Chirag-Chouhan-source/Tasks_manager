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
import { useGetSprintsQuery, useGetUsersQuery } from "@/services/api";
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
  // PopOver State
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpenFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  //  DEFAULT FILTERS
  const defaultFilters = {
    status: "",
    user_id: "",
    ...(type === "task" ? { sprint: "" } : {}),
  };

  // DataFetching
  const { data: users } = useGetUsersQuery();
  const { data: sprints } = useGetSprintsQuery(undefined, {
    skip: type !== "task",
  });

  // Filter State
  const [localFilters, setLocalFilters] = useState(filters || defaultFilters);

  useEffect(() => {
    setLocalFilters(filters || defaultFilters);
  }, [filters]);

  // Filter Action

  const handleChange = (key: string, value: any) => {
    const updated = {
      ...localFilters,
      [key]: value,
    };

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
            {/* HEADER */}
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

            {/* STATUS */}
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

            {/* SPRINT */}
            {type === "task" && (
              <FormControl fullWidth size="small">
                <InputLabel>Sprint</InputLabel>

                <Select
                  value={localFilters.sprint || ""}
                  label="Sprint"
                  onChange={(e) => handleChange("sprint", e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>

                  {sprints?.map((sprint: string) => (
                    <MenuItem key={sprint} value={sprint}>
                      {sprint}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* ASSIGNEE */}
            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>

              <Select
                value={localFilters.user_id || ""}
                label="Assignee"
                onChange={(e) => handleChange("user_id", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>

                {users?.map((user: User) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* RESET */}
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
