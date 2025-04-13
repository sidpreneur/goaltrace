import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [deadlines, setDeadlines] = useState([]);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);

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
                // Now filter by user_id in the traces table
                const filteredDeadlines = data.filter((d) => {
                    const trace = d.nodes.traces;
                    if (trace && trace.user_id === user.id) {
                        return true;
                    }
                    return false;
                });

                setDeadlines(filteredDeadlines);
            }
        };

        fetchDeadlines();
    }, [user]);

    return (
        <div className="w-full flex justify-between items-center px-6 py-4 bg-gray-900 shadow-lg relative">
            <div className="text-xl font-semibold text-white">GoalTrace</div>

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
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    );
}
