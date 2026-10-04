// components/Navbar.tsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      {/* 🔶 Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.title}>JIRA-LITE</Text>
      </View>

      {/* 📂 Side Drawer */}
      {menuOpen && (
        <View style={styles.overlay}>

          {/* 🔵 Drawer (LEFT SIDE) */}
          <View style={styles.drawer}>
            <Text style={styles.menuText}>Menu</Text>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setMenuOpen(false);
                router.push("/profile");
              }}
            >
              <Text style={styles.menuButtonText}>👤 Profile</Text>
            </TouchableOpacity>

            {/* 🔴 Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>

          {/* ⚫ Clickable outside area (RIGHT SIDE) */}
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setMenuOpen(false)}
            activeOpacity={1}
          />

        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "orange",
    padding: 15,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },

  // 🔥 Overlay covering full screen
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row", // VERY IMPORTANT
    zIndex: 999,
  },

  // 🔵 Side Drawer
  drawer: {
    width: width * 0.7,
    maxWidth: 300,
    height: "100%",
    backgroundColor: "#4a77f2",
    padding: 20,
    elevation: 20, // Android layering
  },

  // ⚫ Clickable outside area
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)", // dim effect
  },

  // ✨ Menu text
  menuText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // � Menu link row
  menuButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#5a9df4",
    borderRadius: 5,
    alignItems: "center",
  },

  menuButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // 🔴 Logout Button
  logoutButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#ff6b6b",
    borderRadius: 5,
    alignItems: "center",
  },

  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});