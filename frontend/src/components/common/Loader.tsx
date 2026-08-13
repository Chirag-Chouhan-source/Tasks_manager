"use client";

import { Box, Skeleton, Typography } from "@mui/material";

type Props = {
  type?: "full" | "task" | "subtask" | "detail" | "taskFlat" | "kanbanColumn";
  text?: string;
};

export default function UILoader({
  type = "full",
  text = "Loading...",
}: Props) {
  if (type === "full") {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                backgroundColor: i % 2 === 0 ? "#1976d2" : "#60a5fa",
                animation: "wave 1.4s infinite ease-in-out",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </Box>

        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
          {text}
        </Typography>

        <style>
          {`
            @keyframes wave {
              0%, 80%, 100% {
                transform: translateY(0) scale(0.7);
                opacity: 0.5;
              }
              40% {
                transform: translateY(-6px) scale(1);
                opacity: 1;
              }
            }
          `}
        </style>
      </Box>
    );
  }

  if (type === "task") {
    return (
      <Box display="flex" gap={2} width="100%">
        {[0, 1, 2, 3].map((col) => (
          <Box key={col} flex={1}>
            <Skeleton width="40%" height={30} sx={{ mb: 2 }} />

            {[0, 1, 2].map((card) => (
              <Box
                key={card}
                sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#fff" }}
              >
                <Skeleton height={20} width="70%" />
                <Skeleton height={15} width="90%" />
                <Skeleton height={15} width="60%" sx={{ mt: 1 }} />
                <Skeleton height={30} sx={{ mt: 2 }} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  if (type === "subtask") {
    return (
      <Box display="flex" flexDirection="column" gap={1}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: "#f1f5f9",
            }}
          >
            <Skeleton height={18} width="80%" />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === "detail") {
    return (
      <Box p={3}>
        <Skeleton height={30} width="50%" />

        <Box mt={2}>
          <Skeleton height={20} width="30%" />
          <Skeleton height={20} width="50%" />
        </Box>

        <Box mt={3}>
          <Skeleton height={80} />
        </Box>

        <Box mt={3}>
          <Skeleton height={20} width="20%" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={40} sx={{ mt: 1 }} />
          ))}
        </Box>
      </Box>
    );
  }
  if (type === "taskFlat") {
    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignContent: "flex-start",
          width: "100%",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 280,
              p: 2,
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
            <Skeleton height={20} width="70%" />
            <Skeleton height={15} width="90%" />
            <Skeleton height={15} width="60%" sx={{ mt: 1 }} />
            <Skeleton height={30} sx={{ mt: 2 }} />
          </Box>
        ))}
      </Box>
    );
  }
  if (type === "kanbanColumn") {
    return (
      <Box sx={{ px: 1 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
            <Skeleton height={18} width="70%" />
            <Skeleton height={14} width="90%" />
            <Skeleton height={14} width="60%" sx={{ mt: 1 }} />
            <Skeleton height={30} sx={{ mt: 2 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return null;
}
