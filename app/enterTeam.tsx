import React, { useState, useContext } from "react";
import { View, TextInput, Button, Alert, StyleSheet } from "react-native";
import { loadTeamByCredentials } from "../storage/teamstorage";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";

export default function EnterTeam() {
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const router = useRouter();
  const { setTeamId } = useContext(AuthContext);

  async function handleEnterTeam() {
    const team = await loadTeamByCredentials(teamName, teamCode);

    if (!team) {
      Alert.alert("Invalid team details");
      return;
    }

    await setTeamId(team.teamId);
    Alert.alert("Access Granted");
    router.push("/adminBoard");
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Team Name"
        value={teamName}
        onChangeText={setTeamName}
        style={styles.input}
      />

      <TextInput
        placeholder="Team Code"
        value={teamCode}
        onChangeText={setTeamCode}
        style={styles.input}
      />

      <Button title="Enter Team" onPress={handleEnterTeam} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
});