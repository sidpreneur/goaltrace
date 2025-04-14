import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../helper/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileInfo, setProfileInfo] = useState(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  const handleMarkAsRead = async (id) => {
    const { error } = await supabase
      .from("deadlines")
      .update({ notified: true })
      .eq("id", id);

    if (error) {
      console.error("Failed to mark as read", error);
    } else {
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleUsernameUpdate = async () => {
    const { data: existingUser } = await supabase
      .from("db_user")
      .select("id")
      .eq("username", newUsername)
      .neq("user_id", user.id)
      .single();

    if (existingUser) {
      alert("Username already taken.");
      return;
    }

    const { error } = await supabase
      .from("db_user")
      .update({ username: newUsername })
      .eq("user_id", user.id);

    if (error) {
      alert("Failed to update username.");
    } else {
      setProfileInfo((prev) => ({ ...prev, username: newUsername }));
      setEditingUsername(false);
      setNewUsername("");
    }
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!user) return;

    const fetchDeadlines = async () => {
      const now = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(now.getDate() + 5);

      const { data, error } = await supabase
        .from("deadlines")
        .select(`
          id,
          deadline,
          node_id,
          nodes (
            heading,
            traces (
              title,
              user_id
            )
          )
        `)
        .eq("notified", false)
        .lte("deadline", fiveDaysLater.toISOString())
        .order("deadline", { ascending: true });

      if (error) {
        console.error("Failed to fetch deadlines", error);
      } else {
        const filteredDeadlines = data.filter((d) => {
          const trace = d.nodes.traces;
          return trace && trace.user_id === user.id;
        });

        setDeadlines(filteredDeadlines);
      }
    };

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("db_user")
        .select("name, username, email")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch profile info", error);
      } else {
        setProfileInfo(data);
      }
    };

    fetchDeadlines();
    fetchProfile();
  }, [user]);

  // 🔍 Search Traces
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
    <>
      <div className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 shadow-lg relative">

        {/* Left: Logo */}
        <div className="flex-shrink-0 text-xl font-semibold text-white">
          <Link to="/home">GoalTrace</Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center relative">
          <input
            type="text"
            placeholder="Search public traces by title, tag, username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
          />
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="relative">
              <div
                className="text-white cursor-pointer"
                onClick={() => setIsNotificationVisible((prev) => !prev)}
              >
                🔔 {deadlines.length}
              </div>

              {isNotificationVisible && (
                <div className="absolute right-0 mt-2 w-[36rem] bg-gray-800 text-white rounded-lg shadow-lg p-4 z-10">
                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {deadlines.length > 0 ? (
                      deadlines.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between w-full border-b border-gray-700 pb-2"
                        >
                          <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                            <span className="font-semibold text-gray-300 truncate">
                              {d.nodes?.heading || "Untitled Node"}
                            </span>
                            <span className="text-sm text-gray-400 truncate italic">
                              🧠 {d.nodes?.traces?.title || "Untitled Trace"}
                            </span>
                            <span className="text-sm text-gray-400 whitespace-nowrap">
                              📅 {formatDateTime(d.deadline)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleMarkAsRead(d.id)}
                            className="text-gray-500 hover:text-gray-300 text-xs transition transform hover:scale-110"
                          >
                            ❌
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm text-center">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <div className="relative">
              <FaUserCircle
                size={28}
                className="text-white cursor-pointer"
                onClick={() => setIsProfileVisible((prev) => !prev)}
              />

              {isProfileVisible && profileInfo && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-800 text-white rounded-lg shadow-lg p-4 z-10">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Name</span>
                      <div className="font-medium">{profileInfo.name}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Username</span>
                      {editingUsername ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-white px-2 py-1 rounded w-full"
                          />
                          <button
                            onClick={handleUsernameUpdate}
                            className="bg-green-500 text-white px-2 rounded"
                          >
                            ✔
                          </button>
                          <button
                            onClick={() => setEditingUsername(false)}
                            className="bg-red-500 text-white px-2 rounded"
                          >
                            ✖
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium">@{profileInfo.username}</span>
                          <button
                            onClick={() => {
                              setNewUsername(profileInfo.username);
                              setEditingUsername(true);
                            }}
                            className="text-blue-400 hover:underline text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Email</span>
                      <div className="font-medium">{profileInfo.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Sign Out
            </button>
          )}
        </div>

      </div>

      {/* FULL PAGE SEARCH RESULTS (Same like Home.jsx) */}
      {searchQuery && (
        <div className="w-full flex flex-col items-center bg-gray-900 text-white px-4 py-8 space-y-4">
          {results.length > 0 ? (
            results.map((trace) => (
              <div
                key={trace.trace_id}
                onClick={() => navigate(`/trace/${trace.trace_id}`)}
                className="w-full max-w-2xl bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 cursor-pointer transition"
              >
                <h2 className="text-xl font-bold text-blue-400">{trace.title}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  by {trace.db_user?.name || "Unknown"} (@{trace.db_user?.username || "anon"})
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
            ))
          ) : (
            <p className="text-gray-400 text-lg">No results found.</p>
          )}
        </div>
      )}
    </>
  );
}
