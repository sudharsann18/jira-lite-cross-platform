// app/adminBoard.tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TaskProvider } from "../context/TaskC0ntext";
import Board from "./board"; // 👈 your existing board file
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "expo-router";

export default function AdminBoard() {
  const { role } = useContext(AuthContext);
  const router = useRouter();

  // Ensure user is admin
  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/login");
    }
  }, [role]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <Board />
      </TaskProvider>
    </GestureHandlerRootView>
  );
}