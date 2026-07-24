import { User } from "./user";

export type Comment = {
  id: number;
  content: string;

  task_id: number | null;
  subtask_id: number | null;

  created_at: string;
  updated_at: string;

  user: User | null;
};

export type CommentListResponse = {
  count: number;
  data: Comment[];
};
