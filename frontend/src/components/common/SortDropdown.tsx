"use client";

import CheckIcon from "@mui/icons-material/Check";
import SortIcon from "@mui/icons-material/Sort";
import { Button, ListItemText, Menu, MenuItem } from "@mui/material";
import { useState } from "react";

export type SortValue = {
  label: string;
  sort_by: string;
  sort_order: string;
};

export const SORT_OPTIONS: SortValue[] = [
  {
    label: "Newest First",
    sort_by: "created_at",
    sort_order: "desc",
  },
  {
    label: "Oldest First",
    sort_by: "created_at",
    sort_order: "asc",
  },
  {
    label: "Recently Updated",
    sort_by: "updated_at",
    sort_order: "desc",
  },
  {
    label: "Title A-Z",
    sort_by: "title",
    sort_order: "asc",
  },
  {
    label: "Title Z-A",
    sort_by: "title",
    sort_order: "desc",
  },
];
export const DEFAULT_SORT = SORT_OPTIONS[0];

type Props = {
  value: SortValue;
  onChange: (value: SortValue) => void;
};

export default function SortDropdown({ value, onChange }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isSelected = (option: SortValue) =>
    option.sort_by === value.sort_by && option.sort_order === value.sort_order;

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          minWidth: "auto",
          p: 1,
        }}
      >
        <SortIcon />
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={`${option.sort_by}-${option.sort_order}`}
            onClick={() => {
              onChange(option);
              setAnchorEl(null);
            }}
          >
            <ListItemText>{option.label}</ListItemText>

            {isSelected(option) && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
