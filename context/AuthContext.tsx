import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [role, setRoleState] = useState<"admin" | "user" | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamId, setTeamIdState] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null); // supabase profile
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", userId)
        .maybeSingle();

      if (active) setProfile(error ? null : data);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null);
        return;
      }

      void Promise.resolve().then(() => loadProfile(session.user.id));
    });

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await loadProfile(session.user.id);
      }

      const storedRole = await AsyncStorage.getItem("ROLE");
      const storedTeamId = await AsyncStorage.getItem("TEAM_ID");
      const storedUser = await AsyncStorage.getItem("CURRENT_USER");

      if (!active) return;
      if (storedRole) setRoleState(storedRole as any);
      if (storedTeamId) setTeamIdState(storedTeamId);
      if (storedUser) setCurrentUser(JSON.parse(storedUser));

      setSessionLoaded(true);
    }

    void loadSession();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function setRole(newRole: "admin" | "user") {
    setRoleState(newRole);
    await AsyncStorage.setItem("ROLE", newRole);
  }

  async function setTeamId(id: string) {
    setTeamIdState(id);
    await AsyncStorage.setItem("TEAM_ID", id);
  }

  async function saveCurrentUser(user: any) {
    setCurrentUser(user);
    await AsyncStorage.setItem("CURRENT_USER", JSON.stringify(user));
  }

  async function logout() {
    await supabase.auth.signOut();
    setRoleState(null);
    setCurrentUser(null);
    setTeamIdState(null);
    setProfile(null);
    await AsyncStorage.multiRemove(["ROLE", "TEAM_ID", "CURRENT_USER"]);
  }

  return (
    <AuthContext.Provider value={{
      role, setRole,
      currentUser, setCurrentUser: saveCurrentUser,
      teamId, setTeamId,
      profile, setProfile,
      sessionLoaded,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}