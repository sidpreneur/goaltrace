import { useState, useEffect } from "react";
import { supabase } from "./helper/supabaseClient";
import { useAuth } from "./context/AuthContext";

export default function Exist() {
    const { user } = useAuth(); // Get logged-in user
    const [traces, setTraces] = useState([]);

    useEffect(() => {
        if (user) fetchTraces();
    }, [user]);

    const fetchTraces = async () => {
        const { data, error } = await supabase
            .from("traces")
            .select("title")
            .eq("user_id", user.id);  // Now this works because IDs match
    
        if (error) {
            console.error("Error fetching traces:", error);
            return;
        }
    
        setTraces(data);
    };
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6">Your Existing Traces</h1>

            {traces.length > 0 ? (
                <ul className="space-y-2">
                    {traces.map((trace, index) => (
                        <li key={index} className="p-3 bg-gray-700 rounded-md w-80 text-center">
                            {trace.title}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400">No traces found.</p>
            )}
        </div>
    );
}
