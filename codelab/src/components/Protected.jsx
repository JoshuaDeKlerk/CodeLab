import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Protected() {
  const { user, initialising } = useAuth();
  if (initialising) return <div className="py-10 text-subtext">Loading…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
