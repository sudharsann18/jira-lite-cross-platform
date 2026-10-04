import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

export const supabase = createClient(
  "https://cfauyyczonwhdtblzkch.supabase.co",
  "sb_publishable_8LGRFcfSK0z4LEDw74n27A_n7Agu7WJ",
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);