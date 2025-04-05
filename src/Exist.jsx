import { useEffect, useState } from "react";
import { supabase } from "./helper/supabaseClient";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar.jsx";
import { useNavigate } from "react-router-dom";

export default function Exist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [traces, setTraces] = useState([]);
  const [sortOption, setSortOption] = useState("date-desc");

  const sortTraces = (data, option) => {
    switch (option) {
      case "title-asc":
        return [...data].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      case "title-desc":
        return [...data].sort((a, b) =>
          b.title.localeCompare(a.title)
        );
      case "date-asc":
        return [...data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      case "date-desc":
      default:
        return [...data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
  };

  useEffect(() => {
    const fetchTraces = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("traces")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching traces:", error);
        return;
      }

      setTraces(sortTraces(data, sortOption));
    };

    fetchTraces();
  }, [user, sortOption]);

  const handleDeleteTrace = async (traceId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this trace?");
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

      setTraces((prev) => prev.filter((t) => t.trace_id !== traceId));
      alert("Trace deleted.");
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
  <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient mb-4">
    Your Traces
  </h1>
  <div className="flex justify-end">
    <select
      className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
      value={sortOption}
      onChange={(e) => setSortOption(e.target.value)}
    >
      <option value="title-asc">Sort: A–Z</option>
      <option value="title-desc">Sort: Z–A</option>
      <option value="date-asc">Sort: Date ↑</option>
      <option value="date-desc">Sort: Date ↓</option>
    </select>
  </div>
</div>


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
