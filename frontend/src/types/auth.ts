export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  team_name: string | null;

  roles: string[];

  permissions: string[];
};
