"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, Snackbar, Typography } from "@mui/material";

type Props = {
  open: boolean;
  message: string;
  severity: "success" | "error";
  onClose: () => void;
};

export default function StatusSnackbar({
  open,
  message,
  severity,
  onClose,
}: Props) {
  const isSuccess = severity === "success";

  return (
    <Snackbar
      open={open}
      autoHideDuration={2500} // ✅ auto disappear
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 1.5,

          borderRadius: "12px",

          backgroundColor: isSuccess ? "#10b981" : "#ef4444",
          color: "white",

          boxShadow: "0px 12px 30px rgba(0,0,0,0.2)",

          minWidth: "260px",
        }}
      >
        {/* ✅ ICON */}
        {isSuccess ? (
          <CheckCircleIcon sx={{ fontSize: 22 }} />
        ) : (
          <ErrorOutlineIcon sx={{ fontSize: 22 }} />
        )}

        {/* ✅ MESSAGE */}
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      </Box>
    </Snackbar>
  );
}
