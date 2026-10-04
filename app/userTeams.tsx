import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function UserTeams() {
  const { profile, setTeamId, setCurrentUser } = useContext(AuthContext);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyTeams = useCallback(async () => {
    if (!profile?.id) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("team_members")
      .select("*, teams(*)")
      .eq("profile_id", profile.id);

    if (error) {
      console.log("Error fetching teams:", error);
      setLoading(false);
      return;
    }

    const myTeams = (data || []).filter((row: any) => row.teams).map((row: any) => ({
      teamId: row.teams.id,
      teamName: row.teams.team_name,
      teamCode: row.teams.team_code,
      memberId: row.id,
      memberName: row.name,
    }));

    setTeams(myTeams);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(useCallback(() => {
    void fetchMyTeams();
  }, [fetchMyTeams]));

  async function handleSelectTeam(team: any) {
    await setTeamId(team.teamId);
    await setCurrentUser({
      id: team.memberId,
      name: team.memberName,
    });

    router.push("/userBoard");
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
      <Text style={styles.title}>Your Teams</Text>
      <Text style={styles.subtitle}>Select a team to view your tasks</Text>

      {/* 👇 Pending Invites Button */}
      <TouchableOpacity
        style={styles.invitesButton}
        onPress={() => router.push("/pendingInvites")}
      >
        <Text style={styles.invitesButtonText}>📬 View Pending Invites</Text>
      </TouchableOpacity>

      {teams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏝️</Text>
          <Text style={styles.emptyText}>You haven&apos;t been added to any team yet.</Text>
          <Text style={styles.emptySubText}>Ask your admin to send you an invite.</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.teamId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectTeam(item)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>👥</Text>
                <View>
                  <Text style={styles.cardTitle}>{item.teamName}</Text>
                  <Text style={styles.cardSub}>Tap to view your tasks</Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/roleSelect")}
      >
        <Text style={styles.backText}>← Back</Text>
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
  title: {
    fontSize: 26, fontWeight: "bold",
    color: "#fff", marginBottom: 6, marginTop: 20,
  },
  subtitle: {
    fontSize: 14, color: "#666", marginBottom: 16,
  },
  invitesButton: {
    borderWidth: 1, borderColor: "#4a77f2",
    borderRadius: 10, padding: 12,
    alignItems: "center", marginBottom: 20,
  },
  invitesButtonText: {
    color: "#4a77f2", fontWeight: "bold", fontSize: 14,
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