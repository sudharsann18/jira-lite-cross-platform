import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";
import { createTask, deleteTaskById, loadTasks, updateTaskStatus } from "../storage/taskStorage";
import { Task, TaskStatus } from "../types/Task";
import { AuthContext } from "./AuthContext";

interface TaskContextValue {
  tasks: Task[];
  addTask: (title: string, assignedTo: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const TaskContext = createContext<TaskContextValue>({
  tasks: [],
  addTask: async () => {},
  moveTask: async () => {},
  deleteTask: async () => {},
});

export function TaskProvider({ children }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { teamId } = useContext(AuthContext);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    if (!teamId) return;

    async function fetchTasks() {
      const loaded = await loadTasks(teamId);
      setTasks(loaded);
    }

    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [teamId]);

  async function addTask(title: string, assignedTo: string) {
    if (!teamId) return;

    const newTask: Task = {
      id: uuidv4(),
      title,
      status: "todo",
      assignedTo,
    };

    const saved = await createTask(newTask, teamId);
    if (!saved) return;

    setTasks(current => [...current, newTask]);

    // 👇 Send push notification to assigned user
    const { error } = await supabase.functions.invoke("send-task-notification", {
      body: {
        taskTitle: title,
        assignedTo,
        teamId,
      },
    });

    if (error) {
      console.log("Notification error:", error);
    } else {
      console.log("Notification triggered for:", assignedTo);
    }
  }

  async function moveTask(id: string, newStatus: TaskStatus) {
    if (!teamId) return;
    const updated = tasksRef.current.map(task =>
      task.id === id ? { ...task, status: newStatus } : task
    );
    if (!updated.some(task => task.id === id)) return;
    const statusUpdated = await updateTaskStatus(id, newStatus);
    if (!statusUpdated) {
      return;
    }

    setTasks(updated);
  }

  async function deleteTask(id: string) {
    if (!await deleteTaskById(id)) return;
    setTasks(current => current.filter(task => task.id !== id));
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, moveTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}