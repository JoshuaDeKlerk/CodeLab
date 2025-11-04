import { useContext } from "react";
import { AuthCtx } from "./AuthContext";

// Custom hook to use the Auth context
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
