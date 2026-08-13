import { MenuItem, Select } from "@mui/material";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import {
  useUpdateSubtaskMutation,
  useUpdateTaskMutation,
} from "@/services/api";

import { STATUS_OPTIONS } from "@/constants/status";
import { Status } from "@/types";

type Props = {
  entityId: number;
  entityType: "task" | "subtask";
  value: Status;
  disabled?: boolean;
};

export default function StatusField({
  entityId,
  entityType,
  value,
  disabled = false,
}: Props) {
  const [updateTask] = useUpdateTaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();

  const handleChange = async (newStatus: Status) => {
    try {
      if (entityType === "task") {
        await updateTask({
          id: entityId,
          data: { status: newStatus },
        }).unwrap();
      } else {
        await updateSubtask({
          id: entityId,
          data: { status: newStatus },
        }).unwrap();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Select
      value={value}
      onChange={(e) => handleChange(e.target.value as Status)}
      size="small"
      IconComponent={ArrowDropDownIcon}
      disabled={disabled}
      sx={{
        fontSize: 14,
        textTransform: "capitalize",

        display: "inline-flex",
        alignItems: "center",

        ".MuiOutlinedInput-notchedOutline": {
          border: "none",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          border: "none",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          border: "none",
        },

        "& .MuiSelect-select": {
          padding: "0px 6px",
          display: "flex",
          alignItems: "center",
        },

        "& .MuiSelect-icon": {
          right: 0,
        },

        minWidth: "auto",
      }}
    >
      {STATUS_OPTIONS.map((status) => (
        <MenuItem key={status.value} value={status.value}>
          {status.label}
        </MenuItem>
      ))}
    </Select>
  );
}
