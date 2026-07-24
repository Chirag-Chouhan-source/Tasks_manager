"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Snackbar,
  TablePagination,
  Typography,
  useMediaQuery,
} from "@mui/material";

import {
  useCreateTaskMutation,
  useGetCurrentUserQuery,
  useGetTasksQuery,
} from "@/services/api";

import { hasToken } from "@/utils/auth";
import { hasPermission } from "@/utils/permission";

import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import StatusTabs from "@/components/tasks/StatusTabs";
import TasksHeader from "@/components/tasks/TaskHeader";
import TaskList from "@/components/tasks/TaskList";

import FilterMenu from "@/components/common/FilterMenu";
import UILoader from "@/components/common/Loader";
import SortDropdown, {
  DEFAULT_SORT,
  SortValue,
} from "@/components/common/SortDropdown";

import { STATUS_VALUES } from "@/constants/status";

export default function TasksPage() {
  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Responsive
  const isMobile = useMediaQuery("(max-width:768px)");

  // API
  const { data: currentUser } = useGetCurrentUserQuery(undefined);
  const [createTask] = useCreateTaskMutation();

  // Search, Filter & Sorting
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sprint: "",
    user_id: "",
  });

  const [sort, setSort] = useState<SortValue>(DEFAULT_SORT);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = searchInput.trim();

      setFilters((prev) => ({
        ...prev,
        search: trimmed || "",
      }));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Status Navigation
  const statusParam = searchParams.get("status") || "";

  const [activeStatus, setActiveStatus] = useState(
    statusParam || (isMobile ? "backlog" : ""),
  );

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");

    if (statusFromUrl) {
      setActiveStatus(statusFromUrl);
    } else {
      setActiveStatus(isMobile ? "backlog" : "");
    }
  }, [searchParams, isMobile]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: activeStatus,
    }));
  }, [activeStatus]);

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);

    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    router.push(`/dashboard/tasks?${params.toString()}`);
  };

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Create Tasks
  const [open, setOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined,
  );

  const handleOpen = (status?: string) => {
    setSelectedStatus(status);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStatus(undefined);
  };

  //  UI State
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);

  // Snackbar Feedback notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (searchParams.get("deleted") === "true") {
      setSnackbar({
        open: true,
        message: "Task deleted successfully",
      });

      router.replace("/dashboard/tasks");
    }
  }, [searchParams, router]);

  // Data Fetching
  const { data, isFetching, isError } = useGetTasksQuery(
    {
      ...filters,
      page,
      page_size: pageSize,
      sort_by: sort.sort_by,
      sort_order: sort.sort_order,
    },
    { skip: !hasToken() },
  );

  // Derived UI
  const statusTabs = isMobile ? STATUS_VALUES : ["", ...STATUS_VALUES];

  const taskFilters = (
    <FilterMenu
      type="task"
      filters={filters}
      onChange={(newFilters: any) =>
        setFilters((prev) => ({
          ...prev,
          ...newFilters,
        }))
      }
      onClear={() => {
        setFilters({
          search: "",
          status: "",
          sprint: "",
          user_id: "",
        });
        setSearchInput("");
      }}
    />
  );

  const sortComponent = <SortDropdown value={sort} onChange={setSort} />;

  // Error handling
  if (isError) return <p>Error fetching tasks</p>;

  return (
    <>
      {loadingTaskId && (
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
          <UILoader type="full" text="Opening task..." />
        </Box>
      )}

      <Box
        sx={{
          height: "100%",
          px: 1.5,
          py: 0.5,
          paddingTop: 1.5,
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ✅ HEADER */}

        <Box
          sx={{ mb: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          <TasksHeader
            isMobile={isMobile}
            showMobileSearch={showMobileSearch}
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onToggleMobileSearch={setShowMobileSearch}
            onCreateTask={() => handleOpen()}
            canCreateTask={hasPermission(
              currentUser?.permissions,
              "task.create",
            )}
            filterComponent={taskFilters}
            sortComponent={sortComponent}
          />
          <StatusTabs
            statusTabs={statusTabs}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
          />
        </Box>

        {/* ✅ TASK LIST */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {!activeStatus ? (
            <TaskList
              tasks={data?.results ?? []}
              grouped
              filters={filters}
              sort={sort}
              onTaskClick={(task: any) => {
                setLoadingTaskId(task.id);
                router.push(`/dashboard/tasks/${task.id}`);
              }}
              onAddTask={(status) => handleOpen(status)}
              canCreateTask={hasPermission(
                currentUser?.permissions,
                "task.create",
              )}
            />
          ) : isFetching ? (
            <UILoader type="taskFlat" />
          ) : !data?.results?.length ? (
            <Typography sx={{ color: "text.secondary" }}>
              {searchInput.trim()
                ? `No results found for "${searchInput.trim()}"`
                : "No tasks available"}
            </Typography>
          ) : (
            <TaskList
              tasks={data.results}
              grouped={false}
              filters={filters}
              sort={sort}
              onTaskClick={(task: any) => {
                setLoadingTaskId(task.id);
                router.push(`/dashboard/tasks/${task.id}`);
              }}
              onAddTask={(status) => handleOpen(status)}
              canCreateTask={hasPermission(
                currentUser?.permissions,
                "task.create",
              )}
            />
          )}
        </Box>

        {/* ✅ PAGINATION */}
        {activeStatus && data && (
          <TablePagination
            component="div"
            count={data.count}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPageChange={(_, newPage) => {
              setPage(newPage + 1);
            }}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          />
        )}

        {/* ✅ DIALOG */}
        <CreateTaskDialog
          open={open}
          onClose={handleClose}
          defaultStatus={selectedStatus}
          onCreate={async (formData) => {
            await createTask(formData).unwrap();
          }}
        />
      </Box>

      {/* ✅ SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
