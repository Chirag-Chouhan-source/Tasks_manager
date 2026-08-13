"use client";

import Link from "next/link";

import { hasToken } from "@/utils/auth";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (hasToken()) {
      router.replace("/dashboard");
    }
  }, [router]);
  if (hasToken()) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        backgroundImage: `
    linear-gradient(
      rgba(35, 114, 193, 0.11) 2px,
      transparent 2px
    ),
    linear-gradient(
      90deg,
      rgba(35, 114, 193, 0.11) 2px,
      transparent 2px
    )
  `,
        backgroundSize: "85px 85px",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "#fff",
          color: "#111827",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                flexGrow: 1,
              }}
            >
              Dev
              <Box component="span" sx={{ color: "#1976d2" }}>
                Track
              </Box>
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <Button
                component={Link}
                href="/register"
                variant="contained"
                sx={{
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  textTransform: "none",
                  backgroundColor: "#1976d2",

                  "&:hover": {
                    backgroundColor: "#1565c0",
                    transform: "translateY(-1px)",
                    boxShadow: "0 8px 20px rgba(25,118,210,0.25)",
                  },

                  transition: "all 0.2s ease",
                }}
              >
                Sign Up
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg">
        <Box
          sx={{
            py: { xs: 10, md: 16 },
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: {
                xs: "2.8rem",
                md: "4.8rem",
              },
              lineHeight: 1.1,
            }}
          >
            Manage Projects.
            <br />
            Track Progress.
            <br />
            <Box
              component="span"
              sx={{
                color: "#1976d2",
              }}
            >
              Deliver Faster.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 3,
              color: "#6b7280",
              maxWidth: 700,
              mx: "auto",
              fontSize: "1.15rem",
            }}
          >
            DevTrack helps teams manage tasks, organize workflows, collaborate
            efficiently, and deliver projects on time through powerful Kanban
            boards, task tracking, comments, and team collaboration.
          </Typography>

          <Box
            sx={{
              mt: 5,
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "none",
              }}
            >
              Get Started
            </Button>

            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
