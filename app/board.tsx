// app/board.tsx
import { usePathname, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Button, SafeAreaView, StyleSheet, View } from "react-native";
import { DraxProvider } from "react-native-drax";
import AddTaskModal from "../components/AddTaskModal";
import Column from "../components/Column";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskC0ntext";
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
    padding: 10,
  },
});



function Board() {
  const { tasks } = useContext(TaskContext);
  const { currentUser, profile, role, sessionLoaded, teamId } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isStandaloneBoardRoute = pathname === "/board";

  useEffect(() => {
    if (!isStandaloneBoardRoute || !sessionLoaded) return;

    if (!profile) {
      router.replace("/login");
    } else if (role === "admin") {
      router.replace("/adminBoard");
    } else if (role === "user") {
      router.replace(currentUser && teamId ? "/userBoard" : "/userTeams");
    } else {
      router.replace("/roleSelect");
    }
  }, [isStandaloneBoardRoute, sessionLoaded, profile, role, currentUser, teamId, router]);

  if (isStandaloneBoardRoute) return null;

  return (
    <DraxProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Navbar />

        <Button title="Add Task" onPress={() => setModalVisible(true)} />
        <View style={{ flexDirection: "row", gap: 10, padding: 10 }}>
          <Button title="Add Task" onPress={() => setModalVisible(true)} />
          <Button title="Invite Members" onPress={() => router.push("/inviteMembers")} />
        </View>
        <View style={styles.row}>
          <Column
            title="Todo"
            status="todo"
            tasks={tasks.filter(t => t.status === "todo")}
          />

          <Column
            title="In Process"
            status="inprocess"
            tasks={tasks.filter(t => t.status === "inprocess")}
          />
        </View>

        <View style={styles.row}>
          <Column
            title="Review"
            status="review"
            tasks={tasks.filter(t => t.status === "review")}
          />

          <Column
            title="Completed"
            status="completed"
            tasks={tasks.filter(t => t.status === "completed")}
          />
        </View>

        <AddTaskModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </DraxProvider>
  );
}
export default Board;