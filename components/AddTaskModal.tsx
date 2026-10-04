import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskC0ntext";
import { supabase } from "../lib/supabase";

export default function AddTaskModal({ visible, onClose }: any) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedName, setAssignedName] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const { addTask } = useContext(TaskContext);
  const { teamId } = useContext(AuthContext);

  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId);

    if (!error && data) {
      setUsers(data);
    }
  }

  function handleAdd() {
    if (!title || !assignedTo) return;

    addTask(title, assignedTo);
    setTitle("");
    setAssignedTo("");
    setAssignedName("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.heading}>Add Task</Text>

          <TextInput
            placeholder="Task title"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Text style={styles.label}>Assign To</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={assignedTo}
              dropdownIconColor="#888"
              style={styles.picker}
              onValueChange={(value) => {
                const selectedUser = users.find((user) => user.id === value);
                setAssignedTo(value || "");
                setAssignedName(selectedUser?.name || "");
              }}
            >
              <Picker.Item
                label={users.length ? "Select a user" : "No users available"}
                value=""
                color="#888"
              />
              {users.map((user) => (
                <Picker.Item
                  key={user.id}
                  label={user.name}
                  value={user.id}
                  color="#fff"
                />
              ))}
            </Picker>
          </View>

          {assignedName ? (
            <Text style={styles.selectedUserText}>Selected: {assignedName}</Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#00000088",
  },
  modal: {
    backgroundColor: "#1a1a1a",
    margin: 20,
    padding: 24,
    borderRadius: 14,
  },
  heading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    color: "#888",
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
  },
  pickerWrapper: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    color: "#fff",
    marginHorizontal: -8,
  },
  selectedUserText: {
    color: "#888",
    fontSize: 13,
    marginTop: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#4a77f2",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#888",
    fontWeight: "bold",
  },
});
