"use client";

import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/SideBar";
import UILoader from "@/components/common/Loader";
import { Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) router.push("/login");
  }, [router]);

  // Route finished → hide loader
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Header />

      <Box className="dashboard-main">
        <Sidebar onNavigateStart={() => setIsNavigating(true)} />

        <Box
          className="dashboard-content"
          sx={{ flex: 1, overflowY: "auto", position: "relative" }}
        >
          {isNavigating ? <UILoader type="full" text="Loading..." /> : children}
        </Box>
      </Box>
    </Box>
  );
}
