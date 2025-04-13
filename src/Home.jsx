import Navbar from "./components/Navbar.jsx";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./helper/supabaseClient";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const searchPublicTraces = async () => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery || trimmedQuery === "#") {
        setResults([]);
        return;
      }

      const { data, error } = await supabase
        .from("traces")
        .select(`
          trace_id,
          title,
          created_at,
          db_user (name, username),
          trace_tags (tags (name))
        `)
        .eq("visibility", "public");

      if (error) {
        console.error("Error fetching public traces:", error);
        return;
      }

      const query = trimmedQuery.toLowerCase();

      const filtered = data.filter((trace) => {
        const titleMatch = trace.title.toLowerCase().includes(query);
        const tagMatch = trace.trace_tags?.some((tagObj) =>
          tagObj.tags.name.toLowerCase().includes(query)
        );
        const nameMatch = trace.db_user?.name?.toLowerCase().includes(query);
        const usernameMatch = trace.db_user?.username?.toLowerCase().includes(query);

        return titleMatch || tagMatch || nameMatch || usernameMatch;
      });

      setResults(filtered);
    };

    searchPublicTraces();
  }, [searchQuery]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white">
      <Navbar />

      {/* Search Bar */}
      <div className="w-full max-w-xl mt-6 px-4">
        <input
          type="text"
          placeholder="Search public traces by title, tag, name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
        />
      </div>

      {/* Search Results */}
      {searchQuery && results.length > 0 && (
        <div className="w-full max-w-xl mt-4 px-4 space-y-4">
          {results.map((trace) => (
            <div
              key={trace.trace_id}
              onClick={() => navigate(`/trace/${trace.trace_id}`)}
              className="bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 cursor-pointer transition"
            >
              <h2 className="text-xl font-bold text-blue-400">{trace.title}</h2>
              <p className="text-gray-400 text-sm">
                By: {trace.db_user?.name || "Unknown"} (@{trace.db_user?.username || "anon"})
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {trace.trace_tags?.map((tagObj, i) => (
                  <span
                    key={i}
                    className="bg-purple-600 text-xs px-2 py-1 rounded"
                  >
                    {tagObj.tags.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Section */}
      <div className="flex flex-col items-center justify-center text-center flex-grow">
        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
          GoalTrace
        </h1>
        <h1 className="text-2xl font-bold mt-6">
          {user ? `Hello, ${user.name}! 👋` : "Welcome!"}
        </h1>
        <div className="mt-8 space-x-6">
          <button
            onClick={() => navigate("/new-trace")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 shadow-lg"
          >
            New Trace
          </button>
          <button
            onClick={() => navigate("/exist")}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-700 shadow-lg"
          >
            Existing Traces
          </button>
        </div>
      </div>
    </div>
  );
}
