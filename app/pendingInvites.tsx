import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function PendingInvites() {
  const { profile } = useContext(AuthContext);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchInvites = useCallback(async () => {
    if (!profile?.id) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("team_invites")
      .select("*, teams(team_name, team_code)")
      .eq("invited_profile_id", profile.id)
      .eq("status", "pending");

    if (error) {
      console.log("Error fetching invites:", error);
      setLoading(false);
      return;
    }

    setInvites(data || []);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(useCallback(() => {
    void fetchInvites();
  }, [fetchInvites]));

  async function handleAccept(invite: any) {
    const { error } = await supabase.rpc("accept_team_invite", {
      p_invite_id: invite.id,
    });

    if (error) {
      Alert.alert("Unable to accept invite", error.message);
      return;
    }

    Alert.alert("Joined!", `You have joined ${invite.teams.team_name}`);
    fetchInvites(); // refresh list
  }

  async function handleReject(invite: any) {
    const { error } = await supabase
      .from("team_invites")
      .update({ status: "rejected" })
      .eq("id", invite.id);

    if (error) {
      Alert.alert("Unable to reject invite", error.message);
      return;
    }

    Alert.alert("Rejected", "Invite rejected.");
    fetchInvites();
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
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Pending Invites</Text>
      <Text style={styles.subtitle}>Teams waiting for your response</Text>

      {invites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No pending invites.</Text>
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.teams.team_name}</Text>
                <Text style={styles.cardSub}>Code: {item.teams.team_code}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(item)}
                >
                  <Text style={styles.acceptText}>✓ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(item)}
                >
                  <Text style={styles.rejectText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  back: {
    color: "#4a77f2", fontSize: 15, marginTop: 10, marginBottom: 24,
  },
  title: {
    fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, color: "#666", marginBottom: 24,
  },
  emptyContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    color: "#fff", fontSize: 16, fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1a1a1a", borderRadius: 14,
    padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: "#333",
  },
  cardInfo: { marginBottom: 14 },
  cardTitle: {
    fontSize: 17, fontWeight: "bold", color: "#fff",
  },
  cardSub: { fontSize: 13, color: "#666", marginTop: 2 },
  cardActions: {
    flexDirection: "row", gap: 10,
  },
  acceptButton: {
    flex: 1, backgroundColor: "#1a3a1a",
    borderWidth: 1, borderColor: "#4caf50",
    borderRadius: 8, padding: 10, alignItems: "center",
  },
  acceptText: { color: "#4caf50", fontWeight: "bold" },
  rejectButton: {
    flex: 1, backgroundColor: "#3a1a1a",
    borderWidth: 1, borderColor: "#ff6b6b",
    borderRadius: 8, padding: 10, alignItems: "center",
  },
  rejectText: { color: "#ff6b6b", fontWeight: "bold" },
});