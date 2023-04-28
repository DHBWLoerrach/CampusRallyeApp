import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
// Muss drin sein. Sonst gibt es einen URL Fehler, wenn man supabase an anderer Stelle importiert.
import 'react-native-url-polyfill/auto'

const supabaseUrl = "YOUR_URL"
const supabaseAnonKey = "YOUR_ANON_KEY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
