import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return null; // Or a spinner like <LoadingScreen />
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
}
