import { CommentListResponse } from "./comment";
import { Status } from "./status";
import { User } from "./user";

export type Subtask = {
  id: number;
  title: string;

  status: Status;

  task_id: number;

  sprint: string | null;

  created_at: string;
  updated_at: string;

  users: User[];

  comments: CommentListResponse;
};
