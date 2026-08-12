"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h5" fontWeight={700}>
        Something went wrong
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        An unexpected error occurred. You can try again.
      </Typography>
      <Button variant="contained" onClick={() => reset()}>
        Try again
      </Button>
    </Box>
  );
}
