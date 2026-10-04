import React, { useEffect, useState, useContext } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, SafeAreaView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { AuthContext } from "../context/AuthContext";

export default function AdminHome() {
  const { profile, setTeamId, logout } = useContext(AuthContext);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyTeams();
  }, []);

  async function fetchMyTeams() {
    setLoading(true);

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("admin_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error fetching teams:", error);
      setLoading(false);
      return;
    }

    setTeams(data || []);
    setLoading(false);
  }

  async function handleSelectTeam(team: any) {
    await setTeamId(team.id);
    router.push("/adminBoard");
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4a77f2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Hey, {profile?.username} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Create Team Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/createTeam")}
      >
        <Text style={styles.createButtonText}>+ Create New Team</Text>
      </TouchableOpacity>

      {/* Teams List */}
      <Text style={styles.sectionTitle}>Your Teams</Text>

      {teams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏗️</Text>
          <Text style={styles.emptyText}>No teams yet.</Text>
          <Text style={styles.emptySubText}>Create your first team above.</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectTeam(item)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>👥</Text>
                <View>
                  <Text style={styles.cardTitle}>{item.team_name}</Text>
                  <Text style={styles.cardSub}>Code: {item.team_code}</Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Back to role select */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/roleSelect")}
      >
        <Text style={styles.backText}>← Switch Role</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#000", padding: 24,
  },
  centered: {
    flex: 1, justifyContent: "center",
    alignItems: "center", backgroundColor: "#000",
  },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 20, marginBottom: 24,
  },
  title: {
    fontSize: 24, fontWeight: "bold", color: "#fff",
  },
  subtitle: {
    fontSize: 14, color: "#666", marginTop: 4,
  },
  logoutBtn: {
    borderWidth: 1, borderColor: "#ff6b6b",
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14,
  },
  logoutText: {
    color: "#ff6b6b", fontWeight: "bold",
  },
  createButton: {
    backgroundColor: "#4a77f2", borderRadius: 12,
    padding: 16, alignItems: "center", marginBottom: 28,
  },
  createButtonText: {
    color: "#fff", fontWeight: "bold", fontSize: 16,
  },
  sectionTitle: {
    color: "#666", fontSize: 13,
    fontWeight: "bold", marginBottom: 14,
    textTransform: "uppercase", letterSpacing: 1,
  },
  card: {
    backgroundColor: "#1a1a1a", borderRadius: 14,
    padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: "#333",
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  cardIcon: { fontSize: 28 },
  cardTitle: {
    fontSize: 17, fontWeight: "bold", color: "#fff",
  },
  cardSub: { fontSize: 13, color: "#666", marginTop: 2 },
  arrow: { color: "#4a77f2", fontSize: 20 },
  emptyContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    color: "#fff", fontSize: 16,
    fontWeight: "bold", textAlign: "center",
  },
  emptySubText: {
    color: "#666", fontSize: 14,
    marginTop: 8, textAlign: "center",
  },
  backButton: { padding: 16, alignItems: "center" },
  backText: { color: "#4a77f2", fontSize: 15 },
});