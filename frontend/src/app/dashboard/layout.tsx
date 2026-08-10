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
    if (!hasToken()) router.replace("/login");
  }, [hasMounted, router]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasMounted || !hasToken(),
  });

  useEffect(() => {
    if (!hasMounted) return;
    if (isUserError) {
      router.replace("/login");
    }
  }, [hasMounted, isUserError, router]);

  if (!hasMounted || isUserLoading || (!currentUser && !isUserError)) {
    return (
      <Box sx={{ height: "100vh", width: "100%" }}>
        <UILoader type="full" text="Loading..." />
      </Box>
    );
  }

  if (isUserError || !currentUser) {
    return null;
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
