"use client";

import styles from "./register.module.css";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import InputField from "@/components/common/InputField";
import StatusSnackbar from "@/components/common/StatusSnackbar";
import {
  getPasswordStrength,
  getPasswordStrengthLabel,
} from "@/utils/passwordStrength";

import { hasToken } from "@/utils/auth";

import {
  useGetCurrentUserQuery,
  useRegisterUserMutation,
} from "@/services/api";

import { CurrentUser } from "@/types";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Minimum 3 characters required")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores",
      ),

    email: z.string().email("Enter a valid email"),

    password: z
      .string()
      .min(
        8,
        "Password must be 8+ characters and contain uppercase, lowercase, number and special character",
      )
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
        "Password must be 8+ characters and contain uppercase, lowercase, number and special character",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  // Navigation
  const router = useRouter();

  // Form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Authentication
  const [registerUser, { isLoading: isRegisterLoading }] =
    useRegisterUserMutation();

  const { data: currentUser, isLoading: isUserLoading } =
    useGetCurrentUserQuery(undefined, {
      skip: !hasToken(),
    }) as {
      data?: CurrentUser;
      isLoading: boolean;
    };

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Password Strength
  const password = watch("password");
  const passwordStrength = getPasswordStrength(password || "");
  const strength = getPasswordStrengthLabel(passwordStrength);

  // Render Effect
  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  // Form Submission
  const onSubmit = async (data: RegisterForm) => {
    const { confirmPassword, ...payload } = data;

    try {
      await registerUser(payload).unwrap();

      // optional delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      setSnackbar({
        open: true,
        message: "Account created successfully",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message || err?.data?.detail || "Register failed",
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
              <div className={styles.brand}>TaskFlow</div>

              <div className={styles.heroTitle}>
                Join and start organizing your work
              </div>

              <div className={styles.heroSubtitle}>
                Create your account and take control of your productivity.
              </div>
            </Box>

            {/* ✅ RIGHT SIDE */}
            <Box className={styles.rightSection}>
              <div className={styles.title}>Create Account</div>

              <div className={styles.subtitle}>Sign up to get started</div>

              <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <Box className={styles.formInner}>
                  <InputField
                    name="username"
                    label="Username*"
                    control={control}
                    errors={errors}
                    type="text"
                  />

                  <InputField
                    name="email"
                    label="Email*"
                    control={control}
                    errors={errors}
                    type="text"
                  />
                  <Box>
                    <InputField
                      name="password"
                      label="Password*"
                      control={control}
                      errors={errors}
                      type="password"
                    />

                    {password && (
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ mt: 0.5, mb: 0.5 }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            overflow: "hidden",
                            maxHeight: password ? "20px" : "0px",
                            opacity: password ? 1 : 0,
                            transform: password
                              ? "translateY(0)"
                              : "translateY(-6px)",
                            transition:
                              "max-height 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms ease, transform 350ms ease",
                            mt: password ? 0.5 : 0,
                            mb: password ? 0.5 : 0,
                          }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={(passwordStrength / 7) * 100}
                            sx={{
                              height: 3,
                              borderRadius: 999,
                              backgroundColor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: strength.color,
                                transition:
                                  "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <InputField
                    name="confirmPassword"
                    label="Confirm Password*"
                    control={control}
                    errors={errors}
                    type="password"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disableElevation
                    disabled={isRegisterLoading}
                    className={styles.button}
                  >
                    {isRegisterLoading ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} sx={{ color: "white" }} />
                        Creating...
                      </Box>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </Box>
              </form>

              <div className={styles.footerText}>
                Already have an account?{" "}
                <span
                  className={styles.link}
                  onClick={() => router.push("/login")}
                >
                  Login
                </span>
              </div>
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
