import { Role } from "./role";

export type User = {
  id: number;
  username: string;
  email: string;
  team_name: string | null;
  roles: Role[];
};
