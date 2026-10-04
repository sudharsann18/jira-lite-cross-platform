// components/Column.tsx
import React, { useContext, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { DraxView } from "react-native-drax";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskC0ntext";
import { Task, TaskStatus } from "../types/Task";
import TaskCard from "./TaskCard";

interface Props {
  title: string;
  status: TaskStatus;
  tasks: Task[];
}

export default function Column({ title, status, tasks }: Props) {
  const { moveTask } = useContext(TaskContext);
  const { currentUser, role } = useContext(AuthContext);
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const maxHeight = Dimensions.get("window").height * 0.35; // Each column gets 35% of screen height

  return (
    <DraxView
      style={styles.column}
      receivingStyle={styles.receiving}
      onReceiveDragDrop={({ dragged: { payload } }) => {
        if (typeof payload === "string") moveTask(payload, status);
      }}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>{tasks.length} tasks</Text>

      <View style={[styles.scrollContainer, { maxHeight }]}>
        <Animated.ScrollView
          scrollEnabled={true}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            { useNativeDriver: false }
          )}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: -8 }}
          style={styles.scrollView}
        >
          {tasks.map(task => {
            const isOwner = task.assignedTo === currentUser?.id;
            return (
              <TaskCard key={task.id} task={task} isDraggable={isOwner || role === "admin"} />
            );
          })}
        </Animated.ScrollView>
      </View>
    </DraxView>
  );
}

const styles = StyleSheet.create({
  column: {
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },
  receiving: {
    backgroundColor: "#222",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
    fontSize: 16,
  },
  count: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
  },
  scrollContainer: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    overflow: "hidden",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});