"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Box, Drawer, IconButton, Typography } from "@mui/material";

import TaskIcon from "@mui/icons-material/AssignmentOutlined";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/PeopleOutline";

export default function MobileDrawer() {
  // Navigation
  const pathname = usePathname();

  // Drawer State
  const [open, setOpen] = useState(false);

  // Navigation Items
  const items = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <DashboardIcon />,
    },
    {
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: <TaskIcon />,
    },
    {
      label: "Users",
      href: "/dashboard/users",
      icon: <PeopleIcon />,
    },
  ];

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <MenuIcon />
      </IconButton>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, py: 2 }}>
          <Box
            sx={{
              px: 2,
              pb: 2,
              borderBottom: "1px solid #e5e7eb",
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              Dev
              <Box component="span" sx={{ color: "#2563eb" }}>
                Track
              </Box>
            </Typography>
          </Box>

          {items.map((item) => {
            const isActive =
              item.label === "Tasks"
                ? pathname.startsWith("/dashboard/tasks")
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ textDecoration: "none" }}
              >
                <Box
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

                  <Typography sx={{ color: "#000000" }}>
                    {item.label}
                  </Typography>
                </Box>
              </Link>
            );
          })}
        </Box>
      </Drawer>
    </>
  );
}
