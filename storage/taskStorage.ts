import { supabase } from "../lib/supabase";
import { Task, TaskStatus } from "../types/Task";

export async function createTask(task: Task, teamId: string): Promise<boolean> {
  const taskPayload = {
    id: task.id,
    title: task.title,
    status: task.status,
    assigned_to: task.assignedTo,
    team_id: teamId,
  };

  const { error } = await supabase.from("tasks").insert(taskPayload);

  return !error;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);

  if (error) console.log("Error updating task status:", error);
  return !error;
}

export async function loadTasks(teamId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("team_id", teamId)
    .is("archived_at", null);

  if (error || !data) return [];

  return data.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status as any,
    assignedTo: t.assigned_to,
  }));
}

export async function deleteTaskById(id: string) {
  const { error } = await supabase.rpc("archive_task", { p_task_id: id });
  if (error) console.log("Error deleting task:", error);
  return !error;
}