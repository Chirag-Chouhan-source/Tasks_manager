"use client";

import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

type Props = {
  isMobile: boolean;
  showMobileSearch: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onToggleMobileSearch: (show: boolean) => void;
  onCreateTask: () => void;
  canCreateTask: boolean;
  filterComponent: React.ReactNode;
  sortComponent: React.ReactNode;
};

export default function TasksHeader({
  isMobile,
  showMobileSearch,
  searchInput,
  onSearchChange,
  onToggleMobileSearch,
  onCreateTask,
  canCreateTask,
  filterComponent,
  sortComponent,
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1.5,
        minHeight: "50px",
      }}
    >
      {isMobile ? (
        showMobileSearch ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              minHeight: "36px",
            }}
          >
            <TextField
              autoFocus
              fullWidth
              placeholder="Search task by title..."
              size="small"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              variant="standard"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          fontSize: 16,
                          color: "#94a3b8",
                        }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button onClick={() => onToggleMobileSearch(false)}>✕</Button>

            {filterComponent}
            {sortComponent}
          </Box>
        ) : (
          <>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                Tasks
              </Typography>

              {canCreateTask && (
                <Box
                  onClick={onCreateTask}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    cursor: "pointer",
                    color: "#111827",
                    transition: "all 0.15s ease",

                    "&:hover": {
                      backgroundColor: "#f3f4f6",
                      color: "#2563eb",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: 20 }} />
                </Box>
              )}
            </Box>

            <Box display="flex" gap={1}>
              <Button onClick={() => onToggleMobileSearch(true)}>
                <SearchIcon />
              </Button>

              {filterComponent}
              {sortComponent}
            </Box>
          </>
        )
      ) : (
        <>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
              }}
            >
              Tasks
            </Typography>

            {canCreateTask && (
              <Box
                onClick={onCreateTask}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#2563eb",
                  transition: "all 0.15s ease",

                  "&:hover": {
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 18, fontWeight: 700 }} />
              </Box>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            <TextField
              placeholder="Search task by title..."
              size="small"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              sx={{ width: 240 }}
              variant="standard"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          fontSize: 16,
                          color: "#94a3b8",
                        }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {filterComponent}
            {sortComponent}
          </Box>
        </>
      )}
    </Box>
  );
}
