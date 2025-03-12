import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
}
