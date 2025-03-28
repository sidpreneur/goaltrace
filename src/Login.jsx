import { useState } from "react";
import { supabase } from "./helper/supabaseClient";
import { Link , useNavigate} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navi = useNavigate();
    const {setUser} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) {
            setMessage("Error: " + error.message);
            return;
        }
        if (data) {
            setUser(data.user);
            await supabase.auth.refreshSession();

            navi("/home");
            return null;
        }

        setEmail("");
        setPassword("");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient mb-6">
                Login
            </h2>
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg border border-blue-400 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-lg border border-blue-400 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="w-full p-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                >
                    Login
                </button>
            </form>

            {message && (
                <p className={`mt-4 text-lg ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                    {message}
                </p>
            )}

            <p className="mt-4">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-400 hover:underline">
                    Register here
                </Link>
            </p>
        </div>
    );
}
