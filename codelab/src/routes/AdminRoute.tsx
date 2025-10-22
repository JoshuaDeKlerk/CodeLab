import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../config/admin";

export default function AdminRoute() {
  const { user, loading } = useAuth() as any;
  if (loading) return null; 
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user.uid)) return <Navigate to="/" replace />;
  return <Outlet />;
}
