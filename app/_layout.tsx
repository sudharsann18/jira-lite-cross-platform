import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { TaskProvider } from "../context/TaskC0ntext";
import "react-native-get-random-values";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

export default function RootLayout() {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Fires when notification is received while app is open
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification received:", notification);
      });

    // Fires when user taps a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Notification tapped:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <TaskProvider>
        <Stack />
      </TaskProvider>
    </AuthProvider>
  );
}