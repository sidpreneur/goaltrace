import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login"
import Register from "./Register"
import Starter from "./Starter"
import Home from "./Home"
import { AuthProvider } from "./context/AuthContext"
import AuthGuard from "./components/AuthGuard" 
import Newtrace from "./Newtrace"





export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
  
        <Routes>
          <Route path="/" element={<Starter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<AuthGuard><Home /></AuthGuard>}  />
          <Route path="/new-trace" element={<AuthGuard><Newtrace /></AuthGuard>} />

        </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
