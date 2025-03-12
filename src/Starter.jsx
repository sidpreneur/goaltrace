import { useNavigate } from "react-router-dom";

export default function Starter() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient mb-6">
                GoalTrace
            </h1>
            <p className="text-xl text-gray-400 mb-8">
                Map Your Journey, One Trace at a Time
            </p>
            <div className="flex space-x-6">
                <button
                    onClick={() => navigate("/login")}
                    className="w-40 p-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                >
                    Login
                </button>
                <button
                    onClick={() => navigate("/register")}
                    className="w-40 p-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                >
                Register
                </button>
            </div>
        </div>
    );
}
