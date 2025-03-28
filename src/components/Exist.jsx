import { useEffect, useState } from "react";
import { supabase } from "./helper/supabaseClient";
import { useAuth } from "./context/AuthContext";

export default function Exist() {
    const { user } = useAuth(); // Get logged-in user
    const [traces, setTraces] = useState([]);

    useEffect(() => {
        const fetchTraces = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from("traces")
                .select("*")
                .eq("user_id", user.id); // Get only traces of this user

            if (error) {
                console.error("Error fetching traces:", error);
                return;
            }

            setTraces(data);
        };

        fetchTraces();
    }, [user]); // Fetch again if `user` changes

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-4">Your Traces</h1>

            {traces.length === 0 ? (
                <p className="text-gray-400">No traces found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {traces.map((trace) => (
                        <div key={trace.trace_id} className="bg-gray-800 p-4 rounded-lg shadow">
                            <h2 className="text-xl font-semibold">{trace.title}</h2>
                            <p className="text-gray-400">Created at: {new Date(trace.created_at).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
