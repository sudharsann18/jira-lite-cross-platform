import { Stack, useRouter } from "expo-router";
import React, { useContext, useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DraxProvider } from "react-native-drax";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Column from "../components/Column";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskC0ntext";

export default function UserBoard() {
  const { tasks } = useContext(TaskContext);
  const { currentUser, role, profile, sessionLoaded } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoaded) return;

    if (role && role !== "user") {
      router.replace("/login");
    } else if (!profile || !currentUser) {
      router.replace("/login");
    }
  }, [sessionLoaded, role, profile, currentUser, router]);

  const myTasks = tasks.filter(
    (t) => t.assignedTo === currentUser?.id
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraxProvider>
        <SafeAreaView style={styles.container}>
          <Stack.Screen options={{
            title: `Welcome ${currentUser?.name || "User"} 👋`,
          }} />

          {/* 👇 Updated back button goes to userTeams */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace("/userTeams")}>
              <Text style={styles.backText}>← Teams</Text>
            </TouchableOpacity>
          </View>

          <Navbar />

          <View style={styles.row}>
            <Column
              title="Todo"
              status="todo"
              tasks={myTasks.filter(t => t.status === "todo")}
            />
            <Column
              title="In Process"
              status="inprocess"
              tasks={myTasks.filter(t => t.status === "inprocess")}
            />
          </View>

          <View style={styles.row}>
            <Column
              title="Review"
              status="review"
              tasks={myTasks.filter(t => t.status === "review")}
            />
            <Column
              title="Completed"
              status="completed"
              tasks={myTasks.filter(t => t.status === "completed")}
            />
          </View>
        </SafeAreaView>
      </DraxProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#000",
  },
  backText: {
    color: "#fff",
    fontSize: 18,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
    padding: 10,
  },
});