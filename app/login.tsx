import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { registerForPushNotifications } from "../lib/notification";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setProfile } = useContext(AuthContext);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Please enter email and password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login failed", error.message);
      setLoading(false);
      return;
    }

    // Fetch their profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      await supabase.auth.signOut();
      Alert.alert("Profile unavailable", "Your account profile could not be loaded. Please try again after the database setup is complete.");
      setLoading(false);
      return;
    }

    setProfile(profileData);
    try {
      await registerForPushNotifications(profileData.id);
    } catch (notificationError) {
      console.log("Push notification registration failed:", notificationError);
    }

    setLoading(false);
    router.replace("/roleSelect"); // 👈 new screen
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to Jira Lite</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Login</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/sinup")}>
        <Text style={styles.link}>Don&apos;t have an account? Create one</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#000",
    padding: 24, justifyContent: "center",
  },
  title: {
    fontSize: 28, fontWeight: "bold",
    color: "#fff", marginBottom: 6,
  },
  subtitle: {
    fontSize: 15, color: "#666", marginBottom: 32,
  },
  input: {
    backgroundColor: "#111", color: "#fff",
    borderWidth: 1, borderColor: "#333",
    borderRadius: 10, padding: 14,
    marginBottom: 14, fontSize: 15,
  },
  button: {
    backgroundColor: "#4a77f2", borderRadius: 10,
    padding: 15, alignItems: "center", marginTop: 6,
  },
  buttonText: {
    color: "#fff", fontWeight: "bold", fontSize: 16,
  },
  link: {
    color: "#4a77f2", textAlign: "center",
    marginTop: 20, fontSize: 14,
  },
});