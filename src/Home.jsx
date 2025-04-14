import Navbar from "./components/Navbar.jsx";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./helper/supabaseClient";






export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white">
      <Navbar />

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