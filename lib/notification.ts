import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(profileId: string) {
  // Push notifications only work on real devices
  if (!Device.isDevice) {
    console.log("Push notifications only work on real devices");
    return;
  }

  // Ask for permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission denied");
    return;
  }

  // Android needs a channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Get push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: "5cd4c937-6c49-4993-865a-97c5c18d2211", // 👈 replace this
  });

  // Save token to profile in Supabase
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token.data })
    .eq("id", profileId);

  if (error) {
    console.log("Error saving push token:", error);
  } else {
    console.log("Push token saved successfully");
  }

  return token.data;
}