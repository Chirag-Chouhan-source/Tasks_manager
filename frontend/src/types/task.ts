import { CommentListResponse } from "./comment";
import { Status } from "./status";
import { Subtask } from "./subtask";
import { User } from "./user";

export type Task = {
  id: number;
  title: string;

  description: string | null;

  status: Status;

  sprint: string | null;

  created_at: string;
  updated_at: string;

  users: User[];

  subtasks: Subtask[];

  comments: CommentListResponse;
};
