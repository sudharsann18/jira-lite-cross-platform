// app/admin.tsx
import { TaskProvider } from "../context/TaskC0ntext";
import Board from "./index"; // your current board

export default function Admin() {
  return (
    <TaskProvider>
      <Board />
    </TaskProvider>
  );
}