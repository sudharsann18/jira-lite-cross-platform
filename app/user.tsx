import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, TextInput, Button, Alert, StyleSheet } from "react-native";
import { loadTeamByCredentials } from "../storage/teamstorage";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "expo-router";

export default function UserLogin() {
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [userId, setUserId] = useState("");

  const { setCurrentUser, setRole, setTeamId } = useContext(AuthContext);
  const router = useRouter();

  async function handleLogin() {
    const team = await loadTeamByCredentials(teamName, teamCode);

    if (!team) {
      Alert.alert("Invalid team details");
      return;
    }

    const user = team.users.find((u: any) => u.id === userId);

    if (!user) {
      Alert.alert("User not found");
      return;
    }

    await setCurrentUser(user);
    await setRole("user");
    await setTeamId(team.teamId);

    Alert.alert("Login successful");
    router.push("/userBoard");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Team Name"
        placeholderTextColor="#aaa"
        value={teamName}
        onChangeText={setTeamName}
        style={styles.input}
      />

      <TextInput
        placeholder="Team Code"
        placeholderTextColor="#aaa"
        value={teamCode}
        onChangeText={setTeamCode}
        style={styles.input}
      />

      <TextInput
        placeholder="User ID"
        placeholderTextColor="#aaa"
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
    backgroundColor: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#111",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    color: "#fff",
    fontSize: 18,
  },
});