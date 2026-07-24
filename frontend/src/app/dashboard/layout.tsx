"use client";

import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/SideBar";
import { Box } from "@mui/material";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      router.push("/login");
    }
  }, [router]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <Header />

      {/* MAIN */}
      <Box className="dashboard-main">
        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTENT */}
        <Box
          className="dashboard-content"
          sx={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
