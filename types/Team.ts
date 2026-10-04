// types/Team.ts
export interface User {
  id: string;
  name: string;
}

export interface Team {
  teamName: string;
  teamCode: string;
  adminId: string;
  users: User[];
}