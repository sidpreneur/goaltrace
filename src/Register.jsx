import { useState } from "react";
import { supabase } from "./helper/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            setMessage("Error: " + error.message);
            return;
        }

        if (data?.user) {
            const { user } = data;

            // Check if username already exists
            const { data: existingUser, error: fetchError } = await supabase
                .from("db_user")
                .select("username")
                .eq("username", username)
                .single();

            if (existingUser) {
                setMessage("Username is already taken.");
                return;
            }

            const { error: dbError } = await supabase.from("db_user").insert([
                {
                    user_id: user.id,
                    name,
                    email,
                    username,
                },
            ]);

            if (dbError) {
                setMessage("Error saving user data: " + dbError.message);
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setMessage("Error: " + signInError.message);
                return;
            }

            navigate("/home");
        }

        setEmail("");
        setPassword("");
        setName("");
        setUsername("");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient mb-6 leading-tight">
                Register
            </h2>
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg border border-blue-400 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 rounded-lg border border-blue-400 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg border border-blue-400 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                />
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 pr-10 rounded-lg border border-blue-400 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-blue-400"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                </div>
                <button
                    type="submit"
                    className="w-full p-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                >
                    Register
                </button>
            </form>

            {message && (
                <p className={`mt-4 text-lg ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                    {message}
                </p>
            )}

            <p className="mt-4">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-400 hover:underline">
                    Login here
                </Link>
            </p>
        </div>
    );
}
