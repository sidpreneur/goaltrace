import { createClient } from "@supabase/supabase-js";

const supaURL = import.meta.env.VITE_SUPABASE_URL;
const supaKey = import.meta.env.VITE_SUPABASE_KEY;
export const supabase = createClient(supaURL, supaKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: true, 
        detectSessionInUrl: false, 
    },
});
