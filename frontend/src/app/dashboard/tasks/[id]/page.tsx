"use client";

import DetailedTask from "@/components/tasks/DetailedTask";
import { useGetTaskByIdQuery } from "@/services/api";
import { Box, Button, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

import UILoader from "@/components/common/Loader";

export default function TaskDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();

  const { data, isLoading, isError } = useGetTaskByIdQuery(id);

  if (isLoading) return <UILoader type="detail" />;
  if (isError) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Task not found
        </Typography>

        <Typography color="text.secondary">
          This task may have been deleted.
        </Typography>

        <Button
          variant="contained"
          onClick={() => router.push("/dashboard/tasks")}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }
  if (!data) return null;

  return <DetailedTask task={data} />;
}
