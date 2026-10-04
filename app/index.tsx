import { useEffect, useContext } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { profile, sessionLoaded } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoaded) return;

    if (profile) {
      router.replace("/roleSelect"); // already logged in
    } else {
      router.replace("/login");
    }
  }, [sessionLoaded, profile]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000",
      justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color="#4a77f2" size="large" />
    </View>
  );
}