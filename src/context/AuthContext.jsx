import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../helper/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔐 Sync OneSignal ID AFTER user login
    const syncOneSignalId = async (userId) => {
        try {
            const onesignalId = await window.OneSignal?.getUserId();
            if (!onesignalId || !userId) return;

            const { data, error: fetchError } = await supabase
                .from("db_user")
                .select("onesignal_id")
                .eq("user_id", userId)
                .single();

            if (fetchError) {
                console.error("Fetch error:", fetchError.message);
                return;
            }

            if (data?.onesignal_id !== onesignalId) {
                const { error } = await supabase
                    .from("db_user")
                    .update({ onesignal_id: onesignalId })
                    .eq("user_id", userId);

                if (error) console.error("Update error:", error.message);
                else console.log("✅ OneSignal ID synced in db_user");
            }
        } catch (err) {
            console.error("❌ Error syncing OneSignal ID:", err.message);
        }
    };

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
                const { user } = data.session;
                setUser({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || "User",
                });
                syncOneSignalId(user.id); // ✅ Sync here
            }
            setLoading(false);
        };

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    const { user } = session;
                    setUser({
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.name || "User",
                    });
                    syncOneSignalId(user.id); // ✅ Sync here too
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
