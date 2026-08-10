"use client";

import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/SideBar";
import UILoader from "@/components/common/Loader";
import { useGetCurrentUserQuery } from "@/services/api";
import { hasToken } from "@/utils/auth";
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

  const [hasMounted, setHasMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (!hasToken()) router.push("/login");
  }, [hasMounted, router]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const { data: currentUser, isLoading: isUserLoading } =
    useGetCurrentUserQuery(undefined, {
      skip: !hasMounted || !hasToken(),
    });

  // Same on server + first client paint → no hydration mismatch
  if (!hasMounted || isUserLoading || !currentUser) {
    return (
      <Box sx={{ height: "100vh", width: "100%" }}>
        <UILoader type="full" text="Loading..." />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box className="dashboard-main">
        <Sidebar onNavigateStart={() => setIsNavigating(true)} />
        <Box className="dashboard-content" sx={{ flex: 1, overflowY: "auto" }}>
          {isNavigating ? <UILoader type="full" text="Loading..." /> : children}
        </Box>
      </Box>
    </Box>
  );
}
