"use client";

import { InputAdornment, MenuItem, TextField } from "@mui/material";
import { Controller } from "react-hook-form";

import { useGetUsersQuery } from "@/services/api";
import { User } from "@/types";
import GroupIcon from "@mui/icons-material/Group";

type Props = {
  name: string;
  control: any;
};

export default function UserField({ name, control }: Props) {
  const { data: users = [] } = useGetUsersQuery();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const getUserNameById = (id: number) => {
          const user = users.find((u: User) => u.id === id);
          return user?.username || "";
        };

        return (
          <TextField
            select
            label="Users"
            fullWidth
            size="small"
            value={field.value || []}
            onChange={field.onChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupIcon fontSize="small" />
                  </InputAdornment>
                ),
              },

              select: {
                multiple: true,

                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 260,
                      mt: 1,
                      borderRadius: 2,
                      p: 1,
                    },
                  },

                  MenuListProps: {
                    sx: {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    },
                  },
                },

                renderValue: (selected) =>
                  (selected as number[]).map(getUserNameById).join(", "),
              },
            }}
            sx={{
              backgroundColor: "#f9fafb",
              borderRadius: 2,
            }}
          >
            {users.map((user: User) => (
              <MenuItem
                key={user.id}
                value={user.id}
                sx={{
                  borderRadius: 2,
                  textAlign: "center",
                  fontSize: 13,
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                  },
                }}
              >
                {user.username}
              </MenuItem>
            ))}
          </TextField>
        );
      }}
    />
  );
}
