"use client";

import { Box } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import TaskIcon from "@mui/icons-material/AssignmentOutlined";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutline";

import { useGetCurrentUserQuery } from "@/services/api";
import { CurrentUser } from "@/types";
import { hasPermission } from "@/utils/permission";

type Props = {
  onNavigateStart: () => void;
};

export default function Sidebar({ onNavigateStart }: Props) {
  // Navigation
  const pathname = usePathname();

  // API
  const { data: currentUser } = useGetCurrentUserQuery(undefined) as {
    data?: CurrentUser;
  };

  // Menu Items
  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: <TaskIcon fontSize="small" />,
    },
  ];

  if (hasPermission(currentUser?.permissions, "user.view")) {
    menuItems.push({
      label: "Users",
      href: "/dashboard/users",
      icon: <PeopleIcon fontSize="small" />,
    });
  }

  return (
    <Box
      className="sidebar"
      sx={{
        height: "100%",
        borderRight: "1px solid #e5e7eb",
        px: 2,
        py: 3,
        bgcolor: "#ffffff",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {menuItems.map((item) => {
          const isActive =
            item.label === "Tasks"
              ? pathname.startsWith("/dashboard/tasks") ||
                pathname.startsWith("/dashboard/subtasks")
              : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none" }}
              onClick={() => {
                if (pathname !== item.href) {
                  onNavigateStart?.();
                }
              }}
            >
              <Box
                className="sidebar-item"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,

                  px: 1.5,
                  py: 1.2,

                  borderRadius: 2,
                  cursor: "pointer",

                  position: "relative",

                  color: isActive ? "#313132" : "#6b7280",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,

                  backgroundColor: isActive ? "#e6ebf0" : "transparent",

                  transition: "all 0.2s ease",

                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                    color: "#111827",
                  },
                }}
              >
                {isActive && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: "3px",
                      borderRadius: 2,
                      backgroundColor: "#3b82f6",
                    }}
                  />
                )}
                <Box
                  className="sidebar-item-icon"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: isActive ? "#3a538a" : "#9ca3af", // ✅ active = blue
                  }}
                >
                  {item.icon}
                </Box>
                <Box className="sidebar-item-text">{item.label}</Box>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}
