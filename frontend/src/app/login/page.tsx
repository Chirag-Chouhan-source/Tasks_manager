"use client";

if (typeof window !== "undefined") {
  (window as any).__NEXT_DISABLE_HMR__ = true;
}
import styles from "./login.module.css";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import {
  api,
  useGetCurrentUserQuery,
  useLoginUserMutation,
} from "@/services/api";

import { hasToken } from "@/utils/auth";

import InputField from "@/components/common/InputField";
import StatusSnackbar from "@/components/common/StatusSnackbar";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),

  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Authentication
  const dispatch = useDispatch();
  const [loginUser, { isLoading: isLoginLoading }] = useLoginUserMutation();

  const { data: currentUser, isLoading: isUserLoading } =
    useGetCurrentUserQuery(undefined, {
      skip: !hasToken(),
    });

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Redirect Effects
  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  useEffect(() => {
    const status = searchParams.get("status");

    if (status === "logout") {
      setSnackbar({
        open: true,
        message: "Logged out successfully",
        severity: "success",
      });
      router.replace("/login");
    }
  }, [searchParams]);

  // Form Submission
  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await loginUser(data).unwrap();

      localStorage.setItem("access_token", result.access_token);

      localStorage.setItem("refresh_token", result.refresh_token);

      dispatch(api.util.resetApiState());

      router.push("/dashboard?status=login");

      // ✅ DO NOT setLoading(false) here
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message || err?.data?.detail || "Login failed",
        severity: "error",
      });
    }
  };

  // Loading State
  if (hasToken() && isUserLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <Box className={styles.container}>
        <div className={styles.card}>
          <Paper elevation={0} className={styles.paperInner}>
            {/* ✅ LEFT SIDE */}
            <Box className={styles.leftSection}>
              <Typography component="div" className={styles.brand}>
                TaskFlow
              </Typography>

              <Typography component="div" className={styles.heroTitle}>
                Stay organized. Stay productive.
              </Typography>

              <Typography component="div" className={styles.heroSubtitle}>
                Manage your tasks and workflow in one powerful platform.
              </Typography>
            </Box>

            {/* ✅ RIGHT SIDE */}
            <Box className={styles.rightSection}>
              <Typography component="div" className={styles.title}>
                Welcome back
              </Typography>

              <Typography component="div" className={styles.subtitle}>
                Login to your account
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box className={styles.formInner}>
                  <InputField
                    name="email"
                    label="Email*"
                    control={control}
                    errors={errors}
                    type="text"
                  />
                  <InputField
                    name="password"
                    label="Password*"
                    control={control}
                    errors={errors}
                    type="password"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isLoginLoading}
                    className={styles.button}
                  >
                    {isLoginLoading ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} sx={{ color: "white" }} />
                        Logging in...
                      </Box>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </Box>
              </form>

              <Typography component="div" className={styles.footerText}>
                Don't have an account?{" "}
                <span
                  className={styles.link}
                  onClick={() => router.push("/register")}
                >
                  Register
                </span>
              </Typography>
            </Box>
          </Paper>
        </div>
      </Box>
      <StatusSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
