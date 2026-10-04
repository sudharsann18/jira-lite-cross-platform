// types/Task.ts
export type TaskStatus =
  | "todo"
  | "inprocess"
  | "completed"
  | "review";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignedTo: string;
}