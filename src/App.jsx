import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Starter from "./Starter";
import Home from "./Home";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./components/AuthGuard";
import Newtrace from "./Newtrace";
import Exist from "./Exist";
import OpenTrace from "./components/OpenTrace";

export default function App() {
  useEffect(() => {
    if (!window.OneSignalInitialized) {
      window.OneSignal = window.OneSignal || [];
      OneSignal.push(function () {
        OneSignal.init({
          appId: "6f19a7af-009c-40ae-b29a-252ab1b591d9",
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
        });
      });
      window.OneSignalInitialized = true;
    }
  }, []);
  

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Starter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/new-trace" element={<AuthGuard><Newtrace /></AuthGuard>} />
          <Route path="/exist" element={<AuthGuard><Exist /></AuthGuard>} />
          <Route path="/trace/:traceId" element={<AuthGuard><OpenTrace/></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
