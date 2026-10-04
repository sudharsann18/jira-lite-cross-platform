// components/TaskCard.tsx
import React, { useContext, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { DraxView } from "react-native-drax";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskC0ntext";
import { Task } from "../types/Task";

export default function TaskCard({ task, isDraggable }: { task: Task; isDraggable?: boolean }) {
  const { deleteTask } = useContext(TaskContext);
  const { role } = useContext(AuthContext) || {};
  const [popupVisible, setPopupVisible] = useState(false);

  return (
    <>
      {isDraggable ? (
        <DraxView
          draggingStyle={styles.dragging}
          dragReleasedStyle={styles.dragging}
          hoverDraggingStyle={styles.hoverDragging}
          payload={task.id}
          longPressDelay={500}
        >
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => setPopupVisible(true)}
          >
            <Text style={styles.text}>{task.title}</Text>

            <View style={styles.actions}>
              {role === "user" && (
                <TouchableOpacity onPress={() => setPopupVisible(true)}>
                  <Text style={styles.icon}>⋮</Text>
                </TouchableOpacity>
              )}

              {role === "admin" && (
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <Text style={styles.icon}>❌</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </DraxView>
      ) : (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => setPopupVisible(true)}
        >
          <Text style={styles.text}>{task.title}</Text>

          <View style={styles.actions}>
            {role === "user" && (
              <TouchableOpacity onPress={() => setPopupVisible(true)}>
                <Text style={styles.icon}>⋮</Text>
              </TouchableOpacity>
            )}

            {role === "admin" && (
              <TouchableOpacity onPress={() => deleteTask(task.id)}>
                <Text style={styles.icon}>❌</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}

      <Modal
        visible={popupVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setPopupVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPopupVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Task details</Text>
            <Text style={styles.modalLabel}>Name:</Text>
            <Text style={styles.modalText}>{task.title}</Text>
            <Text style={styles.modalLabel}>Assigned to:</Text>
            <Text style={styles.modalText}>{task.assignedTo}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPopupVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dragging: {
    opacity: 0.5,
  },
  hoverDragging: {
    borderColor: "#fff",
    borderWidth: 2,
  },
  text: {
    fontSize: 16,
    flex: 1,
    color: "#fff",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  icon: {
    fontSize: 24,
    color: "#fff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#121212",
    borderRadius: 14,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  modalLabel: {
    color: "#888",
    marginBottom: 4,
  },
  modalText: {
    color: "#fff",
    marginBottom: 12,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#272727",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
  },
});