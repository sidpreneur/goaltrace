import { useEffect, useState } from "react";
import { supabase } from "./helper/supabaseClient";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar.jsx";
import { useNavigate } from "react-router-dom";

export default function Exist() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [traces, setTraces] = useState([]);

    // Fetch traces for the logged-in user
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
    }, [user]);

    // Function to delete a trace
    const handleDeleteTrace = async (traceId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this trace? This action cannot be undone.");
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from("traces")
                .delete()
                .eq("trace_id", traceId);

            if (error) {
                console.error("Error deleting trace:", error);
                alert("Failed to delete the trace.");
                return;
            }

            // Refresh the traces list after deletion
            setTraces((prevTraces) => prevTraces.filter((trace) => trace.trace_id !== traceId));
            alert("Trace deleted successfully.");
        } catch (err) {
            console.error("Unexpected error in handleDeleteTrace:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />

            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
                    Your Traces
                </h1>

                {traces.length === 0 ? (
                    <p className="text-gray-400 text-center text-lg">No traces found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {traces.map((trace) => (
                            <div
                                key={trace.trace_id}
                                className="bg-gray-800 p-5 rounded-lg shadow-lg transition transform hover:scale-105 hover:shadow-2xl"
                            >
                                <h2
                                    onClick={() => navigate(`/trace/${trace.trace_id}`)}
                                    className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
                                >
                                    {trace.title}
                                </h2>
                                <p className="text-gray-400 mt-2">
                                    Created at: {new Date(trace.created_at).toLocaleString()}
                                </p>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => handleDeleteTrace(trace.trace_id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
