import { useAuth } from "../context/AuthContext";
import { supabase } from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/login");
    };

    return (
        <div className="w-full flex justify-between items-center px-6 py-4 bg-gray-800 shadow-lg">
            {/* Left side stays unchanged */}
            <div className="text-xl font-semibold text-white">GoalTrace</div>
            
            {/* Right side */}
            <div>
                {user ? (
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        Sign Out
                    </button>
                ) : null}
            </div>
        </div>
    );
}
