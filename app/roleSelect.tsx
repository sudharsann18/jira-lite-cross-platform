import React, { useContext } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";

export default function RoleSelect() {
  const { profile, setRole, logout } = useContext(AuthContext);
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Hey, {profile?.username || "there"} 👋
      </Text>
      <Text style={styles.subtitle}>How do you want to continue?</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={async () => {
          await setRole("admin");
          router.replace("/adminHome");
        }}
      >
        <Text style={styles.cardIcon}>🛠️</Text>
        <Text style={styles.cardTitle}>Admin</Text>
        <Text style={styles.cardSub}>Create and manage teams</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.cardUser]}
        onPress={async () => {
          await setRole("user");
          router.replace("/userTeams");
        }}
      >
        <Text style={styles.cardIcon}>👤</Text>
        <Text style={styles.cardTitle}>User</Text>
        <Text style={styles.cardSub}>View your assigned tasks</Text>
      </TouchableOpacity>

      {/* 👇 Logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#000",
    padding: 24, justifyContent: "center",
  },
  greeting: {
    fontSize: 26, fontWeight: "bold",
    color: "#fff", marginBottom: 6,
  },
  subtitle: {
    fontSize: 15, color: "#666", marginBottom: 36,
  },
  card: {
    backgroundColor: "#1a1a1a", borderRadius: 14,
    padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: "#333",
  },
  cardUser: {
    borderColor: "#4a77f2",
  },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: {
    fontSize: 20, fontWeight: "bold",
    color: "#fff", marginBottom: 4,
  },
  cardSub: { fontSize: 14, color: "#666" },
  logoutButton: {
    marginTop: 20, padding: 15,
    borderRadius: 10, borderWidth: 1,
    borderColor: "#ff6b6b", alignItems: "center",
  },
  logoutText: {
    color: "#ff6b6b", fontWeight: "bold", fontSize: 15,
  },
});