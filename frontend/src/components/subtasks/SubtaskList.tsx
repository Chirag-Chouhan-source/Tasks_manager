"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

import {
  useDeleteSubtaskMutation,
  useGetSubtasksQuery,
  useBulkDeleteSubtasksMutation,
} from "@/services/api";

import FilterMenu from "@/components/common/FilterMenu";
import UILoader from "@/components/common/Loader";
import { STATUS_CONFIG } from "@/constants/status";
import { Subtask } from "@/types";
import SortDropdown, { DEFAULT_SORT, SortValue } from "../common/SortDropdown";

type Props = {
  taskId: number;
  onAddClick: () => void;
  canCreateSubtask: boolean;
  canDeleteSubtask: boolean;
};

export default function SubtaskList({
  taskId,
  onAddClick,
  canCreateSubtask,
  canDeleteSubtask,
}: Props) {
  // Navigation
  const router = useRouter();

  // Subtask List
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    user_id: "",
    search: "",
  });

  const [sort, setSort] = useState<SortValue>(DEFAULT_SORT);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();

      setFilters((prev) => ({
        ...prev,
        search: trimmed || "",
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPageSize(5);
  }, [filters, taskId, sort]);

  const { data } = useGetSubtasksQuery(
    {
      task_id: taskId,
      ...filters,

      sort_by: sort.sort_by,
      sort_order: sort.sort_order,
      page: 1,
      page_size: pageSize,
    },
    {
      refetchOnMountOrArgChange: true,
    },
  );

  const subtasks = data?.results ?? [];

  // Delete Subtask
  const [deleteSubtask] = useDeleteSubtaskMutation();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [bulkDeleteSubtasks] = useBulkDeleteSubtasksMutation();
  const [openBulkDelete, setOpenBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, [filters, taskId, sort]);

  const allLoadedIds = subtasks.map((s: Subtask) => s.id);
  const allSelected =
    allLoadedIds.length > 0 &&
    allLoadedIds.every((id: number) => selectedIds.includes(id));

  const toggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : allLoadedIds);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setDeleteError("");

    try {
      await deleteSubtask(selectedId).unwrap();

      setOpenDelete(false);
      setSelectedId(null);

      setSnackbar({
        open: true,
        message: "Subtask deleted successfully ",
      });
    } catch (err: any) {
      let message = err?.data?.message || "Cannot delete subtask";

      if (typeof message === "string") {
        message = message.replace(/^\d+:\s*/, "").trim();
      }

      setDeleteError(message);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    setDeleteError("");
    try {
      await bulkDeleteSubtasks({
        task_id: taskId,
        ids: selectedIds,
      }).unwrap();

      setOpenBulkDelete(false);
      exitSelectionMode();

      setSnackbar({
        open: true,
        message: `${selectedIds.length} subtasks deleted successfully`,
      });
    } catch (err: any) {
      let message = err?.data?.message || "Cannot delete subtasks";

      if (typeof message === "string") {
        message = message.replace(/^\d+:\s*/, "").trim();
      }
      setDeleteError(message);
    }
  };

  // Open Subtask
  const [loadingSubtaskId, setLoadingSubtaskId] = useState<number | null>(null);

  // Notification

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  return (
    <Box>
      {/* LOADER */}
      {loadingSubtaskId && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UILoader type="full" text="Opening subtask..." />
        </Box>
      )}

      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Subtasks
          </Typography>

          {canCreateSubtask && (
            <Tooltip title="Add subtask">
              <IconButton size="small" onClick={onAddClick}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {canDeleteSubtask && subtasks.length > 0 && (
            <Button
              size="small"
              onClick={() =>
                selectionMode ? exitSelectionMode() : setSelectionMode(true)
              }
              sx={{
                textTransform: "none",
                color: "#64748b",
                fontWeight: 500,
                minWidth: "unset",
                px: 1,
              }}
            >
              {selectionMode ? "Cancel" : "Select"}
            </Button>
          )}
        </Box>

        <Box display="flex" gap={1}>
          <TextField
            placeholder="Search subtasks..."
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ width: 240, mt: 0.5 }}
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

          <FilterMenu
            type="subtask"
            filters={filters}
            onChange={setFilters}
            onClear={() =>
              setFilters({
                status: "",
                user_id: "",
                search: "",
              })
            }
          />

          <SortDropdown value={sort} onChange={setSort} />
        </Box>
      </Box>

      {/* SELECTION TOOLBAR — visible only when at least one item is selected */}
      <Collapse
        in={selectedIds.length > 0}
        timeout={250}
        unmountOnExit
        sx={{
          "& .MuiCollapse-wrapperInner > *": {
            transition: "opacity 250ms ease, transform 250ms ease",
          },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={1.5}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            "@keyframes selectionToolbarEnter": {
              from: {
                opacity: 0,
                transform: "translateY(-6px)",
              },
              to: {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
            animation: "selectionToolbarEnter 250ms ease",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ cursor: "pointer", minHeight: 32 }}
            onClick={toggleSelectAll}
          >
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={selectedIds.length > 0 && !allSelected}
              onChange={toggleSelectAll}
              onClick={(e) => e.stopPropagation()}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#475569",
                fontWeight: 500,
                userSelect: "none",
              }}
            >
              Select All
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${selectedIds.length} selected`}
            sx={{
              height: 24,
              fontWeight: 500,
              fontSize: 12,
              color: "#475569",
              backgroundColor: "#e2e8f0",
              border: "1px solid #cbd5e1",
              "& .MuiChip-label": { px: 1.25 },
            }}
          />

          <Box
            display="flex"
            alignItems="center"
            gap={1.25}
            sx={{ ml: "auto" }}
          >
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              disabled={selectedIds.length === 0}
              onClick={() => {
                setDeleteError("");
                setOpenBulkDelete(true);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 1.5,
                backgroundColor: "#dc2626",
                color: "#fff",

                "&:hover": {
                  backgroundColor: "#b91c1c",
                },

                "&.Mui-disabled": {
                  backgroundColor: "#fecaca",
                  color: "#fff",
                },
              }}
            >
              Delete
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={exitSelectionMode}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                px: 1.5,
                color: "#475569",
                borderColor: "#cbd5e1",
                backgroundColor: "#fff",

                "&:hover": {
                  borderColor: "#94a3b8",
                  backgroundColor: "#f1f5f9",
                },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* LIST */}
      {!subtasks?.length ? (
        <Typography color="text.secondary">
          {searchInput.trim()
            ? `No results found for "${searchInput.trim()}"`
            : "No subtasks"}
        </Typography>
      ) : (
        <>
          {subtasks.map((subtask: Subtask) => {
            const statusConfig =
              STATUS_CONFIG[subtask.status as keyof typeof STATUS_CONFIG];
            return (
              <Box
                key={subtask.id}
                onClick={() => {
                  setLoadingSubtaskId(subtask.id);
                  router.push(`/dashboard/subtasks/${subtask.id}`);
                }}
                sx={{
                  px: 1.5,
                  py: 1.2,
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f8fafc",
                  mb: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Collapse
                  in={selectionMode}
                  orientation="horizontal"
                  timeout={200}
                >
                  <Fade in={selectionMode} timeout={200}>
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(subtask.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleId(subtask.id)}
                      sx={{
                        p: 0.75,
                        width: 34,
                        height: 30,
                        boxSizing: "border-box",
                        "& .MuiSvgIcon-root": {
                          fontSize: 20,
                        },
                      }}
                    />
                  </Fade>
                </Collapse>
                <Typography sx={{ flex: 1 }}>{subtask.title}</Typography>

                <Chip
                  label={statusConfig?.label ?? subtask.status}
                  size="small"
                  color={statusConfig?.color ?? "default"}
                />
                {canDeleteSubtask && (
                  <Collapse
                    in={!selectionMode}
                    orientation="horizontal"
                    timeout={200}
                  >
                    <Fade in={!selectionMode} timeout={200}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(subtask.id);
                          setOpenDelete(true);
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Fade>
                  </Collapse>
                )}
              </Box>
            );
          })}

          {subtasks.length < (data?.count ?? 0) && (
            <Box
              sx={{
                mt: 2,
                py: 1,
                textAlign: "center",
                border: "1px dashed #cbd5e1",
                borderRadius: 2,
                cursor: "pointer",
                fontWeight: 600,
                color: "#475569",

                "&:hover": {
                  backgroundColor: "#f8fafc",
                },
              }}
              onClick={() => setPageSize((prev) => prev + 5)}
            >
              Load More Subtasks
            </Box>
          )}
        </>
      )}

      {/* DELETE DIALOG */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Subtask</DialogTitle>

        <DialogContent>
          <Typography>Are you sure you want to delete this subtask?</Typography>

          {deleteError && (
            <Typography color="error" mt={1}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>

          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBulkDelete} onClose={() => setOpenBulkDelete(false)}>
        <DialogTitle>Delete Subtasks</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedIds.length} subtasks?
          </Typography>

          {deleteError && (
            <Typography color="error" mt={1}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenBulkDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleBulkDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ ✅ ✅ SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
