import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../helper/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();

            if (data?.session) {
                const { user } = data.session;
                setUser({
                    id: user.id,  // Store user ID
                    email: user.email,
                    name: user.user_metadata?.name || "User",
                });
            }
        };

        getSession();

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    const { user } = session;
                    setUser({
                        id: user.id,  // Store user ID
                        email: user.email,
                        name: user.user_metadata?.name || "User",
                    });
                } else {
                    setUser(null);
                }
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
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
